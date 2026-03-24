export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

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
  if (hasSubscribe) return 'Subscribe and turn on notifications so you don’t miss the next one.';
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
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json().catch(() => ({}));
    const description = (body.description as string)?.trim() || '';
    const keywordsStr = (body.keywords as string) || '';
    const keywords = keywordsStr.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);

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
