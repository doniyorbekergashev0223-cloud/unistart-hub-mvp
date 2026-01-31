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

  // Check if user can access this project's comments
  let canAccess = false
  if (actor.role === 'admin' || actor.role === 'expert') {
    canAccess = true
  } else if (actor.role === 'user') {
    // Users can only see comments for their own projects
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true },
    })
    canAccess = project?.userId === actor.userId
  }

  if (!canAccess) {
    return jsonError(403, 'FORBIDDEN', 'Bu loyihaning izohlariga kirish huquqi yo\'q.')
  }

  try {
    const comments = await prisma.projectComment.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        authorRole: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        comments: comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          authorRole: comment.authorRole,
          createdAt: comment.createdAt,
        })),
      },
    })
  } catch (error) {
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

  // Only admin and expert can add comments
  if (actor.role !== 'admin' && actor.role !== 'expert') {
    return jsonError(403, 'FORBIDDEN', 'Faqat admin yoki ekspert izoh qoldira oladi.')
  }

  const { id } = params
  if (!id) {
    return jsonError(400, 'INVALID_ID', 'Loyiha ID majburiy.')
  }

  const body = await req.json().catch(() => null) as null | {
    content?: unknown
  }

  if (!body) {
    return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.")
  }

  const content = typeof body.content === 'string' ? body.content.trim() : ''

  if (!content) {
    return jsonError(400, 'INVALID_CONTENT', 'Izoh matni majburiy.')
  }

  // Ensure project exists
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!project) {
    return jsonError(404, 'PROJECT_NOT_FOUND', 'Loyiha topilmadi.')
  }

  try {
    const comment = await prisma.projectComment.create({
      data: {
        content,
        authorRole: actor.role,
        projectId: id,
      },
      select: {
        id: true,
        content: true,
        authorRole: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        ok: true,
        data: {
          comment: {
            id: comment.id,
            content: comment.content,
            authorRole: comment.authorRole,
            createdAt: comment.createdAt,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}