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

export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set')
    return null
  }

  // Placeholder tekshiruvi (xavfsizlik uchun)
  if (
    process.env.DATABASE_URL.includes('[YOUR_PASSWORD]') ||
    process.env.DATABASE_URL.includes('YOUR_')
  ) {
    console.error('DATABASE_URL contains placeholder values')
    return null
  }

  const globalForPrisma = globalThis as GlobalWithPrisma

  if (!globalForPrisma.__unistartPrisma) {
    try {
      // Check if DATABASE_URL uses Session Pooler (port 6543) - this causes connection limit issues
      const dbUrl = process.env.DATABASE_URL || ''
      
      if (dbUrl.includes(':6543') || dbUrl.includes('pgbouncer=true')) {
        console.error('❌ CRITICAL ERROR: DATABASE_URL uses Session Pooler (port 6543).')
        console.error('❌ This causes "max clients reached" errors on Vercel.')
        console.error('❌ Please use Direct Connection (port 5432) in Vercel environment variables.')
        console.error('❌ See CRITICAL_DATABASE_FIX.md for instructions.')
        // Don't create client if using Session Pooler - it will fail anyway
        throw new Error('DATABASE_URL must use Direct Connection (port 5432), not Session Pooler (port 6543)')
      }

      // Log connection info for debugging
      console.log('Database connection info:', {
        hasUrl: !!dbUrl,
        urlLength: dbUrl.length,
        usesDirectConnection: dbUrl.includes(':5432') && !dbUrl.includes(':6543'),
        usesSessionPooler: dbUrl.includes(':6543') || dbUrl.includes('pgbouncer=true'),
      })

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
    } catch (error) {
      console.error('Failed to initialize Prisma Client:', error)
      return null
    }
  }

  return globalForPrisma.__unistartPrisma
}
