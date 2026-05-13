export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { routeAI } from '@/lib/ai-router';

const YT_KEY = process.env.YOUTUBE_API_KEY;

function formatCount(n: string | number): string {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return String(num);
}

function calcPostingCadence(dates: string[]): string {
  if (dates.length < 2) return 'Unknown';
  const sorted = dates.map(d => new Date(d).getTime()).sort((a, b) => b - a);
  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    gaps.push((sorted[i] - sorted[i + 1]) / (1000 * 60 * 60 * 24));
  }
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avg <= 2) return 'Daily';
  if (avg <= 4) return '2-3x per week';
  if (avg <= 8) return '1-2x per week';
  if (avg <= 16) return 'Weekly';
  if (avg <= 35) return 'Bi-weekly';
  return 'Monthly';
}

async function fetchChannelData(channelName: string) {
  if (!YT_KEY) return null;
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelName)}&maxResults=1&key=${YT_KEY}`
    );
    const searchData = await searchRes.json();
    const channelId = searchData.items?.[0]?.snippet?.channelId || searchData.items?.[0]?.id?.channelId;
    if (!channelId) return null;

    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${YT_KEY}`
    );
    const statsData = await statsRes.json();
    const channel = statsData.items?.[0];
    if (!channel) return null;

    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=10&key=${YT_KEY}`
    );
    const videosData = await videosRes.json();
    const videoIds = videosData.items?.map((v: any) => v.id?.videoId).filter(Boolean).join(',');

    let videoStats: any[] = [];
    if (videoIds) {
      const vstatsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${YT_KEY}`
      );
      const vstatsData = await vstatsRes.json();
      videoStats = vstatsData.items || [];
    }

    const subs = Number(channel.statistics?.subscriberCount || 1);
    const recentVideos = (videosData.items || []).map((v: any) => {
      const stats = videoStats.find((s: any) => s.id === v.id?.videoId);
      const views = Number(stats?.statistics?.viewCount || 0);
      const likes = Number(stats?.statistics?.likeCount || 0);
      const performanceRatio = subs > 0 ? Math.round((views / subs) * 100) : 0;
      const engagementRate = views > 0 ? ((likes / views) * 100).toFixed(1) : '0';
      return {
        videoId: v.id?.videoId,
        title: v.snippet?.title,
        publishedAt: v.snippet?.publishedAt,
        thumbnail: v.snippet?.thumbnails?.medium?.url,
        viewCount: stats?.statistics?.viewCount || '0',
        likeCount: stats?.statistics?.likeCount || '0',
        commentCount: stats?.statistics?.commentCount || '0',
        performanceRatio,
        engagementRate,
      };
    });

    const totalLikes = recentVideos.reduce((s: number, v: any) => s + Number(v.likeCount), 0);
    const totalViews = recentVideos.reduce((s: number, v: any) => s + Number(v.viewCount), 0);
    const avgEngagementRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : '0';
    const postingCadence = calcPostingCadence(recentVideos.map((v: any) => v.publishedAt));
    const topVideo = [...recentVideos].sort((a: any, b: any) => b.performanceRatio - a.performanceRatio)[0];

    return {
      channelId,
      title: channel.snippet?.title,
      description: channel.snippet?.description?.slice(0, 400),
      thumbnail: channel.snippet?.thumbnails?.medium?.url,
      subscriberCount: channel.statistics?.subscriberCount || '0',
      viewCount: channel.statistics?.viewCount || '0',
      videoCount: channel.statistics?.videoCount || '0',
      country: channel.snippet?.country || '',
      recentVideos,
      avgEngagementRate,
      postingCadence,
      topVideo,
    };
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { channelName?: string; niche?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { channelName, niche } = body;
  if (!channelName?.trim()) return NextResponse.json({ error: 'Channel name is required.' }, { status: 400 });

  const realData = await fetchChannelData(channelName);

  const realDataContext = realData ? `
REAL YOUTUBE DATA:
- Channel: ${realData.title}
- Subscribers: ${formatCount(realData.subscriberCount)}
- Total Views: ${formatCount(realData.viewCount)}
- Videos: ${realData.videoCount}
- Country: ${realData.country || 'Unknown'}
- Avg Engagement Rate: ${realData.avgEngagementRate}%
- Posting Cadence: ${realData.postingCadence}
- Description: ${realData.description}

RECENT VIDEOS (with performance ratio = views/subs × 100):
${realData.recentVideos.map((v: any, i: number) => `${i+1}. "${v.title}" — ${formatCount(v.viewCount)} views, ${v.engagementRate}% engagement, perf ratio: ${v.performanceRatio}% (${new Date(v.publishedAt).toLocaleDateString()})`).join('\n')}

TOP PERFORMING VIDEO: "${realData.topVideo?.title}" with ${realData.topVideo?.performanceRatio}% performance ratio
` : `Channel: ${channelName}\nNiche: ${niche || 'General YouTube'}\n(Estimate based on niche knowledge)`;

  const prompt = `You are a YouTube competitive intelligence expert. Perform deep analysis of this channel.

${realDataContext}
Niche: ${niche || 'General YouTube'}

Return a JSON object with EXACTLY this structure:
{
  "channelSummary": "2-3 sentence positioning and strategy summary",
  "growthVelocity": "high|medium|low",
  "estimatedMonthlyViews": "<number like '2.1M'>",
  "spyScore": <number 0-100, how dangerous competitor they are>,
  "threatLevel": "high|medium|low",
  "contentPillars": ["pillar 1", "pillar 2", "pillar 3", "pillar 4"],
  "titleFormula": "Exact formula they use e.g. 'Number + Superlative + Noun' or 'I Did X for Y Days' with example",
  "topFormats": [
    { "format": "specific format", "avgViews": "<views>", "whyItWorks": "reason" },
    { "format": "format 2", "avgViews": "<views>", "whyItWorks": "reason" },
    { "format": "format 3", "avgViews": "<views>", "whyItWorks": "reason" }
  ],
  "hookStyles": ["Hook style 1 — be specific", "Hook style 2", "Hook style 3"],
  "thumbnailPatterns": ["Thumbnail formula 1 — text, colors, faces", "Formula 2"],
  "postingFrequency": "<cadence>",
  "viralTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
  "audienceInsights": "Who watches, demographics, why they stay loyal",
  "weaknesses": ["Specific exploitable gap 1", "Weakness 2", "Weakness 3"],
  "opportunitiesToBeat": ["Actionable opportunity 1", "Opportunity 2", "Opportunity 3"],
  "stealableIdeas": [
    "Specific video idea you can make better than theirs right now",
    "Idea 2 — be specific with angle",
    "Idea 3",
    "Idea 4",
    "Idea 5"
  ],
  "titleTemplates": [
    "Fill-in-blank template 1 based on their style e.g. '[Number] [Adjective] [Topic] That Will [Benefit]'",
    "Template 2",
    "Template 3"
  ],
  "monetizationHints": "How they likely monetize — sponsorships, courses, affiliate, AdSense, merch etc."
}

Be specific and data-driven. Reference actual video titles and numbers.`;

  const result = await routeAI({ prompt, maxTokens: 1600, temperature: 0.6 });
  if (!result.text) return NextResponse.json({ error: 'AI analysis failed. Please retry.' }, { status: 500 });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const aiAnalysis = JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1'));

    const formattedRealData = realData ? {
      ...realData,
      subscriberCount: formatCount(realData.subscriberCount),
      viewCount: formatCount(realData.viewCount),
    } : null;

    return NextResponse.json({ realData: formattedRealData, aiAnalysis, provider: result.provider });
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response. Please retry.' }, { status: 500 });
  }
}
