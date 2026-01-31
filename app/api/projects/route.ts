import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { uploadProjectFile } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

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

export async function GET(req: Request) {
  if (!prisma) {
    return jsonError(
      503,
      'DATABASE_NOT_CONFIGURED',
      "Ma'lumotlar bazasi sozlanmagan (DATABASE_URL yo'q)."
    )
  }

  const session = await getSession(req)
  if (!session) {
    return jsonError(401, 'UNAUTHORIZED', "Kirish talab qilinadi.")
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { organizationId: true },
  })
  if (!dbUser?.organizationId) {
    return NextResponse.json({
      ok: true,
      data: { projects: [] },
    })
  }
  const orgId = dbUser.organizationId
  const actor = { userId: session.userId, role: session.role }

  let search = ''
  try {
    const url = req.url.startsWith('http') ? new URL(req.url) : new URL(req.url, 'https://localhost')
    search = url.searchParams.get('search')?.trim() || ''
  } catch {
    const q = req.url?.indexOf('?')
    if (typeof q === 'number' && q >= 0) {
      const params = new URLSearchParams(req.url.slice(q + 1))
      search = params.get('search')?.trim() || ''
    }
  }

  const baseWhere: {
    userId?: string
    user: { organizationId: string }
    OR?: { title?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }[]
  } = {
    user: { organizationId: orgId },
  }
  if (actor.role === 'user') {
    baseWhere.userId = actor.userId
  }
  if (search.length > 0) {
    baseWhere.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }
  const whereClause = baseWhere

  try {
    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        contact: true,
        status: true,
        createdAt: true,
        userId: true,
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

  const session = await getSession(req)
  if (!session) {
    return jsonError(401, 'UNAUTHORIZED', "Kirish talab qilinadi.")
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { organizationId: true },
  })
  if (!dbUser?.organizationId) {
    return jsonError(403, 'FORBIDDEN', "Tashkilotga bog'lanmagan. Loyiha yuborish uchun tashkilot a'zosi bo'lishingiz kerak.")
  }
  const actor = { userId: session.userId, role: session.role }

  const contentType = req.headers.get('content-type') || ''

  let title = ''
  let description = ''
  let contact = ''
  let file: File | null = null
  let incomingFileUrl: string | undefined

  if (contentType.includes('application/json')) {
    // JSON format (fileUrl bilan) - katta fayllar uchun Vercel body limitini chetlab o'tish
    const body = (await req.json().catch(() => null)) as
      | null
      | {
          title?: unknown
          description?: unknown
          contact?: unknown
          fileUrl?: unknown
        }

    if (!body) {
      return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.")
    }

    title = typeof body.title === 'string' ? body.title.trim() : ''
    description = typeof body.description === 'string' ? body.description.trim() : ''
    contact = typeof body.contact === 'string' ? body.contact.trim() : ''
    incomingFileUrl = typeof body.fileUrl === 'string' ? body.fileUrl.trim() || undefined : undefined
  } else {
    // Eski FormData formatini qo'llab-quvvatlash (orqaga moslik uchun)
    const formData = await req.formData().catch(() => null)
    if (!formData) {
      return jsonError(400, 'INVALID_FORM_DATA', "Form ma'lumotlari noto'g'ri.")
    }

    title = (formData.get('title') as string)?.trim() || ''
    description = (formData.get('description') as string)?.trim() || ''
    contact = (formData.get('contact') as string)?.trim() || ''
    file = formData.get('file') as File | null
  }

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

    let fileUrl: string | undefined = incomingFileUrl

    // Agar JSON orqali fileUrl kelmagan bo'lsa, FormData'dan kelgan faylni server tarafda yuklaymiz (orqaga moslik uchun)
    if (!fileUrl && file && file.size > 0) {
      try {
        fileUrl = await uploadProjectFile(file, userIdToUse)
      } catch (uploadError: any) {
        console.error('File upload error:', uploadError)
        if (uploadError?.message?.includes('Bucket not found')) {
          return jsonError(
            503,
            'STORAGE_BUCKET_NOT_FOUND',
            "Supabase Storage bucket 'project-files' topilmadi. SUPABASE_STORAGE_SETUP.md faylini ko'ring."
          )
        }
        return jsonError(
          502,
          'FILE_UPLOAD_FAILED',
          uploadError?.message || "Faylni Supabase Storage'ga yuklashda xatolik. Iltimos, qayta urinib ko'ring yoki faylsiz yuboring."
        )
      }
    }

    const orgId = dbUser.organizationId

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

    // SECURITY: Notifications ONLY when a USER submits a project. Recipients: expert/admin in SAME org only.
    // Actor org already verified (early return above). No broadcast; each notification has exactly one userId.
    if (session.role === 'user' && orgId) {
      try {
        const expertsAndAdmins = await prisma.user.findMany({
          where: {
            organizationId: orgId,
            id: { not: session.userId },
            role: { in: ['expert', 'admin'] },
          },
          select: { id: true, organizationId: true },
        })
        const notifTitle = 'Yangi loyiha'
        const notifMessage = "Yangi loyiha yuborildi va tekshiruvni kutmoqda."
        for (const u of expertsAndAdmins) {
          if (u.organizationId !== orgId) continue
          await prisma.notification.create({
            data: { userId: u.id, title: notifTitle, message: notifMessage },
          })
        }
      } catch (notifyErr) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Notify experts/admins on project create:', notifyErr)
        }
      }
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

