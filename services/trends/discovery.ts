/**
 * Trend Radar Engine
 * AI-powered trend discovery system
 */

import connectDB from '@/lib/mongodb';
import ViralDataset from '@/models/ViralDataset';
import TrendHistory from '@/models/TrendHistory';
import axios from 'axios';

export interface TrendInsight {
  keyword: string;
  platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'all';
  score: number;
  growthVelocity: number;
  trendType: 'rising' | 'peak' | 'declining';
  opportunity: 'high' | 'medium' | 'low';
  relatedHashtags: string[];
  estimatedReach: number;
  bestPostingTime?: { day: string; hour: number };
}

/**
 * Discover emerging trends
 */
export async function discoverTrends(
  platform?: 'youtube' | 'facebook' | 'instagram' | 'tiktok'
): Promise<TrendInsight[]> {
  await connectDB();

  const trends: TrendInsight[] = [];

  try {
    // Analyze hashtag growth velocity
    const hashtagTrends = await analyzeHashtagTrends(platform);
    trends.push(...hashtagTrends);

    // Analyze keyword spikes from Google Trends
    const keywordTrends = await analyzeKeywordTrends(platform);
    trends.push(...keywordTrends);

    // Analyze viral video patterns
    const videoTrends = await analyzeVideoTrends(platform);
    trends.push(...videoTrends);

    // Sort by score and return top trends
    return trends
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  } catch (error) {
    console.error('Trend discovery error:', error);
    return trends;
  }
}

/**
 * Analyze hashtag growth velocity
 */
async function analyzeHashtagTrends(
  platform?: 'youtube' | 'facebook' | 'instagram' | 'tiktok'
): Promise<TrendInsight[]> {
  const trends: TrendInsight[] = [];

  try {
    // Get recent viral videos
    const filter: any = { isViral: true };
    if (platform) filter.platform = platform;

    const recentVideos = await ViralDataset.find(filter)
      .sort({ collectedAt: -1 })
      .limit(1000);

    // Extract hashtags and count frequency
    const hashtagCounts = new Map<string, {
      count: number;
      recentCount: number;
      totalEngagement: number;
      platforms: Set<string>;
    }>();

    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const last7d = now - 7 * 24 * 60 * 60 * 1000;

    recentVideos.forEach(video => {
      video.hashtags?.forEach((hashtag: string) => {
        const normalized = hashtag.toLowerCase().replace('#', '');
        if (!hashtagCounts.has(normalized)) {
          hashtagCounts.set(normalized, {
            count: 0,
            recentCount: 0,
            totalEngagement: 0,
            platforms: new Set(),
          });
        }

        const data = hashtagCounts.get(normalized)!;
        data.count++;
        data.platforms.add(video.platform);
        data.totalEngagement += video.engagementRate || 0;

        const videoTime = video.collectedAt?.getTime() || video.postedAt?.getTime() || 0;
        if (videoTime > last24h) {
          data.recentCount++;
        }
      });
    });

    // Calculate growth velocity and create trends
    hashtagCounts.forEach((data, hashtag) => {
      const growthVelocity = data.recentCount / Math.max(1, data.count - data.recentCount);
      const avgEngagement = data.totalEngagement / data.count;
      
      // Determine trend type
      let trendType: 'rising' | 'peak' | 'declining' = 'rising';
      if (growthVelocity > 2) trendType = 'rising';
      else if (growthVelocity > 0.5) trendType = 'peak';
      else trendType = 'declining';

      // Calculate opportunity score
      const score = calculateTrendScore(growthVelocity, avgEngagement, data.recentCount);
      const opportunity = score > 70 ? 'high' : score > 50 ? 'medium' : 'low';

      trends.push({
        keyword: hashtag,
        platform: platform || 'all',
        score,
        growthVelocity: Math.round(growthVelocity * 100),
        trendType,
        opportunity,
        relatedHashtags: findRelatedHashtags(hashtag, recentVideos),
        estimatedReach: estimateReach(hashtag, data.count, avgEngagement),
      });
    });
  } catch (error) {
    console.error('Hashtag trend analysis error:', error);
  }

  return trends;
}

/**
 * Analyze keyword trends from Google Trends
 */
