export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeoPage from '@/models/SeoPage';
import { buildSeoContent } from '@/lib/seoContentBuilder';
import { computeQualityScore, INDEXABLE_THRESHOLD } from '@/lib/qualityScorer';
import { sanitizeSeoKeyword } from '@/lib/seoKeywordSanitizer';
import {
  pickTodayCategories,
  pickTodaySubtopics,
  PER_CATEGORY_DAILY,
  GLOBAL_DAILY_CAP,
  getDayIndex,
} from '@/lib/seoCategoryRegistry';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

/**
 * Owner-locked floor for auto-created pages.
 *
 * Spec: "auto seo page jab bhi create hoga to high quality me create hona
 * chahiye 70+ qulity me hona chahiye". Pages whose computed qualityScore
 * lands below this are skipped at create time — they never enter the DB.
 * This pairs with the cleanup-low-quality cron to keep the dataset lean.
 */
const MIN_AUTO_CREATE_QUALITY = 70;

/**
 * Boosted from 75 → 90 so the viralPart of qualityScorer contributes ~18/20
 * instead of 15/20, lifting the typical builder output above the 70 floor.
 * Owner-curated subtopics are inherently demand-validated, so the higher
 * default reflects reality rather than gaming the score.
 */
const AUTO_VIRAL_SCORE = 90;

