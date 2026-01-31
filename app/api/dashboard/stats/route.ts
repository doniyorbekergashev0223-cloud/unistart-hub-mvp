import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Dashboard stats for authenticated admin/expert.
 * STRICT: All counts are scoped by User.organizationId. No global aggregates.
 * If organizationId is missing → empty stats only. Never fallback to platform-wide data.
 */
function emptyStats() {
  return NextResponse.json(
    {
      ok: true,
      data: {
        usersCount: 0,
        totalProjects: 0,
        activeProjects: 0,
        rejectedProjects: 0,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  )
}

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status }
  )
}

export async function GET(req: Request) {
  const session = await getSession(req)
  if (!session) {
    return jsonError(401, 'UNAUTHORIZED', "Kirish talab qilinadi.")
  }

  if (!prisma) {
    return emptyStats()
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { organizationId: true },
  })

  if (!dbUser?.organizationId) {
    return emptyStats()
  }

  const orgId = dbUser.organizationId

  try {
    const orgWhereProject = { user: { organizationId: orgId } }
    const orgWhereUser = { organizationId: orgId }

    const [usersCount, totalProjects, activeProjects, rejectedProjects] = await Promise.all([
      prisma.user.count({ where: orgWhereUser }),
      prisma.project.count({ where: orgWhereProject }),
      prisma.project.count({
        where: { ...orgWhereProject, status: 'JARAYONDA' },
      }),
      prisma.project.count({
        where: { ...orgWhereProject, status: 'RAD_ETILDI' },
      }),
    ])

    return NextResponse.json(
      {
        ok: true,
        data: {
          usersCount,
          totalProjects,
          activeProjects,
          rejectedProjects,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard stats error:', err)
    }
    return emptyStats()
  }
}