async function analyzeKeywordTrends(
  platform?: 'youtube' | 'facebook' | 'instagram' | 'tiktok'
): Promise<TrendInsight[]> {
  const trends: TrendInsight[] = [];

  try {
    // In production, would use Google Trends API
    // For now, analyze keywords from viral dataset
    const recentVideos = await ViralDataset.find({
      isViral: true,
      ...(platform && { platform }),
    })
      .sort({ collectedAt: -1 })
      .limit(500);

    // Extract keywords from titles
    const keywordCounts = new Map<string, {
      count: number;
      recentCount: number;
      engagement: number;
    }>();

    const last24h = Date.now() - 24 * 60 * 60 * 1000;

    recentVideos.forEach(video => {
      const words = extractKeywords(video.title);
      words.forEach(word => {
        if (word.length > 3) { // Filter short words
          const normalized = word.toLowerCase();
          if (!keywordCounts.has(normalized)) {
            keywordCounts.set(normalized, {
              count: 0,
              recentCount: 0,
              engagement: 0,
            });
          }

          const data = keywordCounts.get(normalized)!;
          data.count++;
          data.engagement += video.engagementRate || 0;

          const videoTime = video.collectedAt?.getTime() || video.postedAt?.getTime() || 0;
          if (videoTime > last24h) {
            data.recentCount++;
          }
        }
      });
    });

    // Create trend insights
    keywordCounts.forEach((data, keyword) => {
      if (data.count < 5) return; // Minimum threshold

      const growthVelocity = data.recentCount / Math.max(1, data.count - data.recentCount);
      const avgEngagement = data.engagement / data.count;
      const score = calculateTrendScore(growthVelocity, avgEngagement, data.recentCount);

      trends.push({
        keyword,
        platform: platform || 'all',
        score,
        growthVelocity: Math.round(growthVelocity * 100),
        trendType: growthVelocity > 1.5 ? 'rising' : 'peak',
        opportunity: score > 70 ? 'high' : 'medium',
        relatedHashtags: [],
        estimatedReach: estimateReach(keyword, data.count, avgEngagement),
      });
    });
  } catch (error) {
    console.error('Keyword trend analysis error:', error);
  }

  return trends;
}

/**
 * Analyze video trends
 */
async function analyzeVideoTrends(
  platform?: 'youtube' | 'facebook' | 'instagram' | 'tiktok'
): Promise<TrendInsight[]> {
  const trends: TrendInsight[] = [];

  try {
    // Analyze video patterns from viral dataset
    const viralVideos = await ViralDataset.find({
      isViral: true,
      ...(platform && { platform }),
    })
      .sort({ growthVelocity: -1 })
      .limit(100);

    // Group by common patterns
    const patterns = new Map<string, {
      count: number;
      avgEngagement: number;
      hashtags: string[];
    }>();

    viralVideos.forEach(video => {
      // Extract pattern from title/hashtags
      const pattern = extractPattern(video.title, video.hashtags);
      
      if (!patterns.has(pattern)) {
        patterns.set(pattern, {
          count: 0,
          avgEngagement: 0,
          hashtags: [],
        });
      }

      const data = patterns.get(pattern)!;
      data.count++;
      data.avgEngagement = (data.avgEngagement * (data.count - 1) + video.engagementRate) / data.count;
      video.hashtags?.forEach((tag: string) => {
        if (!data.hashtags.includes(tag)) {
          data.hashtags.push(tag);
        }
      });
    });

    // Create trend insights
    patterns.forEach((data, pattern) => {
      if (data.count < 3) return;

      const score = Math.min(100, data.avgEngagement * 10 + data.count * 5);
      
      trends.push({
        keyword: pattern,
        platform: platform || 'all',
        score,
        growthVelocity: data.count * 10,
        trendType: 'rising',
        opportunity: score > 70 ? 'high' : 'medium',
        relatedHashtags: data.hashtags.slice(0, 10),
        estimatedReach: estimateReach(pattern, data.count, data.avgEngagement),
      });
    });
  } catch (error) {
    console.error('Video trend analysis error:', error);
  }

  return trends;
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  // Simple keyword extraction
  // In production, would use NLP library
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
}

/**
 * Extract pattern from title and hashtags
 */
function extractPattern(title: string, hashtags: string[]): string {
  // Extract main topic from title
  const words = extractKeywords(title);
  const mainWord = words[0] || 'trending';
  
  // Combine with top hashtag
  const topHashtag = hashtags[0]?.replace('#', '') || '';
  
  return `${mainWord} ${topHashtag}`.trim();
}

/**
 * Find related hashtags
 */
function findRelatedHashtags(
  hashtag: string,
  videos: any[]
): string[] {
  const related = new Map<string, number>();

  videos.forEach(video => {
    if (video.hashtags?.includes(hashtag)) {
      video.hashtags.forEach((tag: string) => {
        if (tag !== hashtag) {
          related.set(tag, (related.get(tag) || 0) + 1);
        }
      });
    }
  });

  return Array.from(related.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
}

/**
 * Calculate trend score
 */
function calculateTrendScore(
  growthVelocity: number,
  avgEngagement: number,
  recentCount: number
): number {
  // Growth velocity weight: 40%
  const velocityScore = Math.min(100, growthVelocity * 20) * 0.4;
  
  // Engagement weight: 30%
  const engagementScore = Math.min(100, avgEngagement * 10) * 0.3;
  
  // Recent activity weight: 30%
  const activityScore = Math.min(100, recentCount * 5) * 0.3;
  
  return Math.round(velocityScore + engagementScore + activityScore);
}

/**
 * Estimate reach for trend
 */
function estimateReach(
  keyword: string,
  count: number,
  avgEngagement: number
): number {
  // Estimate based on viral video patterns
  const baseReach = count * 10000; // Assume 10k views per video
  const engagementMultiplier = 1 + (avgEngagement / 100);
  
  return Math.round(baseReach * engagementMultiplier);
}

/**
 * Save trend to history
 */
export async function saveTrendToHistory(trend: TrendInsight): Promise<void> {
  try {
    await connectDB();

    await TrendHistory.create({
      platform: trend.platform,
      keyword: trend.keyword,
      score: trend.score,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error saving trend to history:', error);
  }
}
