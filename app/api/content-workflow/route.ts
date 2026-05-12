export const dynamic = 'force-dynamic';
export const maxDuration = 45;

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { videoTitle?: string; niche?: string; targetAudience?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { videoTitle, niche, targetAudience } = body;
  if (!videoTitle?.trim()) {
    return NextResponse.json({ error: 'Video title is required.' }, { status: 400 });
  }

  const prompt = `You are a YouTube content strategist. Generate a complete content package for this video in one shot.

Video Title: ${videoTitle}
Niche: ${niche || 'General YouTube'}
Target Audience: ${targetAudience || 'YouTube viewers'}

Return a JSON object with EXACTLY this structure:
{
  "titles": [
    "Optimized title option 1 — high CTR",
    "Optimized title option 2",
    "Optimized title option 3",
    "Optimized title option 4",
    "Optimized title option 5"
  ],
  "hook": "Powerful opening line for the video (first 5 seconds)",
  "description": "Full SEO-optimized YouTube description (200-300 words) with keywords, timestamps placeholder, and CTA",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
  "thumbnailIdeas": [
    "Thumbnail concept 1 — describe text overlay, colors, face expression, background",
    "Thumbnail concept 2",
    "Thumbnail concept 3"
  ],
  "cta": "Specific CTA to use at the end of the video",
  "chapterTimestamps": [
    "0:00 - Introduction",
    "1:30 - <relevant chapter>",
    "3:00 - <relevant chapter>",
    "5:30 - <relevant chapter>",
    "8:00 - <relevant chapter>",
    "10:00 - Conclusion"
  ],
  "communityPost": "Ready-to-post YouTube Community tab post to promote this video (150 words max, engaging, includes a question for comments)",
  "shortsAngle": "Best angle to clip from this video for a YouTube Short — describe the moment and why it works"
}

Make everything specific, creator-native, and immediately usable. No generic filler.`;

  const result = await routeAI({ prompt, maxTokens: 1500, temperature: 0.7 });
  if (!result.text) return NextResponse.json({ error: 'AI generation failed. Please retry.' }, { status: 500 });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const data = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1'));
    return NextResponse.json({ data, provider: result.provider });
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response. Please retry.' }, { status: 500 });
  }
}
