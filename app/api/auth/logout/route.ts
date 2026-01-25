import { NextResponse } from 'next/server';
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';

export const runtime = 'nodejs';

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status }
  );
}

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return jsonError(401, 'UNAUTHORIZED', 'Kirish talab qilinadi.');
  }

  try {
    // Log logout event
    await logAuditEvent(
      userId,
      'LOGOUT',
      getClientIp(req),
      getUserAgent(req)
    );

    return NextResponse.json({ ok: true, data: { message: 'Muvaffaqiyatli chiqildi' } });
  } catch (error) {
    console.error('Logout error:', error);
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}
