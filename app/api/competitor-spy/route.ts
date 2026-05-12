export const dynamic = 'force-dynamic';
export const maxDuration = 45;

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { channelName?: string; niche?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { channelName, niche } = body;
  if (!channelName?.trim()) {
    return NextResponse.json({ error: 'Channel name is required.' }, { status: 400 });
  }

  const prompt = `You are a YouTube competitive intelligence expert. Analyze this creator/channel and reveal their growth playbook.

Channel: ${channelName}
Niche: ${niche || 'General YouTube'}

Based on what you know about this type of channel and niche, return a JSON object with EXACTLY this structure:
{
  "channelSummary": "2-sentence summary of this channel's positioning and strategy",
  "growthVelocity": "high|medium|low",
  "estimatedMonthlyViews": "<e.g. 2M-5M>",
  "topFormats": [
    { "format": "format name", "avgViews": "<e.g. 500K>", "whyItWorks": "specific reason" }
  ],
  "hookStyles": [
    "Hook style 1 they use consistently",
    "Hook style 2",
    "Hook style 3"
  ],
  "thumbnailPatterns": [
    "Pattern 1 — describe their thumbnail formula",
    "Pattern 2"
  ],
  "postingFrequency": "<e.g. 2-3 videos/week>",
  "viralTopics": [
    "Topic/angle that works well for them",
    "Topic 2",
    "Topic 3"
  ],
  "audienceInsights": "Who watches this channel and why they stay",
  "weaknesses": [
    "Gap or weakness you could exploit",
    "Weakness 2"
  ],
  "opportunitiesToBeat": [
    "Specific opportunity to outperform them",
    "Opportunity 2",
    "Opportunity 3"
  ]
}

Be specific and creator-native. Focus on actionable intelligence.`;

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
