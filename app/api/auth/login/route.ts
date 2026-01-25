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
  try {
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

    let user
    try {
      user = await prisma.user.findUnique({
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
    } catch (dbError: any) {
      console.error('Database query error:', dbError)
      console.error('Error type:', dbError?.constructor?.name)
      console.error('Error code:', dbError?.code)
      console.error('Error message:', dbError?.message)
      
      // Check for authentication errors
      if (dbError?.message?.includes('Authentication failed') || 
          dbError?.message?.includes('provided database credentials') ||
          dbError?.message?.includes('password authentication failed') ||
          dbError?.code === 'P1000') {
        console.error('❌ DATABASE AUTHENTICATION ERROR: Invalid credentials in DATABASE_URL')
        console.error('❌ Please check:')
        console.error('   1. Database password is correct in Vercel environment variables')
        console.error('   2. Special characters in password are URL-encoded (@ → %40, # → %23, etc.)')
        console.error('   3. Username format is correct (postgres.PROJECT-REF)')
        return jsonError(
          503,
          'DATABASE_AUTHENTICATION_ERROR',
          "Ma'lumotlar bazasi autentifikatsiya xatosi. Iltimos, Vercel'da DATABASE_URL ni tekshiring: parol to'g'ri, maxsus belgilar URL-encode qilingan bo'lishi kerak. DATABASE_AUTHENTICATION_FIX.md faylini ko'ring."
        )
      }
      
      // Check for connection limit errors
      if (dbError?.message?.includes('MaxClientsInSessionMode') || 
          dbError?.message?.includes('max clients reached')) {
        return jsonError(
          503,
          'DATABASE_CONNECTION_LIMIT',
          "Ma'lumotlar bazasi ulanish limitiga yetildi. Iltimos, Vercel'da DATABASE_URL ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
        )
      }
      
      // Check for connection errors
      if (dbError?.message?.includes("Can't reach database server") ||
          dbError?.code === 'P1001') {
        return jsonError(
          503,
          'DATABASE_CONNECTION_ERROR',
          "Ma'lumotlar bazasi serveriga ulanib bo'lmadi. Iltimos, DATABASE_URL ni tekshiring."
        )
      }
      
      return jsonError(
        500,
        'DATABASE_ERROR',
        "Ma'lumotlar bazasi bilan bog'lanishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
      )
    }

    if (!user) {
      return jsonError(401, 'INVALID_CREDENTIALS', `Email yoki parol noto'g'ri.`)

    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      return jsonError(401, 'INVALID_CREDENTIALS', "Email yoki parol noto'g'ri.")

    }

    const { passwordHash, ...safeUser } = user

    return NextResponse.json({ ok: true, data: { user: safeUser } })
  } catch (error) {
    console.error('Login error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return jsonError(
      500,
      'INTERNAL_ERROR',
      'Server xatoligi yuz berdi. Iltimos, qayta urinib ko\'ring.'
    )
  }
}
