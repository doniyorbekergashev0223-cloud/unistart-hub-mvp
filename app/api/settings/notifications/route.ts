import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  );
}

// Get notification preferences
export async function GET(req: Request) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return jsonError(401, 'UNAUTHORIZED', 'Kirish talab qilinadi.');
  }

  try {
    // Return default preferences (stored in localStorage on client side)
    // Since UserPreferences model doesn't exist in schema, we use defaults
    return NextResponse.json({
      ok: true,
      data: {
        emailStatusChange: true,
        emailAdminComment: true,
        emailPlatformUpdates: false,
      },
    });
  } catch (error) {
    console.error('Notification preferences fetch error:', error);
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}

// Update notification preferences
export async function PATCH(req: Request) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return jsonError(401, 'UNAUTHORIZED', 'Kirish talab qilinadi.');
  }

  try {
    const body = await req.json().catch(() => null) as null | {
      emailStatusChange?: boolean;
      emailAdminComment?: boolean;
      emailPlatformUpdates?: boolean;
    };

    if (!body) {
      return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.");
    }

    // Since UserPreferences model doesn't exist in schema, 
    // we just return the updated values (client will store in localStorage)
    const preferences = {
      emailStatusChange: body.emailStatusChange ?? true,
      emailAdminComment: body.emailAdminComment ?? true,
      emailPlatformUpdates: body.emailPlatformUpdates ?? false,
    };

    return NextResponse.json({
      ok: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Notification preferences update error:', error);
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}
