import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

type Role = 'user' | 'admin' | 'expert'

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
  const actor = { userId: session.userId, role: session.role }

  // Only admin and expert can create reviews
  if (actor.role !== 'admin' && actor.role !== 'expert') {
    return jsonError(403, 'FORBIDDEN', 'Ruxsat yo‘q. Faqat admin yoki ekspert ko‘rib chiqa oladi.')
  }

  const { id } = params
  if (!id) {
    return jsonError(400, 'INVALID_ID', 'Loyiha ID majburiy.')
  }

  const body = await req.json().catch(() => null) as null | {
    status?: unknown
    comment?: unknown
  }

  if (!body) {
    return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.")
  }

  const statusLabel = (typeof body.status === 'string' ? body.status.trim() : '') as 'Qabul qilindi' | 'Jarayonda' | 'Rad etildi' | ''
  const comment = typeof body.comment === 'string' ? body.comment.trim() : ''

  const validStatuses = ['Qabul qilindi', 'Jarayonda', 'Rad etildi']

  const fieldErrors: Record<string, string> = {}
  if (!statusLabel || !validStatuses.includes(statusLabel)) {
    fieldErrors.status = `Status quyidagilardan biri bo'lishi kerak: ${validStatuses.join(', ')}`
  }
  if (!comment) {
    fieldErrors.comment = 'Izoh majburiy'
  }

  if (Object.keys(fieldErrors).length) {
    return jsonError(400, 'VALIDATION_ERROR', "Ma'lumotlar noto'g'ri.", { fieldErrors })
  }

  const statusEnum =
    statusLabel === 'Qabul qilindi' ? 'QABUL_QILINDI' :
    statusLabel === 'Jarayonda' ? 'JARAYONDA' :
    'RAD_ETILDI'

  const actorUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { organizationId: true },
  })
  if (!actorUser?.organizationId) {
    return jsonError(403, 'FORBIDDEN', "Tashkilotga bog'lanmagan.")
  }
  const actorOrgId = actorUser.organizationId

  try {
    await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id },
        select: { id: true, userId: true, title: true, user: { select: { organizationId: true } } },
      })

      if (!project) {
        throw new Error('PROJECT_NOT_FOUND')
      }

      const projectOrgId = project.user?.organizationId ?? null
      if (projectOrgId !== actorOrgId) {
        throw new Error('FORBIDDEN_ORG')
      }

      await tx.projectComment.create({
        data: {
          projectId: id,
          content: comment,
          authorRole: actor.role,
        },
      })

      await tx.project.update({
        where: { id },
        data: { status: statusEnum as any },
      })

      // SECURITY: Only the project owner (project.userId) receives this notification. No one else.
      // Organization already verified: projectOrgId === actorOrgId.
      const ownerOrgId = project.user?.organizationId ?? null
      if (ownerOrgId !== actorOrgId) {
        throw new Error('FORBIDDEN_ORG')
      }
      const recipientUserId = project.userId
      if (!recipientUserId) {
        throw new Error('PROJECT_OWNER_MISSING')
      }

      let notifTitle: string
      let notifMessage: string
      if (statusEnum === 'QABUL_QILINDI') {
        notifTitle = 'Loyiha qabul qilindi'
        notifMessage = "Loyihangiz qabul qilindi 🎉"
      } else if (statusEnum === 'RAD_ETILDI') {
        notifTitle = 'Loyiha rad etildi'
        notifMessage = "Loyihangiz rad etildi."
      } else {
        notifTitle = "Loyihangiz ko'rib chiqildi"
        notifMessage = `Loyihangiz "${project.title}" holati 'Jarayonda' ga o'zgartirildi.`
      }

      await tx.notification.create({
        data: {
          userId: recipientUserId,
          title: notifTitle,
          message: notifMessage,
        },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error.message === 'PROJECT_NOT_FOUND') {
      return jsonError(404, 'PROJECT_NOT_FOUND', 'Loyiha topilmadi.')
    }
    if (error.message === 'FORBIDDEN_ORG') {
      return jsonError(403, 'FORBIDDEN', "Boshqa tashkilot loyihasini ko'rib chiqish mumkin emas.")
    }
    
    // Database connection errors
    const errorMessage = error?.message || ''
    if (errorMessage.includes('MaxClientsInSessionMode') || errorMessage.includes('max clients reached')) {
      console.error('Database connection limit error:', error)
      return jsonError(
        503,
        'DATABASE_CONNECTION_LIMIT',
        "Ma'lumotlar bazasi ulanish limitiga yetdi. Iltimos, Vercel'da DATABASE_URL'ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
      )
    }
    if (errorMessage.includes('Authentication failed') || errorMessage.includes('database credentials')) {
      console.error('Database authentication error:', error)
      return jsonError(
        503,
        'DATABASE_AUTHENTICATION_ERROR',
        "Ma'lumotlar bazasi autentifikatsiya xatosi. Iltimos, DATABASE_URL'dagi parol va username'ni tekshiring. DATABASE_AUTHENTICATION_FIX.md faylini ko'ring."
      )
    }
    if (errorMessage.includes('Tenant or user not found')) {
      console.error('Database tenant error:', error)
      return jsonError(
        503,
        'DATABASE_TENANT_ERROR',
        "Ma'lumotlar bazasi username formati noto'g'ri. Supabase uchun username 'postgres.PROJECT-REF' formatida bo'lishi kerak. TENANT_USER_FIX.md faylini ko'ring."
      )
    }
    
    console.error('Review creation error:', error)
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}