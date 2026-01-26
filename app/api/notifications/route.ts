import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
    let notifications
    try {
      notifications = await prisma.notification.findMany({
        where: { userId: actor.userId },
        orderBy: { createdAt: 'desc' },
      })
    } catch (dbError: any) {
      console.error('Database query error in notifications:', dbError)
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
  } catch (error: any) {
    console.error('Notifications fetch error:', error)
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
    
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}