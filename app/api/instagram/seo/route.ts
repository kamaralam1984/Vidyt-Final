export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

// ─────────────────────────────────────
// Deterministic heuristic scoring
// ─────────────────────────────────────
function scoreCaptionLength(caption: string): number {
  const len = (caption || '').trim().length;
  if (len >= 100 && len <= 500) return 100;
  if (len >= 50 && len < 100) return 85;
  if (len >= 30 && len < 50) return 75;
  if (len >= 15 && len < 30) return 65;
  if (len < 15) return 45;
  return 90;
}

function scoreKeywordUsage(caption: string, keywords: string[]): number {
  const lower = (caption || '').toLowerCase();
  if (keywords.length === 0) return 50;
  let matches = 0;
  for (const kw of keywords) {
    if (!kw.trim()) continue;
    if (lower.includes(kw.toLowerCase().trim())) matches++;
  }
  const ratio = matches / Math.min(keywords.length, 10);
  return Math.min(100, Math.round(50 + ratio * 50));
}

// ─────────────────────────────────────
// AI-driven improvement suggestions
// ─────────────────────────────────────
async function getAISuggestions(
  caption: string,
  keywords: string[],
  scores: { captionScore: number; keywordScore: number; seoScore: number },
): Promise<{ suggestions: string[]; predictedCtr: string; engagementPotential: string; provider: string } | null> {
  const prompt = `You are an Instagram SEO + growth analyst. Audit this caption draft and return short actionable feedback.

Caption: "${(caption || '').slice(0, 600)}"  (heuristic score: ${scores.captionScore}/100)
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
- Each suggestion targets ONE concrete fix (caption hook, hashtag mix, CTA, line breaks, emoji density, niche specificity, etc.).
- Order from highest-impact to lowest.
- predictedCtr: realistic 0.8%-12% range for Instagram (Reels typically 4-8%, posts 1-3%, stories 2-5%).
- engagementPotential factors: CTA presence, story-driven opening, line-break readability, hashtag-text ratio.
- If a score is ≥85, skip that area.`;

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
      cacheKey: `ig-seo-suggest:${(caption || '').slice(0, 80)}:${keywords.slice(0, 3).join(',')}`.toLowerCase(),
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
// Heuristic fallback suggestions
// ─────────────────────────────────────
function heuristicSuggestions(
  caption: string,
  keywords: string[],
  scores: { captionScore: number; keywordScore: number },
): { suggestions: string[]; predictedCtr: string; engagementPotential: string } {
  const out: string[] = [];
  const len = (caption || '').trim().length;

  if (scores.captionScore < 80) {
    if (len < 50) out.push(`Caption too short (${len} chars) — Instagram rewards 100-500 char captions with depth. Add context, story, or value bullets.`);
    else if (len > 2200) out.push(`Caption too long (${len} chars) — Instagram cuts off at "more" link around 125 chars. Front-load the hook.`);
  }
  if (scores.keywordScore < 70) {
    out.push('Weave 2-3 niche keywords into the caption (first 125 chars matter most for the preview).');
  }
  if (!/\n/.test(caption)) out.push('Add line breaks every 1-2 sentences — readability on mobile feed jumps and dwell-time grows.');
  if (!/[!?🔥💡✨🎯👇]/.test(caption)) out.push('Add 1-2 strategic emojis (especially 🔥 or 👇 near CTA) — boosts in-feed thumbstop.');
  if (!/comment|share|save|follow|tap|swipe/i.test(caption)) out.push('Missing clear CTA — end with "Save for later", "Tag a friend", or "Comment your take".');
  if (keywords.length < 3) out.push('Provide at least 3 niche keywords — improves the keyword score AND fuels the hashtag/keyword generators.');
  if (out.length === 0) out.push('Solid baseline — A/B test two opening hooks to find the highest thumbstop rate.');

  return {
    suggestions: out.slice(0, 6),
    predictedCtr: scores.captionScore >= 85 ? '4-7%' : scores.captionScore >= 70 ? '2-4%' : '1-2%',
    engagementPotential: scores.captionScore >= 80 && scores.keywordScore >= 75 ? 'High' : scores.captionScore >= 60 ? 'Medium' : 'Low',
  };
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const caption = searchParams.get('caption') || searchParams.get('title') || '';
  const keywordsParam = searchParams.get('keywords') || '';
  const keywords = keywordsParam.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);

  const captionScore = scoreCaptionLength(caption);
  const keywordScore = scoreKeywordUsage(caption, keywords);
  const weights = { caption: 0.5, keyword: 0.5 };
  const seoScore = Math.min(100, Math.max(0, Math.round(captionScore * weights.caption + keywordScore * weights.keyword)));

  const aiResult = await getAISuggestions(caption, keywords, { captionScore, keywordScore, seoScore });
  const enrichment = aiResult ?? heuristicSuggestions(caption, keywords, { captionScore, keywordScore });

  return NextResponse.json({
    seoScore,
    breakdown: {
      captionLength: { score: captionScore, label: caption.length <= 500 ? 'Good' : 'Too long' },
      keywordUsage:  { score: keywordScore,  label: keywordScore >= 70 ? 'Good' : 'Add keywords' },
    },
    aiSuggestions: enrichment.suggestions,
    predictedCtr: enrichment.predictedCtr,
    engagementPotential: enrichment.engagementPotential,
    aiProvider: aiResult?.provider,
    aiError: aiResult ? undefined : 'AI unavailable — served heuristic suggestions',
  });
}
