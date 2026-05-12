export const dynamic = 'force-dynamic';
export const maxDuration = 45;

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { videoTitle?: string; videoDescription?: string; videoDuration?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { videoTitle, videoDescription, videoDuration } = body;
  if (!videoTitle?.trim()) {
    return NextResponse.json({ error: 'Video title is required.' }, { status: 400 });
  }

  const prompt = `You are a YouTube retention expert. Analyze this video and predict viewer drop-off and retention behavior.

Video Title: ${videoTitle}
Duration: ${videoDuration || 'Unknown'}
Description: ${videoDescription ? videoDescription.slice(0, 400) : 'Not provided'}

Return a JSON object with EXACTLY this structure:
{
  "overallRetentionScore": <number 0-100>,
  "avgViewDuration": "<e.g. 3:42>",
  "retentionCurve": [
    { "timePercent": 0, "retentionPercent": 100 },
    { "timePercent": 10, "retentionPercent": <number> },
    { "timePercent": 20, "retentionPercent": <number> },
    { "timePercent": 30, "retentionPercent": <number> },
    { "timePercent": 40, "retentionPercent": <number> },
    { "timePercent": 50, "retentionPercent": <number> },
    { "timePercent": 60, "retentionPercent": <number> },
    { "timePercent": 70, "retentionPercent": <number> },
    { "timePercent": 80, "retentionPercent": <number> },
    { "timePercent": 90, "retentionPercent": <number> },
    { "timePercent": 100, "retentionPercent": <number> }
  ],
  "dropOffPoints": [
    { "timePercent": <number>, "reason": "specific reason viewers leave here", "severity": "high|medium|low" }
  ],
  "boringSegments": [
    { "start": "<timestamp>", "end": "<timestamp>", "issue": "specific pacing/content issue" }
  ],
  "pacingScore": <number 0-100>,
  "emotionalEngagementScore": <number 0-100>,
  "attentionPrediction": "high|medium|low",
  "fixes": [
    "Specific fix to improve retention at drop-off point 1",
    "Specific fix 2",
    "Specific fix 3"
  ]
}

Be realistic. Most YouTube videos lose 30-50% of viewers in the first 30 seconds. Make the retention curve believable based on the title and content type.`;

  const result = await routeAI({ prompt, maxTokens: 1000, temperature: 0.6 });
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
