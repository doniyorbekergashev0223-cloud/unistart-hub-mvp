import { PrismaClient } from '@prisma/client'

type GlobalWithPrismaDirect = typeof globalThis & {
  __unistartPrismaDirect?: PrismaClient
}

function validateDirectUrl(url: string): { valid: boolean; normalized?: string; error?: string } {
  if (!url || typeof url !== 'string') return { valid: false, error: 'DATABASE_DIRECT_URL is empty or not a string' }
  const trimmed = url.trim()
  if (!trimmed) return { valid: false, error: 'DATABASE_DIRECT_URL is empty after trimming' }
  if (trimmed.includes('[YOUR_PASSWORD]') || trimmed.includes('YOUR_')) return { valid: false, error: 'DATABASE_DIRECT_URL contains placeholder values' }
  try {
    const urlObj = new URL(trimmed)
    if (urlObj.protocol !== 'postgresql:' && urlObj.protocol !== 'postgres:') return { valid: false, error: `Invalid protocol: ${urlObj.protocol}` }
    const sep = trimmed.includes('?') ? '&' : '?'
    const normalized = `${trimmed}${sep}connection_limit=2`
    return { valid: true, normalized }
  } catch (e: unknown) {
    return { valid: false, error: `Invalid DATABASE_DIRECT_URL format: ${(e as Error).message}` }
  }
}

function initializePrismaDirect(): PrismaClient | null {
  if (!process.env.DATABASE_DIRECT_URL) {
    if (process.env.NODE_ENV === 'development') console.error('❌ DATABASE_DIRECT_URL is not set')
    return null
  }
  const g = globalThis as GlobalWithPrismaDirect
  if (!g.__unistartPrismaDirect) {
    try {
      const validation = validateDirectUrl(process.env.DATABASE_DIRECT_URL)
      if (!validation.valid) {
        if (process.env.NODE_ENV === 'development') console.error('❌ DATABASE_DIRECT_URL validation failed:', validation.error)
        return null
      }
      g.__unistartPrismaDirect = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
        datasources: { db: { url: validation.normalized! } },
      })
      if (typeof process !== 'undefined') {
        const cleanup = async () => { try { await g.__unistartPrismaDirect?.$disconnect() } catch { } }
        process.on('beforeExit', cleanup)
        process.on('SIGINT', cleanup)
        process.on('SIGTERM', cleanup)
      }
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') console.error('❌ Failed to initialize Prisma Direct:', error)
      return null
    }
  }
  return g.__unistartPrismaDirect
}

export const prismaDirect = initializePrismaDirect()
