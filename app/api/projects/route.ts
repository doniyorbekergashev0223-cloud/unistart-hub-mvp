import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { uploadProjectFile } from '@/lib/supabase'

export const runtime = 'nodejs'

type Role = 'user' | 'admin' | 'expert'
type StatusLabel = 'Qabul qilindi' | 'Jarayonda' | 'Rad etildi'

const STATUS_TO_ENUM = {
  'Qabul qilindi': 'QABUL_QILINDI',
  Jarayonda: 'JARAYONDA',
  'Rad etildi': 'RAD_ETILDI',
} as const

const ENUM_TO_STATUS: Record<string, StatusLabel> = {
  QABUL_QILINDI: 'Qabul qilindi',
  JARAYONDA: 'Jarayonda',
  RAD_ETILDI: 'Rad etildi',
}

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
}

function parseRole(value: string | null): Role | null {
  if (value === 'user' || value === 'admin' || value === 'expert') return value
  return null
}

function getActor(req: Request): { userId: string; role: Role } | null {
  const userId = req.headers.get('x-user-id')?.trim()
  const role = parseRole(req.headers.get('x-user-role'))
  if (!userId || !role) return null
  return { userId, role }
}

export async function GET(req: Request) {
  const prisma = getPrisma()
  if (!prisma) {
    return jsonError(
      503,
      'DATABASE_NOT_CONFIGURED',
      "Ma'lumotlar bazasi sozlanmagan (DATABASE_URL yo'q)."
    )
  }

  const actor = getActor(req)
  if (!actor) {
    return jsonError(401, 'UNAUTHORIZED', "Kirish talab qilinadi (x-user-id va x-user-role headerlari yo'q).")
  }

  const where =
    actor.role === 'admin' || actor.role === 'expert'
      ? {}
      : { userId: actor.userId }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  })

  return NextResponse.json({
    ok: true,
    data: {
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        contact: p.contact,
        status: ENUM_TO_STATUS[String(p.status)] ?? 'Jarayonda',
        createdAt: p.createdAt,
        user: p.user,
      })),
    },
  })
}

export async function POST(req: Request) {
  const prisma = getPrisma()
  if (!prisma) {
    return jsonError(
      503,
      'DATABASE_NOT_CONFIGURED',
      "Ma'lumotlar bazasi sozlanmagan (DATABASE_URL yo'q)."
    )
  }

  const actor = getActor(req)
  if (!actor) {
    return jsonError(401, 'UNAUTHORIZED', "Kirish talab qilinadi (x-user-id va x-user-role headerlari yo'q).")
  }

  // Parse FormData instead of JSON
  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return jsonError(400, 'INVALID_FORM_DATA', "Form ma'lumotlari noto'g'ri.")
  }

  const title = (formData.get('title') as string)?.trim() || ''
  const description = (formData.get('description') as string)?.trim() || ''
  const contact = (formData.get('contact') as string)?.trim() || ''
  const file = formData.get('file') as File | null

  const fieldErrors: Record<string, string> = {}
  if (!title) fieldErrors.title = 'Loyiha nomi majburiy'
  if (!description) fieldErrors.description = "G'oya tavsifi majburiy"
  if (!contact) fieldErrors.contact = "Aloqa ma'lumotlari majburiy"

  if (Object.keys(fieldErrors).length) {
    return jsonError(400, 'VALIDATION_ERROR', "Ma'lumotlar noto'g'ri.", { fieldErrors })
  }

  const userIdToUse = actor.userId

  // Ensure user exists (security + data integrity)
  const userExists = await prisma.user.findUnique({
    where: { id: userIdToUse },
    select: { id: true },
  })
  if (!userExists) {
    return jsonError(401, 'UNAUTHORIZED', 'Foydalanuvchi topilmadi.')
  }

  let fileUrl: string | undefined

  // Upload file to Supabase if provided
  if (file && file.size > 0) {
    try {
      fileUrl = await uploadProjectFile(file, userIdToUse)
    } catch (uploadError) {
      console.error('File upload error:', uploadError)
      // Continue without file - don't fail the entire submission
    }
  }

  const created = await prisma.project.create({
    data: {
      title,
      description,
      contact,
      status: STATUS_TO_ENUM.Jarayonda as any,
      userId: userIdToUse,
      fileUrl,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  })

  return NextResponse.json(
    {
      ok: true,
      data: {
        project: {
          id: created.id,
          title: created.title,
          description: created.description,
          contact: created.contact,
          status: ENUM_TO_STATUS[String(created.status)] ?? 'Jarayonda',
          createdAt: created.createdAt,
          user: created.user,
          fileUrl: created.fileUrl,
        },
      },
    },
    { status: 201 }
  )
}

