import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/super/seo-pages/delete-by-quality
 *
 * One-shot bulk delete keyed off qualityScore. Used by the admin UI's
 * "Delete by Quality" dropdown — operator picks a threshold from the
 * dropdown and clicks delete; every matching page is removed in one call.
 *
 * Body:
 *   { threshold: number,            // 0–100, e.g. 40
 *     mode?: 'lte' | 'eq',          // default 'lte' — "delete all ≤ threshold"
 *     includeIndexable?: boolean }  // default false — protects sitemap pages
 *
 * Auth: super admin only.
 *
 * Returns: { deletedCount, threshold, mode, totalBefore, totalAfter }.
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.threshold !== 'number') {
    return NextResponse.json({ error: 'Provide numeric threshold (0–100)' }, { status: 400 });
  }
  const threshold = Math.max(0, Math.min(100, Math.round(body.threshold)));
  const mode: 'lte' | 'eq' = body.mode === 'eq' ? 'eq' : 'lte';
  const includeIndexable = body.includeIndexable === true;
  // Chunked delete — Cloudflare's 100s edge timeout cuts off any single
  // request that runs longer. We pick a batch size that comfortably
  // finishes in seconds; the UI calls this endpoint in a loop until
  // `hasMore:false`. Operator can override via body.limit.
  const limit = Math.min(50000, Math.max(500, Number(body.limit) || 10000));

  await connectDB();

  // Build the filter: by default we never delete pages already in the
  // sitemap (isIndexable:true). The operator can override with
  // includeIndexable:true if they really want to nuke everything.
  const filter: any = mode === 'eq'
    ? { qualityScore: threshold }
    : { qualityScore: { $lte: threshold } };
  if (!includeIndexable) filter.isIndexable = { $ne: true };

  // Step 1: find matching _ids only (fast — uses {isIndexable, qualityScore}
  // compound index, no document hydration). Step 2: deleteMany by _id which
  // is the fastest possible delete path. This pattern keeps the request
  // well under the CF 100s budget even on 100k+ row collections.
  const ids = await SeoPage.find(filter).select('_id').limit(limit).lean();
  let deletedCount = 0;
  if (ids.length > 0) {
    const r = await SeoPage.deleteMany({ _id: { $in: ids.map((d: any) => d._id) } });
    deletedCount = r.deletedCount || 0;
  }

  // Cheap O(1) counts — exact counts on huge collections are too slow.
  const totalAfter = await SeoPage.estimatedDocumentCount();
  const hasMore = ids.length >= limit;

  return NextResponse.json({
    success: true,
    deletedCount,
    threshold,
    mode,
    includeIndexable,
    limit,
    hasMore,
    totalAfter,
    totalBefore: totalAfter + deletedCount,
    timestamp: new Date().toISOString(),
  });
}
