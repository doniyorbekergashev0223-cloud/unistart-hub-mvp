import { PrismaClient } from '@prisma/client'

type GlobalWithPrisma = typeof globalThis & {
  __unistartPrisma?: PrismaClient
}

function validateDatabaseUrl(url: string): { valid: boolean; normalized?: string; error?: string } {
  if (!url || typeof url !== 'string') return { valid: false, error: 'DATABASE_URL is empty or not a string' }
  const trimmed = url.trim()
  if (!trimmed) return { valid: false, error: 'DATABASE_URL is empty after trimming' }
  if (trimmed.includes('[YOUR_PASSWORD]') || trimmed.includes('YOUR_')) return { valid: false, error: 'DATABASE_URL contains placeholder values' }
  try {
    const urlObj = new URL(trimmed)
    if (urlObj.protocol !== 'postgresql:' && urlObj.protocol !== 'postgres:') return { valid: false, error: `Invalid protocol: ${urlObj.protocol}` }
    const sep = trimmed.includes('?') ? '&' : '?'
    const normalized = `${trimmed}${sep}connection_limit=2`
    return { valid: true, normalized }
  } catch (e: unknown) {
    return { valid: false, error: `Invalid DATABASE_URL format: ${(e as Error).message}` }
  }
}

function initializePrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'development') console.error('❌ DATABASE_URL is not set')
    return null
  }
  const globalForPrisma = globalThis as GlobalWithPrisma
  if (!globalForPrisma.__unistartPrisma) {
    try {
      const validation = validateDatabaseUrl(process.env.DATABASE_URL)
      if (!validation.valid) {
        if (process.env.NODE_ENV === 'development') console.error('❌ DATABASE_URL validation failed:', validation.error)
        return null
      }
      globalForPrisma.__unistartPrisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
        datasources: { db: { url: validation.normalized! } },
      })
      if (typeof process !== 'undefined') {
        const cleanup = async () => { try { await globalForPrisma.__unistartPrisma?.$disconnect() } catch { } }
        process.on('beforeExit', cleanup)
        process.on('SIGINT', cleanup)
        process.on('SIGTERM', cleanup)
      }
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Failed to initialize Prisma:', error)
      return null
    }
  }
  return globalForPrisma.__unistartPrisma
}

export const prisma = initializePrisma()
export function getPrisma(): PrismaClient | null {
  return prisma
}
