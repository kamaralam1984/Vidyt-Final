export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { denyIfNoFeature } from '@/lib/assertUserFeature';
import { routeAI } from '@/lib/ai-router';

function generateCommentHook(description: string, keywords: string[]): string {
  const kw = keywords[0]?.trim() || 'your niche';
  const hooks = [
    `Comment your biggest YouTube struggle.`,
    `What topic should I cover next? Comment below.`,
    `Drop a "👍" if you want more videos like this.`,
    `Comment "YES" if you agree.`,
    `What's your #1 question about ${kw}? Let me know below.`,
  ];
  const idx = Math.abs(description.length + keywords.length) % hooks.length;
  return hooks[idx];
}

function generateAudienceQuestion(description: string, keywords: string[]): string {
  const kw = keywords[0]?.trim() || 'this';
  const questions = [
    `What do you think about ${kw}?`,
    `Have you tried this? What was your experience?`,
    `Which tip will you try first?`,
    `What would you add to this list?`,
  ];
  const idx = Math.abs(description.length) % questions.length;
  return questions[idx];
}

function generateCTA(description: string): string {
  const hasSubscribe = /subscrib|follow|channel/i.test(description);
  const hasLike = /like|thumbs/i.test(description);
  if (hasSubscribe && hasLike) return 'Subscribe and hit the bell for more. Like if this helped.';
  if (hasSubscribe) return 'Subscribe and turn on notifications so you don't miss the next one.';
  if (hasLike) return 'Like this video if you found it useful.';
  return 'Subscribe for more. Like and comment—it helps the channel.';
}

function predictEngagementRate(description: string, keywords: string[]): number {
  let s = 45;
  if (description?.length > 100) s += 10;
  if (description?.length > 300) s += 5;
  if (keywords?.length >= 3) s += 8;
  if (/comment|question|what do you|tell me/i.test(description || '')) s += 12;
  return Math.min(95, Math.round(s));
}

export async function POST(request: NextRequest) {
  const denied = await denyIfNoFeature(request, 'viral_optimizer');
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    const description = (body.description as string)?.trim() || '';
    const keywordsStr = (body.keywords as string) || '';
    const keywords = keywordsStr.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);

    // -- Layer 1: AI (Paid -> Free -> fallback) --
    if (description || keywords.length) {
      try {
        const aiRes = await routeAI({
          prompt: `You are a YouTube engagement expert. Analyze and return ONLY valid JSON.
Keywords: ${keywords.slice(0, 8).join(', ')}
Description (first 300 chars): "${description.slice(0, 300)}"

Return JSON:
{
  "commentHook": "<a short engaging comment prompt for viewers>",
  "audienceQuestion": "<one specific question to spark discussion>",
  "callToAction": "<subscribe/like/comment CTA>",
  "engagementRate": <integer 5-95>
}`,
          cacheKey: `engagement:${keywords.join(',')}:${description.slice(0, 60)}`.slice(0, 120),
          cacheTtlSec: 600,
          timeoutMs: 15000,
          fallbackText: '',
        });
        if (aiRes.provider !== 'fallback' && aiRes.text) {
          const d = aiRes.parseJson() as any;
          if (d?.commentHook && d?.engagementRate) {
            return NextResponse.json({
              commentHook: d.commentHook,
              audienceQuestion: d.audienceQuestion || '',
              callToAction: d.callToAction || '',
              engagementRate: Math.min(99, Math.max(5, Number(d.engagementRate))),
              _provider: aiRes.provider,
            });
          }
        }
      } catch { /* fall through */ }
    }

    // -- Layer 2: Backend heuristics --
    const commentHook = generateCommentHook(description, keywords);
    const audienceQuestion = generateAudienceQuestion(description, keywords);
    const callToAction = generateCTA(description);
    const engagementRate = predictEngagementRate(description, keywords);

    return NextResponse.json({
      commentHook,
      audienceQuestion,
      callToAction,
      engagementRate: Math.min(99, Math.max(5, engagementRate)),
    });
  } catch (e) {
    console.error('Engagement API error:', e);
    return NextResponse.json(
      {
        commentHook: 'Comment your biggest YouTube struggle.',
        audienceQuestion: 'What do you think about this?',
        callToAction: 'Subscribe for more. Like and comment.',
        engagementRate: 50,
      },
      { status: 500 }
    );
  }
}
