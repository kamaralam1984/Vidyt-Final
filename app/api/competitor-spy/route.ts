export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

const YT_KEY = process.env.YOUTUBE_API_KEY;

async function fetchChannelData(channelName: string) {
  if (!YT_KEY) return null;
  try {
    // 1. Search for channel
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelName)}&maxResults=1&key=${YT_KEY}`
    );
    const searchData = await searchRes.json();
    const channelId = searchData.items?.[0]?.snippet?.channelId || searchData.items?.[0]?.id?.channelId;
    if (!channelId) return null;

    // 2. Get channel stats
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${YT_KEY}`
    );
    const statsData = await statsRes.json();
    const channel = statsData.items?.[0];
    if (!channel) return null;

    // 3. Get last 10 videos
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=10&key=${YT_KEY}`
    );
    const videosData = await videosRes.json();
    const videoIds = videosData.items?.map((v: any) => v.id?.videoId).filter(Boolean).join(',');

    // 4. Get video stats
    let videoStats: any[] = [];
    if (videoIds) {
      const vstatsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${YT_KEY}`
      );
      const vstatsData = await vstatsRes.json();
      videoStats = vstatsData.items || [];
    }

    const recentVideos = (videosData.items || []).map((v: any) => {
      const stats = videoStats.find((s: any) => s.id === v.id?.videoId);
      return {
        videoId: v.id?.videoId,
        title: v.snippet?.title,
        publishedAt: v.snippet?.publishedAt,
        thumbnail: v.snippet?.thumbnails?.medium?.url,
        viewCount: stats?.statistics?.viewCount || '0',
        likeCount: stats?.statistics?.likeCount || '0',
        commentCount: stats?.statistics?.commentCount || '0',
      };
    });

    return {
      channelId,
      title: channel.snippet?.title,
      description: channel.snippet?.description?.slice(0, 300),
      thumbnail: channel.snippet?.thumbnails?.medium?.url,
      subscriberCount: channel.statistics?.subscriberCount || '0',
      viewCount: channel.statistics?.viewCount || '0',
      videoCount: channel.statistics?.videoCount || '0',
      country: channel.snippet?.country || '',
      recentVideos,
    };
  } catch {
    return null;
  }
}

function formatCount(n: string | number): string {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return String(num);
}

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

  // Fetch real YouTube data
  const realData = await fetchChannelData(channelName);

  // Build context for AI — include real data if available
  const realDataContext = realData ? `
REAL YOUTUBE DATA (use these exact numbers in your analysis):
- Channel: ${realData.title}
- Subscribers: ${formatCount(realData.subscriberCount)}
- Total Views: ${formatCount(realData.viewCount)}
- Videos: ${realData.videoCount}
- Country: ${realData.country || 'Unknown'}
- Description: ${realData.description}

RECENT VIDEOS (last 10):
${realData.recentVideos.map((v: any, i: number) => `${i+1}. "${v.title}" — ${formatCount(v.viewCount)} views, ${formatCount(v.likeCount)} likes (${new Date(v.publishedAt).toLocaleDateString()})`).join('\n')}
` : `Channel: ${channelName}\nNiche: ${niche || 'General YouTube'}\n(No real data available — estimate based on niche knowledge)`;

  const prompt = `You are a YouTube competitive intelligence expert. Analyze this channel and provide a detailed growth playbook.

${realDataContext}
Niche: ${niche || 'General YouTube'}

Based on the data above, return a JSON object with EXACTLY this structure:
{
  "channelSummary": "2-3 sentence summary of this channel's positioning, content style, and growth strategy",
  "growthVelocity": "high|medium|low",
  "estimatedMonthlyViews": "${realData ? formatCount(Math.round(Number(realData.viewCount) / 12)) + ' (calculated)' : '<estimate>'}",
  "topFormats": [
    { "format": "specific format name based on their real videos", "avgViews": "<views>", "whyItWorks": "specific reason" },
    { "format": "format 2", "avgViews": "<views>", "whyItWorks": "reason" },
    { "format": "format 3", "avgViews": "<views>", "whyItWorks": "reason" }
  ],
  "hookStyles": [
    "Hook style they use (be specific, reference their actual content)",
    "Hook style 2",
    "Hook style 3"
  ],
  "thumbnailPatterns": [
    "Thumbnail formula 1 — be specific about text, faces, colors",
    "Thumbnail formula 2"
  ],
  "postingFrequency": "<estimate based on video dates or general knowledge>",
  "viralTopics": [
    "Specific topic/angle that performs well for them",
    "Topic 2",
    "Topic 3",
    "Topic 4"
  ],
  "audienceInsights": "Who watches, why they stay, demographic profile",
  "weaknesses": [
    "Specific gap or weakness you can exploit",
    "Weakness 2"
  ],
  "opportunitiesToBeat": [
    "Specific, actionable opportunity to outperform them",
    "Opportunity 2",
    "Opportunity 3"
  ]
}

Be specific and data-driven. Reference actual video titles and real numbers where provided.`;

  const result = await routeAI({ prompt, maxTokens: 1400, temperature: 0.6 });
  if (!result.text) return NextResponse.json({ error: 'AI analysis failed. Please retry.' }, { status: 500 });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const aiAnalysis = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1'));
    return NextResponse.json({
      realData: realData ? { ...realData, subscriberCount: formatCount(realData.subscriberCount), viewCount: formatCount(realData.viewCount) } : null,
      aiAnalysis,
      provider: result.provider,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response. Please retry.' }, { status: 500 });
  }
}
