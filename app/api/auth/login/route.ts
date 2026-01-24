import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { verifyPassword } from '@/lib/security'

export const runtime = 'nodejs'

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
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

  const body = await req.json().catch(() => null) as null | {
    email?: unknown
    password?: unknown
  }

  if (!body) {
    return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.")
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  const fieldErrors: Record<string, string> = {}
  if (!email) fieldErrors.email = 'Email majburiy'
  if (email && !email.includes('@')) fieldErrors.email = "To'g'ri email kiriting"
  if (!password) fieldErrors.password = 'Parol majburiy'

  if (Object.keys(fieldErrors).length) {
    return jsonError(400, 'VALIDATION_ERROR', "Ma'lumotlar noto'g'ri.", { fieldErrors })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      passwordHash: true,
    },
  })

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return jsonError(401, 'INVALID_CREDENTIALS', 'Email yoki parol noto‘g‘ri.')
  }

  const { passwordHash, ...safeUser } = user

  /**
   * TODO (keyingi bosqich): real auth bo'lganda shu yerda JWT/session qaytariladi.
   * Hozircha UI mock AuthContext ishlaydi, bu endpoint esa parallel tayyor turadi.
   */
  return NextResponse.json({ ok: true, data: { user: safeUser } })
}

