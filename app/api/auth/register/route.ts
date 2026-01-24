import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { hashPassword } from '@/lib/security'

export const runtime = 'nodejs'

type Role = 'user' | 'admin' | 'expert'

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
}

function isRole(value: unknown): value is Role {
  return value === 'user' || value === 'admin' || value === 'expert'
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
    name?: unknown
    email?: unknown
    password?: unknown
    inviteCode?: unknown
  }

  if (!body) {
    return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.")
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const inviteCode = typeof body.inviteCode === 'string' ? body.inviteCode.trim() : ''

  const fieldErrors: Record<string, string> = {}
  if (!name) fieldErrors.name = 'Ism majburiy'
  if (!email) fieldErrors.email = 'Email majburiy'
  if (email && !email.includes('@')) fieldErrors.email = "To'g'ri email kiriting"
  if (!password) fieldErrors.password = 'Parol majburiy'
  if (password && password.length < 6) fieldErrors.password = "Parol kamida 6 ta belgidan iborat bo'lishi kerak"

  if (Object.keys(fieldErrors).length) {
    return jsonError(400, 'VALIDATION_ERROR', "Ma'lumotlar noto'g'ri.", { fieldErrors })
  }

  // All new users get 'user' role by default
  const assignedRole: Role = 'user'

  try {
    const passwordHash = hashPassword(password)

    // Create user
    const result = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: assignedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    /**
     * TODO (keyingi bosqich): real auth bo'lganda shu yerda JWT/session qaytariladi.
     * Hozircha UI mock AuthContext ishlaydi, bu endpoint esa parallel tayyor turadi.
     */
    return NextResponse.json({ ok: true, data: { user: result } }, { status: 201 })
  } catch (e: any) {
    // Prisma unique constraint (email)
    if (typeof e?.code === 'string' && e.code === 'P2002') {
      return jsonError(409, 'EMAIL_ALREADY_EXISTS', 'Bu email allaqachon ro‘yxatdan o‘tgan.')
    }
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}

