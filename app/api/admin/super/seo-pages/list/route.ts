import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';
import { getPageStatsBatch } from '@/lib/googleSearchConsole';
import { INDEXABLE_THRESHOLD } from '@/lib/qualityScorer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/super/seo-pages/list
 *
 * Query params:
 *   search=<text>     — matches keyword, title, slug (case-insensitive prefix)
 *   category=<cat>    — exact match
 *   status=<s>        — 'indexable' | 'pending' | 'rejected' | 'all'
 *   source=<src>      — user_search | auto_daily | trending
 *   sort=<field>      — createdAt|qualityScore|views|clicks|impressions|ctr|position  (default: createdAt)
 *   order=<asc|desc>  — default desc
 *   page=<n>          — 1-indexed, default 1
 *   limit=<n>         — default 25, max 100
 *   gsc=<0|1>         — include GSC per-page data (default 1; disable for fast load)
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.trim() || '';
  const category = url.searchParams.get('category') || '';
  const status = url.searchParams.get('status') || 'all';
  const source = url.searchParams.get('source') || '';
  const sort = url.searchParams.get('sort') || 'createdAt';
  const order = url.searchParams.get('order') === 'asc' ? 1 : -1;
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)));
  const includeGsc = url.searchParams.get('gsc') !== '0';

  await connectDB();

  // ── Build filter ─────────────────────────────────────────────────
  const filter: any = {};
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { keyword: { $regex: safe, $options: 'i' } },
      { title: { $regex: safe, $options: 'i' } },
      { slug: { $regex: safe, $options: 'i' } },
    ];
  }
  if (category) filter.category = category;
  if (source) filter.source = source;
  if (status === 'indexable') filter.isIndexable = true;
  else if (status === 'pending') {
    filter.isIndexable = { $ne: true };
    filter.qualityScore = { $gte: INDEXABLE_THRESHOLD };
  } else if (status === 'rejected') {
    filter.isIndexable = { $ne: true };
    filter.qualityScore = { $lt: INDEXABLE_THRESHOLD };
  }

  // ── DB sort (GSC-derived columns require in-memory sort below) ─────
  const dbSortableFields = new Set(['createdAt', 'qualityScore', 'views', 'viralScore', 'publishedAt', 'trendingRank']);
  const dbSort: any = dbSortableFields.has(sort) ? { [sort]: order } : { createdAt: -1 };

  const [total, rows] = await Promise.all([
    SeoPage.countDocuments(filter),
    SeoPage.find(filter)
      .select('slug keyword title category viralScore qualityScore wordCount views isIndexable publishedAt trendingRank source createdAt updatedAt')
      .sort(dbSort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  // ── Merge GSC data ───────────────────────────────────────────────
  let gscMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
  let gscConnected = false;
  if (includeGsc && rows.length > 0) {
    const pathnames = (rows as any[]).map(r => `/k/${r.slug}`);
    gscMap = await getPageStatsBatch(pathnames, 28);
    gscConnected = gscMap.size > 0 || !!process.env.GSC_SERVICE_ACCOUNT_JSON;
  }

  const items = (rows as any[]).map(r => {
    const gsc = gscMap.get(`/k/${r.slug}`) || null;
    const isRejected = !r.isIndexable && (r.qualityScore || 0) < INDEXABLE_THRESHOLD;
    const isPending = !r.isIndexable && (r.qualityScore || 0) >= INDEXABLE_THRESHOLD;
    let statusLabel: 'indexable' | 'pending' | 'rejected' = 'rejected';
    if (r.isIndexable) statusLabel = 'indexable';
    else if (isPending) statusLabel = 'pending';

    return {
      slug: r.slug,
      keyword: r.keyword,
      title: r.title,
      url: `/k/${r.slug}`,
      absoluteUrl: `https://www.vidyt.com/k/${r.slug}`,
      category: r.category,
      source: r.source,
      viralScore: r.viralScore || 0,
      qualityScore: r.qualityScore || 0,
      wordCount: r.wordCount || 0,
      views: r.views || 0,
      trendingRank: r.trendingRank || 0,
      isIndexable: !!r.isIndexable,
      status: statusLabel,
      publishedAt: r.publishedAt || null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      gsc: gsc ? {
        clicks: gsc.clicks,
        impressions: gsc.impressions,
        ctr: Math.round(gsc.ctr * 10000) / 100, // percentage with 2 decimals
        position: Math.round(gsc.position * 10) / 10,
      } : null,
    };
  });

  // ── GSC-column sort (in-memory, after DB page slice — OK because
  //    we scope to the current page only; for global sort by CTR across
  //    all pages, user can switch to DB-sort fields)
  if (includeGsc && !dbSortableFields.has(sort) && gscConnected) {
    const metric = sort as 'clicks' | 'impressions' | 'ctr' | 'position';
    items.sort((a, b) => {
      const av = a.gsc?.[metric] ?? (metric === 'position' ? 999 : 0);
      const bv = b.gsc?.[metric] ?? (metric === 'position' ? 999 : 0);
      return order === 1 ? av - bv : bv - av;
    });
  }

  return NextResponse.json({
    success: true,
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    gscConnected,
  });
}
