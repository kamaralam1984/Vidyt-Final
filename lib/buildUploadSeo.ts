import type { TrendingTopic } from '@/services/trendingEngine';

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
  const description = buildHighCtrDescription({
    title: params.title,
    keywords: params.keywords,
    hookScore: params.hookScore,
    viralProbability: params.viralProbability,
    hashtags,
    trendingTags,
  });
  return { description, hashtags, trendingTags };
}
