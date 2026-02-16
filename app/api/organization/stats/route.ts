import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { prismaDirect } from '@/lib/prismaDirect'
import { getSession } from '@/lib/auth'
import { getStats, setStats, orgStatsKey } from '@/lib/statsCache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Role-based stats. NO organization-wide data for role=user.
 * - organizationId is ALWAYS resolved from the authenticated user (DB).
 * - role=user: ONLY this user's projects. Every query MUST include userId: session.userId.
 *   Never return org totals; user must not see other users' counts.
 * - role=expert|admin: organization-level only (user.organizationId = orgId, usersCount where organizationId = orgId).
 * - If organizationId is missing → empty stats. Never global fallback.
 */

const MONTH_NAMES = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

function emptyData(role: string) {
  const data: {
    usersCount?: number
    totalProjects: number
    byStatus: { accepted: number; rejected: number; pending: number }
    byMonth: { month: string; count: number }[]
  } = {
    totalProjects: 0,
    byStatus: { accepted: 0, rejected: 0, pending: 0 },
    byMonth: [],
  }
  if (role === 'admin' || role === 'expert') {
    data.usersCount = 0
  }
  return NextResponse.json({ ok: true, data })
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

    const db = prisma ?? prismaDirect
    if (!db) {
      return emptyData(session.role)
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    })

    if (!dbUser?.organizationId) {
      return emptyData(session.role)
    }

    const orgId = dbUser.organizationId
    const isUserRole = session.role === 'user'
    const cacheKey = orgStatsKey(orgId, session.role, session.userId)

    const projectWhere = isUserRole
      ? { userId: session.userId, user: { organizationId: orgId } }
      : { user: { organizationId: orgId } }

    const [usersCount, totalProjects, statusGroups, projectDates] = await Promise.all([
      isUserRole
        ? Promise.resolve(0)
        : db.user.count({ where: { organizationId: orgId } }),
      db.project.count({ where: projectWhere }),
      db.project.groupBy({
        by: ['status'],
        where: projectWhere,
        _count: { id: true },
      }),
      db.project.findMany({
        where: projectWhere,
        select: { createdAt: true },
      }),
    ])

    const statusMap = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count.id])
    )
    const byStatus = {
      accepted: statusMap.QABUL_QILINDI ?? 0,
      rejected: statusMap.RAD_ETILDI ?? 0,
      pending: statusMap.JARAYONDA ?? 0,
    }

    const monthMap = new Map<string, number>()
    for (const p of projectDates) {
      const d = p.createdAt
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, (monthMap.get(key) || 0) + 1)
    }
    const byMonth = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, count]) => {
        const [y, m] = key.split('-')
        const monthLabel = `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`
        return { month: monthLabel, count }
      })

    const data: {
      usersCount?: number
      totalProjects: number
      byStatus: { accepted: number; rejected: number; pending: number }
      byMonth: { month: string; count: number }[]
    } = {
      totalProjects,
      byStatus,
      byMonth,
    }
    if (!isUserRole) {
      data.usersCount = usersCount
    }

    const payload = { ok: true as const, data }
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
        },
      }
    )
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Organization stats error:', err)
    }
    return emptyData('user')
  }
}
