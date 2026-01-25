import { NextResponse } from 'next/server';
<<<<<<< Updated upstream
import { logAuditEvent, getClientIp, getUserAgent } from '@/lib/audit';
=======
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    // Log logout event
    await logAuditEvent(
      userId,
      'LOGOUT',
      getClientIp(req),
      getUserAgent(req)
    );

=======
    // Logout successful (audit logging removed as AuditLog model doesn't exist in schema)
>>>>>>> Stashed changes
    return NextResponse.json({ ok: true, data: { message: 'Muvaffaqiyatli chiqildi' } });
  } catch (error) {
    console.error('Logout error:', error);
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}
