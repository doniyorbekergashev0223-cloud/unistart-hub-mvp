import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * Verify user session endpoint.
 * Used to check if a stored session is still valid.
 */
export async function GET(req: Request) {
  const userId = req.headers.get('x-user-id')
  const userRole = req.headers.get('x-user-role')

  if (!userId || !userRole) {
    return NextResponse.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ ok: false, error: { code: 'DATABASE_ERROR', message: "Ma'lumotlar bazasi sozlanmagan." } }, { status: 503 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true },
    })

    if (!user || user.role !== userRole) {
      return NextResponse.json({ ok: false, error: { code: 'INVALID_SESSION', message: 'Session not valid' } }, { status: 401 })
    }

    return NextResponse.json({
      ok: true,
      data: { user },
    })
  } catch (error: any) {
    console.error('Session verification error:', error)
    
    // Database connection errors
    const errorMessage = error?.message || ''
    if (errorMessage.includes('MaxClientsInSessionMode') || errorMessage.includes('max clients reached')) {
      return NextResponse.json({ 
        ok: false, 
        error: { 
          code: 'DATABASE_CONNECTION_LIMIT', 
          message: "Ma'lumotlar bazasi ulanish limitiga yetdi. CRITICAL_DATABASE_FIX.md faylini ko'ring." 
        } 
      }, { status: 503 })
    }
    if (errorMessage.includes('Authentication failed') || errorMessage.includes('database credentials')) {
      return NextResponse.json({ 
        ok: false, 
        error: { 
          code: 'DATABASE_AUTHENTICATION_ERROR', 
          message: "Ma'lumotlar bazasi autentifikatsiya xatosi. DATABASE_AUTHENTICATION_FIX.md faylini ko'ring." 
        } 
      }, { status: 503 })
    }
    if (errorMessage.includes('Tenant or user not found')) {
      return NextResponse.json({ 
        ok: false, 
        error: { 
          code: 'DATABASE_TENANT_ERROR', 
          message: "Ma'lumotlar bazasi username formati noto'g'ri. TENANT_USER_FIX.md faylini ko'ring." 
        } 
      }, { status: 503 })
    }
    
    return NextResponse.json({ ok: false, error: { code: 'SERVER_ERROR', message: 'Server error' } }, { status: 500 })
  }
}
