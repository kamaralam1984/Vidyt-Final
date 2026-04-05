/**
 * Advanced Analytics Service
 * Provides deep insights and metrics for video performance
 */

import Video from '@/models/Video';
import Analysis from '@/models/Analysis';
import EngagementMetrics from '@/models/EngagementMetrics';
import ViralDataset from '@/models/ViralDataset';
import connectDB from '@/lib/mongodb';

export interface AnalyticsOverview {
  totalVideos: number;
  totalAnalyses: number;
  averageViralScore: number;
  averageEngagementRate: number;
  topPerformingVideos: Array<{
    id: string;
    title: string;
    viralScore: number;
    views: number;
    engagementRate: number;
  }>;
  performanceTrend: Array<{
    date: string;
    viralScore: number;
    engagementRate: number;
  }>;
  platformDistribution: Array<{
    platform: string;
    count: number;
    averageScore: number;
  }>;
}

export interface RetentionAnalysis {
  videoId: string;
  title: string;
  averageRetention: number;
  dropOffPoints: Array<{ time: number; percentage: number }>;
  peakEngagement: number;
  peakTime: number;
}

export interface EngagementHeatmap {
  day: string;
  hour: number;
  engagement: number;
  count: number;
}

export interface GrowthCurve {
  videoId: string;
  title: string;
  dataPoints: Array<{
    date: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
  growthVelocity: number;
  peakViews: number;
}

/**
 * Get comprehensive analytics overview
 */
export async function getAnalyticsOverview(
  userId: string,
  startDate?: Date,
  endDate?: Date,
  workspaceId?: string
): Promise<AnalyticsOverview> {
  await connectDB();

  const dateFilter: any = {};
  if (startDate || endDate) {
    dateFilter.uploadedAt = {};
    if (startDate) dateFilter.uploadedAt.$gte = startDate;
    if (endDate) dateFilter.uploadedAt.$lte = endDate;
  }

  const query: any = { userId, ...dateFilter };
  if (workspaceId) {
    query.workspaceId = workspaceId;
  }

  const videos = await Video.find(query);
  const videoIds = videos.map(v => v._id);
  
  const analyses = await Analysis.find({ videoId: { $in: videoIds } });

  // Calculate averages
  const totalVideos = videos.length;
  const totalAnalyses = analyses.length;
  
  const avgViralScore = analyses.length > 0
    ? analyses.reduce((sum, a) => sum + (a.viralProbability || 0), 0) / analyses.length
    : 0;

  const avgEngagementRate = analyses.length > 0
    ? analyses.reduce((sum, a) => sum + (a.thumbnailScore || 0), 0) / analyses.length
    : 0;

  // Top performing videos
  const topPerformers = analyses
    .map(a => {
      const video = videos.find(v => v._id.toString() === a.videoId.toString());
      return {
        id: a.videoId.toString(),
        title: video?.title || 'Unknown',
        viralScore: a.viralProbability || 0,
        views: video?.views || 0,
        engagementRate: a.thumbnailScore || 0,
      };
    })
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 10);

  // Performance trend (last 30 days)
  const trendData: Map<string, { viralScore: number; engagementRate: number; count: number }> = new Map();
  
  analyses.forEach(a => {
    const video = videos.find(v => v._id.toString() === a.videoId.toString());
    if (video?.uploadedAt) {
      const date = video.uploadedAt.toISOString().split('T')[0];
      const existing = trendData.get(date) || { viralScore: 0, engagementRate: 0, count: 0 };
      existing.viralScore += a.viralProbability || 0;
      existing.engagementRate += a.thumbnailScore || 0;
      existing.count++;
      trendData.set(date, existing);
    }
  });

