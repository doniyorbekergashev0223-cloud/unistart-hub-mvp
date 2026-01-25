import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';

export const runtime = 'nodejs';

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  );
}

// Get audit log
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
    // AuditLog model doesn't exist in schema, return empty array
    // This is a graceful degradation - audit logging feature is disabled
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    return NextResponse.json({
      ok: true,
      data: {
        logs: [],
        total: 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Audit log fetch error:', error);
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.');
  }
}
