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
    let notification
    try {
      notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: actor.userId,
        },
      })
    } catch (dbError: any) {
      console.error('Database query error in notifications/read (find):', dbError)
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
      
      throw dbError
    }

    if (!notification) {
      return jsonError(404, 'NOT_FOUND', "Bildirishnoma topilmadi.")
    }

    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      })
    } catch (dbError: any) {
      console.error('Database query error in notifications/read (update):', dbError)
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
      
      throw dbError
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Mark notification read error:', error)
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
