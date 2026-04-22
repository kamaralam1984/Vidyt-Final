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

export interface ScoreInputs {
  wordCount: number;
  viralScore: number;   // 0–100 — algorithmic/viral fit
  trendingRank: number; // 1 = hottest trending today, 0 = not trending
  views: number;        // lifetime views on VidYT
  hashtagCount: number;
  faqCount: number;
  ageHours?: number;    // hours since page creation (freshness)
}

export const INDEXABLE_THRESHOLD = 70;
export const DAILY_PROMOTION_CAP = 100;

export function computeQualityScore(i: ScoreInputs): number {
  // 1) Word-count gate (max 30 pts). Google wants substance.
  //    300w = 0, 800w = 15, 1200w = 25, 1800w+ = 30.
  const wcScore = Math.min(30, Math.max(0, (i.wordCount - 300) / 50));

  // 2) Viral score fit (max 20 pts) — reflects keyword demand.
  const viralPart = Math.min(20, (i.viralScore / 100) * 20);

  // 3) Trending bonus (max 20 pts) — fresh trend pages get priority.
  //    rank 1 = 20, rank 10 = 16, rank 50 = 10, rank 100+ = 0.
  let trendPart = 0;
  if (i.trendingRank > 0) {
    trendPart = Math.max(0, 20 - Math.log10(i.trendingRank) * 8);
  }

  // 4) Engagement signal (max 15 pts) — real users validate quality.
  //    Log-scaled so a single page that went viral doesn't dominate.
  //    0 views = 0, 10 views = 4, 100 views = 8, 1000 views = 12, 10k+ = 15.
  const viewsPart = Math.min(15, Math.log10(i.views + 1) * 4);

  // 5) Structure completeness (max 15 pts) — rich media signals.
  const hashtagPart = Math.min(6, i.hashtagCount * 0.4);  // 15 tags = 6 pts
  const faqPart = Math.min(9, i.faqCount * 1.8);          // 5 FAQs = 9 pts

  const raw = wcScore + viralPart + trendPart + viewsPart + hashtagPart + faqPart;
  return Math.min(100, Math.round(raw));
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
}): number {
  // Derive wordCount from content if stale/zero
  let wordCount = page.wordCount || 0;
  if (!wordCount && page.content) {
    wordCount = page.content.replace(/[#*_`>|-]/g, ' ').split(/\s+/).filter(Boolean).length;
  }

  // FAQ count: heuristic on content
  const faqCount = (page.content || '').split(/^### \d+\./m).length - 1;

  return computeQualityScore({
    wordCount,
    viralScore: page.viralScore || 0,
    trendingRank: page.trendingRank || 0,
    views: page.views || 0,
    hashtagCount: (page.hashtags || []).length,
    faqCount: Math.max(0, faqCount),
  });
}
