import axios from 'axios';
// google-trends-api does not need an API key but must run server-side
// eslint-disable-next-line @typescript-eslint/no-var-requires
const googleTrends = require('google-trends-api');

export interface TrendingTopic {
  keyword: string;
  score: number;
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

    // 1) If user has given custom keywords, try to score them using Google Trends interestOverTime
    if (keywords.length > 0) {
      try {
        const response = await googleTrends.interestOverTime({
          keyword: keywords,
          startTime: thirtyDaysAgo,
          endTime: today,
          granularTimeResolution: false,
        });

        const parsed = JSON.parse(response);
        const timeline = parsed?.default?.timelineData || [];

        const latestPoint = timeline[timeline.length - 1];
        if (latestPoint && latestPoint.value) {
          keywords.forEach((keyword, idx) => {
            const value = latestPoint.value[idx] ?? 0;
            const score = Math.max(10, Math.min(100, Math.round((value / 100) * 100)));
            trendingTopics.push({ keyword, score });
          });
        }
      } catch (err) {
        console.error('Google Trends keyword scoring failed, falling back to simulation:', err);
        keywords.forEach((keyword, index) => {
          const baseScore = 70 - index * 5;
          const randomVariation = Math.random() * 20;
          trendingTopics.push({
            keyword,
            score: Math.min(100, Math.round(baseScore + randomVariation)),
          });
        });
      }
    }
    
    // Platform-specific generic trending topics
    const platformTrends: Record<string, string[]> = {
      youtube: [
        'viral', 'trending', 'shorts', 'fyp', 'foryou',
        'youtubeshorts', 'shortsfeed', 'viralvideo', 'comedy', 'dance',
        'gaming', 'vlog', 'reaction', 'musicvideo', 'live',
        'tutorial', 'review', 'unboxing', 'challenge', 'prank',
      ],
      facebook: [
        'viral', 'trending', 'fyp', 'foryou', 'facebookvideo',
        'fbviral', 'reels', 'viralpost', 'comedy', 'dance',
        'memes', 'news', 'sports', 'livevideo', 'giveaway',
        'shortvideo', 'influencer', 'pagegrowth', 'marketing', 'ads',
      ],
      instagram: [
        'viral', 'trending', 'reels', 'fyp', 'foryou',
        'viralreels', 'instagood', 'instadaily', 'comedy', 'dance',
        'explorepage', 'fashion', 'travel', 'food', 'beauty',
        'lifestyle', 'fitness', 'quotes', 'pets', 'photography',
      ],
      tiktok: [
        'viral', 'trending', 'fyp', 'foryou', 'tiktokviral',
        'tiktoktrending', 'viralvideo', 'comedy', 'dance',
      ],
    };
    
    const genericTrends = (platformTrends[platform] || platformTrends.youtube).slice();

    // Try to fetch latest daily search trends from Google for the given platform context
    try {
      const geo = 'IN'; // default region; adjust via env later if needed
      const trendResponse = await googleTrends.dailyTrends({
        trendDate: today,
        geo,
      });

      const parsed = JSON.parse(trendResponse);
      const stories =
        parsed?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];

      stories.forEach((story: any) => {
        const title = story?.title?.query as string | undefined;
        const trafficStr = story?.formattedTraffic as string | undefined; // e.g. "200K+"

        if (!title) return;
        const base = trafficStr ? parseInt(trafficStr.replace(/\D/g, ''), 10) || 0 : 0;
        const score = Math.max(
          40,
          Math.min(100, Math.round(base > 0 ? Math.log10(base) * 20 + 50 : 60))
        );

        if (!trendingTopics.some((t) => t.keyword.toLowerCase() === title.toLowerCase())) {
          trendingTopics.push({
            keyword: title,
            score,
          });
        }
      });
    } catch (err) {
      console.error('Google Trends dailyTrends failed, using static platform topics as fallback:', err);
    }

    // Always ensure we have at least platform-specific generic topics as backup
    genericTrends.sort(() => Math.random() - 0.5);

    genericTrends.forEach((trend) => {
      if (!trendingTopics.some(t => t.keyword === trend)) {
        trendingTopics.push({
          keyword: trend,
          score: Math.round(50 + Math.random() * 30),
        });
      }
    });
    
    // Sort by score descending
    return trendingTopics.sort((a, b) => b.score - a.score).slice(0, 10);
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
