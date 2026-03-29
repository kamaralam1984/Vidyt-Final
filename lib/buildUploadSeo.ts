import type { TrendingTopic } from '@/services/trendingEngine';

/** YouTube title cap used across dashboard + upload form */
export const YOUTUBE_TITLE_MAX_CHARS = 70;

/** SEO / description word cap */
export const SEO_DESCRIPTION_MAX_WORDS = 200;

export function truncateToWordCount(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  // Under limit: return text as-is so spaces while typing (e.g. "hello ") are kept
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

export function clampYoutubeTitle(title: string, maxChars = YOUTUBE_TITLE_MAX_CHARS): string {
  const t = title.trim();
  if (t.length <= maxChars) return t;
  return t.slice(0, maxChars).trimEnd();
}

/** Alias for API routes that expect this name */
export const normalizeYoutubeTitle = clampYoutubeTitle;

export function takeFiveTitles(titles: string[], maxChars = YOUTUBE_TITLE_MAX_CHARS): string[] {
  return titles
    .slice(0, 5)
    .map((t) => clampYoutubeTitle(t.trim(), maxChars));
}

export interface UploadSeoPack {
  description: string;
  /** Plain hashtags without # — exactly 5 for YouTube / UI */
  hashtags: string[];
  /** Top trending keywords with scores */
  trendingTags: TrendingTopic[];
}

/**
 * High-CTR style YouTube description: hook, value, keywords, trending line, hashtags.
 */
export function buildHighCtrDescription(input: {
  title: string;
  keywords: string[];
  hookScore: number;
  viralProbability: number;
  hashtags: string[];
  trendingTags: TrendingTopic[];
}): string {
  const cleanTags = input.hashtags.map((h) => h.replace(/^#/, '').trim()).filter(Boolean);
  const trendingLine = input.trendingTags
    .map((t) => t.keyword)
    .filter(Boolean)
    .join(', ');
  const kw = input.keywords.slice(0, 8).join(', ');
  const hookPct = Math.min(100, Math.round(Number(input.hookScore) || 0));
  const viralPct = Math.min(100, Math.round(Number(input.viralProbability) || 0));

  return [
    `${input.title}`,
    '',
    `Why watch: optimized for CTR — hook strength ${hookPct}%, modeled viral fit ${viralPct}%.`,
    '',
    `Topics covered: ${kw || 'your niche'}`,
    '',
    `Trending angles to pair with this video: ${trendingLine || 'shorts, viral, trending'}`,
    '',
    cleanTags.map((h) => `#${h}`).join(' '),
  ].join('\n');
}

/** Take up to 5 unique hashtag strings (no #). */
export function takeFiveHashtags(fromHashtags: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of fromHashtags) {
    const t = raw.replace(/^#/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (t.length < 2 || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 5) break;
  }
  return out;
}

/** Up to 10 trending topics; pad from keywords if needed. */
export function takeTenTrending(
  topics: TrendingTopic[],
  fallbackKeywords: string[]
): TrendingTopic[] {
  const list = [...topics];
  let i = 0;
  while (list.length < 10 && i < fallbackKeywords.length) {
    const kw = fallbackKeywords[i++];
    if (!kw || list.some((t) => t.keyword.toLowerCase() === kw.toLowerCase())) continue;
    list.push({ keyword: kw, score: 72 });
  }
  return list.slice(0, 10);
}

export function buildUploadSeoPack(params: {
  title: string;
  keywords: string[];
  hookScore: number;
  viralProbability: number;
  rawHashtags: string[];
  trendingTopics: TrendingTopic[];
}): UploadSeoPack {
  const hashtags = takeFiveHashtags(params.rawHashtags.map((h) => h.replace(/^#/, '')));
  const trendingTags = takeTenTrending(params.trendingTopics, params.keywords);
  let description = buildHighCtrDescription({
    title: params.title,
    keywords: params.keywords,
    hookScore: params.hookScore,
    viralProbability: params.viralProbability,
    hashtags,
    trendingTags,
  });
  description = truncateToWordCount(description, SEO_DESCRIPTION_MAX_WORDS);
  return { description, hashtags, trendingTags };
}

/**
 * Modeled viral fit for SEO-optimized metadata (title + trending alignment).
 * Produces 90–100 so publish-ready copy reflects strong discovery potential.
 */
export function modeledViralFitForTitleSeo(titleScore: number, trendingScore: number): number {
  const t = Math.min(100, Math.max(0, Number(titleScore) || 0));
  const tr = Math.min(100, Math.max(0, Number(trendingScore) || 0));
  const blended = 72 + (t / 100) * 18 + (tr / 100) * 10;
  return Math.min(100, Math.max(90, Math.round(blended)));
}

/** Hook strength shown in description when metadata is title/SEO-optimized (88–100). */
export function modeledHookStrengthForTitleSeo(titleScore: number): number {
  const t = Math.min(100, Math.max(0, Number(titleScore) || 0));
  return Math.min(100, Math.max(88, Math.round(80 + (t / 100) * 18)));
}

/** Comma-separated YouTube tags from SEO pack (deduped, capped). */
export function commaSeparatedYoutubeTags(pack: UploadSeoPack, maxTags = 30): string {
  const parts = [...pack.hashtags, ...pack.trendingTags.map((x) => x.keyword)];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of parts) {
    const s = String(raw || '')
      .trim()
      .replace(/^#/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
    if (s.length < 2 || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= maxTags) break;
  }
  return out.join(', ');
}
