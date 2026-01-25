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
      globalForPrisma.__unistartPrisma = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'warn', 'error']
            : ['error'],
      })
    } catch (error) {
      console.error('Failed to initialize Prisma Client:', error)
      return null
    }
  }

  return globalForPrisma.__unistartPrisma
}
