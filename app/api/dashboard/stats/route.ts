import { NextResponse } from 'next/server'
import { prismaDirect } from '@/lib/prismaDirect'
import { getSession } from '@/lib/auth'
import { getStats, setStats, dashboardStatsKey } from '@/lib/statsCache'

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
  try {
    const session = await getSession(req)
    if (!session) {
      return jsonError(401, 'UNAUTHORIZED', "Kirish talab qilinadi.")
    }

    if (!prismaDirect) {
      return emptyStats()
    }

    const dbUser = await prismaDirect.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    })

    if (!dbUser?.organizationId) {
      return emptyStats()
    }

    const orgId = dbUser.organizationId
    const cacheKey = dashboardStatsKey(orgId)
    let cached: { ok: true; data: { usersCount: number; totalProjects: number; activeProjects: number; rejectedProjects: number } } | null = null
    try {
      cached = getStats(cacheKey)
    } catch {
      // cache read failed, proceed to DB
    }
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      })
    }

    const orgWhereProject = { user: { organizationId: orgId } }
    const orgWhereUser = { organizationId: orgId }

    const [usersCount, totalProjects, activeProjects, rejectedProjects] = await Promise.all([
      prismaDirect.user.count({ where: orgWhereUser }),
      prismaDirect.project.count({ where: orgWhereProject }),
      prismaDirect.project.count({
        where: { ...orgWhereProject, status: 'JARAYONDA' },
      }),
      prismaDirect.project.count({
        where: { ...orgWhereProject, status: 'RAD_ETILDI' },
      }),
    ])

    const payload = {
      ok: true as const,
      data: {
        usersCount,
        totalProjects,
        activeProjects,
        rejectedProjects,
      },
    }
    try {
      setStats(cacheKey, payload)
    } catch {
      // cache write failed, response still valid
    }
    return NextResponse.json(
      payload,
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
