import { getPrisma } from './db';
type AuditLogAction = 'LOGIN' | 'LOGOUT' | 'REGISTER';

export async function logAuditEvent(
  userId: string,
  action: AuditLogAction,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const prisma = getPrisma();
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the app
    console.error('Failed to log audit event:', error);
  }
}

export function getClientIp(req: Request): string | undefined {
  // Try to get IP from headers (common in production with proxies)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return undefined;
}

export function getUserAgent(req: Request): string | undefined {
  return req.headers.get('user-agent') || undefined;
}
