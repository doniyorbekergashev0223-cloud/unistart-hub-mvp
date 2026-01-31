import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Partner universities count (display only)
const PARTNER_UNIVERSITIES_COUNT = 5
// Jami tashkilotlar — doimiy 6 ta (seed dagi tashkilotlar soni, o'zgarmas)
const JAMI_TASHKILOTLAR = 6

function emptyResponse() {
  return NextResponse.json(
    {
      ok: true,
      data: {
        usersCount: 0,
        totalProjects: 0,
        organizationsCount: JAMI_TASHKILOTLAR,
        universitiesCount: PARTNER_UNIVERSITIES_COUNT,
        youthAgencyUsersCount: 0,
        userGrowthByMonth: [] as { month: string; count: number; year: number }[],
        projectsByStatus: { jarayonda: 0, qabulQilindi: 0, radEtildi: 0 },
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  )
}

export async function GET() {
  if (!prisma) {
    return emptyResponse()
  }

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
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

    // Aggregate user registrations by month (anonymized)
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
    const projectsByStatus = {
      jarayonda: statusMap.JARAYONDA ?? 0,
      qabulQilindi: statusMap.QABUL_QILINDI ?? 0,
      radEtildi: statusMap.RAD_ETILDI ?? 0,
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          usersCount,
          totalProjects,
          organizationsCount: JAMI_TASHKILOTLAR,
          universitiesCount: PARTNER_UNIVERSITIES_COUNT,
          youthAgencyUsersCount,
          userGrowthByMonth,
          projectsByStatus,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Public stats error:', err)
    }
    return emptyResponse()
  }
}
