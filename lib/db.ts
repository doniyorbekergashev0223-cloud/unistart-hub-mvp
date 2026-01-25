import { PrismaClient } from '@prisma/client'

/**
 * Prisma klienti faqat DATABASE_URL mavjud bo'lsa yaratiladi.
 * Shu orqali loyiha env o'rnatilmagan holatda ham "crash" bo'lmaydi.
 */
export function getPrisma() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set')
    return null
  }

  // Check if DATABASE_URL is just a placeholder
  if (process.env.DATABASE_URL.includes('[YOUR_PASSWORD]') ||
      process.env.DATABASE_URL.includes('YOUR_')) {
    console.error('DATABASE_URL contains placeholder values - database not configured')
    return null
  }

  const globalForPrisma = globalThis as unknown as {
    __unistartPrisma?: PrismaClient
  }

  if (!globalForPrisma.__unistartPrisma) {
    try {
      console.log('Creating new Prisma client...')
      console.log('Database URL configured:', process.env.DATABASE_URL.substring(0, 30) + '...')

      globalForPrisma.__unistartPrisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
        // Connection timeout settings
        __internal: {
          engine: {
            connectTimeout: 10000, // 10 seconds
          },
        },
      })
      console.log('Prisma client created successfully')
    } catch (error) {
      console.error('Failed to create Prisma client:', error)
      console.error('Error details:', error instanceof Error ? error.message : String(error))
      console.error('This might be due to:')
      console.error('1. Invalid DATABASE_URL format')
      console.error('2. Prisma client not generated (run: npx prisma generate)')
      console.error('3. Database server not accessible')
      return null
    }
  }

  return globalForPrisma.__unistartPrisma
}

