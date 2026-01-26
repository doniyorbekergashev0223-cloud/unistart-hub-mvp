import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

  if (!prisma) {
    // CRITICAL: Return ok: true with zeros - never fail stats API
    // This prevents cascading failures and logout bugs
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
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
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
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )
    }

    // Fixed: Get all statistics in a single transaction to ensure consistency
    // This prevents data from changing between queries on refresh
    const stats = await prisma.$transaction(async (tx) => {
      const [
        usersCount,
        totalProjects,
        activeProjects,
        rejectedProjects,
      ] = await Promise.all([
        // Total registered users
        tx.user.count().catch((err: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('User count error:', err?.message || err)
          }
          return 0
        }),

        // Total projects
        tx.project.count().catch((err: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Total projects count error:', err?.message || err)
          }
          return 0
        }),

        // Active projects (status = JARAYONDA)
        tx.project.count({
          where: { status: 'JARAYONDA' as any }
        }).catch((err: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Active projects count error:', err?.message || err)
          }
          return 0
        }),

        // Rejected projects (status = RAD_ETILDI)
        tx.project.count({
          where: { status: 'RAD_ETILDI' as any }
        }).catch((err: any) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Rejected projects count error:', err?.message || err)
          }
          return 0
        }),
      ])

      return { usersCount, totalProjects, activeProjects, rejectedProjects }
    }, {
      timeout: 10000, // 10 second timeout
    })

    const { usersCount, totalProjects, activeProjects, rejectedProjects } = stats

    // Fixed: Add cache control headers to prevent inconsistent data on refresh
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
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard stats error:', error)
      console.error('Error details:', error?.message || String(error))
    }
    // Return zeros instead of error to prevent dashboard crash
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
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  }
}