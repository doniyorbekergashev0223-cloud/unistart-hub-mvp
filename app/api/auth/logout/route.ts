import { NextResponse } from 'next/server'
import { getSession, AUTH_COOKIE_NAME, AUTH_COOKIE_CLEAR_OPTIONS } from '@/lib/auth'
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit'

export const runtime = 'nodejs'

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status }
  )
}

export async function POST(req: Request) {
  const session = await getSession(req)
  if (session?.userId) {
    try {
      await logAuditEvent(session.userId, 'LOGOUT', getClientIp(req), getUserAgent(req))
    } catch {
      // Don't fail logout on audit error
    }
  }

  const res = NextResponse.json({ ok: true, data: { message: 'Muvaffaqiyatli chiqildi' } })
  res.cookies.set(AUTH_COOKIE_NAME, '', AUTH_COOKIE_CLEAR_OPTIONS)
  return res
}
