import axios from 'axios';

export interface TrendingTopic {
  keyword: string;
  score: number;
}

export async function getTrendingTopics(keywords: string[], platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' = 'youtube'): Promise<TrendingTopic[]> {
  try {
    // In production, integrate with platform-specific APIs
    // For now, simulate trending topics based on keywords and platform
    
    const trendingTopics: TrendingTopic[] = [];
    
    // Simulate trending scores based on keywords
    keywords.forEach((keyword, index) => {
      const baseScore = 70 - (index * 5); // First keywords get higher scores
      const randomVariation = Math.random() * 20;
      trendingTopics.push({
        keyword,
        score: Math.min(100, Math.round(baseScore + randomVariation)),
      });
    });
    
    // Platform-specific generic trending topics
    const platformTrends: Record<string, string[]> = {
      youtube: [
        'viral', 'trending', 'shorts', 'fyp', 'foryou',
        'youtubeshorts', 'shortsfeed', 'viralvideo', 'comedy', 'dance',
      ],
      facebook: [
        'viral', 'trending', 'fyp', 'foryou', 'facebookvideo',
        'fbviral', 'reels', 'viralpost', 'comedy', 'dance',
      ],
      instagram: [
        'viral', 'trending', 'reels', 'fyp', 'foryou',
        'viralreels', 'instagood', 'instadaily', 'comedy', 'dance',
      ],
      tiktok: [
        'viral', 'trending', 'fyp', 'foryou', 'tiktokviral',
        'tiktoktrending', 'viralvideo', 'comedy', 'dance',
      ],
    };
    
    const genericTrends = platformTrends[platform] || platformTrends.youtube;
    
    genericTrends.forEach(trend => {
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

export async function getTrendingScore(keywords: string[]): Promise<number> {
  const topics = await getTrendingTopics(keywords);
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
