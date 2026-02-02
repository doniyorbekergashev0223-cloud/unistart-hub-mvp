import { PrismaClient } from '@prisma/client'

type GlobalWithPrisma = typeof globalThis & {
  __unistartPrisma?: PrismaClient
}

const ENV_KEY = 'DATABASE_DIRECT_URL'

function validateDirectUrl(url: string): { valid: boolean; normalized?: string; error?: string } {
  if (!url || typeof url !== 'string') return { valid: false, error: `${ENV_KEY} is empty or not a string` }
  const trimmed = url.trim()
  if (!trimmed) return { valid: false, error: `${ENV_KEY} is empty after trimming` }
  if (trimmed.includes('[YOUR_PASSWORD]') || trimmed.includes('YOUR_')) return { valid: false, error: `${ENV_KEY} contains placeholder values` }
  try {
    const urlObj = new URL(trimmed)
    if (urlObj.protocol !== 'postgresql:' && urlObj.protocol !== 'postgres:') return { valid: false, error: `Invalid protocol: ${urlObj.protocol}` }
    const sep = trimmed.includes('?') ? '&' : '?'
    const normalized = `${trimmed}${sep}connection_limit=3`
    return { valid: true, normalized }
  } catch (e: unknown) {
    return { valid: false, error: `Invalid ${ENV_KEY} format: ${(e as Error).message}` }
  }
}

function initializePrisma(): PrismaClient {
  const globalForPrisma = globalThis as GlobalWithPrisma
  if (globalForPrisma.__unistartPrisma) {
    return globalForPrisma.__unistartPrisma
  }
  const raw = process.env[ENV_KEY]
  if (!raw) {
    if (process.env.NODE_ENV === 'development') console.error(`❌ ${ENV_KEY} is not set`)
    throw new Error(`${ENV_KEY} is required. Prisma uses direct DB only (no pooler).`)
  }
  const validation = validateDirectUrl(raw)
  if (!validation.valid) {
    if (process.env.NODE_ENV === 'development') console.error(`❌ ${ENV_KEY} validation failed:`, validation.error)
    throw new Error(validation.error ?? `${ENV_KEY} invalid`)
  }
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: { db: { url: validation.normalized! } },
  })
  globalForPrisma.__unistartPrisma = client
  if (typeof process !== 'undefined') {
    const cleanup = async () => {
      try {
        await globalForPrisma.__unistartPrisma?.$disconnect()
      } catch {
        // ignore
      }
    }
    process.on('beforeExit', cleanup)
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
  }
  return client
}

export const prisma = initializePrisma()

export function getPrisma(): PrismaClient {
  return prisma
}
