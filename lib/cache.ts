import { getRedis } from '@/lib/redis';

// IORedis auto-connects on first command — never call .connect() manually
export async function getCacheJSON<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error('[cache] getCacheJSON failed', { key, err: e instanceof Error ? e.message : e });
    return null;
  }
}

export async function setCacheJSON(key: string, value: unknown, ttlSec = 60): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
  } catch (e) {
    console.error('[cache] setCacheJSON failed', { key, err: e instanceof Error ? e.message : e });
  }
}

export async function deleteCacheJSON(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch (e) {
    console.error('[cache] deleteCacheJSON failed', { key, err: e instanceof Error ? e.message : e });
  }
}

/** Delete all keys matching a glob pattern — use for cache invalidation */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch (e) {
    console.error('[cache] deleteCachePattern failed', { pattern, err: e instanceof Error ? e.message : e });
  }
}
