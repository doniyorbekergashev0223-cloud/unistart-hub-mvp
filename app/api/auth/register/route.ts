import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/security'

export const runtime = 'nodejs'

type Role = 'user' | 'admin' | 'expert'

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
}

function isRole(value: unknown): value is Role {
  return value === 'user' || value === 'admin' || value === 'expert'
}

export async function POST(req: Request) {
  if (!prisma) {
    return jsonError(
      503,
      'DATABASE_NOT_CONFIGURED',
      "Ma'lumotlar bazasi sozlanmagan (DATABASE_URL yo'q)."
    )
  }

  const body = await req.json().catch(() => null) as null | {
    name?: unknown
    email?: unknown
    password?: unknown
  }

  if (!body) {
    return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.")
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  const fieldErrors: Record<string, string> = {}
  if (!name) fieldErrors.name = 'Ism majburiy'
  if (!email) fieldErrors.email = 'Email majburiy'
  if (email && !email.includes('@')) fieldErrors.email = "To'g'ri email kiriting"
  if (!password) fieldErrors.password = 'Parol majburiy'
  if (password && password.length < 6) fieldErrors.password = "Parol kamida 6 ta belgidan iborat bo'lishi kerak"

  if (Object.keys(fieldErrors).length) {
    return jsonError(400, 'VALIDATION_ERROR', "Ma'lumotlar noto'g'ri.", { fieldErrors })
  }

  // All new users get 'user' role by default
  const assignedRole: Role = 'user'

  try {
    const passwordHash = await hashPassword(password)

    // Create user
    const result = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: assignedRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ ok: true, data: { user: result } }, { status: 201 })
  } catch (e: any) {
    console.error('Register error:', e)
    console.error('Error type:', e?.constructor?.name)
    console.error('Error code:', e?.code)
    console.error('Error message:', e?.message)
    
    // Prisma unique constraint (email)
    if (typeof e?.code === 'string' && e.code === 'P2002') {
      return jsonError(409, 'EMAIL_ALREADY_EXISTS', 'Bu email allaqachon ro‘yxatdan o‘tgan.')
    }
    
    // Check for "Tenant or user not found" error (Supabase username format issue)
    if (e?.message?.includes('Tenant or user not found') ||
        e?.message?.includes('tenant or user not found')) {
      console.error('❌ CRITICAL ERROR: "Tenant or user not found"')
      console.error('❌ This means DATABASE_URL username format is incorrect for Supabase')
      console.error('❌ Supabase requires username format: postgres.PROJECT-REF')
      return jsonError(
        503,
        'DATABASE_TENANT_ERROR',
        "Ma'lumotlar bazasi username formati noto'g'ri. Supabase uchun username 'postgres.PROJECT-REF' formatida bo'lishi kerak. TENANT_USER_FIX.md faylini ko'ring."
      )
    }
    
    // Check for authentication errors
    if (e?.message?.includes('Authentication failed') || 
        e?.message?.includes('provided database credentials') ||
        e?.message?.includes('password authentication failed') ||
        e?.code === 'P1000') {
      console.error('❌ DATABASE AUTHENTICATION ERROR: Invalid credentials in DATABASE_URL')
      return jsonError(
        503,
        'DATABASE_AUTHENTICATION_ERROR',
        "Ma'lumotlar bazasi autentifikatsiya xatosi. Iltimos, Vercel'da DATABASE_URL ni tekshiring: parol to'g'ri, maxsus belgilar URL-encode qilingan bo'lishi kerak. DATABASE_AUTHENTICATION_FIX.md faylini ko'ring."
      )
    }
    
    // Check for connection limit errors
    if (e?.message?.includes('MaxClientsInSessionMode') || 
        e?.message?.includes('max clients reached')) {
      return jsonError(
        503,
        'DATABASE_CONNECTION_LIMIT',
        "Ma'lumotlar bazasi ulanish limitiga yetildi. Iltimos, Vercel'da DATABASE_URL ni Direct Connection (port 5432) ga o'zgartiring. CRITICAL_DATABASE_FIX.md faylini ko'ring."
      )
    }
    
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.')
  }
}

