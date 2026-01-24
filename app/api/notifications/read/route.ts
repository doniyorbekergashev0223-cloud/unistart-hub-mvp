import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export const runtime = 'nodejs'

type Role = 'user' | 'admin' | 'expert'

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

function getActor(req: NextRequest): { userId: string; role: Role } | null {
  const userId = req.headers.get('x-user-id')?.trim()
  const role = parseRole(req.headers.get('x-user-role'))
  if (!userId || !role) return null
  return { userId, role }
}

export async function POST(req: NextRequest) {
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
    return jsonError(401, 'UNAUTHORIZED', "Kirish talab qilinadi.")
  }

  const body = await req.json().catch(() => null) as null | {
    notificationId?: unknown
  }

  if (!body) {
    return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.")
  }

  const notificationId = typeof body.notificationId === 'string' ? body.notificationId.trim() : ''

  if (!notificationId) {
    return jsonError(400, 'VALIDATION_ERROR', "Bildirishnoma ID majburiy.")
  }

  try {
    // Verify notification exists and belongs to current user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: actor.userId,
      },
    })

    if (!notification) {
      return jsonError(404, 'NOT_FOUND', "Bildirishnoma topilmadi.")
    }

    // Mark as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Mark notification read error:', error)
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}