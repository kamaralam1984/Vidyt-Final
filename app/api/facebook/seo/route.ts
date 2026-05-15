export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

// ─────────────────────────────────────
// Deterministic heuristic scoring (fast, stable)
// ─────────────────────────────────────
function scoreTitleLength(title: string): number {
  const len = (title || '').trim().length;
  if (len >= 30 && len <= 100) return 100;
  if (len >= 20 && len < 30) return 85;
  if (len > 100 && len <= 150) return 75;
  if (len >= 10 && len < 20) return 70;
  if (len < 10) return 40;
  return 50;
}

function scoreKeywordUsage(title: string, description: string, keywords: string[]): number {
  const combined = `${(title || '').toLowerCase()} ${(description || '').toLowerCase()}`;
  if (keywords.length === 0) return 50;
  let matches = 0;
  for (const kw of keywords) {
    const term = kw.toLowerCase().trim();
    if (!term) continue;
    if (combined.includes(term)) matches++;
  }
  const ratio = keywords.length > 0 ? matches / Math.min(keywords.length, 10) : 0;
  return Math.min(100, Math.round(50 + ratio * 50));
}

function scoreDescription(description: string): number {
  const len = (description || '').trim().length;
  if (len >= 150 && len <= 500) return 100;
  if (len >= 80 && len < 150) return 85;
  if (len >= 30 && len < 80) return 70;
  if (len < 30) return 50;
  return 90;
}

