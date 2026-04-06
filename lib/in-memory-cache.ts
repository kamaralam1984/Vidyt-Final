/**
 * In-Memory Cache with TTL (fallback when Redis is unavailable)
 * Used as a secondary cache layer so responses are always served.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function memGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function memSet<T>(key: string, value: T, ttlSec = 300): void {
  store.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}

export function memDelete(key: string): void {
  store.delete(key);
}

export function memFlush(): void {
  store.clear();
}

export function memSize(): number {
  return store.size;
}

/** Get from in-memory, then Redis fallback */
export async function getWithFallback<T>(key: string): Promise<T | null> {
  // Try in-memory first (fastest)
  const memResult = memGet<T>(key);
  if (memResult !== null) return memResult;

  // Try Redis
  try {
    const { getCacheJSON } = await import('./cache');
    const redisResult = await getCacheJSON<T>(key);
    if (redisResult !== null) {
      // Warm the in-memory cache
      memSet(key, redisResult, 300);
      return redisResult;
    }
  } catch {
    // Redis unavailable, fine
  }
  return null;
}

/** Set in both in-memory and Redis */
export async function setWithFallback<T>(key: string, value: T, ttlSec = 300): Promise<void> {
  memSet(key, value, ttlSec);
  try {
    const { setCacheJSON } = await import('./cache');
    await setCacheJSON(key, value, ttlSec);
  } catch {
    // Redis unavailable, in-memory is enough
  }
}
