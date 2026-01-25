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
    console.error('Prisma client is null - DATABASE_URL not configured')
    // Return mock data for development when DB is not configured
    console.log('Returning mock data since database is not configured')
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

  console.log('Prisma client created successfully')

  try {
    console.log('Starting database queries...')

    // Test connection first with timeout
    try {
      await Promise.race([
        prisma.$connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
        )
      ])
      console.log('Database connection established')
    } catch (connectError) {
      console.error('Database connection failed:', connectError)
      throw new Error(
        `Database serverga ulanib bo'lmadi. Iltimos, quyidagilarni tekshiring:\n` +
        `1. DATABASE_URL to'g'ri ekanligini tekshiring\n` +
        `2. Supabase project faol ekanligini tekshiring\n` +
        `3. Parol to'g'ri ekanligini tekshiring\n` +
        `4. Internet aloqasini tekshiring`
      )
    }

    // Get all statistics in parallel for better performance
    const [
      usersCount,
      totalProjects,
      activeProjects,
      rejectedProjects,
    ] = await Promise.all([
      // Total registered users
      prisma.user.count().catch(err => {
        console.error('User count error:', err)
        return 0
      }),

      // Total projects
      prisma.project.count().catch(err => {
        console.error('Total projects count error:', err)
        return 0
      }),

      // Active projects (status = JARAYONDA)
      prisma.project.count({
        where: { status: 'JARAYONDA' as any }
      }).catch(err => {
        console.error('Active projects count error:', err)
        return 0
      }),

      // Rejected projects (status = RAD_ETILDI)
      prisma.project.count({
        where: { status: 'RAD_ETILDI' as any }
      }).catch(err => {
        console.error('Rejected projects count error:', err)
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
  } catch (error) {
    console.error('Dashboard stats error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return jsonError(500, 'INTERNAL_ERROR', 'Statistika olishda xatolik yuz berdi.', {
      message: error instanceof Error ? error.message : String(error)
    })
  }
}