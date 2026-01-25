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
    // UserPreferences model doesn't exist in schema, return default theme
    // Theme is stored in localStorage on client side
    return NextResponse.json({
      ok: true,
      data: { theme: 'system' },
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

    // UserPreferences model doesn't exist in schema
    // Theme is stored in localStorage on client side, just return success
    return NextResponse.json({
      ok: true,
      data: { theme },
    });
  } catch (error) {
    console.error('Theme update error:', error);
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}
