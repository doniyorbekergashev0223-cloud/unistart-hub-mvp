import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

type Role = 'user' | 'admin' | 'expert'

function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
}

const ENUM_TO_STATUS: Record<string, string> = {
  QABUL_QILINDI: 'Qabul qilindi',
  JARAYONDA: 'Jarayonda',
  RAD_ETILDI: 'Rad etildi',
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!prisma) {
    return jsonError(
      503,
      'DATABASE_NOT_CONFIGURED',
      "Ma'lumotlar bazasi sozlanmagan."
    )
  }

  const session = await getSession(req)
  if (!session) {
    return jsonError(401, 'UNAUTHORIZED', 'Kirish talab qilinadi.')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { organizationId: true },
  })
  if (!dbUser?.organizationId) {
    return jsonError(403, 'FORBIDDEN', "Tashkilotga bog'lanmagan. Loyihani ko'rish uchun tashkilot a'zosi bo'lishingiz kerak.")
  }
  const orgId = dbUser.organizationId
  const actor = { userId: session.userId, role: session.role }

  const { id } = params
  if (!id) {
    return jsonError(400, 'INVALID_ID', 'Loyiha ID majburiy.')
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        user: { organizationId: orgId },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!project) {
      return jsonError(404, 'PROJECT_NOT_FOUND', 'Loyiha topilmadi.')
    }

    const canAccess =
      project.userId === actor.userId ||
      actor.role === 'admin' ||
      actor.role === 'expert'

    if (!canAccess) {
      return jsonError(403, 'FORBIDDEN', "Ruxsat yo'q.")
    }

    // Get reviews/comments for this project
    // Map admin/expert comments to reviews format
    const reviews = project.comments && Array.isArray(project.comments)
      ? project.comments
          .filter((c: any) => c.authorRole === 'admin' || c.authorRole === 'expert')
          .map((comment: any) => ({
            id: comment.id,
            reviewerId: comment.userId || '',
            reviewerName: comment.authorRole === 'admin' ? 'Admin' : 'Ekspert',
            reviewerRole: comment.authorRole,
            status: ENUM_TO_STATUS[project.status] || project.status,
            statusEnum: project.status,
            comment: comment.content || '',
            createdAt: comment.createdAt,
          }))
      : []

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
        role: project.user.role,
      },
      reviews: reviews, // Always return array, even if empty
      comments: project.comments
        ? project.comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            authorRole: comment.authorRole,
            createdAt: comment.createdAt,
          }))
        : [],
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
