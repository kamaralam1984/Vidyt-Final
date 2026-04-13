import React, { useMemo } from 'react';
import { Zap, TrendingUp, Users, Eye, DollarSign } from 'lucide-react';

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

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default function GrowthPrediction({ channel }: Props) {
  const predictions = useMemo(() => {
    const rate = channel.growthPercent30d / 100;
    const predictedSubs = channel.subscribers * (1 + Math.max(rate, 0.01));
    const monthlyViews = channel.avgViewsPerVideo * channel.uploadFrequency;
    const predictedViews = monthlyViews * (1 + Math.max(rate * 0.5, 0.005));
    const currentRevenue = (monthlyViews / 1000) * 4;
    const predictedRevenue = (predictedViews / 1000) * 4;

    return [
      {
        metric: 'Subscribers',
        current: channel.subscribers,
        predicted: predictedSubs,
        growth: predictedSubs - channel.subscribers,
        icon: Users,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        barColor: 'from-blue-500 to-cyan-400',
      },
      {
        metric: 'Monthly Views',
        current: monthlyViews,
        predicted: predictedViews,
        growth: predictedViews - monthlyViews,
        icon: Eye,
        color: 'text-green-400',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        barColor: 'from-green-500 to-emerald-400',
      },
      {
        metric: 'Monthly Revenue',
        current: currentRevenue,
        predicted: predictedRevenue,
        growth: predictedRevenue - currentRevenue,
        icon: DollarSign,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        barColor: 'from-amber-500 to-yellow-400',
      },
    ];
  }, [channel]);

  const confidenceScore = Math.min(Math.abs(channel.growthPercent30d) * 2 + 70, 95);

  return (
    <div className="space-y-3">
      {/* Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {predictions.map((pred, idx) => {
          const Icon = pred.icon;
          const growthPercent = pred.current > 0 ? ((pred.growth / pred.current) * 100).toFixed(1) : '0.0';
          const isPositive = pred.growth >= 0;

          const formatVal = (v: number) =>
            pred.metric === 'Monthly Revenue'
              ? `$${v >= 1000 ? (v / 1000).toFixed(1) + 'K' : v.toFixed(0)}`
              : formatNumber(v);

          return (
            <div key={idx} className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5 hover:border-[#333] transition">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`${pred.bg} ${pred.border} border p-2.5 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${pred.color}`} />
                </div>
                <span className={`text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{growthPercent}%
                </span>
              </div>

              <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">{pred.metric}</p>

              {/* Current vs Predicted */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-[#0a0a0a] rounded-lg p-2.5">
                  <p className="text-[9px] text-[#444] uppercase font-bold mb-0.5">Now</p>
                  <p className="text-sm font-bold text-white">{formatVal(pred.current)}</p>
                </div>
                <div className={`${pred.bg} ${pred.border} border rounded-lg p-2.5`}>
                  <p className={`text-[9px] ${pred.color} uppercase font-bold mb-0.5`}>30 Days</p>
                  <p className={`text-sm font-bold ${pred.color}`}>{formatVal(pred.predicted)}</p>
                </div>
              </div>

              {/* Growth bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#444]">Expected</span>
                  <span className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{formatVal(Math.abs(pred.growth))}
                  </span>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full bg-gradient-to-r ${isPositive ? pred.barColor : 'from-red-500 to-orange-400'} transition-all duration-700`}
                    style={{ width: `${Math.min(Math.abs(parseFloat(growthPercent)) * 3, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confidence + Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Confidence */}
        <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Prediction Confidence
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#1a1a1a" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke={confidenceScore > 80 ? '#22c55e' : confidenceScore > 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${(confidenceScore / 100) * 201} 201`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{confidenceScore.toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#888] leading-relaxed">
                {confidenceScore > 80
                  ? 'High confidence based on consistent growth patterns.'
                  : confidenceScore > 60
                  ? 'Moderate confidence — more data will improve accuracy.'
                  : 'Low confidence — predictions may vary significantly.'}
              </p>
              <p className="text-[10px] text-[#444] mt-1">
                Based on {channel.growthPercent30d.toFixed(1)}% growth over last 30 days
              </p>
            </div>
          </div>
        </div>

        {/* Key Factors */}
        <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5">
          <h3 className="text-sm font-bold text-white mb-3">Key Prediction Factors</h3>
          <div className="space-y-2">
            {[
              { label: 'Growth Rate (30d)', value: `${channel.growthPercent30d.toFixed(2)}%`, color: 'text-blue-400' },
              { label: 'Upload Frequency', value: `${channel.uploadFrequency.toFixed(1)} /month`, color: 'text-green-400' },
              { label: 'Engagement Rate', value: `${(channel.engagementRate * 100).toFixed(2)}%`, color: 'text-cyan-400' },
              { label: 'Channel Maturity', value: `${channel.totalVideos} videos`, color: 'text-purple-400' },
            ].map((factor, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#1a1a1a] last:border-0">
                <span className="text-xs text-[#666]">{factor.label}</span>
                <span className={`text-xs font-bold ${factor.color}`}>{factor.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-[#0d0d0d] rounded-lg p-3 border border-[#181818]">
        <p className="text-[10px] text-[#444] leading-relaxed">
          Predictions are based on historical data and assume consistent content quality and upload schedule. Actual results may vary based on algorithm changes, market conditions, and content performance.
        </p>
      </div>
    </div>
  );
}
