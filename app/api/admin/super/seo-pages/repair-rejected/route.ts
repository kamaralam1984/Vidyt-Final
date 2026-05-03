// Bulk repair of the 457k rejected /k/ backlog. Two paths:
//  - Garbage slug (the URL itself reads as a doorway page like
//    "best-best-best-tutorial-tutorial-2026") — Google will never index it
//    no matter how good the content is, so we delete the row.
//  - Salvageable slug — re-run buildSeoContent on the keyword, recompute
//    qualityScore. If the new score crosses INDEXABLE_THRESHOLD we flip
//    isIndexable + publishedAt and let the IndexNow cron pick it up.
//
// Pages already indexable are never touched.
//
// Query:
//   ?mode=auto    → delete garbage + upgrade salvageable (default)
//   ?mode=delete  → only delete garbage
//   ?mode=upgrade → only upgrade salvageable
//   &limit=N      → batch size (default 5000, max 50000)

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { isSuperAdminRole } from '@/lib/adminAuth';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { scoreSlug } from '@/lib/slugQuality';
import { buildSeoContent } from '@/lib/seoContentBuilder';
import { computeQualityScore, INDEXABLE_THRESHOLD } from '@/lib/qualityScorer';

type Mode = 'auto' | 'delete' | 'upgrade';

async function repair(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user || !isSuperAdminRole(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const mode = (url.searchParams.get('mode') || 'auto') as Mode;
  const limitParam = parseInt(url.searchParams.get('limit') || '5000', 10);
  const batchSize = Math.min(Math.max(100, isFinite(limitParam) ? limitParam : 5000), 50000);

  await connectDB();

  // Oldest, lowest-scoring rejected pages first so we burn through the
  // worst of the backlog on each run.
  const rejected = await SeoPage.find({ isIndexable: { $ne: true } })
    .sort({ qualityScore: 1, createdAt: 1 })
    .limit(batchSize)
    .select('slug keyword qualityScore wordCount viralScore hashtags content views')
    .lean();

  let deleted = 0;
  let upgraded = 0;
  let promoted = 0;
  let kept = 0;

  const deleteSlugs: string[] = [];
  const upgradeOps: any[] = [];

  for (const p of rejected as any[]) {
    const ss = scoreSlug(p.slug);

    // 1) Garbage slug → unrepairable → delete (when allowed by mode).
    if (ss.isGarbage) {
      if (mode === 'delete' || mode === 'auto') {
        deleteSlugs.push(p.slug);
      } else {
        kept++;
      }
      continue;
    }

    // 2) Clean slug → rebuild content + re-score (when allowed).
    if (mode === 'upgrade' || mode === 'auto') {
      const kw = String(p.keyword || (p.slug as string).replace(/-/g, ' ')).trim();
      if (!kw) { kept++; continue; }

      let built;
      try {
        built = buildSeoContent(kw);
      } catch {
        kept++;
        continue;
      }

      const newScore = computeQualityScore({
        wordCount: built.wordCount,
        viralScore: p.viralScore || 75,
        trendingRank: 0,
        views: p.views || 0,
        hashtagCount: built.hashtags.length,
        faqCount: built.faqs?.length || 0,
        slug: p.slug,
      });

      const willPromote = newScore >= INDEXABLE_THRESHOLD;
      const setDoc: any = {
        title: built.title,
        metaTitle: built.metaTitle,
        metaDescription: built.metaDescription,
        content: built.content,
        hashtags: built.hashtags,
        relatedKeywords: built.relatedKeywords,
        category: built.category,
        wordCount: built.wordCount,
        qualityScore: newScore,
      };
      if (willPromote) {
        setDoc.isIndexable = true;
        setDoc.publishedAt = new Date();
      }

      upgradeOps.push({
        updateOne: { filter: { slug: p.slug }, update: { $set: setDoc } },
      });
      upgraded++;
      if (willPromote) promoted++;
    } else {
      kept++;
    }
  }

  if (deleteSlugs.length) {
    const r = await SeoPage.deleteMany({
      slug: { $in: deleteSlugs },
      isIndexable: { $ne: true },
    });
    deleted = r.deletedCount || 0;
  }
  if (upgradeOps.length) {
    await SeoPage.bulkWrite(upgradeOps, { ordered: false });
  }

  return NextResponse.json({
    success: true,
    mode,
    scanned: rejected.length,
    deleted,
    upgraded,
    promoted,
    kept,
    threshold: INDEXABLE_THRESHOLD,
    timestamp: new Date().toISOString(),
  });
}

// Same logic on POST + GET so the admin page can call it via simple POST
// and the user can also kick a one-shot run from the browser.
export const POST = repair;
export const GET = repair;
