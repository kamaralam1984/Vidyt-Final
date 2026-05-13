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

  const prompt = `You are a YouTube hook expert who has studied thousands of viral video openings and deeply understands viewer psychology, pattern interrupts, and attention mechanics. Analyze this hook with surgical precision.

Video Title: ${videoTitle || 'Not provided'}
Hook (first 30 seconds script): ${hookText.slice(0, 600)}
Target Audience: ${targetAudience || 'General YouTube viewers'}

Return a JSON object with EXACTLY this structure:
{
  "hookScore": <number 0-100>,
  "hookType": "<one of: Question Hook|Shocking Statement|Story Hook|Controversy Hook|How-To Hook|Social Proof Hook|Challenge Hook|Curiosity Gap Hook>",
  "hookFormula": "<name the formula this hook uses, e.g. 'Problem-Agitate-Solution', 'Curiosity Gap', 'Social Proof + Stakes', 'Pattern Interrupt + Payoff', 'Bold Claim + Proof', 'Relatability + Twist'>",
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
  "retentionBySecond": [
    { "second": 0, "retention": 100 },
    { "second": 5, "retention": <number, predicted % of viewers still watching at 5s> },
    { "second": 10, "retention": <number> },
    { "second": 15, "retention": <number> },
    { "second": 20, "retention": <number> },
    { "second": 30, "retention": <number> }
  ],
  "viralComparisons": [
    { "creator": "<real YouTuber name>", "example": "<brief description of their hook style or specific video type>", "whyItWorks": "<1 sentence on the psychological mechanism>" },
    { "creator": "<real YouTuber name>", "example": "<brief description>", "whyItWorks": "<1 sentence>" }
  ],
  "retentionRisk": "high|medium|low",
  "improvements": [
    "Specific improvement 1",
    "Specific improvement 2",
    "Specific improvement 3"
  ]
}

Be brutally honest. 80% of creators lose viewers in the first 15 seconds. A hook that scores below 60 will cost the algorithm ranking. retentionBySecond must be realistic — the sharpest drop is usually between 0-10s.`;

  const result = await routeAI({ prompt, maxTokens: 2000, temperature: 0.5 });
  if (!result.text) return NextResponse.json({ error: 'AI analysis failed. Please retry.' }, { status: 500 });

  try {
    const stripped = result.text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const data = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Non-object response');
    return NextResponse.json({ data, provider: result.provider });
  } catch (e: any) {
    console.error('[hook-analyzer] parse error:', e?.message, '| snippet:', result.text?.slice(0, 300));
    return NextResponse.json({ error: 'Failed to parse AI response. Please retry.' }, { status: 500 });
  }
}
