import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { generateResetCode, hashToken } from '@/lib/tokens'
import { sendPasswordResetCode } from '@/lib/email'

export const runtime = 'nodejs'

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
}

/**
 * Forgot Password API endpoint.
 * 
 * Flow:
 * 1. User submits email
 * 2. Generate secure 6-digit code
 * 3. Hash and store code + expiry (15 minutes) in database
 * 4. Send code via email
 * 5. Return success (always, for security - don't reveal if email exists)
 * 
 * Security:
 * - Always returns success to prevent email enumeration
 * - Codes expire after 15 minutes
 * - Codes are hashed before storage
 * - Old unused codes are invalidated
 */
export async function POST(req: Request) {
  const prisma = getPrisma()
  if (!prisma) {
    return jsonError(
      503,
      'DATABASE_NOT_CONFIGURED',
      "Ma'lumotlar bazasi sozlanmagan (DATABASE_URL yo'q)."
    )
  }

  try {
    const body = await req.json().catch(() => null) as null | {
      email?: unknown
    }

    if (!body) {
      return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.")
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    // Validate email format
    if (!email || !email.includes('@')) {
      // Return success even for invalid email (security: prevent enumeration)
      return NextResponse.json({
        ok: true,
        data: {
          message: "Agar bu email ro'yxatdan o'tgan bo'lsa, parolni tiklash kodi yuborildi.",
        },
      })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })

    // Always return success (security: don't reveal if email exists)
    // If user doesn't exist, we still return success but don't send email
    if (!user) {
      return NextResponse.json({
        ok: true,
        data: {
          message: "Agar bu email ro'yxatdan o'tgan bo'lsa, parolni tiklash kodi yuborildi.",
        },
      })
    }

    // Generate secure 6-digit code
    const code = generateResetCode()
    const hashedCode = hashToken(code)

    // Set expiry to 15 minutes from now
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    // Invalidate any existing unused reset codes for this user
    await prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: {
        used: true,
      },
    })

    // Create new password reset record
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedCode,
        expiresAt,
      },
    })

    // Send email with reset code
    // If email fails, we still return success (code is stored, user can request again)
    await sendPasswordResetCode(user.email, code)

    return NextResponse.json({
      ok: true,
      data: {
        message: "Agar bu email ro'yxatdan o'tgan bo'lsa, parolni tiklash kodi yuborildi.",
      },
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    // Return success even on error (security: don't reveal system state)
    return NextResponse.json({
      ok: true,
      data: {
        message: "Agar bu email ro'yxatdan o'tgan bo'lsa, parolni tiklash kodi yuborildi.",
      },
    })
  }
}
