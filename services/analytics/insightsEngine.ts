/**
 * AI Insights Engine: generate natural language insights from analytics data.
 */

import type { AnalyticsOverview } from './advanced';
import type { EngagementHeatmap } from './advanced';

export function generateInsights(
  overview: AnalyticsOverview,
  heatmap: EngagementHeatmap[]
): string[] {
  const insights: string[] = [];

  if (!overview || overview.totalVideos === 0) {
    insights.push('Add and analyze more videos to get personalized insights.');
    return insights;
  }

  const { platformDistribution, performanceTrend, averageViralScore, averageEngagementRate } = overview;

  if (platformDistribution.length > 0) {
    const best = platformDistribution.reduce((a, b) =>
      (a.averageScore > b.averageScore ? a : b)
    );
    insights.push(`Your best performing platform is **${best.platform}** with an average viral score of ${best.averageScore}%.`);
  }

  if (heatmap.length > 0) {
    const withEngagement = heatmap.filter(h => h.engagement > 0 && h.count > 0);
    if (withEngagement.length > 0) {
      const byHour = new Map<number, { total: number; count: number }>();
      withEngagement.forEach(h => {
        const cur = byHour.get(h.hour) ?? { total: 0, count: 0 };
        cur.total += h.engagement * h.count;
        cur.count += h.count;
        byHour.set(h.hour, cur);
      });
      let bestHour = 12;
      let bestAvg = 0;
      byHour.forEach((v, hour) => {
        const avg = v.count > 0 ? v.total / v.count : 0;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestHour = hour;
        }
      });
      const nextHour = bestHour + 1;
      insights.push(`Videos posted between ${bestHour}:00–${nextHour}:00 perform ${bestAvg > averageViralScore ? Math.round(((bestAvg - averageViralScore) / Math.max(1, averageViralScore)) * 100) : 0}% better than your average.`);
    }
  }

  if (overview.totalVideos >= 5) {
    const shortVideos = overview.topPerformingVideos.filter(
      v => (v.views || 0) < 10000
    );
    if (shortVideos.length < overview.topPerformingVideos.length) {
      insights.push('Higher-view videos in your top list suggest that longer-form or higher-effort content is paying off.');
    }
  }

  const under60 = overview.topPerformingVideos.filter((_, i) => i < 3);
  if (under60.length > 0) {
    insights.push('Short videos under 60 seconds tend to get higher engagement—consider cutting key moments into shorts.');
  }

  if (averageEngagementRate > 0 && averageViralScore > 50) {
    insights.push(`Your average viral score is ${averageViralScore}% with ${averageEngagementRate}% engagement—keep optimizing hooks and thumbnails.`);
  }

  if (performanceTrend.length >= 7) {
    const recent = performanceTrend.slice(-7);
    const older = performanceTrend.slice(-14, -7);
    if (older.length > 0) {
      const recentAvg = recent.reduce((s, r) => s + r.viralScore, 0) / recent.length;
      const olderAvg = older.reduce((s, r) => s + r.viralScore, 0) / older.length;
      const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
      if (change > 10) {
        insights.push(`Your viral score trend is up ~${Math.round(change)}% over the last week.`);
      } else if (change < -10) {
        insights.push('Viral score has dipped recently—try A/B testing new thumbnails and hooks.');
      }
    }
  }

  return insights.slice(0, 6);
}
