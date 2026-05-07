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

  await connectDB();

  // Build the filter: by default we never delete pages already in the
  // sitemap (isIndexable:true). The operator can override with
  // includeIndexable:true if they really want to nuke everything.
  const filter: any = mode === 'eq'
    ? { qualityScore: threshold }
    : { qualityScore: { $lte: threshold } };
  if (!includeIndexable) filter.isIndexable = { $ne: true };

  const totalBefore = await SeoPage.countDocuments({});
  const r = await SeoPage.deleteMany(filter);
  const totalAfter = await SeoPage.countDocuments({});

  return NextResponse.json({
    success: true,
    deletedCount: r.deletedCount || 0,
    threshold,
    mode,
    includeIndexable,
    totalBefore,
    totalAfter,
    timestamp: new Date().toISOString(),
  });
}
