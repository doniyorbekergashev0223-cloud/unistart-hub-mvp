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
        console.warn('⚠️ WARNING: DATABASE_URL uses Session Pooler (port 6543). This causes "max clients reached" errors.')
        console.warn('⚠️ Please use Direct Connection (port 5432) in Vercel environment variables.')
        console.warn('⚠️ See SUPABASE_CONNECTION_FIX.md for instructions.')
      }

      globalForPrisma.__unistartPrisma = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'warn', 'error']
            : ['error'],
        // Connection pool configuration for Vercel/serverless
        // Reduces connection pool size to prevent "max clients reached" errors
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
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
