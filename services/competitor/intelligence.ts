import Competitor from '@/models/Competitor';
import Video from '@/models/Video';
import Analysis from '@/models/Analysis';
import connectDB from '@/lib/mongodb';

export interface CompetitorInsights {
  competitorId: string;
  channelName: string;
  averageEngagementRate: number;
  averageViews: number;
  topPerformers: Array<{
    videoId: string;
    title: string;
    views: number;
    engagementRate: number;
    viralScore: number;
  }>;
  bestPostingTimes: Array<{ day: string; hour: number; score: number }>;
  successfulPatterns: {
    titles: string[];
    hashtags: string[];
    videoLengths: number[];
    categories: string[];
  };
  growthRate: number;
  recommendations: string[];
}

import { getApiConfig } from '@/lib/apiConfig';
import axios from 'axios';

/**
 * Analyze competitor channel and extract insights
 */
export async function analyzeCompetitor(
  userId: string,
  competitorId: string,
  platform: 'youtube' | 'facebook' | 'instagram'
): Promise<CompetitorInsights> {
  await connectDB();

  const config = await getApiConfig();
  const apiKey = config.youtubeDataApiKey;

  if (!apiKey && platform === 'youtube') {
    throw new Error('YouTube Data API Key not configured in Super Admin settings');
  }

  // Get or create competitor record
  let competitor = await Competitor.findOne({ 
    userId, 
    competitorId, 
    platform 
  });

  let channelData: any = null;
  let videoItems: any[] = [];

  if (platform === 'youtube') {
    console.log(`[CompetitorIntelligence] Fetching real data for YouTube channel: ${competitorId}`);
    
    // 1. Fetch Channel Metadata
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: competitorId,
        key: apiKey
      }
    });
    
    channelData = channelRes.data?.items?.[0];
    if (!channelData) {
      // Try resolving handle if competitorId starts with @
      if (competitorId.startsWith('@')) {
        const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: { part: 'snippet', q: competitorId, type: 'channel', key: apiKey, maxResults: 1 }
        });
        const resolvedId = searchRes.data?.items?.[0]?.id?.channelId;
        if (resolvedId) return analyzeCompetitor(userId, resolvedId, platform);
      }
      throw new Error(`YouTube channel ${competitorId} not found`);
    }

    // 2. Fetch Recent Videos via Search (more reliable for "latest")
    const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        channelId: channelData.id,
        order: 'date',
        type: 'video',
        maxResults: 25,
        key: apiKey
      }
    });
    
    const searchItems = videoRes.data?.items || [];
    const videoIds = searchItems.map((item: any) => item.id.videoId).join(',');

    // 3. Get detailed stats for these videos
    if (videoIds) {
      const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: videoIds,
          key: apiKey
        }
      });
      videoItems = statsRes.data?.items || [];
    }
  }

  if (!competitor) {
    competitor = new Competitor({
      userId,
      competitorId,
      platform,
      channelName: channelData?.snippet?.title || competitorId,
      channelUrl: platform === 'youtube' ? `https://youtube.com/channel/${channelData?.id}` : '',
      trackedVideos: [],
      lastAnalyzed: new Date(),
    });
  } else {
    competitor.channelName = channelData?.snippet?.title || competitor.channelName;
  }

  // Transform YouTube API items to our internal "Video" like structure for analysis
  const normalizedVideos = videoItems.map(item => ({
    title: item.snippet.title,
    views: parseInt(item.statistics.viewCount) || 0,
    duration: parseISO8601Duration(item.contentDetails.duration),
    uploadedAt: new Date(item.snippet.publishedAt),
    hashtags: extractHashtags(item.snippet.description || ''),
    category: item.snippet.categoryId,
    likes: parseInt(item.statistics.likeCount) || 0,
    comments: parseInt(item.statistics.commentCount) || 0,
  }));

  const insights = await extractInsights(normalizedVideos);

  // Update competitor record
  competitor.averageEngagementRate = insights.averageEngagementRate;
  competitor.averageViews = insights.averageViews;
  competitor.followerCount = parseInt(channelData?.statistics?.subscriberCount) || 0;
  competitor.bestPostingTimes = insights.bestPostingTimes;
  competitor.successfulPatterns = insights.successfulPatterns;
  competitor.growthRate = insights.growthRate;
  competitor.lastAnalyzed = new Date();
  
  await competitor.save();

  return {
    competitorId: competitor.competitorId,
    channelName: competitor.channelName,
    ...insights,
  };
}

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) + (parseInt(match[2] || '0') * 60) + parseInt(match[3] || '0');
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

/**
 * Extract insights from competitor videos
 */
