import axios from 'axios';
import ViralDataset from '@/models/ViralDataset';
import TrendHistory from '@/models/TrendHistory';
import connectDB from '@/lib/mongodb';

export interface IngestionResult {
  success: boolean;
  collected: number;
  errors: string[];
}

/**
 * Main data ingestion orchestrator
 */
export async function ingestAllPlatforms(): Promise<IngestionResult> {
  await connectDB();
  
  const results: IngestionResult = {
    success: true,
    collected: 0,
    errors: [],
  };

  try {
    // YouTube trending videos
    try {
      const youtubeData = await ingestYouTubeTrending();
      results.collected += youtubeData.collected;
      if (youtubeData.errors.length > 0) {
        results.errors.push(...youtubeData.errors);
      }
    } catch (error: any) {
      results.errors.push(`YouTube ingestion failed: ${error.message}`);
      results.success = false;
    }

    // Google Trends
    try {
      const trendsData = await ingestGoogleTrends();
      results.collected += trendsData.collected;
      if (trendsData.errors.length > 0) {
        results.errors.push(...trendsData.errors);
      }
    } catch (error: any) {
      results.errors.push(`Google Trends ingestion failed: ${error.message}`);
    }

    // TikTok trending (if API available)
    // Twitter trending
    // Reddit trending

    return results;
  } catch (error: any) {
    results.success = false;
    results.errors.push(`Ingestion failed: ${error.message}`);
    return results;
  }
}

/**
 * Ingest YouTube trending videos
 */
async function ingestYouTubeTrending(): Promise<{ collected: number; errors: string[] }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { collected: 0, errors: ['YouTube API key not configured'] };
  }

  const errors: string[] = [];
  let collected = 0;

  try {
    // Get trending videos
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        key: apiKey,
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular',
        maxResults: 50,
        regionCode: 'US', // Can be made configurable
      },
      timeout: 30000,
    });

    const videos = response.data.items || [];

    for (const video of videos) {
      try {
        const views = parseInt(video.statistics.viewCount) || 0;
        const likes = parseInt(video.statistics.likeCount) || 0;
        const comments = parseInt(video.statistics.commentCount) || 0;
        const duration = parseDuration(video.contentDetails.duration);
        
        const engagementRate = views > 0 
          ? ((likes + comments) / views) * 100 
          : 0;

        // Calculate growth velocity (simplified - would need historical data)
        const growthVelocity = views / Math.max(1, duration / 3600); // Views per hour

        const hashtags = extractHashtags(video.snippet.description || '');

        const viralDataset = new ViralDataset({
          videoId: video.id,
          platform: 'youtube',
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnailUrl: video.snippet.thumbnails.high?.url || '',
          hashtags,
          views,
          likes,
          comments,
          shares: 0, // YouTube doesn't provide shares in basic API
          engagementRate,
          growthVelocity,
          postedAt: new Date(video.snippet.publishedAt),
          collectedAt: new Date(),
          isViral: views > 100000, // Threshold for viral
          viralThreshold: 100000,
          duration,
          metadata: {
            channelId: video.snippet.channelId,
            channelName: video.snippet.channelName,
            category: video.snippet.categoryId,
          },
          features: {}, // Would be populated by analysis
        });

        // Check if already exists
        const existing = await ViralDataset.findOne({ 
          videoId: video.id, 
          platform: 'youtube' 
        });

        if (!existing) {
          await viralDataset.save();
          collected++;
        } else {
          // Update metrics
          existing.views = views;
          existing.likes = likes;
          existing.comments = comments;
          existing.engagementRate = engagementRate;
          existing.growthVelocity = growthVelocity;
          existing.collectedAt = new Date();
          await existing.save();
        }
      } catch (error: any) {
        errors.push(`Failed to process video ${video.id}: ${error.message}`);
      }
    }
  } catch (error: any) {
    errors.push(`YouTube API error: ${error.message}`);
  }

  return { collected, errors };
}

/**
 * Ingest Google Trends data
 */
async function ingestGoogleTrends(): Promise<{ collected: number; errors: string[] }> {
  const errors: string[] = [];
  let collected = 0;

  try {
    // Note: Google Trends doesn't have a public API
    // We'll use a scraping approach or third-party service
    // For now, simulate with common trending keywords
    
    const trendingKeywords = [
      'viral video', 'trending', 'shorts', 'comedy', 'dance',
      'music', 'food', 'travel', 'fitness', 'beauty',
    ];

    for (const keyword of trendingKeywords) {
      try {
        // In production, use actual Google Trends API or scraping
        const trendScore = 50 + Math.random() * 50; // Simulated
        const growthVelocity = Math.random() * 20;

        const trendHistory = new TrendHistory({
          keyword,
          platform: 'google',
          trendScore: Math.round(trendScore),
          growthVelocity,
          timestamp: new Date(),
          region: 'global',
          lifecycle: trendScore > 70 ? 'peak' : trendScore > 50 ? 'growing' : 'emerging',
          relatedKeywords: [],
        });

        await trendHistory.save();
        collected++;
      } catch (error: any) {
        errors.push(`Failed to process trend ${keyword}: ${error.message}`);
      }
    }
  } catch (error: any) {
    errors.push(`Google Trends error: ${error.message}`);
  }

  return { collected, errors };
}

/**
 * Parse YouTube duration format (PT1H2M10S) to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Extract hashtags from text
 */
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(
  views: number,
  likes: number,
  comments: number,
  shares: number
): number {
  if (views === 0) return 0;
  return ((likes + comments + shares) / views) * 100;
}

/**
 * Calculate growth velocity (views per hour)
 */
export function calculateGrowthVelocity(
  views: number,
  hoursSincePost: number
): number {
  if (hoursSincePost === 0) return views;
  return views / hoursSincePost;
}
