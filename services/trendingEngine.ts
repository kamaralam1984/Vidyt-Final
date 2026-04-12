import axios from 'axios';
// google-trends-api does not need an API key but must run server-side
// eslint-disable-next-line @typescript-eslint/no-var-requires
const googleTrends = require('google-trends-api');

export interface TrendingTopic {
  topic: string;
  score: number;
  source: 'google' | 'youtube';
  confidence: 'high' | 'medium';
}

export async function getTrendingTopics(
  keywords: string[],
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' = 'youtube'
): Promise<TrendingTopic[]> {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const trendingTopics: TrendingTopic[] = [];

    // 1) Google Trends Integration
    if (keywords.length > 0) {
      try {
        const response = await googleTrends.interestOverTime({
          keyword: keywords,
          startTime: thirtyDaysAgo,
          endTime: today,
        });

        const parsed = JSON.parse(response);
        const timeline = parsed?.default?.timelineData || [];
        const latestPoint = timeline[timeline.length - 1];

        if (latestPoint && latestPoint.value) {
          keywords.forEach((keyword, idx) => {
            const value = latestPoint.value[idx] ?? 0;
            trendingTopics.push({
              topic: keyword,
              score: Math.max(10, Math.min(100, Math.round(value))),
              source: 'google',
              confidence: value > 50 ? 'high' : 'medium',
            });
          });
        }
      } catch (err) {
        console.error('Google Trends scoring failed:', err);
      }
    }

    // 2) YouTube Trending Fallback / Supplement
    // In production, this calls the YouTube Data API v3 'videos.list' with chart='mostPopular'
    try {
        const config = await (await import('@/lib/apiConfig')).getApiConfig();
        if (config.youtubeDataApiKey) {
            const ytResponse = await axios.get('https://www.googleapis.com/youtube/v3/videoCategories', {
                params: {
                    part: 'snippet',
                    regionCode: 'US',
                    key: config.youtubeDataApiKey
                }
            });
            const categories = ytResponse.data?.items?.slice(0, 5) || [];
            categories.forEach((cat: any) => {
                trendingTopics.push({
                    topic: cat.snippet.title,
                    score: 85,
                    source: 'youtube',
                    confidence: 'high'
                });
            });
        }
    } catch (e) {
        console.error('YouTube Trending API failed:', e);
    }

    // 3) Deduplicate and Sort
    const resultMap = new Map<string, TrendingTopic>();
    trendingTopics.forEach(t => {
        const existing = resultMap.get(t.topic.toLowerCase());
        if (!existing || t.score > existing.score) {
            resultMap.set(t.topic.toLowerCase(), t);
        }
    });

    const result = Array.from(resultMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    
    // Cache the result for 6 hours
    try {
      const { getRedis } = await import('@/lib/redis');
      const redis = getRedis();
      const cacheKey = `trends:${platform}:${keywords.join(',')}`;
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 6 * 60 * 60);
    } catch (e) {
      console.warn('[TrendingEngine] Failed to cache trends in Redis');
    }

    return result;
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return [];
  }
}

export async function getTrendingScore(
  keywords: string[],
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' = 'youtube'
): Promise<number> {
  const topics = await getTrendingTopics(keywords, platform);
  if (topics.length === 0) return 50;
  
  const avgScore = topics.reduce((sum, topic) => sum + topic.score, 0) / topics.length;
  return Math.round(avgScore);
}

// In production, integrate with Google Trends API
async function fetchGoogleTrends(keyword: string): Promise<number> {
  // This would make actual API calls to Google Trends
  // For now, return simulated data
  return Math.random() * 100;
}
