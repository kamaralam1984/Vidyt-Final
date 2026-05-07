/**
 * Quality scorer for /k/ SEO pages.
 *
 * Why: Google's "helpful content" system rejects thin, templated, zero-value
 * pages ("Crawled - currently not indexed"). We refuse to sitemap a page
 * unless it scores ≥ INDEXABLE_THRESHOLD here. The promote-seo-pages cron
 * picks the top 100 scorers per day and marks them isIndexable:true.
 *
 * Score = 0–100, weighted mix of objective signals. Not ML — just rules
 * that reflect what Google's raters actually penalise.
 */

import { scoreSlug } from './slugQuality';

export interface ScoreInputs {
  wordCount: number;
  viralScore: number;   // 0–100 — algorithmic/viral fit
  trendingRank: number; // 1 = hottest trending today, 0 = not trending
  views: number;        // lifetime views on VidYT
  hashtagCount: number;
  faqCount: number;
  ageHours?: number;    // hours since page creation (freshness)
  slug?: string;        // URL slug — penalised when garbage (best-best-best...)
}

// Threshold at 20: enough to block truly empty pages while letting
// content-rich pages with imperfect slugs through.
export const INDEXABLE_THRESHOLD = 20;
// Owner spec: stagger publishing — never flood the sitemap. 60/day matches
// the global creation cap so creation and promotion velocities stay paired.
export const DAILY_PROMOTION_CAP = 60;

export function computeQualityScore(i: ScoreInputs): number {
  // 1) Word-count gate (max 35 pts). Google wants substance.
  //    300w = 0, 600w = 12, 900w = 24, 1200w+ = 30, 1800w+ = 35.
  const wcScore = Math.min(35, Math.max(0, (i.wordCount - 300) / 30));

  // 2) Viral score fit (max 20 pts) — reflects keyword demand.
  const viralPart = Math.min(20, (i.viralScore / 100) * 20);

  // 3) Trending bonus (max 20 pts) — fresh trend pages get priority.
  //    rank 1 = 20, rank 10 = 16, rank 50 = 10, rank 100+ = 0.
  let trendPart = 0;
  if (i.trendingRank > 0) {
    trendPart = Math.max(0, 20 - Math.log10(i.trendingRank) * 8);
  }

  // 4) Engagement signal (max 10 pts) — real users validate quality.
  //    Log-scaled so a single page that went viral doesn't dominate.
  //    0 views = 0, 10 views = 3, 100 views = 6, 1000 views = 9, 10k+ = 10.
  const viewsPart = Math.min(10, Math.log10(i.views + 1) * 3);

  // 5) Structure completeness (max 15 pts) — rich content signals.
  const hashtagPart = Math.min(6, i.hashtagCount * 0.4);  // 15 tags = 6 pts
  const faqPart = Math.min(9, i.faqCount * 1.8);          // 5 FAQs = 9 pts

  // 6) Freshness bonus (max 5 pts) — new pages get a brief boost to enter
  //    the cron promotion pool before accumulating real engagement.
  const agePart = i.ageHours !== undefined
    ? Math.max(0, 5 - i.ageHours / 48)   // full 5 pts at 0h, 0 at 240h (10 days)
    : 5;                                   // unknown age → assume fresh

  // 7) Slug-quality penalty (up to -15). Content quality should dominate —
  //    a great article with a slightly imperfect slug still deserves indexing.
  //    Truly garbage slugs still get a hard penalty to block doorway pages.
  let slugPenalty = 0;
  if (i.slug) {
    const ss = scoreSlug(i.slug);
    if (ss.isGarbage) slugPenalty = 15;
    else if (ss.score < 70) slugPenalty = 8;
    else if (ss.score < 85) slugPenalty = 3;
  }

  const raw = wcScore + viralPart + trendPart + viewsPart + hashtagPart + faqPart + agePart - slugPenalty;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function isIndexableScore(score: number): boolean {
  return score >= INDEXABLE_THRESHOLD;
}

/**
 * Re-score an existing page document (after views change, after content edit, etc.)
 * Call from the promote cron.
 */
export function rescorePage(page: {
  wordCount?: number;
  viralScore?: number;
  trendingRank?: number;
  views?: number;
  hashtags?: string[];
  content?: string;
  slug?: string;
  faqs?: Array<any>;
}): number {
  let wordCount = page.wordCount || 0;
  if (!wordCount && page.content) {
    wordCount = page.content.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length;
  }

  // Use stored faqs array (set by buildSeoContent) if available; fall back to
  // the content-regex heuristic for legacy pages that pre-date the faqs field.
  let faqCount = 0;
  if (Array.isArray(page.faqs) && page.faqs.length > 0) {
    faqCount = page.faqs.length;
  } else {
    faqCount = Math.max(0, (page.content || '').split(/^### \d+\./m).length - 1);
  }

  return computeQualityScore({
    wordCount,
    viralScore: page.viralScore || 0,
    trendingRank: page.trendingRank || 0,
    views: page.views || 0,
    hashtagCount: (page.hashtags || []).length,
    faqCount,
    slug: page.slug,
  });
}
