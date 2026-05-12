export const dynamic = 'force-dynamic';
export const maxDuration = 45;

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { videoTitle?: string; niche?: string; targetAudience?: string; videoType?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { videoTitle, niche, targetAudience, videoType } = body;
  if (!videoTitle?.trim()) {
    return NextResponse.json({ error: 'Video title is required.' }, { status: 400 });
  }

  const prompt = `You are a YouTube content strategist who has helped channels grow from 0 to 1M subscribers. Generate a complete, publish-ready content package for this video.

Video Title: ${videoTitle}
Niche: ${niche || 'General YouTube'}
Target Audience: ${targetAudience || 'YouTube viewers'}
Video Type: ${videoType || 'general'}

Return a JSON object with EXACTLY this structure:
{
  "titles": [
    "Optimized title option 1 — high CTR, uses power words",
    "Optimized title option 2 — curiosity gap angle",
    "Optimized title option 3 — listicle or number-driven",
    "Optimized title option 4 — search-optimized long-tail",
    "Optimized title option 5 — bold claim or controversy angle"
  ],
  "hook": "Powerful opening line for the video (first 5 seconds) — must create immediate pattern interrupt",
  "description": "Full SEO-optimized YouTube description (200-300 words) with keywords naturally woven in, timestamps placeholder, links section, and strong CTA",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12"],
  "thumbnailIdeas": [
    "Thumbnail concept 1 — describe exact text overlay (3 words max), face expression, background color/scene, contrast strategy",
    "Thumbnail concept 2 — different visual angle",
    "Thumbnail concept 3 — minimal/text-heavy alternative"
  ],
  "cta": "Specific CTA to use at the end of the video — make it feel natural not salesy",
  "chapterTimestamps": [
    "0:00 - Introduction",
    "1:30 - <relevant chapter>",
    "3:00 - <relevant chapter>",
    "5:30 - <relevant chapter>",
    "8:00 - <relevant chapter>",
    "10:00 - Conclusion"
  ],
  "communityPost": "Ready-to-post YouTube Community tab post to promote this video (150 words max, engaging, ends with a direct question to drive comments)",
  "shortsAngle": "Best moment to clip as a YouTube Short — describe the exact timestamp range, what happens, and the hook line to open it with",
  "seoKeywords": [
    "primary keyword phrase 1",
    "primary keyword phrase 2",
    "primary keyword phrase 3",
    "long-tail keyword 4",
    "long-tail keyword 5"
  ],
  "commentBait": "Specific question to ask viewers at the 2/3 mark of the video to drive comments — make it personal, easy to answer, and related to the content",
  "publishingStrategy": {
    "bestDayToPost": "<day of week and reasoning based on niche, e.g. 'Tuesday — tech audiences peak mid-week'>",
    "bestTimeToPost": "<time in EST with reasoning, e.g. '2pm EST — catches US lunch + European evening'>",
    "crossPlatformPlan": "<specific actions for Instagram Reels, TikTok, Twitter/X, and LinkedIn if relevant — one sentence each>"
  },
  "abTitles": [
    {
      "a": "Title variant A — more curiosity-driven",
      "b": "Title variant B — more direct/benefit-driven",
      "hypothesis": "one sentence on which will win and why based on audience psychology"
    },
    {
      "a": "Title variant A2 — emotional angle",
      "b": "Title variant B2 — data/proof angle",
      "hypothesis": "one sentence hypothesis"
    }
  ]
}

Make everything specific, creator-native, and immediately usable. Tailor to the video type (${videoType || 'general'}). No generic filler — every field should feel written for THIS video.`;

  const result = await routeAI({ prompt, maxTokens: 1800, temperature: 0.7 });
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
