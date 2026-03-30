import React from 'react';
import { Trophy, Target, Flame, Zap } from 'lucide-react';

interface ChannelData {
  channelId: string;
  name: string;
  subscribers: number;
  totalViews: number;
  totalVideos: number;
  avgViewsPerVideo: number;
  engagementRate: number;
  growthPercent30d: number;
  uploadFrequency: number;
  niche: string;
  thumbnailUrl?: string;
}

interface Props {
  channel: ChannelData;
}

// Calculate scoring based on channel metrics
function calculateScore(channel: ChannelData): { global: number; niche: number; growth: number } {
  // Normalized scoring (0-10 scale)
  const subScore = Math.min((channel.subscribers / 10000000) * 10, 10);
  const viewScore = Math.min((channel.totalViews / 1000000000) * 10, 10);
  const engagementScore = Math.min(channel.engagementRate * 1000, 10);
  const consistencyScore = Math.min((channel.uploadFrequency / 8) * 10, 10);

  const globalScore = (subScore * 0.3 + viewScore * 0.3 + engagementScore * 0.2 + consistencyScore * 0.2);
  const growthScore = Math.min(Math.max(channel.growthPercent30d * 0.1 + 5, 1), 10);

  return {
    global: globalScore,
    niche: globalScore + (Math.random() * 2 - 1), // Simulate niche variation
    growth: growthScore,
  };
}

function getRankBadge(percentile: number) {
  if (percentile >= 95) return { label: '🥇 Gold', color: 'from-amber-400 to-amber-600' };
  if (percentile >= 75) return { label: '🥈 Silver', color: 'from-gray-300 to-gray-500' };
  if (percentile >= 50) return { label: '🥉 Bronze', color: 'from-orange-300 to-orange-600' };
  return { label: '⭐ Rising', color: 'from-blue-400 to-cyan-500' };
}

export default function RankingPanel({ channel }: Props) {
  const scores = calculateScore(channel);
  const globalPercentile = Math.min(Math.max(scores.global * 10, 1), 100);
  const nichePercentile = Math.min(Math.max(scores.niche * 10, 1), 100);
  const growthPercentile = scores.growth > 6 ? 85 : scores.growth > 4 ? 60 : 35;

  const globalRank = Math.floor(7000000 * ((100 - globalPercentile) / 100)) + 1;
  const nicheRank = Math.floor(5000 * ((100 - nichePercentile) / 100)) + 1;

  const ranks = [
    {
      icon: Trophy,
      title: 'Global Rank',
      rank: `#${globalRank.toLocaleString()}`,
      subtitle: `Top ${(100 - globalPercentile).toFixed(1)}% globally`,
      percentile: globalPercentile,
      color: 'from-blue-500 to-cyan-400',
      badge: getRankBadge(globalPercentile),
    },
    {
      icon: Target,
      title: 'Niche Rank',
      rank: `#${nicheRank.toLocaleString()}`,
      subtitle: `Top ${(100 - nichePercentile).toFixed(1)}% in ${channel.niche}`,
      percentile: nichePercentile,
      color: 'from-purple-500 to-pink-400',
      badge: getRankBadge(nichePercentile),
    },
    {
      icon: Flame,
      title: 'Growth Momentum',
      rank: growthPercentile > 75 ? '🔥 Rapid' : growthPercentile > 50 ? '📈 Stable' : '📊 Slow',
      subtitle: `${scores.growth.toFixed(1)}/10 growth score`,
      percentile: growthPercentile,
      color: 'from-orange-500 to-red-400',
      badge: getRankBadge(growthPercentile),
    },
  ];

  return (
    <div className="space-y-6">
      {ranks.map((rank, idx) => {
        const Icon = rank.icon;
        return (
          <div
            key={idx}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`bg-gradient-to-br ${rank.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{rank.title}</h3>
                  <p className="text-gray-400 text-sm">{rank.subtitle}</p>
                </div>
              </div>
              <div className={`bg-gradient-to-br ${rank.badge.color} px-4 py-2 rounded-lg`}>
                <p className="text-white font-bold text-sm text-center">{rank.badge.label}</p>
              </div>
            </div>

            {/* Rank Value */}
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4">
              {rank.rank}
            </div>

            {/* Percentile Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Percentile</span>
                <span className="text-sm font-semibold text-white">{rank.percentile.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700/30 rounded-full h-3 overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${rank.color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${rank.percentile}%` }}
                ></div>
              </div>
            </div>

            {/* Insights */}
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-gray-400">
                {rank.percentile > 75
                  ? '✨ You are performing exceptionally well in this category!'
                  : rank.percentile > 50
                  ? '📊 Good performance. Focus on growth opportunities.'
                  : '💪 Room to improve. Check AI insights for recommendations.'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
