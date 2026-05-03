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

  const before = await SeoPage.estimatedDocumentCount();
  const r = await SeoPage.deleteMany({ isIndexable: { $ne: true } });
  const after = await SeoPage.estimatedDocumentCount();

  return NextResponse.json({
    success: true,
    deleted: r.deletedCount || 0,
    totalBefore: before,
    totalAfter: after,
    message: 'All non-indexable pages deleted. Indexable pages preserved.',
    timestamp: new Date().toISOString(),
  });
}

export const POST = purge;
export const GET = purge;
