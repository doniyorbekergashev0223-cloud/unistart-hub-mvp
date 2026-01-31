import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * Verify session from httpOnly cookie (JWT).
 * No client-supplied identity; cookie is the only source.
 */
export async function GET(req: Request) {
  const session = await getSession(req)
  if (!session) {
    return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ ok: false, error: { code: 'DATABASE_ERROR', message: "Ma'lumotlar bazasi sozlanmagan." } }, { status: 503 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        organizationId: true,
      },
    })

    if (!user || user.role !== session.role) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_SESSION', message: 'Session not valid' } }, { status: 401 })
    }

    let organization: { name: string; logoUrl: string | null } | null = null
    if (user.organizationId) {
      try {
        const org = await prisma.organization.findUnique({
          where: { id: user.organizationId },
          select: { name: true, logoUrl: true },
        })
        if (org) {
          organization = { name: org.name, logoUrl: org.logoUrl ?? null }
        }
      } catch (orgErr: unknown) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Verify: could not load organization', orgErr)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: { user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl }, organization },
    })
  } catch (error: unknown) {
    console.error('Session verification error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('MaxClientsInSessionMode') || errorMessage.includes('max clients reached')) {
      return NextResponse.json({
        ok: false,
        error: { code: 'DATABASE_CONNECTION_LIMIT', message: "Ma'lumotlar bazasi ulanish limitiga yetdi. CRITICAL_DATABASE_FIX.md faylini ko'ring." },
      }, { status: 503 })
    }
    if (errorMessage.includes('Authentication failed') || errorMessage.includes('database credentials')) {
      return NextResponse.json({
        ok: false,
        error: { code: 'DATABASE_AUTHENTICATION_ERROR', message: "Ma'lumotlar bazasi autentifikatsiya xatosi. DATABASE_AUTHENTICATION_FIX.md faylini ko'ring." },
      }, { status: 503 })
    }
    if (errorMessage.includes('Tenant or user not found')) {
      return NextResponse.json({
        ok: false,
        error: { code: 'DATABASE_TENANT_ERROR', message: "Ma'lumotlar bazasi username formati noto'g'ri. TENANT_USER_FIX.md faylini ko'ring." },
      }, { status: 503 })
    }
    return NextResponse.json({ ok: false, error: { code: 'SERVER_ERROR', message: 'Server error' } }, { status: 500 })
  }
}
