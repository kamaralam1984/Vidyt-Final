import TrendHistory from '@/models/TrendHistory';
import ViralDataset from '@/models/ViralDataset';
import { generateVideoIdeas } from '@/services/ai/contentCopilot';
import connectDB from '@/lib/mongodb';

export interface ContentStrategy {
  weeklyPlan: Array<{
    day: string;
    time: string;
    topic: string;
    title: string;
    hashtags: string[];
    platform: string;
    estimatedScore: number;
  }>;
  postingSchedule: Array<{
    day: string;
    hours: number[];
    platform: string;
  }>;
  topicSuggestions: Array<{
    topic: string;
    trendScore: number;
    opportunityScore: number;
    hashtags: string[];
    platform: string;
  }>;
  recommendations: string[];
}

/**
 * Generate automated content strategy for a creator
 */
export async function generateContentStrategy(
  userId: string,
  niche: string,
  platforms: Array<'youtube' | 'facebook' | 'instagram'> = ['youtube'],
  days: number = 7
): Promise<ContentStrategy> {
  await connectDB();

  // Get trending topics
  const trends = await TrendHistory.find({
    timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    lifecycle: { $in: ['emerging', 'growing'] },
  })
    .sort({ growthVelocity: -1 })
    .limit(20);

  // Get successful patterns from viral dataset
  const viralVideos = await ViralDataset.find({
    isViral: true,
    platform: { $in: platforms },
    collectedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  })
    .limit(50);

  // Generate weekly plan
  const weeklyPlan = await generateWeeklyPlan(niche, platforms, days, trends, viralVideos);

  // Generate posting schedule
  const postingSchedule = generatePostingSchedule(platforms, viralVideos);

  // Generate topic suggestions
  const topicSuggestions = await generateTopicSuggestions(niche, trends, viralVideos);

  // Generate recommendations
  const recommendations = generateRecommendations(weeklyPlan, postingSchedule, topicSuggestions);

  return {
    weeklyPlan,
    postingSchedule,
    topicSuggestions,
    recommendations,
  };
}

/**
 * Generate weekly content plan
 */
async function generateWeeklyPlan(
  niche: string,
  platforms: string[],
  days: number,
  trends: any[],
  viralVideos: any[]
): Promise<ContentStrategy['weeklyPlan']> {
  const plan: ContentStrategy['weeklyPlan'] = [];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Get AI-generated ideas
  const aiIdeas = await generateVideoIdeas(niche, platforms[0] as any, days * platforms.length);

  let ideaIndex = 0;
  let trendIndex = 0;

  for (let day = 0; day < days; day++) {
    const dayName = daysOfWeek[day % 7];
    
    for (const platform of platforms) {
      // Select topic from trends or AI ideas
      let topic: string;
      let hashtags: string[] = [];
      let estimatedScore = 50;

      if (trends.length > 0 && trendIndex < trends.length) {
        const trend = trends[trendIndex];
        topic = trend.keyword;
        hashtags = [trend.keyword, ...trend.relatedKeywords].slice(0, 10);
        estimatedScore = Math.round(trend.trendScore);
        trendIndex++;
      } else if (aiIdeas.length > 0 && ideaIndex < aiIdeas.length) {
        const idea = aiIdeas[ideaIndex];
        topic = idea.title;
        hashtags = idea.hashtags;
        estimatedScore = Math.round(idea.estimatedViralScore);
        ideaIndex++;
      } else {
        topic = `${niche} Content ${day + 1}`;
        hashtags = [niche, 'viral', 'trending'];
      }

      // Determine optimal posting time
      const optimalTime = getOptimalTime(platform, dayName, viralVideos);

      plan.push({
        day: dayName,
        time: `${optimalTime}:00`,
        topic,
        title: topic,
        hashtags,
        platform,
        estimatedScore,
      });
    }
  }

  return plan;
}

/**
 * Generate posting schedule
 */
