import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { uploadProjectFile } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

  try {
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
  } catch (error: any) {
    console.error('Projects GET error:', error)
    
    // Database connection errors
    const errorMessage = error?.message || ''
    if (errorMessage.includes('MaxClientsInSessionMode') || errorMessage.includes('max clients reached')) {
      return jsonError(
        503,
        'DATABASE_CONNECTION_LIMIT',
        "Ma'lumotlar bazasi ulanish limitiga yetdi. CRITICAL_DATABASE_FIX.md faylini ko'ring."
      )
    }
    if (errorMessage.includes('Authentication failed') || errorMessage.includes('database credentials')) {
      return jsonError(
        503,
        'DATABASE_AUTHENTICATION_ERROR',
        "Ma'lumotlar bazasi autentifikatsiya xatosi. DATABASE_AUTHENTICATION_FIX.md faylini ko'ring."
      )
    }
    if (errorMessage.includes('Tenant or user not found')) {
      return jsonError(
        503,
        'DATABASE_TENANT_ERROR',
        "Ma'lumotlar bazasi username formati noto'g'ri. TENANT_USER_FIX.md faylini ko'ring."
      )
    }
    
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}

export async function POST(req: Request) {
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

  try {
    // Ensure user exists (security + data integrity)
    let userExists
    try {
      userExists = await prisma.user.findUnique({
        where: { id: userIdToUse },
        select: { id: true },
      })
    } catch (dbError: any) {
      console.error('Database query error in projects POST (find user):', dbError)
      console.error('Error type:', dbError?.constructor?.name)
      console.error('Error code:', dbError?.code)
      
      // Check for connection limit errors
      if (dbError?.message?.includes('MaxClientsInSessionMode') || 
          dbError?.message?.includes('max clients reached')) {
        return jsonError(
          503,
          'DATABASE_CONNECTION_LIMIT',
          "Ma'lumotlar bazasi ulanish limitiga yetildi. Iltimos, Vercel'da DATABASE_URL ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
        )
      }
      
      // Check for "Tenant or user not found" error
      if (dbError?.message?.includes('Tenant or user not found') ||
          dbError?.message?.includes('tenant or user not found')) {
        return jsonError(
          503,
          'DATABASE_TENANT_ERROR',
          "Ma'lumotlar bazasi username formati noto'g'ri. Supabase uchun username 'postgres.PROJECT-REF' formatida bo'lishi kerak. TENANT_USER_FIX.md faylini ko'ring."
        )
      }
      
      throw dbError
    }

    if (!userExists) {
      return jsonError(401, 'UNAUTHORIZED', 'Foydalanuvchi topilmadi.')
    }

    let fileUrl: string | undefined

    // Upload file to Supabase if provided
    if (file && file.size > 0) {
      try {
        fileUrl = await uploadProjectFile(file, userIdToUse)
      } catch (uploadError: any) {
        console.error('File upload error:', uploadError)
        // Continue without file - don't fail the entire submission
        // But log the error for debugging
        if (uploadError?.message?.includes('Bucket not found')) {
          console.error('⚠️ Supabase Storage bucket "project-files" topilmadi. SUPABASE_STORAGE_SETUP.md faylini ko\'ring.')
        }
      }
    }

    // Create project
    let created
    try {
      created = await prisma.project.create({
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
    } catch (dbError: any) {
      console.error('Database query error in projects POST (create project):', dbError)
      console.error('Error type:', dbError?.constructor?.name)
      console.error('Error code:', dbError?.code)
      
      // Check for connection limit errors
      if (dbError?.message?.includes('MaxClientsInSessionMode') || 
          dbError?.message?.includes('max clients reached')) {
        return jsonError(
          503,
          'DATABASE_CONNECTION_LIMIT',
          "Ma'lumotlar bazasi ulanish limitiga yetildi. Iltimos, Vercel'da DATABASE_URL ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
        )
      }
      
      // Check for "Tenant or user not found" error
      if (dbError?.message?.includes('Tenant or user not found') ||
          dbError?.message?.includes('tenant or user not found')) {
        return jsonError(
          503,
          'DATABASE_TENANT_ERROR',
          "Ma'lumotlar bazasi username formati noto'g'ri. Supabase uchun username 'postgres.PROJECT-REF' formatida bo'lishi kerak. TENANT_USER_FIX.md faylini ko'ring."
        )
      }
      
      return jsonError(500, 'DATABASE_ERROR', "Ma'lumotlar bazasi bilan bog'lanishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")
    }

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
  } catch (error: any) {
    console.error('Project creation error:', error)
    console.error('Error type:', error?.constructor?.name)
    console.error('Error code:', error?.code)
    console.error('Error message:', error?.message)
    
    // Check for connection limit errors
    if (error?.message?.includes('MaxClientsInSessionMode') || 
        error?.message?.includes('max clients reached')) {
      return jsonError(
        503,
        'DATABASE_CONNECTION_LIMIT',
        "Ma'lumotlar bazasi ulanish limitiga yetildi. Iltimos, Vercel'da DATABASE_URL ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
      )
    }
    
    return jsonError(500, 'INTERNAL_ERROR', 'Loyiha yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
  }
}

