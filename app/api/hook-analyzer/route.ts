export const dynamic = 'force-dynamic';
export const maxDuration = 45;

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { hookText?: string; videoTitle?: string; targetAudience?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { hookText, videoTitle, targetAudience } = body;
  if (!hookText?.trim()) {
    return NextResponse.json({ error: 'Hook text is required.' }, { status: 400 });
  }

  const prompt = `You are a YouTube hook expert who has studied thousands of viral video openings. Analyze this hook ruthlessly.

Video Title: ${videoTitle || 'Not provided'}
Hook (first 30 seconds script): ${hookText.slice(0, 600)}
Target Audience: ${targetAudience || 'General YouTube viewers'}

Return a JSON object with EXACTLY this structure:
{
  "hookScore": <number 0-100>,
  "scores": {
    "pacing": <number 0-100>,
    "energy": <number 0-100>,
    "curiosityGap": <number 0-100>,
    "clarity": <number 0-100>,
    "emotionalPull": <number 0-100>
  },
  "verdict": "one sentence brutal honest verdict on this hook",
  "weakMoments": [
    { "moment": "quote or describe the weak part", "issue": "why this kills retention", "fix": "exact fix" }
  ],
  "strengths": [
    "specific strength 1",
    "specific strength 2"
  ],
  "rewrittenHook": "Complete rewritten version of the hook — same topic but 3-5x stronger. Make it punchy, specific, creates immediate curiosity.",
  "alternativeOpeners": [
    "Alternative opening line 1",
    "Alternative opening line 2",
    "Alternative opening line 3"
  ],
  "retentionRisk": "high|medium|low",
  "improvements": [
    "Specific improvement 1",
    "Specific improvement 2",
    "Specific improvement 3"
  ]
}

Be brutally honest. 80% of creators lose viewers in the first 15 seconds because of a weak hook.`;

  const result = await routeAI({ prompt, maxTokens: 1200, temperature: 0.7 });
  if (!result.text) return NextResponse.json({ error: 'AI analysis failed. Please retry.' }, { status: 500 });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const data = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1'));
    return NextResponse.json({ data, provider: result.provider });
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response. Please retry.' }, { status: 500 });
  }
}
