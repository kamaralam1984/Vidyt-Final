import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';
import { getPageDetail, inspectUrl, isGscConfigured } from '@/lib/googleSearchConsole';
import { rescorePage, INDEXABLE_THRESHOLD } from '@/lib/qualityScorer';
import { buildSeoContent } from '@/lib/seoContentBuilder';

export const dynamic = 'force-dynamic';

// ── GET /api/admin/super/seo-pages/[slug] — full detail + GSC ──────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const page = await SeoPage.findOne({ slug: params.slug }).lean() as any;
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

  const pathname = `/k/${page.slug}`;
  const [detail, inspection] = await Promise.all([
    getPageDetail(pathname, 28),
    inspectUrl(pathname),
  ]);

  return NextResponse.json({
    success: true,
    page: {
      ...page,
      url: pathname,
      absoluteUrl: `https://www.vidyt.com${pathname}`,
    },
    gsc: {
      configured: isGscConfigured(),
      detail,
      inspection,
    },
    threshold: INDEXABLE_THRESHOLD,
  });
}

// ── PATCH /api/admin/super/seo-pages/[slug] — edit fields ──────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  await connectDB();

  // Special actions
  if (body.action === 'promote') {
    const r = await SeoPage.findOneAndUpdate(
      { slug: params.slug },
      { $set: { isIndexable: true, publishedAt: new Date() } },
      { new: true }
    ).lean();
    return NextResponse.json({ success: true, action: 'promote', page: r });
  }
  if (body.action === 'demote') {
    const r = await SeoPage.findOneAndUpdate(
      { slug: params.slug },
      { $set: { isIndexable: false } },
      { new: true }
    ).lean();
    return NextResponse.json({ success: true, action: 'demote', page: r });
  }
  if (body.action === 'regenerate') {
    // Rebuild content from keyword via seoContentBuilder, recompute quality.
    const current = await SeoPage.findOne({ slug: params.slug }).lean() as any;
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const built = buildSeoContent(current.keyword, {
      viralScore: current.viralScore || 72,
      trendingRank: current.trendingRank || 0,
      isTrending: (current.trendingRank || 0) > 0,
    });
    const updated = await SeoPage.findOneAndUpdate(
      { slug: params.slug },
      {
        $set: {
          title: built.title,
          metaTitle: built.metaTitle,
          metaDescription: built.metaDescription,
          content: built.content,
          hashtags: built.hashtags,
          relatedKeywords: built.relatedKeywords,
          category: built.category,
          wordCount: built.wordCount,
        },
      },
      { new: true }
    ).lean() as any;
    if (updated) {
      const score = rescorePage(updated);
      await SeoPage.updateOne({ slug: params.slug }, { $set: { qualityScore: score } });
    }
    return NextResponse.json({ success: true, action: 'regenerate', page: updated });
  }

  // Plain field edits — allowlist to prevent clients setting slug or isIndexable
  // via PATCH (those go through explicit actions above).
  const allowed = ['title', 'metaTitle', 'metaDescription', 'content', 'hashtags', 'relatedKeywords', 'category', 'viralScore'];
  const set: any = {};
  for (const key of allowed) {
    if (key in body) set[key] = body[key];
  }
  if (Object.keys(set).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }
  // Recompute wordCount if content changed
  if (typeof set.content === 'string') {
    set.wordCount = set.content.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length;
  }

  const updated = await SeoPage.findOneAndUpdate(
    { slug: params.slug },
    { $set: set },
    { new: true }
  ).lean() as any;
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Recompute quality score with fresh field values
  const score = rescorePage(updated);
  await SeoPage.updateOne({ slug: params.slug }, { $set: { qualityScore: score } });

  return NextResponse.json({ success: true, page: { ...updated, qualityScore: score } });
}

// ── DELETE /api/admin/super/seo-pages/[slug] ──────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const r = await SeoPage.deleteOne({ slug: params.slug });
  if (r.deletedCount === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, deleted: params.slug });
}
