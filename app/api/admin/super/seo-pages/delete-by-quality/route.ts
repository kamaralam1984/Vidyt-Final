import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body.threshold !== 'number') {
    return NextResponse.json(
      { error: 'Provide numeric threshold (0-100)' },
      { status: 400 }
    );
  }

  const threshold = Math.max(
    0,
    Math.min(100, Math.round(body.threshold))
  );

  const mode: 'lte' | 'eq' =
    body.mode === 'eq' ? 'eq' : 'lte';

  const includeIndexable =
    body.includeIndexable === true;

  const limit = Math.min(
    50000,
    Math.max(50, Number(body.limit) || 100)
  );

  await connectDB();

  const filter: any =
    mode === 'eq'
      ? { qualityScore: threshold }
      : { qualityScore: { $lte: threshold } };

  if (!includeIndexable) {
    filter.isIndexable = false;
  }

  let ids: any[];

  try {
    ids = await SeoPage.find(filter)
      .hint(
        includeIndexable
          ? { qualityScore: -1 }
          : { isIndexable: 1, qualityScore: -1 }
      )
      .select('_id')
      .limit(limit)
      .lean();
  } catch {
    ids = await SeoPage.find(filter)
      .select('_id')
      .limit(limit)
      .lean();
  }

  let deletedCount = 0;

  if (ids.length > 0) {
    const r = await SeoPage.deleteMany({
      _id: { $in: ids.map((d: any) => d._id) },
    });

    deletedCount = r.deletedCount || 0;
  }

  const totalAfter =
    await SeoPage.estimatedDocumentCount();

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
