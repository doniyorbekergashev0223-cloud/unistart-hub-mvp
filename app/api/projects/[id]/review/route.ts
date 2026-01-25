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
    return jsonError(401, 'UNAUTHORIZED', "Kirish talab qilinadi.")
  }

  // Only admin and expert can create reviews
  if (actor.role !== 'admin' && actor.role !== 'expert') {
    return jsonError(403, 'FORBIDDEN', 'Ruxsat yo‘q. Faqat admin yoki ekspert ko‘rib chiqa oladi.')
  }

  const { id } = params
  if (!id) {
    return jsonError(400, 'INVALID_ID', 'Loyiha ID majburiy.')
  }

  const body = await req.json().catch(() => null) as null | {
    status?: unknown
    comment?: unknown
  }

  if (!body) {
    return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.")
  }

  const statusLabel = (typeof body.status === 'string' ? body.status.trim() : '') as 'Qabul qilindi' | 'Jarayonda' | 'Rad etildi' | ''
  const comment = typeof body.comment === 'string' ? body.comment.trim() : ''

  const validStatuses = ['Qabul qilindi', 'Jarayonda', 'Rad etildi']

  const fieldErrors: Record<string, string> = {}
  if (!statusLabel || !validStatuses.includes(statusLabel)) {
    fieldErrors.status = `Status quyidagilardan biri bo'lishi kerak: ${validStatuses.join(', ')}`
  }
  if (!comment) {
    fieldErrors.comment = 'Izoh majburiy'
  }

  if (Object.keys(fieldErrors).length) {
    return jsonError(400, 'VALIDATION_ERROR', "Ma'lumotlar noto'g'ri.", { fieldErrors })
  }

  const statusEnum =
    statusLabel === 'Qabul qilindi' ? 'QABUL_QILINDI' :
    statusLabel === 'Jarayonda' ? 'JARAYONDA' :
    'RAD_ETILDI'

  try {
    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Verify project exists and get owner info
      const project = await tx.project.findUnique({
        where: { id },
        select: { id: true, userId: true, title: true },
      })

      if (!project) {
        throw new Error('PROJECT_NOT_FOUND')
      }

      // Create comment instead of review (ProjectReview model doesn't exist in schema)
      await tx.projectComment.create({
        data: {
          projectId: id,
          content: comment,
          authorRole: actor.role,
        },
      })

      // Update project status to the latest review status
      await tx.project.update({
        where: { id },
        data: { status: statusEnum as any },
      })

      // Notification creation removed - Notification model doesn't exist in schema
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error.message === 'PROJECT_NOT_FOUND') {
      return jsonError(404, 'PROJECT_NOT_FOUND', 'Loyiha topilmadi.')
    }
    console.error('Review creation error:', error)
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}