export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

// ─────────────────────────────────────
// Hardcoded fallback
// ─────────────────────────────────────
function extractBases(title: string, keyword: string): string[] {
  const titleWords = (title || '').toLowerCase().trim().split(/\s+/).filter((w) => w.length > 1);
  const keywordWords = (keyword || '').toLowerCase().trim().split(/[,;\s]+/).map((k) => k.trim()).filter(Boolean);
  const bases: string[] = [];
  if (titleWords.length >= 2) bases.push(titleWords.slice(0, 2).join(' '));
  if (titleWords.length >= 1) bases.push(titleWords[0]);
  keywordWords.forEach((kw) => {
    const w = kw.split(/\s+/).slice(0, 2).join(' ');
    if (w && !bases.includes(w)) bases.push(w);
  });
  if (bases.length === 0) bases.push('viral', 'facebook', 'trending');
  return [...new Set(bases)];
}

function fallbackViralKeywords(title: string, keyword: string): { keyword: string; viralScore: number }[] {
  const bases = extractBases(title, keyword);
  const suffixes = [' tips', ' viral', ' reels', ' 2025', ' growth', ' strategy', ' hack', ' guide', ' trending', ' content', ' facebook'];
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
  title: string,
  keyword: string,
): Promise<{ viralKeywords: { keyword: string; viralScore: number }[]; provider: string } | null> {
  const year = new Date().getFullYear();
  const prompt = `You are a Facebook SEO + viral content researcher. Generate 50 search-friendly viral keywords/phrases for the topic below.

Title / topic: "${title || 'general content'}"
Seed keyword: "${keyword || '(none)'}"
Year: ${year}

Keyword mix rules:
- 15 broad high-volume (single or two-word, generic facebook viral terms)
- 15 long-tail (3-5 word search phrases, specific intent)
- 10 question-style ("how to", "best", "why", "kya hai", etc.)
- 10 trending/year-tagged (with ${year}, "latest", "new", "now")
- Include Hinglish variants when topic suggests Indian audience.
- Avoid duplicates and pure single-word stop-words.

Return ONLY this JSON (no markdown):
{
  "viralKeywords": [
    { "keyword": "facebook viral tips ${year}", "viralScore": 0-100 },
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
      cacheKey: `fb-kw:${title}:${keyword}`.toLowerCase(),
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
  const title = (searchParams.get('title') || '').trim();

  const aiResult = await getAIKeywords(title, keyword);
  const viralKeywords = aiResult?.viralKeywords?.length
    ? aiResult.viralKeywords
    : fallbackViralKeywords(title, keyword);

  return NextResponse.json({
    keyword: keyword || null,
    viralKeywords,
    aiProvider: aiResult?.provider,
    aiError: aiResult ? undefined : 'AI unavailable — served heuristic fallback',
  });
}
