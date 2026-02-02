import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getStats, setStats, publicStatsKey } from '@/lib/statsCache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PARTNER_UNIVERSITIES_COUNT = 5
const JAMI_TASHKILOTLAR = 6

type PublicStatsData = {
  usersCount: number
  totalProjects: number
  activeProjects: number
  rejectedProjects: number
  organizationsCount: number
  universitiesCount: number
  youthAgencyUsersCount: number
  userGrowthByMonth: { month: string; count: number; year: number }[]
  projectsByStatus: { jarayonda: number; qabulQilindi: number; radEtildi: number }
}

type PublicStatsPayload = { ok: true; data: PublicStatsData }

const EMPTY_DATA: PublicStatsData = {
  usersCount: 0,
  totalProjects: 0,
  activeProjects: 0,
  rejectedProjects: 0,
  organizationsCount: JAMI_TASHKILOTLAR,
  universitiesCount: PARTNER_UNIVERSITIES_COUNT,
  youthAgencyUsersCount: 0,
  userGrowthByMonth: [],
  projectsByStatus: { jarayonda: 0, qabulQilindi: 0, radEtildi: 0 },
}

function emptyResponse(): NextResponse {
  return NextResponse.json(
    { ok: true, data: EMPTY_DATA } as PublicStatsPayload,
    {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    }
  )
}

function jsonResponse(payload: PublicStatsPayload): NextResponse {
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  })
}

export async function GET() {
  const cacheKey = publicStatsKey()

  let cached: PublicStatsPayload | null = null
  try {
    cached = getStats<PublicStatsPayload>(cacheKey)
  } catch {
    // cache read failed, proceed to DB
  }
  if (cached != null && typeof cached.ok === 'boolean' && cached.ok === true && cached.data != null) {
    const d = cached.data
    const safe: PublicStatsPayload = {
      ok: true,
      data: {
        usersCount: typeof d.usersCount === 'number' ? d.usersCount : 0,
        totalProjects: typeof d.totalProjects === 'number' ? d.totalProjects : 0,
        activeProjects: typeof d.activeProjects === 'number' ? d.activeProjects : (d.projectsByStatus?.jarayonda ?? 0),
        rejectedProjects: typeof d.rejectedProjects === 'number' ? d.rejectedProjects : (d.projectsByStatus?.radEtildi ?? 0),
        organizationsCount: typeof d.organizationsCount === 'number' ? d.organizationsCount : JAMI_TASHKILOTLAR,
        universitiesCount: typeof d.universitiesCount === 'number' ? d.universitiesCount : PARTNER_UNIVERSITIES_COUNT,
        youthAgencyUsersCount: typeof d.youthAgencyUsersCount === 'number' ? d.youthAgencyUsersCount : 0,
        userGrowthByMonth: Array.isArray(d.userGrowthByMonth) ? d.userGrowthByMonth : [],
        projectsByStatus: d.projectsByStatus && typeof d.projectsByStatus === 'object'
          ? {
              jarayonda: typeof d.projectsByStatus.jarayonda === 'number' ? d.projectsByStatus.jarayonda : 0,
              qabulQilindi: typeof d.projectsByStatus.qabulQilindi === 'number' ? d.projectsByStatus.qabulQilindi : 0,
              radEtildi: typeof d.projectsByStatus.radEtildi === 'number' ? d.projectsByStatus.radEtildi : 0,
            }
          : { jarayonda: 0, qabulQilindi: 0, radEtildi: 0 },
      },
    }
    return jsonResponse(safe)
  }

  if (!prisma) {
    const fallback = getStats<PublicStatsPayload>(cacheKey)
    if (fallback != null && fallback.data) return jsonResponse(fallback)
    return emptyResponse()
  }

  try {
    const [usersCount, totalProjects, userDates, statusCounts, youthAgencyUsersCount] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.user.findMany({ select: { createdAt: true } }),
      prisma.project.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.user.count({
        where: { organization: { slug: 'youth-agency' } },
      }),
    ])

    const monthMap = new Map<string, number>()
    const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
    for (const u of userDates) {
      const d = u.createdAt
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, (monthMap.get(key) || 0) + 1)
    }
    const userGrowthByMonth = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([key, count]) => {
        const [y, m] = key.split('-')
        return {
          month: monthNames[parseInt(m, 10) - 1],
          count,
          year: parseInt(y, 10),
        }
      })

    const statusMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count.id])
    )
    const jarayonda = statusMap.JARAYONDA ?? 0
    const qabulQilindi = statusMap.QABUL_QILINDI ?? 0
    const radEtildi = statusMap.RAD_ETILDI ?? 0
    const projectsByStatus = { jarayonda, qabulQilindi, radEtildi }

    const payload: PublicStatsPayload = {
      ok: true,
      data: {
        usersCount: Number(usersCount),
        totalProjects: Number(totalProjects),
        activeProjects: jarayonda,
        rejectedProjects: radEtildi,
        organizationsCount: JAMI_TASHKILOTLAR,
        universitiesCount: PARTNER_UNIVERSITIES_COUNT,
        youthAgencyUsersCount: Number(youthAgencyUsersCount),
        userGrowthByMonth,
        projectsByStatus,
      },
    }
    try {
      setStats(cacheKey, payload)
    } catch {
      // cache write failed
    }
    return jsonResponse(payload)
  } catch (_err) {
    const fallback = getStats<PublicStatsPayload>(cacheKey)
    if (fallback != null && fallback.data) return jsonResponse(fallback)
    return emptyResponse()
  }
}
