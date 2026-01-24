import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

/**
 * Hozircha "placeholder" hashing (strukturasi production-ga tayyor):
 * - salt + scrypt
 * - key rotation / params boshqaruvi keyingi bosqichda qo'shiladi
 *
 * Format: scrypt$N$r$p$saltHex$hashHex
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const N = 16384
  const r = 8
  const p = 1
  const keyLen = 64

  const derivedKey = scryptSync(password, salt, keyLen, { N, r, p })
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${derivedKey.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split('$')
    if (parts.length !== 6) return false
    const [algo, nStr, rStr, pStr, saltHex, hashHex] = parts
    if (algo !== 'scrypt') return false

    const N = Number(nStr)
    const r = Number(rStr)
    const p = Number(pStr)
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')

    const actual = scryptSync(password, salt, expected.length, { N, r, p })
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

