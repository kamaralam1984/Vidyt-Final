export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

const YT_KEY = process.env.YOUTUBE_API_KEY;

function extractVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '0:00';
  const h = parseInt(m[1] || '0'), min = parseInt(m[2] || '0'), s = parseInt(m[3] || '0');
  if (h > 0) return `${h}:${String(min).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${min}:${String(s).padStart(2,'0')}`;
}

async function fetchVideoData(videoId: string) {
  if (!YT_KEY) return null;
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoId}&key=${YT_KEY}`
    );
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;
    return {
      videoId,
      title: item.snippet?.title,
      channelTitle: item.snippet?.channelTitle,
      publishedAt: item.snippet?.publishedAt,
      description: item.snippet?.description?.slice(0, 300),
      duration: parseDuration(item.contentDetails?.duration || ''),
      viewCount: item.statistics?.viewCount || '0',
      likeCount: item.statistics?.likeCount || '0',
      commentCount: item.statistics?.commentCount || '0',
      thumbnail: item.snippet?.thumbnails?.medium?.url,
    };
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { videoTitle?: string; videoDescription?: string; videoDuration?: string; youtubeUrl?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { videoTitle, videoDescription, videoDuration, youtubeUrl } = body;

  let realVideoData = null;
  let titleForAnalysis = videoTitle;
  let durationForAnalysis = videoDuration;
  let descForAnalysis = videoDescription;

  if (youtubeUrl?.trim()) {
    const videoId = extractVideoId(youtubeUrl);
    if (videoId) {
      realVideoData = await fetchVideoData(videoId);
      if (realVideoData) {
        titleForAnalysis = realVideoData.title;
        durationForAnalysis = realVideoData.duration;
        descForAnalysis = realVideoData.description || '';
      }
    }
  }

  if (!titleForAnalysis?.trim()) {
    return NextResponse.json({ error: 'Video title or YouTube URL is required.' }, { status: 400 });
  }

  const realContext = realVideoData ? `
REAL VIDEO DATA:
- Title: ${realVideoData.title}
- Channel: ${realVideoData.channelTitle}
- Duration: ${realVideoData.duration}
- Views: ${Number(realVideoData.viewCount).toLocaleString()}
- Likes: ${Number(realVideoData.likeCount).toLocaleString()}
- Comments: ${Number(realVideoData.commentCount).toLocaleString()}
- Published: ${new Date(realVideoData.publishedAt).toLocaleDateString()}
` : `Video Title: ${titleForAnalysis}\nDuration: ${durationForAnalysis || 'Unknown'}\nDescription: ${descForAnalysis?.slice(0, 400) || 'Not provided'}`;

  const prompt = `You are a YouTube retention expert with access to millions of viewer behavior data points.

${realContext}

Analyze this video and predict viewer retention behavior. Return a JSON object with EXACTLY this structure:
{
  "overallRetentionScore": <number 0-100>,
  "avgViewDuration": "<e.g. 3:42>",
  "hookStrength": <number 0-100, strength of first 30 seconds>,
  "midVideoEngagement": <number 0-100, predicted engagement at 40-70% mark>,
  "endScreenCTR": <number 5-25, % who likely reach end screen>,
  "bestClipMoment": "<timestamp range most viral clip-worthy, e.g. '2:30-3:45'>",
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
    { "start": "<timestamp>", "end": "<timestamp>", "issue": "specific issue" }
  ],
  "pacingScore": <number 0-100>,
  "emotionalEngagementScore": <number 0-100>,
  "attentionPrediction": "high|medium|low",
  "fixes": [
    "Specific fix 1 with timestamp if applicable",
    "Specific fix 2",
    "Specific fix 3",
    "Specific fix 4"
  ]
}

Be realistic based on the video stats and content type. If views are high relative to subscribers, retention is likely good.`;

  const result = await routeAI({ prompt, maxTokens: 2000, temperature: 0.5 });
  if (!result.text) return NextResponse.json({ error: 'AI analysis failed. Please retry.' }, { status: 500 });

  try {
    // Strip markdown code fences if present
    const stripped = result.text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, '$1');
    const analysis = JSON.parse(cleaned);
    if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) {
      throw new Error('AI returned non-object response');
    }
    return NextResponse.json({ realVideoData, analysis, provider: result.provider });
  } catch (e: any) {
    console.error('[retention-ai] parse error:', e?.message, '| text snippet:', result.text?.slice(0, 400));
    return NextResponse.json({ error: 'Failed to parse AI response. Please retry.' }, { status: 500 });
  }
}
