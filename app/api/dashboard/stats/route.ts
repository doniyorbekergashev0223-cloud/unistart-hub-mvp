import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export const runtime = 'nodejs'
// Prevent static generation - this route must be dynamic
export const dynamic = 'force-dynamic'

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
}

export async function GET() {
  // CRITICAL: This route must be dynamic - never run during build
  // Stats are fetched at runtime only

  const prisma = getPrisma()
  if (!prisma) {
    return jsonError(
      503,
      'DATABASE_NOT_CONFIGURED',
      "Ma'lumotlar bazasi sozlanmagan (DATABASE_URL yo'q)."
    )
  }

  try {
    // Prisma connects lazily, so we test with a simple query instead of $connect()
    // This is more reliable and handles connection errors better
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (connectError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database connection failed:', connectError)
      }
      // Return zeros instead of error to prevent dashboard crash
      return NextResponse.json({
        ok: true,
        data: {
          usersCount: 0,
          totalProjects: 0,
          activeProjects: 0,
          rejectedProjects: 0,
        },
      })
    }

    // Get all statistics in parallel for better performance
    // Each query has individual error handling to prevent one failure from breaking all
    const [
      usersCount,
      totalProjects,
      activeProjects,
      rejectedProjects,
    ] = await Promise.all([
      // Total registered users
      prisma.user.count().catch((err: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('User count error:', err?.message || err)
        }
        return 0
      }),

      // Total projects
      prisma.project.count().catch((err: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Total projects count error:', err?.message || err)
        }
        return 0
      }),

      // Active projects (status = JARAYONDA)
      prisma.project.count({
        where: { status: 'JARAYONDA' as any }
      }).catch((err: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Active projects count error:', err?.message || err)
        }
        return 0
      }),

      // Rejected projects (status = RAD_ETILDI)
      prisma.project.count({
        where: { status: 'RAD_ETILDI' as any }
      }).catch((err: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Rejected projects count error:', err?.message || err)
        }
        return 0
      }),
    ])

    return NextResponse.json({
      ok: true,
      data: {
        usersCount,
        totalProjects,
        activeProjects,
        rejectedProjects,
      },
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard stats error:', error)
      console.error('Error details:', error?.message || String(error))
    }
    // Return zeros instead of error to prevent dashboard crash
    return NextResponse.json({
      ok: true,
      data: {
        usersCount: 0,
        totalProjects: 0,
        activeProjects: 0,
        rejectedProjects: 0,
      },
    })
  }
}