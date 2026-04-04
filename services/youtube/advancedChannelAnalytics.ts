
import axios from 'axios';
import { getApiConfig } from '@/lib/apiConfig';

export interface ChannelAnalytics {
  channelInfo: {
    id: string;
    title: string;
    description: string;
    customUrl: string;
    thumbnails: any;
    bannerUrl?: string;
    statistics: {
      viewCount: number;
      subscriberCount: number;
      videoCount: number;
    };
  };
  videoPerformance: {
    averageViews: number;
    averageEngagementRate: number;
    totalRecentViews: number;
    growthVelocity: number; // views per day on average for recent videos
    consistencyScore: number; // 0-100 based on upload frequency
  };
  recentVideos: Array<{
    id: string;
    title: string;
    publishedAt: string;
    thumbnail: string;
    views: number;
    likes: number;
    comments: number;
    engagementRate: number;
    viralScore: number;
  }>;
  audit: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
}

export async function getAdvancedChannelAnalytics(channelUrl: string): Promise<ChannelAnalytics> {
  const config = await getApiConfig();
  const apiKey = config.youtubeDataApiKey?.trim();
  
  if (!apiKey) {
    throw new Error('YouTube Data API key is not configured in Super Admin settings.');
  }

  // 1. Resolve Channel ID
  const channelId = await resolveChannelId(channelUrl, apiKey);
  
  // 2. Fetch Channel Details
  const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
    params: {
      part: 'snippet,statistics,brandingSettings,contentDetails',
      id: channelId,
      key: apiKey
    }
  });

  const channelData = channelRes.data?.items?.[0];
  if (!channelData) throw new Error('Channel details not found');

  const uploadsPlaylistId = channelData.contentDetails?.relatedPlaylists?.uploads;

  // 3. Fetch Recent Videos
  const playlistItemsRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
    params: {
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: 30,
      key: apiKey
    }
  });

  const videoIds = playlistItemsRes.data?.items?.map((item: any) => item.contentDetails.videoId) || [];
  
  // 4. Fetch Detailed Video Stats
  const videosRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: {
      part: 'snippet,statistics,contentDetails',
      id: videoIds.join(','),
      key: apiKey
    }
  });

  const rawVideos = videosRes.data?.items || [];
  
  // 5. Process Metrics
  let totalViews = 0;
  let totalEngagementRate = 0;
  
  const processedVideos = rawVideos.map((v: any) => {
    const views = parseInt(v.statistics?.viewCount || '0');
    const likes = parseInt(v.statistics?.likeCount || '0');
    const comments = parseInt(v.statistics?.commentCount || '0');
    const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
    
    // Viral Score heuristic: age vs views vs channel size
    const publishedAt = new Date(v.snippet.publishedAt);
    const ageInDays = Math.max(1, (new Date().getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
    const viewsPerDay = views / ageInDays;
    const channelAvgViews = parseInt(channelData.statistics.viewCount) / Math.max(1, parseInt(channelData.statistics.videoCount));
    const viralScore = Math.min(100, Math.round((viewsPerDay / (channelAvgViews / 30 || 1)) * 10));

    totalViews += views;
    totalEngagementRate += engagementRate;

    return {
      id: v.id,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      thumbnail: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url,
      views,
      likes,
      comments,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      viralScore
    };
  });

  const avgViews = totalViews / Math.max(1, processedVideos.length);
  const avgEngagementRate = totalEngagementRate / Math.max(1, processedVideos.length);
  
  // Growth Velocity (Simplistic: average views per day across recent videos)
  const growthVelocity = processedVideos.reduce((acc, v) => {
    const age = Math.max(1, (new Date().getTime() - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
    return acc + (v.views / age);
  }, 0) / Math.max(1, processedVideos.length);

  // 6. Generate AI Audit (Heuristic based for now, can be LLM later)
  const strengths = [];
  const weaknesses = [];
  const opportunities = [];

  if (avgEngagementRate > 4) strengths.push('High audience engagement (Above 4%)');
  if (parseInt(channelData.statistics.subscriberCount) > 100000) strengths.push('Strong established audience base');
  
  if (avgEngagementRate < 1) weaknesses.push('Low engagement rate (Below 1%)');
  if (processedVideos.length < 5) weaknesses.push('Low upload frequency in the recent period');
  
  if (processedVideos.some(v => v.viralScore > 80)) opportunities.push('Recent viral success indicates a winning trend to double down on');
  opportunities.push('Optimize metadata for better CTR as search volume is high for your niche');

  return {
    channelInfo: {
      id: channelId,
      title: channelData.snippet.title,
      description: channelData.snippet.description,
      customUrl: channelData.snippet.customUrl,
      thumbnails: channelData.snippet.thumbnails,
      bannerUrl: channelData.brandingSettings?.image?.bannerExternalUrl,
      statistics: {
        viewCount: parseInt(channelData.statistics.viewCount),
        subscriberCount: parseInt(channelData.statistics.subscriberCount),
        videoCount: parseInt(channelData.statistics.videoCount),
      }
    },
    videoPerformance: {
      averageViews: Math.round(avgViews),
      averageEngagementRate: parseFloat(avgEngagementRate.toFixed(2)),
      totalRecentViews: totalViews,
      growthVelocity: Math.round(growthVelocity),
      consistencyScore: Math.min(100, processedVideos.length * 4),
    },
    recentVideos: processedVideos,
    audit: { strengths, weaknesses, opportunities }
  };
}

async function resolveChannelId(url: string, apiKey: string): Promise<string> {
  const u = url.trim();
  
  // 1. Check if it's already a channel ID
  if (u.startsWith('UC') && u.length >= 20) return u;
  
  // 2. Extract handle or channel ID from URL
  const handleMatch = u.match(/youtube\.com\/(@[a-zA-Z0-9._-]+)/);
  const channelMatch = u.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  const cMatch = u.match(/youtube\.com\/c\/([a-zA-Z0-9_-]+)/);
  
  const identifier = handleMatch ? handleMatch[1] : (channelMatch ? channelMatch[1] : (cMatch ? cMatch[1] : u));
  
  if (identifier.startsWith('@')) {
    const handle = identifier.slice(1);
    const res = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'id', forHandle: handle, key: apiKey }
    });
    if (res.data?.items?.[0]?.id) return res.data.items[0].id;
    
    // Fallback: search for channel
    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'id', q: identifier, type: 'channel', key: apiKey, maxResults: 1 }
    });
    if (searchRes.data?.items?.[0]?.id?.channelId) return searchRes.data.items[0].id.channelId;
  }
  
  return identifier;
}
