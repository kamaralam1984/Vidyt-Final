export const dynamic = 'force-dynamic';
export const maxDuration = 45;

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { thumbnailDescription?: string; videoTitle?: string; niche?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { thumbnailDescription, videoTitle, niche } = body;
  if (!thumbnailDescription?.trim() && !videoTitle?.trim()) {
    return NextResponse.json({ error: 'Provide a thumbnail description or video title.' }, { status: 400 });
  }

  const prompt = `You are a world-class YouTube thumbnail CTR expert. Analyze this thumbnail and predict its performance.

Video Title: ${videoTitle || 'Not provided'}
Thumbnail Description: ${thumbnailDescription || 'Not provided'}
Niche: ${niche || 'General YouTube'}

Return a JSON object with EXACTLY this structure:
{
  "overallScore": <number 0-100>,
  "ctrPrediction": "<e.g. 4.2%>",
  "scores": {
    "readability": <number 0-100>,
    "emotionalImpact": <number 0-100>,
    "colorContrast": <number 0-100>,
    "clutterScore": <number 0-100>,
    "curiosityGap": <number 0-100>
  },
  "issues": [
    { "area": "Text Readability|Color Contrast|Emotional Impact|Clutter|Face/Expression|Curiosity Gap", "severity": "high|medium|low", "description": "specific issue" }
  ],
  "strengths": [
    "specific strength 1",
    "specific strength 2"
  ],
  "suggestions": [
    "Specific actionable improvement 1",
    "Specific actionable improvement 2",
    "Specific actionable improvement 3"
  ],
  "improvedVersionIdeas": [
    "Thumbnail concept idea 1 — describe colors, text, face expression, layout",
    "Thumbnail concept idea 2"
  ],
  "competitorBenchmark": "How this thumbnail compares to top performers in this niche"
}

Be honest. Most thumbnails have 2-4 fixable issues. Focus on CTR-boosting changes.`;

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
