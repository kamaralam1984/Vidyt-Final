export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getAdvancedChannelAnalytics } from '@/services/youtube/advancedChannelAnalytics';
import { routeAI } from '@/lib/ai-router';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { channelInput, niche } = body;

    if (!channelInput || typeof channelInput !== 'string' || !channelInput.trim()) {
      return NextResponse.json({ success: false, error: 'Channel URL or name is required.' }, { status: 400 });
    }

    // Fetch real YouTube data
    const analytics = await getAdvancedChannelAnalytics(channelInput.trim());
    const info = analytics.channelInfo;
    const stats = info.statistics;
    const perf = analytics.videoPerformance;

    // Calculate upload frequency from recent videos
    const recentVideos = analytics.recentVideos || [];
    let uploadFrequency = 4; // default
    if (recentVideos.length >= 2) {
      const dates = recentVideos.map((v: any) => new Date(v.publishedAt).getTime()).sort((a: number, b: number) => b - a);
      const spanDays = (dates[0] - dates[dates.length - 1]) / (1000 * 60 * 60 * 24);
      if (spanDays > 0) {
        uploadFrequency = Math.round((recentVideos.length / spanDays) * 30 * 10) / 10;
      }
    }

    // Calculate 30-day growth estimate from recent video performance
    const growthPercent30d = perf.averageEngagementRate > 5
      ? Math.min(perf.averageEngagementRate * 0.8, 15)
      : perf.averageEngagementRate > 2
      ? perf.averageEngagementRate * 0.5
      : perf.averageEngagementRate * 0.3;

    // Detect niche via AI if not provided
    let detectedNiche = niche || 'General';
    if (!niche || niche === 'auto' || niche === 'Auto Detect') {
      try {
        const nicheRes = await routeAI({
          prompt: `Based on this YouTube channel's title and description, what is the primary content niche? Choose ONE from: Technology, Gaming, Entertainment, Music, Education, Travel, Food, Fashion, Business, Finance, Health, Sports, Vlogs, News, Comedy, Science, DIY, Automotive, Pets, Fitness.

Channel: "${info.title}"
Description: "${(info.description || '').slice(0, 500)}"
Recent video titles: ${recentVideos.slice(0, 5).map((v: any) => `"${v.title}"`).join(', ')}

Reply with ONLY the niche name, nothing else.`,
          cacheKey: `niche-detect:${info.id}`,
          cacheTtlSec: 3600,
        });
        const nicheText = nicheRes.text.trim().replace(/[^a-zA-Z\s]/g, '').trim();
        if (nicheText && nicheText.length < 30) {
          detectedNiche = nicheText;
        }
      } catch {
        // Fallback: simple keyword detection
        const desc = ((info.description || '') + ' ' + info.title).toLowerCase();
        if (desc.includes('tech') || desc.includes('code') || desc.includes('programming')) detectedNiche = 'Technology';
        else if (desc.includes('game') || desc.includes('gaming') || desc.includes('play')) detectedNiche = 'Gaming';
        else if (desc.includes('music') || desc.includes('song')) detectedNiche = 'Music';
        else if (desc.includes('cook') || desc.includes('food') || desc.includes('recipe')) detectedNiche = 'Food';
        else if (desc.includes('travel') || desc.includes('vlog')) detectedNiche = 'Travel';
        else if (desc.includes('education') || desc.includes('learn') || desc.includes('tutorial')) detectedNiche = 'Education';
        else if (desc.includes('fitness') || desc.includes('health') || desc.includes('workout')) detectedNiche = 'Health';
        else if (desc.includes('business') || desc.includes('finance') || desc.includes('invest')) detectedNiche = 'Finance';
        else detectedNiche = 'Entertainment';
      }
    }

    // Generate AI insights
    let aiInsights = null;
    try {
      const aiRes = await routeAI({
        prompt: `Analyze this YouTube channel and provide actionable insights.

Channel: "${info.title}" (${stats.subscriberCount.toLocaleString()} subs, ${stats.viewCount.toLocaleString()} views, ${stats.videoCount} videos)
Niche: ${detectedNiche}
Avg Views/Video: ${perf.averageViews.toLocaleString()}
Engagement Rate: ${perf.averageEngagementRate.toFixed(2)}%
Upload Frequency: ${uploadFrequency.toFixed(1)} videos/month
Recent Videos Performance: ${recentVideos.slice(0, 5).map((v: any) => `"${v.title}" (${v.views.toLocaleString()} views, ${v.engagementRate}% engagement)`).join('; ')}

Return a JSON object with these keys:
- "strengths": array of 3-5 strings (channel strengths)
- "improvements": array of 3-5 strings (areas to improve)
- "strategy": array of 3-4 strings (content strategy recommendations)
- "postingTime": string (best posting time recommendation)
- "growthTips": array of 3 strings (specific growth tips)

Reply with ONLY valid JSON, no markdown or extra text.`,
        cacheKey: `ci-insights:${info.id}`,
        cacheTtlSec: 600,
      });
      const match = aiRes.text.match(/\{[\s\S]*\}/);
      if (match) {
        aiInsights = JSON.parse(match[0]);
      }
    } catch {
      // AI insights will be generated client-side as fallback
    }

    const channelData = {
      channelId: info.id,
      name: info.title,
      subscribers: stats.subscriberCount,
      totalViews: stats.viewCount,
      totalVideos: stats.videoCount,
      avgViewsPerVideo: perf.averageViews,
      engagementRate: perf.averageEngagementRate / 100, // Convert to decimal
      growthPercent30d: Math.round(growthPercent30d * 100) / 100,
      uploadFrequency,
      niche: detectedNiche,
      thumbnailUrl: info.thumbnails?.high?.url || info.thumbnails?.medium?.url || info.thumbnails?.default?.url || '',
      // Extended data for advanced features
      description: (info.description || '').slice(0, 300),
      bannerUrl: info.bannerUrl || '',
      recentVideos: recentVideos.slice(0, 10),
      aiInsights,
      audit: analytics.audit,
    };

    return NextResponse.json({ success: true, channelData });
  } catch (e: any) {
    console.error('Channel Intelligence Error:', e);
    const msg = e.message || 'Failed to analyze channel';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
