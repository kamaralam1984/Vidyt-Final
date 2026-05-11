export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    // Fetch the YouTube watch page to extract caption track URL
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const html = await pageRes.text();

    // Extract ytInitialPlayerResponse JSON
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
    if (!match) return null;

    let playerData: any;
    try { playerData = JSON.parse(match[1]); } catch { return null; }

    const tracks: any[] = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    if (!tracks.length) return null;

    // Prefer Hindi, then English, then first available
    const track =
      tracks.find((t) => t.languageCode === 'hi') ||
      tracks.find((t) => t.languageCode === 'en') ||
      tracks[0];

    if (!track?.baseUrl) return null;

    // Fetch the caption XML
    const captionRes = await fetch(track.baseUrl + '&fmt=json3');
    if (!captionRes.ok) return null;
    const captionData = await captionRes.json();

    const lines: string[] = (captionData?.events || [])
      .filter((e: any) => e.segs)
      .map((e: any) => e.segs.map((s: any) => s.utf8 || '').join(''))
      .filter((t: string) => t.trim() && t !== '\n');

    const transcript = lines.join(' ').replace(/\s+/g, ' ').trim();
    return transcript.length > 20 ? transcript : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId')?.trim();
    const title = searchParams.get('title')?.trim() || '';
    const description = searchParams.get('description')?.trim() || '';

    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    // Layer 1: Real YouTube transcript (no package, direct fetch)
    const transcript = await fetchYouTubeTranscript(videoId);
    if (transcript) {
      return NextResponse.json({
        script: transcript,
        source: 'transcript',
        wordCount: transcript.split(/\s+/).length,
      });
    }

    // Layer 2: AI-generated script from title + description
    if (title || description) {
      try {
        const aiRes = await routeAI({
          prompt: `You are a YouTube content expert. Based on this video's metadata, write the likely script content in detail.

Title: "${title}"
Description: "${description.slice(0, 400)}"

Write a detailed script/content (400-600 words) covering what this video likely contains:
- The hook/intro (first 30 seconds)
- Main content points
- Key talking points and transitions
- Outro/CTA

Write in natural conversational tone as if it is the actual script. No section headers.`,
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
      script: 'No transcript available for this video. Enable auto-captions on YouTube or add manual captions to see the script here.',
      source: 'none',
      wordCount: 0,
    });
  } catch (e: any) {
    console.error('video-script error:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch script' }, { status: 500 });
  }
}
