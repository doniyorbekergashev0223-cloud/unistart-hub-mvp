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
    // Get all reviews for this project, ordered by newest first
    const reviews = await prisma.projectReview.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: {
          select: { id: true, name: true, role: true },
        },
      },
    })

    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      reviewerName: review.reviewer.name,
      reviewerRole: review.reviewer.role,
      status: review.status === 'QABUL_QILINDI' ? 'Qabul qilindi' :
              review.status === 'RAD_ETILDI' ? 'Rad etildi' : 'Jarayonda',
      comment: review.comment,
      createdAt: review.createdAt,
    }))

    return NextResponse.json({
      ok: true,
      data: {
        reviews: formattedReviews,
      },
    })
  } catch (error) {
    console.error('Reviews fetch error:', error)
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}