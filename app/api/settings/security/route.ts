import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/security';

export const runtime = 'nodejs';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  );
}

// Change password
export async function POST(req: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return jsonError(503, 'DATABASE_NOT_CONFIGURED', "Ma'lumotlar bazasi sozlanmagan.");
  }

  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return jsonError(401, 'UNAUTHORIZED', 'Kirish talab qilinadi.');
  }

  try {
    const body = await req.json().catch(() => null) as null | {
      currentPassword?: unknown;
      newPassword?: unknown;
    };

    if (!body) {
      return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.");
    }

    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    // Validation
    const fieldErrors: Record<string, string> = {};
    if (!currentPassword) {
      fieldErrors.currentPassword = 'Joriy parol majburiy';
    }
    if (!newPassword) {
      fieldErrors.newPassword = 'Yangi parol majburiy';
    } else if (newPassword.length < 8) {
      fieldErrors.newPassword = 'Yangi parol kamida 8 ta belgi bo\'lishi kerak';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return jsonError(400, 'VALIDATION_ERROR', "Ma'lumotlar noto'g'ri.", { fieldErrors });
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return jsonError(404, 'USER_NOT_FOUND', 'Foydalanuvchi topilmadi.');
    }

    // Verify current password
    if (!await verifyPassword(currentPassword, user.passwordHash)) {
      return jsonError(401, 'INVALID_PASSWORD', 'Joriy parol noto\'g\'ri.');
    }

    // Check if new password is different
    if (await verifyPassword(newPassword, user.passwordHash)) {
      return jsonError(400, 'SAME_PASSWORD', 'Yangi parol joriy paroldan farq qilishi kerak.');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Audit logging removed - AuditLog model doesn't exist in schema

    return NextResponse.json({ ok: true, data: { message: 'Parol muvaffaqiyatli o\'zgartirildi.' } });
  } catch (error) {
    console.error('Password change error:', error);
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}
