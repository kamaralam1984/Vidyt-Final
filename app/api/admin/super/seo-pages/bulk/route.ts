import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/super/seo-pages/bulk
 * body: { action: 'delete' | 'promote' | 'demote', slugs: string[] }
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.slugs) || body.slugs.length === 0) {
    return NextResponse.json({ error: 'Provide slugs array' }, { status: 400 });
  }
  const slugs: string[] = body.slugs.filter((s: any) => typeof s === 'string').slice(0, 500);
  if (slugs.length === 0) return NextResponse.json({ error: 'No valid slugs' }, { status: 400 });

  await connectDB();
  let affected = 0;

  if (body.action === 'delete') {
    const r = await SeoPage.deleteMany({ slug: { $in: slugs } });
    affected = r.deletedCount || 0;
  } else if (body.action === 'promote') {
    const r = await SeoPage.updateMany(
      { slug: { $in: slugs } },
      { $set: { isIndexable: true, publishedAt: new Date() } }
    );
    affected = r.modifiedCount || 0;
  } else if (body.action === 'demote') {
    const r = await SeoPage.updateMany(
      { slug: { $in: slugs } },
      { $set: { isIndexable: false } }
    );
    affected = r.modifiedCount || 0;
  } else {
    return NextResponse.json({ error: 'action must be delete|promote|demote' }, { status: 400 });
  }

  return NextResponse.json({ success: true, action: body.action, affected, requested: slugs.length });
}
