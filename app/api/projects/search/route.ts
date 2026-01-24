import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db';

export const runtime = 'nodejs';

type Role = 'user' | 'admin' | 'expert';
type StatusLabel = 'Qabul qilindi' | 'Jarayonda' | 'Rad etildi';

const ENUM_TO_STATUS: Record<string, StatusLabel> = {
  QABUL_QILINDI: 'Qabul qilindi',
  JARAYONDA: 'Jarayonda',
  RAD_ETILDI: 'Rad etildi',
};

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  );
}

function parseRole(value: string | null): Role | null {
  if (value === 'user' || value === 'admin' || value === 'expert') return value;
  return null;
}

function getActor(req: Request): { userId: string; role: Role } | null {
  const userId = req.headers.get('x-user-id')?.trim();
  const role = parseRole(req.headers.get('x-user-role'));
  if (!userId || !role) return null;
  return { userId, role };
}

export async function GET(req: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return jsonError(
      503,
      'DATABASE_NOT_CONFIGURED',
      "Ma'lumotlar bazasi sozlanmagan (DATABASE_URL yo'q)."
    );
  }

  const actor = getActor(req);
  if (!actor) {
    return jsonError(401, 'UNAUTHORIZED', "Kirish talab qilinadi (x-user-id va x-user-role headerlari yo'q).");
  }

  // Get search query from URL
  const url = new URL(req.url);
  const query = url.searchParams.get('q')?.trim() || '';

  // If query is empty, return empty results (caller should use /api/projects instead)
  if (!query) {
    return NextResponse.json({
      ok: true,
      data: { projects: [] },
    });
  }

  try {
    // Base where clause for access control
    const baseWhere =
      actor.role === 'admin' || actor.role === 'expert'
        ? {}
        : { userId: actor.userId };

    // Search conditions: title, description, status, or user name
    const statusMatches: Array<{ status: 'QABUL_QILINDI' | 'JARAYONDA' | 'RAD_ETILDI' }> = [];
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('qabul') || queryLower.includes('qabul qilindi')) {
      statusMatches.push({ status: 'QABUL_QILINDI' });
    }
    if (queryLower.includes('jarayon') || queryLower.includes('jarayonda')) {
      statusMatches.push({ status: 'JARAYONDA' });
    }
    if (queryLower.includes('rad') || queryLower.includes('rad etildi')) {
      statusMatches.push({ status: 'RAD_ETILDI' });
    }

    const searchConditions = {
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
        {
          user: {
            name: { contains: query, mode: 'insensitive' as const },
          },
        },
        ...statusMatches,
      ],
    };

    // Combine base where with search conditions
    const where = {
      ...baseWhere,
      ...searchConditions,
    };

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        projects: projects.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          contact: p.contact,
          status: ENUM_TO_STATUS[String(p.status)] ?? 'Jarayonda',
          createdAt: p.createdAt,
          user: p.user,
        })),
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return jsonError(500, 'INTERNAL_ERROR', 'Qidiruvda xatolik yuz berdi.');
  }
}