function generatePostingSchedule(
  platforms: string[],
  viralVideos: any[]
): ContentStrategy['postingSchedule'] {
  const schedule: ContentStrategy['postingSchedule'] = [];

  for (const platform of platforms) {
    // Analyze best posting times from viral videos
    const platformVideos = viralVideos.filter(v => v.platform === platform);
    
    const timeMap = new Map<number, number>();
    platformVideos.forEach(video => {
      const hour = new Date(video.postedAt).getHours();
      const current = timeMap.get(hour) || 0;
      timeMap.set(hour, current + video.views);
    });

    const bestHours = Array.from(timeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    daysOfWeek.forEach(day => {
      schedule.push({
        day,
        hours: bestHours.length > 0 ? bestHours : [10, 14, 20], // Default times
        platform,
      });
    });
  }

  return schedule;
}

/**
 * Generate topic suggestions
 */
async function generateTopicSuggestions(
  niche: string,
  trends: any[],
  viralVideos: any[]
): Promise<ContentStrategy['topicSuggestions']> {
  const suggestions: ContentStrategy['topicSuggestions'] = [];

  // Add trending topics
  trends.slice(0, 10).forEach(trend => {
    suggestions.push({
      topic: trend.keyword,
      trendScore: trend.trendScore,
      opportunityScore: Math.round(trend.growthVelocity * 5),
      hashtags: [trend.keyword, ...trend.relatedKeywords].slice(0, 10),
      platform: trend.platform,
    });
  });

  // Add successful topics from viral videos
  const successfulTopics = viralVideos
    .map(v => ({
      topic: v.title,
      trendScore: v.trendingScore || 50,
      opportunityScore: v.engagementRate,
      hashtags: v.hashtags.slice(0, 10),
      platform: v.platform,
    }))
    .slice(0, 10);

  suggestions.push(...successfulTopics);

  return suggestions.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

/**
 * Get optimal posting time
 */
function getOptimalTime(platform: string, day: string, viralVideos: any[]): number {
  const platformVideos = viralVideos.filter(v => v.platform === platform);
  
  if (platformVideos.length === 0) {
    // Default optimal times
    const defaults: Record<string, number> = {
      youtube: 14,
      facebook: 13,
      instagram: 11,
    };
    return defaults[platform] || 14;
  }

  // Find best hour for this day
  const dayVideos = platformVideos.filter(v => {
    const videoDay = new Date(v.postedAt).toLocaleDateString('en-US', { weekday: 'long' });
    return videoDay === day;
  });

  if (dayVideos.length === 0) return 14;

  const hourMap = new Map<number, number>();
  dayVideos.forEach(video => {
    const hour = new Date(video.postedAt).getHours();
    const current = hourMap.get(hour) || 0;
    hourMap.set(hour, current + video.views);
  });

  const bestHour = Array.from(hourMap.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  return bestHour || 14;
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  weeklyPlan: ContentStrategy['weeklyPlan'],
  postingSchedule: ContentStrategy['postingSchedule'],
  topicSuggestions: ContentStrategy['topicSuggestions']
): string[] {
  const recommendations: string[] = [];

  if (weeklyPlan.length > 0) {
    recommendations.push(`✅ Weekly content plan generated with ${weeklyPlan.length} posts`);
  }

  if (topicSuggestions.length > 0) {
    const topTopic = topicSuggestions[0];
    recommendations.push(`🔥 Top trending topic: "${topTopic.topic}" (Score: ${topTopic.opportunityScore})`);
  }

  if (postingSchedule.length > 0) {
    const avgHours = postingSchedule.reduce((sum, s) => sum + s.hours.length, 0) / postingSchedule.length;
    recommendations.push(`📅 Optimal posting: ${Math.round(avgHours)} times per day`);
  }

  recommendations.push('💡 Use AI Copilot to generate scripts for each topic');
  recommendations.push('📊 Track performance and adjust strategy weekly');

  return recommendations;
}
