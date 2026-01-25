import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton.
 * - DATABASE_URL bo'lmasa: null qaytaradi (crash bo'lmaydi)
 * - Dev muhitda global cache ishlatiladi (HMR muammosiz)
 * - Prisma 6.x + Vercel + Next.js 14 bilan to‘liq mos
 */

type GlobalWithPrisma = typeof globalThis & {
  __unistartPrisma?: PrismaClient
}

/**
 * Validates and normalizes DATABASE_URL
 * Handles URL encoding issues and validates format
 */
function validateAndNormalizeDatabaseUrl(url: string): { valid: boolean; normalized?: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'DATABASE_URL is empty or not a string' }
  }

  // Remove leading/trailing whitespace
  const trimmed = url.trim()
  if (!trimmed) {
    return { valid: false, error: 'DATABASE_URL is empty after trimming' }
  }

  // Check for placeholders
  if (trimmed.includes('[YOUR_PASSWORD]') || trimmed.includes('YOUR_')) {
    return { valid: false, error: 'DATABASE_URL contains placeholder values' }
  }

  try {
    // Try to parse the URL to validate format
    const urlObj = new URL(trimmed)
    
    // Validate it's a postgresql URL
    if (urlObj.protocol !== 'postgresql:' && urlObj.protocol !== 'postgres:') {
      return { valid: false, error: `Invalid protocol: ${urlObj.protocol}. Expected postgresql: or postgres:` }
    }

    // Check if password needs URL encoding
    // If password contains special characters that aren't encoded, we need to encode them
    const password = urlObj.password
    if (password) {
      // Check for unencoded special characters
      const specialChars = /[@#%&+=\s]/
      if (specialChars.test(password)) {
        // Password might need encoding, but we'll let Prisma handle it
        // Just log a warning
        console.warn('⚠️ DATABASE_URL password contains special characters. Ensure they are URL-encoded if authentication fails.')
      }
    }

    // Validate port
    const port = urlObj.port || (urlObj.protocol === 'postgresql:' ? '5432' : '5432')
    if (port === '6543' || trimmed.includes('pgbouncer=true')) {
      return { 
        valid: false, 
        error: 'DATABASE_URL uses Session Pooler (port 6543). Use Direct Connection (port 5432) for Vercel. See CRITICAL_DATABASE_FIX.md' 
      }
    }

    // Return normalized URL (trimmed)
    return { valid: true, normalized: trimmed }
  } catch (parseError: any) {
    return { 
      valid: false, 
      error: `Invalid DATABASE_URL format: ${parseError.message}` 
    }
  }
}

export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set')
    return null
  }

  const globalForPrisma = globalThis as GlobalWithPrisma

  if (!globalForPrisma.__unistartPrisma) {
    try {
      // Validate and normalize DATABASE_URL
      const validation = validateAndNormalizeDatabaseUrl(process.env.DATABASE_URL)
      
      if (!validation.valid) {
        console.error('❌ DATABASE_URL validation failed:', validation.error)
        return null
      }

      const dbUrl = validation.normalized!

      // Log connection info for debugging (without exposing password)
      try {
        const urlObj = new URL(dbUrl)
        console.log('✅ Database connection info:', {
          hasUrl: true,
          protocol: urlObj.protocol,
          hostname: urlObj.hostname,
          port: urlObj.port || '5432',
          database: urlObj.pathname.slice(1) || 'postgres',
          username: urlObj.username || 'postgres',
          hasPassword: !!urlObj.password,
          passwordLength: urlObj.password ? urlObj.password.length : 0,
          usesDirectConnection: (urlObj.port || '5432') === '5432' && !dbUrl.includes('pgbouncer=true'),
          urlLength: dbUrl.length,
        })
      } catch (logError) {
        console.log('Database connection info (partial):', {
          hasUrl: true,
          urlLength: dbUrl.length,
        })
      }

      globalForPrisma.__unistartPrisma = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'warn', 'error']
            : ['error'],
        datasources: {
          db: {
            url: dbUrl,
          },
        },
      })

      // Ensure connections are properly closed on process exit
      // This is critical for serverless environments like Vercel
      if (typeof process !== 'undefined') {
        const cleanup = async () => {
          try {
            await globalForPrisma.__unistartPrisma?.$disconnect()
          } catch (error) {
            console.error('Error disconnecting Prisma:', error)
          }
        }

        process.on('beforeExit', cleanup)
        process.on('SIGINT', cleanup)
        process.on('SIGTERM', cleanup)
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize Prisma Client:', error)
      console.error('Error message:', error?.message)
      console.error('Error code:', error?.code)
      return null
    }
  }

  return globalForPrisma.__unistartPrisma
}