  const performanceTrend = Array.from(trendData.entries())
    .map(([date, data]) => ({
      date,
      viralScore: Math.round(data.viralScore / data.count),
      engagementRate: Math.round(data.engagementRate / data.count),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days

  // Platform distribution
  const platformMap = new Map<string, { count: number; totalScore: number }>();
  videos.forEach(video => {
    const platform = video.platform || 'unknown';
    const existing = platformMap.get(platform) || { count: 0, totalScore: 0 };
    existing.count++;
    const analysis = analyses.find(a => a.videoId.toString() === video._id.toString());
    if (analysis) {
      existing.totalScore += analysis.viralProbability || 0;
    }
    platformMap.set(platform, existing);
  });

  const platformDistribution = Array.from(platformMap.entries()).map(([platform, data]) => ({
    platform,
    count: data.count,
    averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
  }));

  return {
    totalVideos,
    totalAnalyses,
    averageViralScore: Math.round(avgViralScore),
    averageEngagementRate: Math.round(avgEngagementRate),
    topPerformingVideos: topPerformers,
    performanceTrend,
    platformDistribution,
  };
}

/**
 * Analyze viewer retention
 */
export async function analyzeRetention(
  videoId: string
): Promise<RetentionAnalysis | null> {
  await connectDB();

  const video = await Video.findById(videoId);
  if (!video) return null;

  const metrics = await EngagementMetrics.find({ videoId })
    .sort({ timestamp: 1 });

  if (metrics.length === 0) {
    return {
      videoId: video._id.toString(),
      title: video.title,
      averageRetention: 0,
      dropOffPoints: [],
      peakEngagement: 0,
      peakTime: 0,
    };
  }

  // Calculate retention from metrics
  const retentionData = metrics.map(m => ({
    time: m.timestamp.getTime(),
    retention: m.retentionRate || 0,
  }));

  const averageRetention = retentionData.length > 0
    ? retentionData.reduce((sum, d) => sum + d.retention, 0) / retentionData.length
    : 0;

  // Find drop-off points (significant decreases)
  const dropOffPoints: Array<{ time: number; percentage: number }> = [];
  for (let i = 1; i < retentionData.length; i++) {
    const drop = retentionData[i - 1].retention - retentionData[i].retention;
    if (drop > 10) { // More than 10% drop
      dropOffPoints.push({
        time: retentionData[i].time,
        percentage: drop,
      });
    }
  }

  // Find peak engagement
  const peakMetric = metrics.reduce((max, m) => 
    (m.engagementRate || 0) > (max.engagementRate || 0) ? m : max
  );

  return {
    videoId: video._id.toString(),
    title: video.title,
    averageRetention: Math.round(averageRetention),
    dropOffPoints: dropOffPoints.slice(0, 5), // Top 5 drop-offs
    peakEngagement: Math.round(peakMetric.engagementRate || 0),
    peakTime: peakMetric.timestamp.getTime(),
  };
}

/**
 * Generate engagement heatmap
 */
export async function generateEngagementHeatmap(
  userId: string
): Promise<EngagementHeatmap[]> {
  await connectDB();

  const videos = await Video.find({ userId });
  const videoIds = videos.map(v => v._id);
  const analyses = await Analysis.find({ videoId: { $in: videoIds } });

  const heatmapMap = new Map<string, { engagement: number; count: number }>();

  videos.forEach(video => {
    const analysis = analyses.find(a => a.videoId.toString() === video._id.toString());
    if (video.uploadedAt && analysis) {
      const day = video.uploadedAt.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = video.uploadedAt.getHours();
      const key = `${day}-${hour}`;

      const existing = heatmapMap.get(key) || { engagement: 0, count: 0 };
      existing.engagement += analysis.viralProbability || 0;
      existing.count++;
      heatmapMap.set(key, existing);
    }
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const heatmap: EngagementHeatmap[] = [];

  days.forEach(day => {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      const data = heatmapMap.get(key);
      heatmap.push({
        day,
        hour,
        engagement: data ? Math.round(data.engagement / data.count) : 0,
        count: data?.count || 0,
      });
    }
  });

  return heatmap;
}

/**
 * Generate growth curve for video
 */
export async function generateGrowthCurve(
  videoId: string
): Promise<GrowthCurve | null> {
  await connectDB();

  const video = await Video.findById(videoId);
  if (!video) return null;

  const metrics = await EngagementMetrics.find({ videoId })
    .sort({ timestamp: 1 });

  if (metrics.length === 0) {
    return {
      videoId: video._id.toString(),
      title: video.title,
      dataPoints: [],
      growthVelocity: 0,
      peakViews: video.views || 0,
    };
  }

  const dataPoints = metrics.map(m => ({
    date: m.timestamp.toISOString(),
    views: m.views,
    likes: m.likes,
    comments: m.comments,
    shares: m.shares,
  }));

  // Calculate growth velocity (views per day)
  const firstMetric = metrics[0];
  const lastMetric = metrics[metrics.length - 1];
  const daysDiff = (lastMetric.timestamp.getTime() - firstMetric.timestamp.getTime()) / (1000 * 60 * 60 * 24);
  const growthVelocity = daysDiff > 0
    ? (lastMetric.views - firstMetric.views) / daysDiff
    : 0;

  const peakViews = Math.max(...metrics.map(m => m.views));

  return {
    videoId: video._id.toString(),
    title: video.title,
    dataPoints,
    growthVelocity: Math.round(growthVelocity),
    peakViews,
  };
}

/**
 * Get benchmark comparison
 */
export async function getBenchmarkComparison(
  userId: string
): Promise<{
  userMetrics: {
    averageViralScore: number;
    averageEngagementRate: number;
    averageViews: number;
  };
  industryBenchmarks: {
    averageViralScore: number;
    averageEngagementRate: number;
    averageViews: number;
  };
  percentile: number;
}> {
  await connectDB();

  // Get user metrics
  const userVideos = await Video.find({ userId });
  const userVideoIds = userVideos.map(v => v._id);
  const userAnalyses = await Analysis.find({ videoId: { $in: userVideoIds } });

  const userAvgViral = userAnalyses.length > 0
    ? userAnalyses.reduce((sum, a) => sum + (a.viralProbability || 0), 0) / userAnalyses.length
    : 0;

  const userAvgEngagement = userAnalyses.length > 0
    ? userAnalyses.reduce((sum, a) => sum + (a.thumbnailScore || 0), 0) / userAnalyses.length
    : 0;

  const userAvgViews = userVideos.length > 0
    ? userVideos.reduce((sum, v) => sum + (v.views || 0), 0) / userVideos.length
    : 0;

  // Get industry benchmarks from viral dataset
  const industryVideos = await ViralDataset.find({ isViral: true }).limit(1000);
  
  const industryAvgViral = industryVideos.length > 0
    ? industryVideos.reduce((sum, v) => sum + (v.engagementRate || 0), 0) / industryVideos.length
    : 0;

  const industryAvgEngagement = industryAvgViral; // Simplified
  const industryAvgViews = industryVideos.length > 0
    ? industryVideos.reduce((sum, v) => sum + (v.views || 0), 0) / industryVideos.length
    : 0;

  // Calculate percentile (simplified)
  const percentile = userAvgViral > industryAvgViral ? 75 : userAvgViral > industryAvgViral * 0.8 ? 50 : 25;

  return {
    userMetrics: {
      averageViralScore: Math.round(userAvgViral),
      averageEngagementRate: Math.round(userAvgEngagement),
      averageViews: Math.round(userAvgViews),
    },
    industryBenchmarks: {
      averageViralScore: Math.round(industryAvgViral),
      averageEngagementRate: Math.round(industryAvgEngagement),
      averageViews: Math.round(industryAvgViews),
    },
    percentile,
  };
}