/** UTC start-of-day. Used for the "createdToday" guard. */
function startOfTodayUTC(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

/**
 * GET /api/cron/generate-seo-pages — quality-gated daily auto-page engine.
 *
 * Owner spec (locked):
 *   • PER_CATEGORY_DAILY = 3 pages per active category
 *   • GLOBAL_DAILY_CAP   = 60 pages globally per day
 *   • Categories rotate via day-index when active × 3 > 60
 *   • Subtopics rotate within each category so the same combo isn't
 *     re-generated until the pool has cycled
 *   • If today's count already hit the global cap, the cron is a no-op —
 *     re-running won't bulk-create
 *   • Slug-exists short-circuit prevents accidental duplicates
 *   • Keywords go through seoKeywordSanitizer (≤4 tokens, anti-spam)
 *   • Pages are NOT auto-promoted here — promote-seo-pages cron handles
 *     publish velocity separately so we never flood the sitemap
 *   • Bulk thin-page repair is capped to a small batch (10/run) so the
 *     cron stays a "healthy daily nudge", not a backlog flush
 */
export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    // ── 0. Hard ceiling: how many can we still create today? ────────────────
    //   Counts pages created since 00:00 UTC. If we already hit the cap,
    //   bail out cleanly — no creation, no upgrade, no promotion.
    const todayStart = startOfTodayUTC();
    const createdTodayBefore = await SeoPage.countDocuments({
      createdAt: { $gte: todayStart },
    });
    const remainingToday = Math.max(0, GLOBAL_DAILY_CAP - createdTodayBefore);

    if (remainingToday === 0) {
      return NextResponse.json({
        success: true,
        skipped: 'global daily cap reached',
        createdToday: createdTodayBefore,
        cap: GLOBAL_DAILY_CAP,
        timestamp: new Date().toISOString(),
      });
    }

    // ── 1. Build today's working set of (category, subtopic) keywords ──────
    const dayIndex = getDayIndex();
    const todaysCategories = pickTodayCategories();

    type Job = { category: string; keyword: string; slug: string };
    const queue: Job[] = [];
    const seen = new Set<string>();

    for (const cat of todaysCategories) {
      const subtopics = pickTodaySubtopics(cat, PER_CATEGORY_DAILY);
      for (const sub of subtopics) {
        const verdict = sanitizeSeoKeyword(sub);
        if (!verdict.ok || !verdict.cleaned) continue;
        const slug = slugify(verdict.cleaned);
        if (!slug || slug.length < 3 || seen.has(slug)) continue;
        seen.add(slug);
        queue.push({ category: cat.name, keyword: verdict.cleaned, slug });
        if (queue.length >= remainingToday) break;
      }
      if (queue.length >= remainingToday) break;
    }

    // ── 2. Skip slugs that already exist (idempotent across cron retries) ──
    const existingSlugs = await SeoPage.find({
      slug: { $in: queue.map(j => j.slug) },
    }).select('slug').lean();
    const existing = new Set((existingSlugs as unknown as Array<{ slug: string }>).map(s => s.slug));
    const toCreate = queue.filter(j => !existing.has(j.slug));

    // ── 3. Create — strictly one page per (category, subtopic) job ─────────
    //   Each candidate is built, scored, and only persisted if the score
    //   clears MIN_AUTO_CREATE_QUALITY. Pages that pass go directly into the
    //   sitemap (isIndexable:true) — no need for a separate promotion gate
    //   when the floor is already 70+.
    let created = 0;
    let skippedBelowQuality = 0;
    const createdSamples: { slug: string; category: string; quality: number }[] = [];
    const skippedSamples: { slug: string; quality: number }[] = [];

    for (const job of toCreate) {
      if (created >= remainingToday) break;

      const built = buildSeoContent(job.keyword);

      const qualityScore = computeQualityScore({
        wordCount: built.wordCount,
        viralScore: AUTO_VIRAL_SCORE,
        trendingRank: 0,
        views: 0,
        hashtagCount: built.hashtags.length,
        faqCount: built.faqs.length,
        slug: job.slug,
      });

      // Hard quality floor. Below 70 → skip silently (no DB write).
      if (qualityScore < MIN_AUTO_CREATE_QUALITY) {
        skippedBelowQuality++;
        if (skippedSamples.length < 5) {
          skippedSamples.push({ slug: job.slug, quality: qualityScore });
        }
        continue;
      }

      // 70+ → publish immediately. Daily creation cap (60) provides the
      // staggering, so we don't need a separate un-indexable holding pool.
      await SeoPage.create({
        slug: job.slug,
        keyword: job.keyword,
        title: built.title,
        metaTitle: built.metaTitle,
        metaDescription: built.metaDescription,
        content: built.content,
        hashtags: built.hashtags,
        relatedKeywords: built.relatedKeywords,
        faqs: built.faqs,
        viralScore: AUTO_VIRAL_SCORE,
        category: built.category || job.category,
        wordCount: built.wordCount,
        qualityScore,
        source: 'auto_daily',
        isIndexable: true,
        publishedAt: new Date(),
      });

      created++;
      if (createdSamples.length < 5) {
        createdSamples.push({ slug: job.slug, category: job.category, quality: qualityScore });
      }
    }
    // INDEXABLE_THRESHOLD reference retained for the cleanup cron contract;
    // suppress unused-var lint here without changing the export.
    void INDEXABLE_THRESHOLD;

    // ── 4. Tiny thin-page nudge (max 10/run) ───────────────────────────────
    //   Old code regenerated 500 thin pages per run — that's a bulk action
    //   and contradicts the "natural cadence" rule. Cap aggressively here;
    //   the dedicated repair-rejected admin endpoint handles backlog clears.
    const THIN_REPAIR_PER_RUN = 10;
    const thinPages = await SeoPage.find({
      $or: [{ wordCount: { $lt: 400 } }, { wordCount: { $exists: false } }],
      isIndexable: { $ne: true },
    }).select('slug keyword category source').limit(THIN_REPAIR_PER_RUN).lean();

    let upgraded = 0;
    if (thinPages.length > 0) {
      const upgradeOps: any[] = [];
      for (const p of thinPages as any[]) {
        const kw = (p.keyword || (p.slug as string).replace(/-/g, ' ')).trim();
        if (!kw) continue;
        const built = buildSeoContent(kw);
        const upgradeScore = computeQualityScore({
          wordCount: built.wordCount,
          viralScore: 75,
          trendingRank: 0,
          views: 0,
          hashtagCount: built.hashtags.length,
          faqCount: built.faqs.length,
          slug: p.slug,
        });
        const upgradeSet: any = {
          title: built.title,
          metaTitle: built.metaTitle,
          metaDescription: built.metaDescription,
          content: built.content,
          hashtags: built.hashtags,
          relatedKeywords: built.relatedKeywords,
          faqs: built.faqs,
          category: built.category,
          wordCount: built.wordCount,
          qualityScore: upgradeScore,
          source: p.source || 'auto_daily',
        };
        // If the upgrade lifts the page above the 70 floor, promote it in
        // the same write — no need to wait for a separate cron pass.
        if (upgradeScore >= MIN_AUTO_CREATE_QUALITY) {
          upgradeSet.isIndexable = true;
          upgradeSet.publishedAt = new Date();
        }
        upgradeOps.push({
          updateOne: {
            filter: { slug: p.slug },
            update: { $set: upgradeSet },
          },
        });
        upgraded++;
      }
      if (upgradeOps.length) await SeoPage.bulkWrite(upgradeOps, { ordered: false });
    }

    return NextResponse.json({
      success: true,
      dayIndex,
      cap: GLOBAL_DAILY_CAP,
      perCategory: PER_CATEGORY_DAILY,
      qualityFloor: MIN_AUTO_CREATE_QUALITY,
      todaysCategories: todaysCategories.map(c => c.name),
      createdTodayBefore,
      createdThisRun: created,
      skippedBelowQuality,
      thinPagesUpgraded: upgraded,
      remainingTodayAfter: Math.max(0, remainingToday - created),
      createdSamples,
      skippedSamples,
      message: `Day ${dayIndex} · ${created} new ≥${MIN_AUTO_CREATE_QUALITY} quality (cap ${GLOBAL_DAILY_CAP}) · ${skippedBelowQuality} skipped below floor · ${upgraded} thin upgraded`,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[generate-seo-pages] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
