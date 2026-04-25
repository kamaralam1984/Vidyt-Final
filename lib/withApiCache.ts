/**
 * withApiCache — universal caching wrapper for Next.js API route handlers.
 *
 * Strategy:
 *   1. Check in-memory store (microsecond latency)
 *   2. Fall through to Redis   (< 1 ms on same host)
 *   3. Fall through to handler (DB / AI call)
 *   4. Store result in both layers
 *
 * Usage:
 *   export const GET = withApiCache(
 *     async (req) => NextResponse.json(data),
 *     { key: (req) => `plans:${url.searchParams}`, ttl: 300, cacheControl: 'public, max-age=60, stale-while-revalidate=240' }
 *   );
 */

import { NextRequest, NextResponse } from 'next/server';
import { memGet, memSet } from './in-memory-cache';
import { getCacheJSON, setCacheJSON } from './cache';

type Handler = (req: NextRequest, ctx?: any) => Promise<NextResponse>;

interface CacheOptions {
  /** Cache key string or function that derives key from request */
  key: string | ((req: NextRequest) => string);
  /** TTL in seconds — in-memory uses same TTL (default 60s) */
  ttl?: number;
  /** Value for Cache-Control response header (default: private, no-store) */
  cacheControl?: string;
  /** Skip cache entirely when this returns true (e.g. authenticated user data) */
  bypass?: (req: NextRequest) => boolean;
}

export function withApiCache(handler: Handler, opts: CacheOptions): Handler {
  return async (req: NextRequest, ctx?: any) => {
    const ttl = opts.ttl ?? 60;
    const cacheKey = typeof opts.key === 'function' ? opts.key(req) : opts.key;
    const cacheControl = opts.cacheControl ?? 'private, no-store';

    // Bypass check (e.g. for user-specific data)
    if (opts.bypass?.(req)) {
      return handler(req, ctx);
    }

    // 1. In-memory (L1)
    const memHit = memGet<object>(cacheKey);
    if (memHit) {
      return NextResponse.json(memHit, {
        headers: {
          'Cache-Control': cacheControl,
          'X-Cache': 'HIT-MEM',
        },
      });
    }

    // 2. Redis (L2)
    const redisHit = await getCacheJSON<object>(cacheKey);
    if (redisHit) {
      // Warm L1 with a shorter TTL (30s max) to avoid stale in-memory data
      memSet(cacheKey, redisHit, Math.min(ttl, 30));
      return NextResponse.json(redisHit, {
        headers: {
          'Cache-Control': cacheControl,
          'X-Cache': 'HIT-REDIS',
        },
      });
    }

    // 3. Origin handler
    const response = await handler(req, ctx);

    // Only cache successful JSON responses
    if (response.status === 200) {
      try {
        // Clone so we don't consume the body stream
        const cloned = response.clone();
        const data = await cloned.json();
        memSet(cacheKey, data, Math.min(ttl, 30));
        await setCacheJSON(cacheKey, data, ttl);
      } catch {
        // Non-JSON or stream — skip caching
      }
    }

    response.headers.set('Cache-Control', cacheControl);
    response.headers.set('X-Cache', 'MISS');
    return response;
  };
}
