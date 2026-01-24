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

const ENUM_TO_STATUS: Record<string, string> = {
  QABUL_QILINDI: 'Qabul qilindi',
  JARAYONDA: 'Jarayonda',
  RAD_ETILDI: 'Rad etildi',
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    return jsonError(401, 'UNAUTHORIZED', "Kirish talab qilinadi.")
  }

  const { id } = params
  if (!id) {
    return jsonError(400, 'INVALID_ID', 'Loyiha ID majburiy.')
  }

  try {
    // Get project with all relations
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviews: {
          orderBy: { createdAt: 'asc' },
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    })

    if (!project) {
      return jsonError(404, 'PROJECT_NOT_FOUND', 'Loyiha topilmadi.')
    }

    // Access control: only owner, admin, or expert can view
    const canAccess =
      project.userId === actor.userId ||
      actor.role === 'admin' ||
      actor.role === 'expert'

    if (!canAccess) {
      return jsonError(403, 'FORBIDDEN', 'Ruxsat yo\'q.')
    }

    // Format project data
    const formattedProject = {
      id: project.id,
      title: project.title,
      description: project.description,
      contact: project.contact,
      status: ENUM_TO_STATUS[project.status] || project.status,
      statusEnum: project.status,
      fileUrl: project.fileUrl,
      createdAt: project.createdAt,
      owner: {
        id: project.user.id,
        name: project.user.name,
        email: project.user.email,
      },
      reviews: project.reviews.map((review) => ({
        id: review.id,
        reviewerId: review.reviewerId,
        reviewerName: review.reviewer.name,
        reviewerRole: review.reviewer.role,
        status: ENUM_TO_STATUS[review.status] || review.status,
        statusEnum: review.status,
        comment: review.comment,
        createdAt: review.createdAt,
      })),
    }

    return NextResponse.json({
      ok: true,
      data: { project: formattedProject },
    })
  } catch (error) {
    console.error('Project fetch error:', error)
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}