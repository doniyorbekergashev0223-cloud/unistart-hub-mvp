import { PrismaClient } from '@prisma/client'

/**
 * CRITICAL: Prisma Client Global Singleton for Vercel Serverless
 * 
 * This ensures ONE PrismaClient instance across all serverless function executions.
 * Prevents "MaxClientsInSessionMode" errors by reusing connections.
 * 
 * Usage:
 *   import { prisma } from '@/lib/db'
 *   const users = await prisma.user.findMany()
 * 
 * DO NOT:
 *   - Call new PrismaClient() anywhere
 *   - Use getPrisma() function (deprecated)
 *   - Create Prisma inside API handlers
 */

type GlobalWithPrisma = typeof globalThis & {
  __unistartPrisma?: PrismaClient
}

/**
 * Validates and normalizes DATABASE_URL
 */
function validateAndNormalizeDatabaseUrl(url: string): { valid: boolean; normalized?: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'DATABASE_URL is empty or not a string' }
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return { valid: false, error: 'DATABASE_URL is empty after trimming' }
  }

  if (trimmed.includes('[YOUR_PASSWORD]') || trimmed.includes('YOUR_')) {
    return { valid: false, error: 'DATABASE_URL contains placeholder values' }
  }

  try {
    const urlObj = new URL(trimmed)
    
    if (urlObj.protocol !== 'postgresql:' && urlObj.protocol !== 'postgres:') {
      return { valid: false, error: `Invalid protocol: ${urlObj.protocol}. Expected postgresql: or postgres:` }
    }

    const password = urlObj.password
    if (password) {
      const specialChars = /[@#%&+=\s]/
      if (specialChars.test(password)) {
        console.warn('⚠️ DATABASE_URL password contains special characters. Ensure they are URL-encoded if authentication fails.')
      }
    }

    const port = urlObj.port || '5432'
    if (port === '6543' || trimmed.includes('pgbouncer=true')) {
      return { 
        valid: false, 
        error: 'DATABASE_URL uses Session Pooler (port 6543). Use Direct Connection (port 5432) for Vercel. See CRITICAL_DATABASE_FIX.md' 
      }
    }

    const username = urlObj.username || ''
    if (username === 'postgres' && urlObj.hostname.includes('supabase')) {
      return {
        valid: false,
        error: 'DATABASE_URL username is "postgres" but Supabase requires "postgres.PROJECT-REF" format. This causes "Tenant or user not found" error. Get the correct connection string from Supabase Dashboard → Settings → Database → Direct Connection. See TENANT_USER_FIX.md'
      }
    }

    if (urlObj.hostname.includes('supabase') && !username.includes('.')) {
      console.warn('⚠️ WARNING: Username format may be incorrect for Supabase. Expected format: postgres.PROJECT-REF')
    }

    return { valid: true, normalized: trimmed }
  } catch (parseError: any) {
    return { 
      valid: false, 
      error: `Invalid DATABASE_URL format: ${parseError.message}` 
    }
  }
}

/**
 * Initialize Prisma Client as global singleton
 */
function initializePrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ DATABASE_URL environment variable is not set')
    }
    return null
  }

  const globalForPrisma = globalThis as GlobalWithPrisma

  // CRITICAL: Only create ONE instance per serverless function lifecycle
  if (!globalForPrisma.__unistartPrisma) {
    try {
      const validation = validateAndNormalizeDatabaseUrl(process.env.DATABASE_URL)
      
      if (!validation.valid) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ DATABASE_URL validation failed:', validation.error)
        }
        return null
      }

      const dbUrl = validation.normalized!

      // Create Prisma Client with optimized settings for Vercel serverless
      globalForPrisma.__unistartPrisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
        datasources: {
          db: {
            url: dbUrl,
          },
        },
      })

      // Ensure connections are properly closed on process exit
      if (typeof process !== 'undefined') {
        const cleanup = async () => {
          try {
            await globalForPrisma.__unistartPrisma?.$disconnect()
          } catch (error) {
            // Ignore cleanup errors
          }
        }

        process.on('beforeExit', cleanup)
        process.on('SIGINT', cleanup)
        process.on('SIGTERM', cleanup)
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Failed to initialize Prisma Client:', error)
      }
      return null
    }
  }

  return globalForPrisma.__unistartPrisma
}

/**
 * Global Prisma Client Singleton
 * 
 * This is initialized once and reused across all API routes.
 * DO NOT call new PrismaClient() anywhere else.
 */
export const prisma = initializePrisma()

/**
 * @deprecated Use `import { prisma } from '@/lib/db'` instead
 * This function is kept for backward compatibility but will be removed.
 */
export function getPrisma(): PrismaClient | null {
  return prisma
}
