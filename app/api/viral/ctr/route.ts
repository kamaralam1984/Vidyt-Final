export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoAnyFeature } from '@/lib/assertUserFeature';

function scoreTitleCuriosity(title: string): number {
  if (!title?.trim()) return 40;
  const t = title.trim();
  const hasNumber = /\d+/.test(t);
  const hasQuestion = /\?|how|what|why|when|which/i.test(t);
  const hasBracket = /[\[\(]/.test(t);
  const length = Math.min(60, t.length);
  let s = 50;
  if (hasNumber) s += 8;
  if (hasQuestion) s += 10;
  if (hasBracket) s += 5;
  s += Math.min(15, length / 4);
  return Math.min(100, Math.round(s));
}

function scoreKeywordRelevance(title: string, keywords: string[]): number {
  if (!title?.trim()) return 50;
  const words = title.toLowerCase().split(/\s+/).filter(Boolean);
  const kw = keywords.map((k) => k.toLowerCase().trim()).filter(Boolean);
  if (kw.length === 0) return 60;
  let matches = 0;
  for (const w of words) {
    if (kw.some((k) => k.includes(w) || w.includes(k))) matches++;
  }
  const ratio = words.length ? matches / Math.min(words.length, kw.length) : 0;
  return Math.min(100, Math.round(50 + ratio * 50));
}

export async function POST(request: NextRequest) {
  const denied = await denyIfNoAnyFeature(request, ['youtube_seo', 'viral_optimizer']);
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    const title = (body.title as string)?.trim() || '';
    const keywordsStr = (body.keywords as string) || '';
    const keywords = keywordsStr.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);
    const thumbnailScore = typeof body.thumbnailScore === 'number' ? body.thumbnailScore : 70;
    const thumbnailContrast = typeof body.thumbnailContrast === 'number' ? body.thumbnailContrast : 70;
    const faceDetection = typeof body.faceDetection === 'number' ? body.faceDetection : 0;
    const textReadability = typeof body.textReadability === 'number' ? body.textReadability : 70;

    const titleCuriosity = scoreTitleCuriosity(title);
    const keywordRelevance = scoreKeywordRelevance(title, keywords);
    const factors = {
      titleCuriosity,
      keywordRelevance,
      thumbnailContrast,
      faceDetection: faceDetection > 0 ? Math.min(100, 60 + faceDetection * 15) : 45,
      textReadability,
    };
    const weights = { titleCuriosity: 0.25, keywordRelevance: 0.2, thumbnailContrast: 0.2, faceDetection: 0.2, textReadability: 0.15 };
    const ctrScore = Math.round(
      factors.titleCuriosity * weights.titleCuriosity +
        factors.keywordRelevance * weights.keywordRelevance +
        factors.thumbnailContrast * weights.thumbnailContrast +
        factors.faceDetection * weights.faceDetection +
        factors.textReadability * weights.textReadability
    );
    const ctrPercent = Math.min(15, (ctrScore / 100) * 14).toFixed(1);

    const suggestions: string[] = [];
    if (factors.titleCuriosity < 70) suggestions.push('Add curiosity: use numbers, a question, or brackets in the title.');
    if (factors.keywordRelevance < 60) suggestions.push('Include 1–2 main keywords from your tags in the title.');
    if (factors.thumbnailContrast < 70) suggestions.push('Increase thumbnail contrast (e.g. bold text on solid background).');
    if (factors.faceDetection < 60) suggestions.push('Consider showing a face or clear emotion on the thumbnail for higher CTR.');
    if (factors.textReadability < 70) suggestions.push('Keep thumbnail text short (3–5 words) and highly readable.');

    return NextResponse.json({
      ctrScore: Math.min(100, Math.max(0, ctrScore)),
      ctrPercent: String(ctrPercent),
      factors,
      suggestions: suggestions.length ? suggestions : ['Title and thumbnail look strong. Test with A/B titles for more gains.'],
    });
  } catch (e) {
    console.error('CTR API error:', e);
    return NextResponse.json(
      { ctrScore: 50, ctrPercent: '7.0', factors: {}, suggestions: ['Analysis failed. Try again.'] },
      { status: 500 }
    );
  }
}