// ─────────────────────────────────────
// AI-driven improvement suggestions (tight 6s timeout — never blocks UI long)
// ─────────────────────────────────────
async function getAISuggestions(
  title: string,
  description: string,
  keywords: string[],
  scores: { titleScore: number; keywordScore: number; descScore: number; seoScore: number },
): Promise<{ suggestions: string[]; predictedCtr: string; engagementPotential: string; provider: string } | null> {
  const prompt = `You are a Facebook SEO + growth analyst. Audit this draft post and return short actionable feedback.

Title: "${title}"  (heuristic score: ${scores.titleScore}/100)
Description: "${(description || '').slice(0, 600)}"  (heuristic score: ${scores.descScore}/100)
Keywords used: ${keywords.length ? keywords.join(', ') : '(none)'}  (heuristic score: ${scores.keywordScore}/100)
Composite SEO score: ${scores.seoScore}/100

Return ONLY this JSON (no markdown):
{
  "suggestions": [
    "Specific, actionable line — what to change and why (max 140 chars each).",
    ... 4-6 items prioritised by biggest score gap
  ],
  "predictedCtr": "X-Y%",
  "engagementPotential": "Low | Medium | High | Very High"
}

Rules:
- Each suggestion targets ONE concrete fix (title hook, keyword stuffing, CTA, hashtag mix, length, emoji, etc.).
- Order from highest-impact to lowest.
- predictedCtr: realistic 0.5%-8% range for Facebook based on hook strength + keyword fit.
- engagementPotential: factor in CTA presence, emotional hooks, hashtag-to-text ratio.
- If a score is already ≥85, do not waste a suggestion slot on it.`;

  const parse = (text: string) => {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      const j = JSON.parse(m[0].replace(/,(\s*[}\]])/g, '$1')) as {
        suggestions?: string[];
        predictedCtr?: string;
        engagementPotential?: string;
      };
      const suggestions = Array.isArray(j.suggestions)
        ? j.suggestions.filter((s) => typeof s === 'string' && s.trim().length > 5).slice(0, 6)
        : [];
      if (suggestions.length === 0) return null;
      return {
        suggestions,
        predictedCtr: typeof j.predictedCtr === 'string' ? j.predictedCtr : 'n/a',
        engagementPotential: typeof j.engagementPotential === 'string' ? j.engagementPotential : 'Medium',
      };
    } catch {
      return null;
    }
  };

  try {
    const ai = await routeAI({
      prompt,
      timeoutMs: 6000,
      cacheKey: `fb-seo-suggest:${title}:${(description || '').slice(0, 80)}:${keywords.slice(0, 3).join(',')}`.toLowerCase(),
      cacheTtlSec: 180,
      fallbackText: '{}',
    });
    const parsed = parse(ai.text || '');
    if (!parsed) return null;
    return { ...parsed, provider: ai.provider };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────
// Heuristic fallback suggestions (instant — used when AI off)
// ─────────────────────────────────────
function heuristicSuggestions(
  title: string,
  description: string,
  keywords: string[],
  scores: { titleScore: number; keywordScore: number; descScore: number },
): { suggestions: string[]; predictedCtr: string; engagementPotential: string } {
  const out: string[] = [];
  if (scores.titleScore < 80) {
    const len = (title || '').trim().length;
    if (len < 20) out.push(`Title too short (${len} chars) — aim for 30-100 chars with a clear hook and primary keyword.`);
    else if (len > 100) out.push(`Title too long (${len} chars) — trim to 100 chars; Facebook truncates beyond this on mobile.`);
  }
  if (scores.keywordScore < 70) {
    out.push(`Keyword coverage is weak — fold your top 2-3 keywords naturally into both title and description.`);
  }
  if (scores.descScore < 80) {
    const len = (description || '').trim().length;
    if (len < 80) out.push(`Description too short (${len} chars) — expand to 150-500 chars; lead with the value, end with a CTA.`);
    else if (len > 500) out.push(`Description verbose (${len} chars) — tighten under 500 chars; readers drop off after first 250.`);
  }
  if (keywords.length < 3) out.push('Add at least 3-5 niche keywords — boosts both reach and the keyword score.');
  if (!/[!?🔥💡✨]/.test(title)) out.push('Add an emoji or stronger punctuation in the title — raises mobile-feed CTR ~15%.');
  if (out.length === 0) out.push('Solid baseline — try A/B-testing two title variants to find the highest CTR hook.');
  return {
    suggestions: out.slice(0, 6),
    predictedCtr: scores.titleScore >= 85 ? '3-5%' : scores.titleScore >= 70 ? '2-3%' : '1-2%',
    engagementPotential: scores.titleScore >= 80 && scores.descScore >= 75 ? 'High' : scores.titleScore >= 60 ? 'Medium' : 'Low',
  };
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || '';
  const description = searchParams.get('description') || '';
  const keywordsParam = searchParams.get('keywords') || '';
  const keywords = keywordsParam.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);

  const titleScore = scoreTitleLength(title);
  const keywordScore = scoreKeywordUsage(title, description, keywords);
  const descScore = scoreDescription(description);
  const thumbnailScore = 70;

  const weights = { title: 0.3, keyword: 0.3, description: 0.3, thumbnail: 0.1 };
  const seoScore = Math.min(100, Math.max(0, Math.round(
    titleScore * weights.title +
    keywordScore * weights.keyword +
    descScore * weights.description +
    thumbnailScore * weights.thumbnail
  )));

  // AI-driven improvement layer (runs in parallel with response shaping)
  const aiPromise = getAISuggestions(title, description, keywords, { titleScore, keywordScore, descScore, seoScore });
  const aiResult = await aiPromise;
  const enrichment = aiResult ?? heuristicSuggestions(title, description, keywords, { titleScore, keywordScore, descScore });

  return NextResponse.json({
    seoScore,
    breakdown: {
      titleLength:  { score: titleScore,     label: title.length <= 100 ? 'Good' : 'Too long' },
      keywordUsage: { score: keywordScore,   label: keywordScore >= 70 ? 'Good' : 'Add keywords' },
      description:  { score: descScore,      label: descScore >= 70 ? 'Good' : 'Expand description' },
      thumbnail:    { score: thumbnailScore, label: 'Default' },
    },
    aiSuggestions: enrichment.suggestions,
    predictedCtr: enrichment.predictedCtr,
    engagementPotential: enrichment.engagementPotential,
    aiProvider: aiResult?.provider,
    aiError: aiResult ? undefined : 'AI unavailable — served heuristic suggestions',
  });
}
