/**
 * POST /api/auth/register
 *
 * Prisma-only authentication. User selects organization at signup (student → university, non-student → yoshlar agentligi).
 * - organizationSlug: slug of existing Organization (e.g. sambhram, kazan, youth-agency). Required.
 * - User is linked to that organization; no new Organization is created.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/security'
import { createSessionToken, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth'

export const runtime = 'nodejs'

type Role = 'user' | 'admin' | 'expert'

function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status }
  )
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
    organizationSlug?: unknown
  }

  if (!body) {
    return jsonError(400, 'INVALID_JSON', "So'rov JSON formati noto'g'ri.")
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const organizationSlug = typeof body.organizationSlug === 'string' ? body.organizationSlug.trim() : ''

  const fieldErrors: Record<string, string> = {}
  if (!name) fieldErrors.name = 'Ism majburiy'
  if (!email) fieldErrors.email = 'Email majburiy'
  if (email && !email.includes('@')) fieldErrors.email = "To'g'ri email kiriting"
  if (!password) fieldErrors.password = 'Parol majburiy'
  if (password && password.length < 6) fieldErrors.password = "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
  if (!organizationSlug) fieldErrors.organization = 'Tashkilotni tanlang'

  if (Object.keys(fieldErrors).length) {
    return jsonError(400, 'VALIDATION_ERROR', "Ma'lumotlar noto'g'ri.", { fieldErrors })
  }

  const existingOrg = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
    select: { id: true, name: true, logoUrl: true },
  })
  if (!existingOrg) {
    return jsonError(400, 'ORGANIZATION_NOT_FOUND', "Tanlangan tashkilot topilmadi. Iltimos, tashkilotni qayta tanlang yoki db:seed ishga tushiring.")
  }

  const assignedRole: Role = 'user'

  try {
    const passwordHash = await hashPassword(password)

    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: assignedRole,
        organizationId: existingOrg.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        organizationId: true,
        createdAt: true,
      },
    })

    let token: string
    try {
      token = await createSessionToken({ userId: createdUser.id, role: createdUser.role })
    } catch (authErr: unknown) {
      if (authErr instanceof Error && authErr.message.includes('JWT_SECRET')) {
        return jsonError(503, 'AUTH_NOT_CONFIGURED', "JWT_SECRET sozlanmagan. .env da JWT_SECRET qo'shing.")
      }
      throw authErr
    }
    const organization = { name: existingOrg.name, logoUrl: existingOrg.logoUrl ?? null }
    const res = NextResponse.json(
      { ok: true, data: { user: createdUser, organization } },
      { status: 201 }
    )
    res.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS)
    return res
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

    // Trigger/RLS: Prisma surfaces PG trigger failures as "column ... new ... does not exist"
    const msg = typeof e?.message === 'string' ? e.message : ''
    const isTriggerOrRls =
      msg.includes('column') &&
      msg.toLowerCase().includes('new') &&
      (msg.includes('does not exist') || msg.includes("doesn't exist"))
    if (isTriggerOrRls) {
      return jsonError(
        503,
        'DATABASE_TRIGGER_OR_RLS_ERROR',
        "User jadvali ustidagi trigger yoki RLS xatolik berdi. Prisma-only auth uchun Supabase Dashboard → Database → User: barcha triggerlarni o'chiring va RLS ni o'chiring."
      )
    }

    // Table/relation does not exist — migration marked applied but not run, or wrong table name
    if (msg.includes('does not exist') && (msg.includes('Organization') || msg.includes('relation') || msg.includes('table'))) {
      return jsonError(
        503,
        'DATABASE_SCHEMA_ERROR',
        "Organization jadvali yoki User.organizationId mavjud emas. Terminalda: npx prisma migrate deploy yoki migratsiya SQL ni Supabase da bajaring.",
        process.env.NODE_ENV === 'development' ? { raw: msg } : undefined
      )
    }

    // Development: return actual error so user can fix
    const devDetails = process.env.NODE_ENV === 'development' && msg ? { raw: msg, code: e?.code } : undefined
    return jsonError(500, 'INTERNAL_ERROR', 'Server xatoligi yuz berdi.', devDetails)
  }
}

