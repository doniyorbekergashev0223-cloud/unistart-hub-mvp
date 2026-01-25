import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * Verify user session endpoint.
 * Used to check if a stored session is still valid.
 */
export async function GET(req: Request) {
  const userId = req.headers.get('x-user-id')
  const userRole = req.headers.get('x-user-role')

  if (!userId || !userRole) {
    return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
  }

  const prisma = getPrisma()
  if (!prisma) {
    return NextResponse.json({ ok: false, error: { code: 'DATABASE_ERROR', message: "Ma'lumotlar bazasi sozlanmagan." } }, { status: 503 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    })

    if (!user || user.role !== userRole) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_SESSION', message: 'Session not valid' } }, { status: 401 })
    }

    return NextResponse.json({
      ok: true,
      data: { user },
    })
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json({ ok: false, error: { code: 'SERVER_ERROR', message: 'Server error' } }, { status: 500 })
  }
}
