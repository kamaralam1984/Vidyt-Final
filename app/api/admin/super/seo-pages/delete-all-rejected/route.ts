// One-click bulk purge of every page that hasn't earned indexable status.
// Pairs with the Recreate Fresh endpoint so the admin can fully reset the
// /k/<slug> backlog and let the curated + trending crons rebuild from scratch.
//
// Indexable pages are NEVER touched (those are already in the sitemap).

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';

async function purge(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  // Chunked delete — Cloudflare's 100s edge timeout cuts off any single
  // request that runs longer. Find IDs first (fast, indexed), delete by
  // _id (fastest possible path). UI calls in a loop until hasMore:false.
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get('limit'));
  const limit = Math.min(50000, Math.max(500, limitParam || 2000));

  const before = await SeoPage.estimatedDocumentCount();
  // Use `isIndexable: false` not `{$ne:true}` — $ne forces a collection
  // scan that blows past timeouts on 80k+ row collections.
  const ids = await SeoPage.find({ isIndexable: false })
    .select('_id')
    .limit(limit)
    .lean();
  let deleted = 0;
  if (ids.length > 0) {
    const r = await SeoPage.deleteMany({ _id: { $in: ids.map((d: any) => d._id) } });
    deleted = r.deletedCount || 0;
  }
  const after = await SeoPage.estimatedDocumentCount();
  const hasMore = ids.length >= limit;

  return NextResponse.json({
    success: true,
    deleted,
    limit,
    hasMore,
    totalBefore: before,
    totalAfter: after,
    message: hasMore
      ? `Deleted ${deleted} pages. More remain — call again to continue.`
      : 'All non-indexable pages deleted. Indexable pages preserved.',
    timestamp: new Date().toISOString(),
  });
}

export const POST = purge;
export const GET = purge;
