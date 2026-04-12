import { getRedis } from '@/lib/redis';

export async function getCacheJSON<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    await redis.connect().catch(() => {});
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
    await redis.connect().catch(() => {});
    await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
  } catch (e) {
    console.error('[cache] setCacheJSON failed', { key, err: e instanceof Error ? e.message : e });
  }
}
