// Single source of truth for busting the public plans cache. Whenever any
// admin endpoint writes the Plan model the public /api/subscriptions/plans
// in-memory + Redis cache must be cleared, otherwise pricing cards keep
// serving the previous values until the TTL expires.

import { memDelete } from './in-memory-cache';
import { deleteCacheJSON } from './cache';

/** Cache keys produced by app/api/subscriptions/plans/route.ts. Keep in sync. */
const PLAN_CACHE_KEYS = ['api:plans:1', 'api:plans:0'];

export async function invalidatePublicPlanCache(): Promise<void> {
  for (const key of PLAN_CACHE_KEYS) {
    memDelete(key);
    try { await deleteCacheJSON(key); } catch { /* redis optional */ }
  }
}
