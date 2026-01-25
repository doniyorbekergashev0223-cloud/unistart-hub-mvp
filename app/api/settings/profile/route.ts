import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';
import { uploadAvatar } from '@/lib/supabase';

export const runtime = 'nodejs';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  );
}

// Get user profile
export async function GET(req: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return jsonError(503, 'DATABASE_NOT_CONFIGURED', "Ma'lumotlar bazasi sozlanmagan.");
  }

  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return jsonError(401, 'UNAUTHORIZED', 'Kirish talab qilinadi.');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return jsonError(404, 'USER_NOT_FOUND', 'Foydalanuvchi topilmadi.');
    }

    return NextResponse.json({ ok: true, data: { user } });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}

// Update user profile
export async function PATCH(req: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return jsonError(503, 'DATABASE_NOT_CONFIGURED', "Ma'lumotlar bazasi sozlanmagan.");
  }

  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return jsonError(401, 'UNAUTHORIZED', 'Kirish talab qilinadi.');
  }

  try {
    const formData = await req.formData();
    const name = formData.get('name')?.toString();
    const avatarFile = formData.get('avatar') as File | null;

    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatarUrl: true },
    });

    if (!existingUser) {
      return jsonError(404, 'USER_NOT_FOUND', 'Foydalanuvchi topilmadi.');
    }

    const updateData: { name?: string; avatarUrl?: string } = {};

    // Update name if provided
    if (name && name.trim() && name !== existingUser.name) {
      if (name.trim().length < 2) {
        return jsonError(400, 'VALIDATION_ERROR', 'Ism kamida 2 ta belgi bo\'lishi kerak.');
      }
      updateData.name = name.trim();
    }

    // Upload avatar if provided
    if (avatarFile && avatarFile.size > 0) {
      try {
        const avatarUrl = await uploadAvatar(avatarFile, userId);
        updateData.avatarUrl = avatarUrl;
      } catch (uploadError: any) {
        console.error('Avatar upload error:', uploadError);
        return jsonError(400, 'AVATAR_UPLOAD_ERROR', uploadError.message || 'Rasm yuklashda xatolik yuz berdi.');
      }
    }

    // If no updates, return current data
    if (Object.keys(updateData).length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
      return NextResponse.json({ ok: true, data: { user } });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, data: { user: updatedUser } });
  } catch (error) {
    console.error('Profile update error:', error);
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}
