/**
 * JWT-based session auth. Single source of truth: Prisma User.
 * Session is stored in httpOnly cookie; no client-side user identity.
 */
import { SignJWT, jwtVerify } from 'jose'

export const AUTH_COOKIE_NAME = 'unistart_session'

const ROLE_VALUES = ['user', 'admin', 'expert'] as const
export type SessionRole = (typeof ROLE_VALUES)[number]

export interface SessionPayload {
  userId: string
  role: SessionRole
  iat?: number
  exp?: number
}

function getSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 16) {
    return null
  }
  return new TextEncoder().encode(secret)
}

/** Default: 7 days */
const MAX_AGE_SEC = 60 * 60 * 24 * 7

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getSecret()
  if (!secret) throw new Error('JWT_SECRET must be set and at least 16 characters')
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(secret)
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecret()
    if (!secret) return null
    const { payload } = await jwtVerify(token, secret)
    const userId = payload.userId
    const role = payload.role
    if (typeof userId !== 'string' || !userId || !ROLE_VALUES.includes(role as SessionRole)) {
      return null
    }
    return { userId, role: role as SessionRole }
  } catch {
    return null
  }
}

/** Read session token from request Cookie header. */
export function getSessionTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1].trim()) : null
}

/**
 * Get current session from request (JWT in httpOnly cookie).
 * Returns { userId, role } or null if missing/invalid.
 */
export async function getSession(req: Request): Promise<SessionPayload | null> {
  const token = getSessionTokenFromRequest(req)
  if (!token) return null
  return verifySessionToken(token)
}

export function isRole(value: unknown): value is SessionRole {
  return ROLE_VALUES.includes(value as SessionRole)
}

/** Cookie options for Set-Cookie (secure-ready). */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE_SEC,
}

/** Options to clear the auth cookie. */
export const AUTH_COOKIE_CLEAR_OPTIONS = {
  ...AUTH_COOKIE_OPTIONS,
  maxAge: 0,
}
