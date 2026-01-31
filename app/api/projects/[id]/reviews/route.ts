import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

type Role = 'user' | 'admin' | 'expert'

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!prisma) {
    return jsonError(
      503,
      'DATABASE_NOT_CONFIGURED',
      "Ma'lumotlar bazasi sozlanmagan (DATABASE_URL yo'q)."
    )
  }

  const session = await getSession(req)
  if (!session) {
    return jsonError(401, 'UNAUTHORIZED', "Kirish talab qilinadi.")
  }
  const actor = { userId: session.userId, role: session.role }

  const { id } = params
  if (!id) {
    return jsonError(400, 'INVALID_ID', 'Loyiha ID majburiy.')
  }

  try {
    // ProjectReview model doesn't exist in schema, use ProjectComment instead
    const comments = await prisma.projectComment.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true, authorRole: true, createdAt: true },
    })

    // Format comments as reviews (since ProjectReview model doesn't exist)
    const formattedReviews = comments.map((comment) => ({
      id: comment.id,
      reviewerName: 'Ekspert', // ProjectComment doesn't have reviewer info
      reviewerRole: comment.authorRole,
      status: 'Jarayonda', // Default status since ProjectComment doesn't have status
      comment: comment.content,
      createdAt: comment.createdAt,
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