export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoFeature } from '@/lib/assertUserFeature';
import { routeAI } from '@/lib/ai-router';

function scoreTitleForCtr(t: string): number {
  if (!t?.trim()) return 5;
  const s = t.trim();
  let score = 5;
  if (/\d+/.test(s)) score += 1.2;
  if (/\?|how|what|why|when|which/i.test(s)) score += 1.5;
  if (/[\[\(]/.test(s)) score += 0.8;
  const len = Math.min(60, s.length);
  score += Math.min(2, len / 30);
  return Math.min(14, Math.round(score * 10) / 10);
}

function generateTitles(title: string, keywords: string[]): { title: string; predictedCtr: number }[] {
  const base = title.trim() || 'Your Video';
  const kw = keywords.slice(0, 5);
  const year = new Date().getFullYear();
  const templates = [
    base,
    `How to ${base} (${year})`,
    `${base} | Step by Step`,
    `The Ultimate Guide to ${base}`,
    `${base} - Tips That Actually Work`,
  ];
  const withKw = kw[0] ? [
    `${base} - ${kw[0]}`,
    `Best ${kw[0]} Tips: ${base}`,
  ] : [];
  const all = [...templates, ...withKw].slice(0, 5);
  return all.map((t) => {
    const full = t.length > 100 ? t.slice(0, 97) + '...' : t;
    const predictedCtr = scoreTitleForCtr(full);
    return { title: full, predictedCtr };
  }).sort((a, b) => b.predictedCtr - a.predictedCtr);
}

export async function POST(request: NextRequest) {
  const denied = await denyIfNoFeature(request, 'viral_optimizer');
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    const title = (body.title as string)?.trim() || '';
    const keywordsStr = (body.keywords as string) || '';
    const keywords = keywordsStr.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);

    // -- Layer 1: AI (Paid -> Free -> fallback) --
    if (title) {
      try {
        const year = new Date().getFullYear();
        const aiRes = await routeAI({
          prompt: `You are a YouTube title optimization expert. Generate 5 high-CTR title variants. Return ONLY valid JSON.
Original title: "${title}"
Keywords: ${keywords.slice(0, 5).join(', ')}
Year: ${year}

Return JSON:
{
  "titles": [
    {"title": "<variant1>", "predictedCtr": <4.0-14.0>, "recommended": true},
    {"title": "<variant2>", "predictedCtr": <4.0-14.0>, "recommended": false},
    {"title": "<variant3>", "predictedCtr": <4.0-14.0>, "recommended": false},
    {"title": "<variant4>", "predictedCtr": <4.0-14.0>, "recommended": false},
    {"title": "<variant5>", "predictedCtr": <4.0-14.0>, "recommended": false}
  ]
}
Rules: use numbers, power words, curiosity gaps, brackets. Best CTR title gets recommended:true.`,
          cacheKey: `titles:${title}:${keywords.join(',')}`.slice(0, 120),
          cacheTtlSec: 600,
          timeoutMs: 20000,
          fallbackText: '',
        });
        if (aiRes.provider !== 'fallback' && aiRes.text) {
          const d = aiRes.parseJson() as any;
          if (Array.isArray(d?.titles) && d.titles.length >= 2) {
            return NextResponse.json({
              titles: d.titles.slice(0, 5).map((t: any, i: number) => ({
                title: String(t.title || '').slice(0, 100),
                predictedCtr: Math.min(14, Math.max(3, Number(t.predictedCtr) || 7)),
                recommended: t.recommended === true || i === 0,
              })),
              _provider: aiRes.provider,
            });
          }
        }
      } catch { /* fall through */ }
    }

    // -- Layer 2: Backend heuristics --
    const titles = generateTitles(title, keywords);
    const recommendedIndex = 0;

    return NextResponse.json({
      titles: titles.map((t, i) => ({
        ...t,
        recommended: i === recommendedIndex,
      })),
    });
  } catch (e) {
    console.error('Title optimizer API error:', e);
    return NextResponse.json(
      { titles: [{ title: 'Your Video', predictedCtr: 7, recommended: true }] },
      { status: 500 }
    );
  }
}
