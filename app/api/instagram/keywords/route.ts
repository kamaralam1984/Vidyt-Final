export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

// ─────────────────────────────────────
// Hardcoded fallback
// ─────────────────────────────────────
function extractBases(caption: string, keyword: string): string[] {
  const captionWords = (caption || '').toLowerCase().trim().split(/\s+/).filter((w) => w.length > 1);
  const keywordWords = (keyword || '').toLowerCase().trim().split(/[,;\s]+/).map((k) => k.trim()).filter(Boolean);
  const bases: string[] = [];
  if (captionWords.length >= 2) bases.push(captionWords.slice(0, 2).join(' '));
  if (captionWords.length >= 1) bases.push(captionWords[0]);
  keywordWords.forEach((kw) => {
    const w = kw.split(/\s+/).slice(0, 2).join(' ');
    if (w && !bases.includes(w)) bases.push(w);
  });
  if (bases.length === 0) bases.push('viral', 'instagram', 'trending');
  return [...new Set(bases)];
}

function fallbackViralKeywords(caption: string, keyword: string): { keyword: string; viralScore: number }[] {
  const bases = extractBases(caption, keyword);
  const suffixes = [' viral', ' reels', ' 2025', ' growth', ' tips', ' trending', ' content', ' instagram', ' explore', ' fyp'];
  const out: { keyword: string; viralScore: number }[] = [];
  const seen = new Set<string>();
  for (const b of bases) {
    const base = b.replace(/\s+/g, ' ').trim() || 'viral';
    for (const s of suffixes) {
      const kw = (base + s).replace(/\s+/g, ' ').trim();
      if (kw.length < 3 || seen.has(kw)) continue;
      seen.add(kw);
      out.push({ keyword: kw, viralScore: 50 + (out.length % 45) });
      if (out.length >= 50) break;
    }
    if (out.length >= 50) break;
  }
  return out.slice(0, 50).sort((a, b) => b.viralScore - a.viralScore);
}

// ─────────────────────────────────────
// AI-driven viral keyword research
// ─────────────────────────────────────
async function getAIKeywords(
  caption: string,
  keyword: string,
): Promise<{ viralKeywords: { keyword: string; viralScore: number }[]; provider: string } | null> {
  const year = new Date().getFullYear();
  const prompt = `You are an Instagram SEO + viral content researcher. Generate 50 search-friendly viral keywords/phrases for the topic below.

Caption / topic: "${caption || 'general content'}"
Seed keyword: "${keyword || '(none)'}"
Year: ${year}

Keyword mix rules (Instagram-specific):
- 15 broad high-volume single/two-word terms (e.g. "reels", "explore", "viral content")
- 15 long-tail (3-5 words, specific intent, Reels-friendly phrasing)
- 10 question-style ("how to", "best", "why", "kya hai", "kaise", etc.)
- 10 trending/year-tagged (with ${year}, "latest", "new", "trending now")
- Include Hinglish variants when topic suggests Indian audience.
- Avoid pure stopwords. Each keyword must be searchable as an Instagram caption/hashtag-adjacent term.

Return ONLY this JSON (no markdown):
{
  "viralKeywords": [
    { "keyword": "instagram reels viral ${year}", "viralScore": 0-100 },
    ... 50 items total, sorted by viralScore descending
  ]
}
viralScore guidance: 80-95 high-intent + high-volume; 60-79 mid; 40-59 niche/long-tail.`;

  const parse = (text: string) => {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      const j = JSON.parse(m[0].replace(/,(\s*[}\]])/g, '$1')) as {
        viralKeywords?: { keyword: string; viralScore: number }[];
      };
      if (!Array.isArray(j.viralKeywords) || j.viralKeywords.length === 0) return null;
      const seen = new Set<string>();
      return j.viralKeywords
        .filter((k) => k && typeof k.keyword === 'string' && k.keyword.trim().length > 2)
        .map((k) => ({
          keyword: k.keyword.trim().toLowerCase(),
          viralScore: Math.max(20, Math.min(98, Math.round(Number(k.viralScore) || 60))),
        }))
        .filter((k) => (seen.has(k.keyword) ? false : seen.add(k.keyword)))
        .sort((a, b) => b.viralScore - a.viralScore)
        .slice(0, 50);
    } catch {
      return null;
    }
  };

  try {
    const ai = await routeAI({
      prompt,
      timeoutMs: 14000,
      cacheKey: `ig-kw:${caption}:${keyword}`.toLowerCase(),
      cacheTtlSec: 300,
      fallbackText: '{}',
    });
    const parsed = parse(ai.text || '');
    if (!parsed || parsed.length === 0) return null;
    return { viralKeywords: parsed, provider: ai.provider };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get('keyword') || '').trim();
  const caption = (searchParams.get('caption') || searchParams.get('title') || '').trim();

  const aiResult = await getAIKeywords(caption, keyword);
  const viralKeywords = aiResult?.viralKeywords?.length
    ? aiResult.viralKeywords
    : fallbackViralKeywords(caption, keyword);

  return NextResponse.json({
    keyword: keyword || null,
    viralKeywords,
    aiProvider: aiResult?.provider,
    aiError: aiResult ? undefined : 'AI unavailable — served heuristic fallback',
  });
}
