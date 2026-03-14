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

/**
 * Analyze competitor channel and extract insights
 */
export async function analyzeCompetitor(
  userId: string,
  competitorId: string,
  platform: 'youtube' | 'facebook' | 'instagram'
): Promise<CompetitorInsights> {
  await connectDB();

  // Get or create competitor record
  let competitor = await Competitor.findOne({ 
    userId, 
    competitorId, 
    platform 
  });

  if (!competitor) {
    // Create new competitor record
    competitor = new Competitor({
      userId,
      competitorId,
      platform,
      channelName: competitorId, // Would fetch from API
      channelUrl: '',
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
  }

  // Get competitor's videos (would fetch from platform API)
  // For now, analyze existing videos in our database
  const competitorVideos = await Video.find({
    platform,
    // Would filter by competitorId/channelId
  }).limit(50);

  // Analyze videos
  const insights = await extractInsights(competitorVideos);

  // Update competitor record
  competitor.averageEngagementRate = insights.averageEngagementRate;
  competitor.averageViews = insights.averageViews;
  competitor.topPerformers = insights.topPerformers.map(v => v.videoId as any);
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
      videoId: v._id.toString(),
      title: v.title,
      views: v.views || 0,
      engagementRate: v.analysisId?.viralProbability || 0,
      viralScore: v.analysisId?.viralProbability || 0,
    }))
    .sort((a, b) => b.viralScore - a.viralScore)
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
