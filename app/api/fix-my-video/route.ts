export const dynamic = 'force-dynamic';
export const maxDuration = 45;

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { videoTitle?: string; videoUrl?: string; thumbnailUrl?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { videoTitle, videoUrl, thumbnailUrl, description } = body;
  if (!videoTitle?.trim() && !videoUrl?.trim()) {
    return NextResponse.json({ error: 'Provide at least a video title or URL.' }, { status: 400 });
  }

  const prompt = `You are a world-class YouTube growth expert. A creator has shared an underperforming video for diagnosis.

Video Title: ${videoTitle || 'Not provided'}
Video URL: ${videoUrl || 'Not provided'}
Description snippet: ${description ? description.slice(0, 300) : 'Not provided'}
Thumbnail URL: ${thumbnailUrl || 'Not provided'}

Analyze this video and return a JSON diagnosis with EXACTLY this structure:
{
  "overallDiagnosis": "2-3 sentence summary of why this video underperformed",
  "viralPotentialScore": <number 0-100>,
  "issues": [
    {
      "area": "Title",
      "severity": "high|medium|low",
      "problem": "specific problem description",
      "fix": "exact actionable fix"
    },
    {
      "area": "Thumbnail",
      "severity": "high|medium|low",
      "problem": "specific problem description",
      "fix": "exact actionable fix"
    },
    {
      "area": "Hook",
      "severity": "high|medium|low",
      "problem": "specific problem description",
      "fix": "exact actionable fix"
    },
    {
      "area": "SEO & Keywords",
      "severity": "high|medium|low",
      "problem": "specific problem description",
      "fix": "exact actionable fix"
    }
  ],
  "betterTitles": [
    "Rewritten title option 1",
    "Rewritten title option 2",
    "Rewritten title option 3"
  ],
  "betterHook": "Rewritten opening line / hook for this video",
  "actionPlan": [
    "Step 1: most impactful change to make right now",
    "Step 2: next change",
    "Step 3: next change"
  ]
}

Be specific, honest, and creator-native in your language. Focus on views, CTR, retention, and viral potential.`;

  const result = await routeAI({ prompt, maxTokens: 1200, temperature: 0.7 });

  if (!result.text) {
    return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 500 });
  }

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const diagnosis = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1'));
    return NextResponse.json({ diagnosis, provider: result.provider });
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response. Please retry.' }, { status: 500 });
  }
}
