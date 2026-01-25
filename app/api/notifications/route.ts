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

export async function GET(req: NextRequest) {
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

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: actor.userId },
      orderBy: { createdAt: 'desc' },
    })

    const unreadCount = notifications.filter((n) => !n.isRead).length

    return NextResponse.json({
      ok: true,
      data: {
        notifications: notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt,
        })),
        unreadCount,
      },
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}