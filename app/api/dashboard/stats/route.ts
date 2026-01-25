import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export const runtime = 'nodejs'

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
}

export async function GET() {
  console.log('Dashboard stats API called')
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
  console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...')

  const prisma = getPrisma()
  if (!prisma) {
    return jsonError(
      503,
      'DATABASE_NOT_CONFIGURED',
      "Ma'lumotlar bazasi sozlanmagan (DATABASE_URL yo'q)."
    )
  }

  console.log('Prisma client created successfully')

  try {
    console.log('Starting database queries...')

    // Prisma connects lazily, so we test with a simple query instead of $connect()
    // This is more reliable and handles connection errors better
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('Database connection verified')
    } catch (connectError: any) {
      console.error('Database connection failed:', connectError)
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
        console.error('User count error:', err?.message || err)
        return 0
      }),

      // Total projects
      prisma.project.count().catch((err: any) => {
        console.error('Total projects count error:', err?.message || err)
        return 0
      }),

      // Active projects (status = JARAYONDA)
      prisma.project.count({
        where: { status: 'JARAYONDA' as any }
      }).catch((err: any) => {
        console.error('Active projects count error:', err?.message || err)
        return 0
      }),

      // Rejected projects (status = RAD_ETILDI)
      prisma.project.count({
        where: { status: 'RAD_ETILDI' as any }
      }).catch((err: any) => {
        console.error('Rejected projects count error:', err?.message || err)
        return 0
      }),
    ])

    console.log('Database queries completed:', { usersCount, totalProjects, activeProjects, rejectedProjects })

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
    console.error('Dashboard stats error:', error)
    console.error('Error details:', error?.message || String(error))
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