async function extractInsights(videos: any[]): Promise<Omit<CompetitorInsights, 'competitorId' | 'channelName'>> {
  if (videos.length === 0) {
    return {
      averageEngagementRate: 0,
      averageViews: 0,
      topPerformers: [],
      bestPostingTimes: [],
      successfulPatterns: {
        titles: [],
        hashtags: [],
        videoLengths: [],
        categories: [],
      },
      growthRate: 0,
      recommendations: [],
    };
  }

  // Calculate averages
  const totalEngagement = videos.reduce((sum, v) => {
    const analysis = v.analysisId; // Would fetch actual analysis
    return sum + (analysis?.viralProbability || 0);
  }, 0);
  
  const averageEngagementRate = totalEngagement / videos.length;
  const averageViews = videos.reduce((sum, v) => sum + (v.views || 0), 0) / videos.length;

  // Find top performers
  const topPerformers = videos
    .map(v => ({
      videoId: v.id || Math.random().toString(),
      title: v.title,
      views: v.views || 0,
      engagementRate: v.views > 0 ? (v.likes / v.views) * 100 : 0,
      viralScore: v.views > 0 ? (v.likes / v.views) * 100 : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Analyze posting times
  const postingTimeMap = new Map<string, number>();
  videos.forEach(v => {
    const day = v.uploadedAt?.getDay() || 0;
    const hour = v.uploadedAt?.getHours() || 12;
    const key = `${day}-${hour}`;
    const current = postingTimeMap.get(key) || 0;
    postingTimeMap.set(key, current + (v.views || 0));
  });

  const bestPostingTimes = Array.from(postingTimeMap.entries())
    .map(([key, score]) => {
      const [day, hour] = key.split('-');
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        day: dayNames[parseInt(day)],
        hour: parseInt(hour),
        score: Math.round(score),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Extract successful patterns
  const successfulTitles = topPerformers.map(v => v.title).slice(0, 10);
  const successfulHashtags = videos
    .flatMap(v => v.hashtags || [])
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .slice(0, 20);
  const successfulLengths = videos
    .map(v => v.duration)
    .filter(d => d > 0)
    .sort((a, b) => b - a)
    .slice(0, 5);

  // Calculate growth rate (simplified)
  const sortedVideos = videos.sort((a, b) => 
    (a.uploadedAt?.getTime() || 0) - (b.uploadedAt?.getTime() || 0)
  );
  const recentViews = sortedVideos.slice(-10).reduce((sum, v) => sum + (v.views || 0), 0) / 10;
  const olderViews = sortedVideos.slice(0, 10).reduce((sum, v) => sum + (v.views || 0), 0) / 10;
  const growthRate = olderViews > 0 ? ((recentViews - olderViews) / olderViews) * 100 : 0;

  // Generate recommendations
  const recommendations = generateRecommendations({
    averageEngagementRate,
    topPerformers,
    bestPostingTimes,
    successfulPatterns: {
      titles: successfulTitles,
      hashtags: successfulHashtags,
      videoLengths: successfulLengths,
      categories: [],
    },
  });

  return {
    averageEngagementRate: Math.round(averageEngagementRate),
    averageViews: Math.round(averageViews),
    topPerformers,
    bestPostingTimes,
    successfulPatterns: {
      titles: successfulTitles,
      hashtags: successfulHashtags,
      videoLengths: successfulLengths,
      categories: [],
    },
    growthRate: Math.round(growthRate),
    recommendations,
  };
}

/**
 * Generate recommendations based on competitor analysis
 */
function generateRecommendations(insights: any): string[] {
  const recommendations: string[] = [];

  if (insights.averageEngagementRate > 70) {
    recommendations.push('This competitor has high engagement. Study their content style and posting strategy.');
  }

  if (insights.bestPostingTimes.length > 0) {
    const bestTime = insights.bestPostingTimes[0];
    recommendations.push(`Best posting time: ${bestTime.day} at ${bestTime.hour}:00`);
  }

  if (insights.successfulPatterns.titles.length > 0) {
    recommendations.push(`Study their successful titles: ${insights.successfulPatterns.titles.slice(0, 3).join(', ')}`);
  }

  if (insights.growthRate > 0) {
    recommendations.push(`Competitor is growing at ${insights.growthRate.toFixed(1)}% rate. Analyze their recent content.`);
  }

  return recommendations;
}

/**
 * Track competitor automatically
 */
export async function trackCompetitor(
  userId: string,
  competitorId: string,
  platform: 'youtube' | 'facebook' | 'instagram',
  channelName: string,
  channelUrl: string
): Promise<void> {
  await connectDB();

  const competitor = new Competitor({
    userId,
    competitorId,
    platform,
    channelName,
    channelUrl,
    trackedVideos: [],
    lastAnalyzed: new Date(),
    topPerformers: [],
    averageEngagementRate: 0,
    averageViews: 0,
    bestPostingTimes: [],
    successfulPatterns: {
      titles: [],
      hashtags: [],
      videoLengths: [],
      categories: [],
    },
    growthRate: 0,
  });

  await competitor.save();
}
