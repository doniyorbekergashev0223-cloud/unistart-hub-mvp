const TTL_MS = 60_000

type Entry<T> = { value: T; expiresAt: number }

const store = new Map<string, Entry<unknown>>()

function prune(): void {
  const now = Date.now()
  for (const [k, v] of store.entries()) {
    if (v.expiresAt <= now) store.delete(k)
  }
}

export function getStats<T>(key: string): T | null {
  const entry = store.get(key) as Entry<T> | undefined
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    store.delete(key)
    return null
  }
  return entry.value
}

export function setStats<T>(key: string, value: T): void {
  if (store.size > 500) prune()
  store.set(key, { value, expiresAt: Date.now() + TTL_MS })
}

export function dashboardStatsKey(organizationId: string): string {
  return `dashboard_stats_org_${organizationId}`
}

export function orgStatsKey(organizationId: string, role: string, userId: string): string {
  return `org_stats_${organizationId}_${role}_${userId}`
}

export function publicStatsKey(): string {
  return 'public_stats'
}
