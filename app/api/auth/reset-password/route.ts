import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { hashPassword } from '@/lib/security'
import { hashToken, verifyToken } from '@/lib/tokens'

export const runtime = 'nodejs'

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
}

/**
 * Reset Password API endpoint.
 * 
 * Flow:
 * 1. User submits email, code, and new password
 * 2. Find password reset record by hashed code
 * 3. Verify code hasn't expired and hasn't been used
 * 4. Verify code matches (hash comparison)
 * 5. Hash new password
 * 6. Update user password
 * 7. Mark reset code as used
 * 
 * Security:
 * - Codes expire after 15 minutes
 * - Codes can only be used once
 * - Codes are verified using hash comparison
 * - New password is hashed with bcrypt before storage
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
      code?: unknown
      newPassword?: unknown
    }

    if (!body) {
      return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.")
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

    // Validation
    const fieldErrors: Record<string, string> = {}
    if (!email || !email.includes('@')) {
      fieldErrors.email = "To'g'ri email kiriting"
    }
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      fieldErrors.code = "Tasdiqlash kodi 6 ta raqamdan iborat bo'lishi kerak"
    }
    if (!newPassword) {
      fieldErrors.newPassword = 'Yangi parol majburiy'
    } else if (newPassword.length < 8) {
      fieldErrors.newPassword = "Parol kamida 8 ta belgidan iborat bo'lishi kerak"
    }

    if (Object.keys(fieldErrors).length) {
      return jsonError(400, 'VALIDATION_ERROR', "Ma'lumotlar noto'g'ri.", { fieldErrors })
    }

    // Find user by email
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })
    } catch (dbError: any) {
      console.error('Database query error in reset-password (find user):', dbError)
      
      // Check for connection limit errors
      if (dbError?.message?.includes('MaxClientsInSessionMode') || 
          dbError?.message?.includes('max clients reached')) {
        return jsonError(
          503,
          'DATABASE_CONNECTION_LIMIT',
          "Ma'lumotlar bazasi ulanish limitiga yetildi. Iltimos, Vercel'da DATABASE_URL ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
        )
      }
      
      return jsonError(500, 'DATABASE_ERROR', "Ma'lumotlar bazasi bilan bog'lanishda xatolik yuz berdi.")
    }

    if (!user) {
      return jsonError(404, 'USER_NOT_FOUND', 'Foydalanuvchi topilmadi.')
    }

    // Hash the provided code to compare with stored hash
    const hashedCode = hashToken(code)

    // Find password reset record
    let resetRecord
    try {
      resetRecord = await prisma.passwordReset.findFirst({
        where: {
          userId: user.id,
          token: hashedCode,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (dbError: any) {
      console.error('Database query error in reset-password:', dbError)
      
      // Check for connection limit errors
      if (dbError?.message?.includes('MaxClientsInSessionMode') || 
          dbError?.message?.includes('max clients reached')) {
        return jsonError(
          503,
          'DATABASE_CONNECTION_LIMIT',
          "Ma'lumotlar bazasi ulanish limitiga yetildi. Iltimos, Vercel'da DATABASE_URL ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
        )
      }
      
      return jsonError(500, 'DATABASE_ERROR', "Ma'lumotlar bazasi bilan bog'lanishda xatolik yuz berdi.")
    }

    if (!resetRecord) {
      return jsonError(400, 'INVALID_CODE', "Tasdiqlash kodi noto'g'ri yoki muddati o'tgan.")
    }

    // Verify token matches (double-check with verifyToken for extra security)
    if (!verifyToken(code, resetRecord.token)) {
      return jsonError(400, 'INVALID_CODE', "Tasdiqlash kodi noto'g'ri.")
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update user password and mark reset code as used in a transaction
    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      })

      // Mark reset code as used
      await tx.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      })
    })

    return NextResponse.json({
      ok: true,
      data: {
        message: 'Parol muvaffaqiyatli o\'zgartirildi.',
      },
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}
