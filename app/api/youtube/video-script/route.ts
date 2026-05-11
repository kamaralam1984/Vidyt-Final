export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { YoutubeTranscript } from 'youtube-transcript';
import { routeAI } from '@/lib/ai-router';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId')?.trim();
    const title = searchParams.get('title')?.trim() || '';
    const description = searchParams.get('description')?.trim() || '';

    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    // Layer 1: Fetch real transcript from YouTube captions
    try {
      const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'hi' })
        .catch(() => YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }))
        .catch(() => YoutubeTranscript.fetchTranscript(videoId));

      if (items && items.length > 0) {
        const transcript = items.map((i) => i.text).join(' ').replace(/\s+/g, ' ').trim();
        return NextResponse.json({
          script: transcript,
          source: 'transcript',
          wordCount: transcript.split(/\s+/).length,
        });
      }
    } catch { /* no captions, fall through */ }

    // Layer 2: AI-generated script from title + description
    if (title || description) {
      try {
        const aiRes = await routeAI({
          prompt: `You are a YouTube content expert. Based on this video's metadata, write the likely script/content outline in detail.

Title: "${title}"
Description: "${description.slice(0, 400)}"

Write a detailed script/content breakdown (400-600 words) covering:
1. Likely hook/intro (first 30 seconds)
2. Main content points covered
3. Key talking points and transitions
4. Likely outro/CTA

Write in a natural, conversational tone matching the video topic. Do NOT include section labels like "1." or "Hook:" — write flowing prose as if it's the actual script.`,
          cacheKey: `script:${videoId}`,
          cacheTtlSec: 3600,
          timeoutMs: 20000,
          fallbackText: '',
        });

        if (aiRes.provider !== 'fallback' && aiRes.text) {
          return NextResponse.json({
            script: aiRes.text.trim(),
            source: 'ai',
            wordCount: aiRes.text.trim().split(/\s+/).length,
          });
        }
      } catch { /* fall through */ }
    }

    return NextResponse.json({
      script: 'No transcript or captions available for this video. Enable auto-captions on YouTube or add manual captions to see the script here.',
      source: 'none',
      wordCount: 0,
    });
  } catch (e: any) {
    console.error('video-script error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch script' }, { status: 500 });
  }
}
