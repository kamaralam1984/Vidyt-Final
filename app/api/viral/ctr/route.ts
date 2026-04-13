export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoAnyFeature } from '@/lib/assertUserFeature';

// ─── Scoring helpers ───

function scoreTitleCuriosity(title: string): number {
  if (!title?.trim()) return 30;
  const t = title.trim();
  let s = 40;

  // Numbers boost CTR significantly (e.g., "Top 10", "5 Ways")
  if (/\d+/.test(t)) s += 12;
  // Questions create curiosity gap
  if (/\?|how|what|why|when|which|who/i.test(t)) s += 10;
  // Brackets/parentheses boost CTR by ~38% (Backlinko study)
  if (/[\[\(]/.test(t)) s += 8;
  // Power/emotional words
  const powerWords = /secret|amazing|shocking|incredible|unbelievable|insane|best|worst|ultimate|proven|hack|trick|mistake|never|always|must|watch|stop|urgent|breaking|exclusive|viral|free|instant|guaranteed/i;
  if (powerWords.test(t)) s += 10;
  // Urgency words
  if (/now|today|hurry|limited|last|don'?t miss|before it'?s/i.test(t)) s += 5;
  // Year in title (freshness signal)
  if (/202[4-9]|203\d/.test(t)) s += 4;
  // Optimal length (50-60 chars)
  const len = t.length;
  if (len >= 40 && len <= 65) s += 8;
  else if (len >= 30 && len <= 70) s += 4;
  // ALL CAPS words for emphasis (1-2 words)
  const capsWords = (t.match(/\b[A-Z]{3,}\b/g) || []).length;
  if (capsWords >= 1 && capsWords <= 3) s += 4;
  // Pipe or dash separator (common in high-CTR titles)
  if (/[|–—]/.test(t)) s += 3;

  return Math.min(100, Math.round(s));
}

function scoreKeywordRelevance(title: string, keywords: string[]): number {
  if (!title?.trim()) return 40;
  const words = title.toLowerCase().split(/\s+/).filter(Boolean);
  const kw = keywords.map((k) => k.toLowerCase().trim()).filter(Boolean);
  if (kw.length === 0) return 55;

  let exactMatches = 0;
  let partialMatches = 0;
  for (const w of words) {
    if (kw.some((k) => k === w)) exactMatches++;
    else if (kw.some((k) => k.includes(w) || w.includes(k))) partialMatches++;
  }
  // Keyword in first 3 words is stronger signal
  const firstThree = words.slice(0, 3);
  const frontLoaded = kw.some((k) => firstThree.some((w) => k.includes(w) || w.includes(k)));

  let s = 45;
  s += Math.min(25, exactMatches * 12);
  s += Math.min(10, partialMatches * 5);
  if (frontLoaded) s += 10;
  // Keyword density sweet spot: 1-3 keywords in title
  if (exactMatches >= 1 && exactMatches <= 3) s += 5;

  return Math.min(100, Math.round(s));
}

function scoreDescriptionQuality(title: string, keywords: string[], description?: string): number {
  if (!description?.trim()) return 35;
  const d = description.trim();
  let s = 40;

  // Length check (ideal: 200-5000 chars)
  if (d.length >= 200 && d.length <= 5000) s += 12;
  else if (d.length >= 100) s += 6;
  // Has hashtags
  const hashCount = (d.match(/#\w+/g) || []).length;
  if (hashCount >= 5 && hashCount <= 30) s += 10;
  else if (hashCount >= 1) s += 5;
  // Has keywords in description
  const kw = keywords.map((k) => k.toLowerCase().trim()).filter(Boolean);
  const dLower = d.toLowerCase();
  const kwInDesc = kw.filter((k) => dLower.includes(k)).length;
  if (kwInDesc >= 3) s += 12;
  else if (kwInDesc >= 1) s += 6;
  // Has CTA (subscribe, like, comment)
  if (/subscribe|like|comment|share|follow|turn on/i.test(d)) s += 5;
  // Has links
  if (/https?:\/\//i.test(d)) s += 3;
  // Has timestamps
  if (/\d{1,2}:\d{2}/.test(d)) s += 5;
  // Has line breaks (structured)
  if ((d.match(/\n/g) || []).length >= 3) s += 4;

  return Math.min(100, Math.round(s));
}

function scoreHashtagStrategy(keywords: string[]): number {
  const kw = keywords.filter(Boolean);
  if (kw.length === 0) return 30;
  let s = 40;

  // Optimal hashtag/keyword count
  if (kw.length >= 8 && kw.length <= 25) s += 20;
  else if (kw.length >= 5) s += 12;
  else if (kw.length >= 3) s += 6;

  // Mix of short and long-tail keywords
  const shortKw = kw.filter((k) => k.split(/\s+/).length === 1).length;
  const longTail = kw.filter((k) => k.split(/\s+/).length >= 3).length;
  if (shortKw >= 2 && longTail >= 2) s += 10;

  // Has trending-style keywords
  const trendWords = /viral|trending|shorts|fyp|explore|new|latest|breaking/i;
  const hasTrend = kw.some((k) => trendWords.test(k));
  if (hasTrend) s += 8;

  // Variety (not all the same word)
  const unique = new Set(kw.map((k) => k.toLowerCase()));
  if (unique.size >= kw.length * 0.8) s += 5;

  return Math.min(100, Math.round(s));
}

export async function POST(request: NextRequest) {
  const denied = await denyIfNoAnyFeature(request, ['youtube_seo', 'viral_optimizer']);
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    const title = (body.title as string)?.trim() || '';
    const keywordsStr = (body.keywords as string) || '';
    const keywords = keywordsStr.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);
    const description = (body.description as string) || '';
    const thumbnailScore = typeof body.thumbnailScore === 'number' ? body.thumbnailScore : 70;
    const thumbnailContrast = typeof body.thumbnailContrast === 'number' ? body.thumbnailContrast : 70;
    const faceDetection = typeof body.faceDetection === 'number' ? body.faceDetection : 0;
    const textReadability = typeof body.textReadability === 'number' ? body.textReadability : 70;

    const titleCuriosity = scoreTitleCuriosity(title);
    const keywordRelevance = scoreKeywordRelevance(title, keywords);
    const descriptionQuality = scoreDescriptionQuality(title, keywords, description);
    const hashtagStrategy = scoreHashtagStrategy(keywords);
    const faceScore = faceDetection > 0 ? Math.min(100, 55 + faceDetection * 18) : 40;

    const factors = {
      titleCuriosity,
      keywordRelevance,
      thumbnailContrast,
      faceDetection: faceScore,
      textReadability,
      descriptionQuality,
      hashtagStrategy,
    };

    // Weighted scoring (research-based weights)
    const weights = {
      titleCuriosity: 0.22,
      keywordRelevance: 0.15,
      thumbnailContrast: 0.18,
      faceDetection: 0.15,
      textReadability: 0.10,
      descriptionQuality: 0.10,
      hashtagStrategy: 0.10,
    };

    const ctrScore = Math.round(
      factors.titleCuriosity * weights.titleCuriosity +
      factors.keywordRelevance * weights.keywordRelevance +
      factors.thumbnailContrast * weights.thumbnailContrast +
      factors.faceDetection * weights.faceDetection +
      factors.textReadability * weights.textReadability +
      factors.descriptionQuality * weights.descriptionQuality +
      factors.hashtagStrategy * weights.hashtagStrategy
    );

    // CTR mapping: score 0-100 → CTR 2%-16%
    // High-quality content can reach 11.8%+ with score >= 82
    const ctrPercent = Math.min(16, 2 + (ctrScore / 100) * 14).toFixed(1);

    const suggestions: string[] = [];
    if (factors.titleCuriosity < 75) suggestions.push('Add power words (Secret, Amazing, Proven), numbers, or a question to your title for higher curiosity.');
    if (factors.keywordRelevance < 65) suggestions.push('Place your main keyword in the first 3 words of the title for maximum SEO impact.');
    if (factors.thumbnailContrast < 75) suggestions.push('Use bold, high-contrast colors in your thumbnail. Red/Yellow text on dark backgrounds performs best.');
    if (factors.faceDetection < 60) suggestions.push('Add a face showing strong emotion (surprise, excitement) on your thumbnail — faces boost CTR by 30-40%.');
    if (factors.textReadability < 75) suggestions.push('Keep thumbnail text to 3-5 words MAX. Use thick, bold fonts that are readable at small sizes.');
    if (factors.descriptionQuality < 70) suggestions.push('Write a 200+ char description with keywords, timestamps, hashtags, and a CTA (Subscribe/Like).');
    if (factors.hashtagStrategy < 70) suggestions.push('Use 10-20 targeted keywords mixing short-tail and long-tail. Include trending terms like #viral #shorts.');
    if (titleCuriosity >= 80 && !/[\[\(]/.test(title)) suggestions.push('Pro tip: Add brackets like [PROVEN] or (2024 Guide) — brackets boost CTR by ~38%.');

    if (suggestions.length === 0) {
      suggestions.push('Excellent optimization! Your content is set for high CTR. Consider A/B testing 2-3 thumbnail variants.');
    }

    return NextResponse.json({
      ctrScore: Math.min(100, Math.max(0, ctrScore)),
      ctrPercent: String(ctrPercent),
      factors,
      suggestions,
    });
  } catch (e) {
    console.error('CTR API error:', e);
    return NextResponse.json(
      { ctrScore: 50, ctrPercent: '7.0', factors: {}, suggestions: ['Analysis failed. Try again.'] },
      { status: 500 }
    );
  }
}
