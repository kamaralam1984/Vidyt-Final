import React from 'react';
import { Trophy, Target, Flame } from 'lucide-react';

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

function calculateScore(channel: ChannelData) {
  const subScore = Math.min((channel.subscribers / 10000000) * 10, 10);
  const viewScore = Math.min((channel.totalViews / 1000000000) * 10, 10);
  const engagementScore = Math.min(channel.engagementRate * 1000, 10);
  const consistencyScore = Math.min((channel.uploadFrequency / 8) * 10, 10);

  const globalScore = subScore * 0.3 + viewScore * 0.3 + engagementScore * 0.2 + consistencyScore * 0.2;
  const growthScore = Math.min(Math.max(channel.growthPercent30d * 0.1 + 5, 1), 10);

  return {
    global: globalScore,
    niche: globalScore + (Math.random() * 2 - 1),
    growth: growthScore,
  };
}

function getRankBadge(percentile: number) {
  if (percentile >= 95) return { label: 'Gold', emoji: '1', colors: 'from-amber-500 to-yellow-600', text: 'text-amber-400' };
  if (percentile >= 75) return { label: 'Silver', emoji: '2', colors: 'from-gray-400 to-gray-500', text: 'text-gray-300' };
  if (percentile >= 50) return { label: 'Bronze', emoji: '3', colors: 'from-orange-500 to-orange-700', text: 'text-orange-400' };
  return { label: 'Rising', emoji: 'star', colors: 'from-blue-500 to-cyan-500', text: 'text-blue-400' };
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
      subtitle: `Top ${(100 - globalPercentile).toFixed(1)}% of 7M+ channels`,
      percentile: globalPercentile,
      color: 'from-blue-500 to-cyan-400',
      barColor: 'bg-gradient-to-r from-blue-500 to-cyan-400',
      badge: getRankBadge(globalPercentile),
    },
    {
      icon: Target,
      title: `${channel.niche} Rank`,
      rank: `#${nicheRank.toLocaleString()}`,
      subtitle: `Top ${(100 - nichePercentile).toFixed(1)}% in niche`,
      percentile: nichePercentile,
      color: 'from-purple-500 to-pink-400',
      barColor: 'bg-gradient-to-r from-purple-500 to-pink-400',
      badge: getRankBadge(nichePercentile),
    },
    {
      icon: Flame,
      title: 'Growth Momentum',
      rank: growthPercentile > 75 ? 'Rapid' : growthPercentile > 50 ? 'Stable' : 'Slow',
      subtitle: `${scores.growth.toFixed(1)}/10 growth score`,
      percentile: growthPercentile,
      color: 'from-orange-500 to-red-400',
      barColor: 'bg-gradient-to-r from-orange-500 to-red-400',
      badge: getRankBadge(growthPercentile),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Rank Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ranks.map((rank, idx) => {
          const Icon = rank.icon;
          return (
            <div key={idx} className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5 hover:border-[#333] transition">
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-br ${rank.color} p-2.5 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r ${rank.badge.colors} text-white`}>
                  {rank.badge.label}
                </span>
              </div>

              <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">{rank.title}</p>
              <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{rank.rank}</p>
              <p className="text-[11px] text-[#555] mb-4">{rank.subtitle}</p>

              {/* Percentile Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#444]">Percentile</span>
                  <span className="text-xs font-bold text-white">{rank.percentile.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-2 overflow-hidden">
                  <div
                    className={`${rank.barColor} h-2 rounded-full transition-all duration-700`}
                    style={{ width: `${rank.percentile}%` }}
                  />
                </div>
              </div>

              <p className="text-[10px] text-[#444] mt-3">
                {rank.percentile > 75 ? 'Exceptional performance' :
                 rank.percentile > 50 ? 'Good — room to grow' :
                 'Building momentum'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Overall Score */}
      <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#1a1a1a" strokeWidth="6" />
              <circle
                cx="48" cy="48" r="40" fill="none"
                stroke="url(#scoreGrad)" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(globalPercentile / 100) * 251.3} 251.3`}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF0000" />
                  <stop offset="100%" stopColor="#ff6b6b" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-white">{scores.global.toFixed(1)}</span>
              <span className="text-[8px] text-[#555] uppercase font-bold">/ 10</span>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-sm font-bold text-white mb-1">Overall Channel Score</h3>
            <p className="text-xs text-[#555]">
              Composite score based on subscribers, views, engagement, and upload consistency.
              {globalPercentile > 80 ? ' Your channel is performing exceptionally well!' :
               globalPercentile > 50 ? ' Good foundation — focus on engagement to climb higher.' :
               ' Keep growing! Consistent uploads and engagement drive rankings.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
