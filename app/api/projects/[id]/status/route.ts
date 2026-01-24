import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export const runtime = 'nodejs'

type Role = 'user' | 'admin' | 'expert'

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
}

function parseRole(value: string | null): Role | null {
  if (value === 'user' || value === 'admin' || value === 'expert') return value
  return null
}

function getActor(req: NextRequest): { userId: string; role: Role } | null {
  const userId = req.headers.get('x-user-id')?.trim()
  const role = parseRole(req.headers.get('x-user-role'))
  if (!userId || !role) return null
  return { userId, role }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = getPrisma()
  if (!prisma) {
    return jsonError(
      503,
      'DATABASE_NOT_CONFIGURED',
      "Ma'lumotlar bazasi sozlanmagan (DATABASE_URL yo'q)."
    )
  }

  const actor = getActor(req)
  if (!actor) {
    return jsonError(401, 'UNAUTHORIZED', "Kirish talab qilinadi (x-user-id va x-user-role headerlari yo'q).")
  }

  // Only admin can change status
  if (actor.role !== 'admin') {
    return jsonError(403, 'FORBIDDEN', 'Faqat admin statusni o\'zgartira oladi.')
  }

  const { id } = params
  if (!id) {
    return jsonError(400, 'INVALID_ID', 'Loyiha ID majburiy.')
  }

  const body = await req.json().catch(() => null) as null | {
    status?: unknown
  }

  if (!body) {
    return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.")
  }

  const status = typeof body.status === 'string' ? body.status.trim() : ''
  const validStatuses = ['Qabul qilindi', 'Jarayonda', 'Rad etildi']

  if (!status || !validStatuses.includes(status)) {
    return jsonError(400, 'INVALID_STATUS', `Status quyidagilardan biri bo'lishi kerak: ${validStatuses.join(', ')}`)
  }

  try {
    const updated = await prisma.project.update({
      where: { id },
      data: { status: status as any },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        project: {
          id: updated.id,
          title: updated.title,
          status: updated.status,
        },
      },
    })
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return jsonError(404, 'PROJECT_NOT_FOUND', 'Loyiha topilmadi.')
    }
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}