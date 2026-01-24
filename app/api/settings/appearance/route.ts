import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';

export const runtime = 'nodejs';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  );
}

// Get theme preference
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
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { theme: true },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          emailStatusChange: true,
          emailAdminComment: true,
          emailPlatformUpdates: false,
          theme: 'system',
        },
        select: { theme: true },
      });
    }

    return NextResponse.json({
      ok: true,
      data: { theme: preferences.theme },
    });
  } catch (error) {
    console.error('Theme fetch error:', error);
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}

// Update theme preference
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
    const body = await req.json().catch(() => null) as null | {
      theme?: unknown;
    };

    if (!body) {
      return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.");
    }

    const theme = typeof body.theme === 'string' ? body.theme : '';
    if (!['light', 'dark', 'system'].includes(theme)) {
      return jsonError(400, 'INVALID_THEME', 'Noto\'g\'ri mavzu. Faqat "light", "dark" yoki "system" qabul qilinadi.');
    }

    // Upsert preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        emailStatusChange: true,
        emailAdminComment: true,
        emailPlatformUpdates: false,
        theme,
      },
      update: { theme },
      select: { theme: true },
    });

    return NextResponse.json({
      ok: true,
      data: { theme: preferences.theme },
    });
  } catch (error) {
    console.error('Theme update error:', error);
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}
