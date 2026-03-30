import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

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

// CPM ranges by niche (in USD)
const cpmByNiche: Record<string, { low: number; avg: number; high: number }> = {
  Technology: { low: 4, avg: 8, high: 15 },
  Gaming: { low: 2, avg: 5, high: 10 },
  Entertainment: { low: 1, avg: 3, high: 8 },
  Music: { low: 0.5, avg: 2, high: 5 },
  Education: { low: 3, avg: 7, high: 12 },
  Travel: { low: 2, avg: 4, high: 8 },
  Food: { low: 1, avg: 3, high: 6 },
  Fashion: { low: 1, avg: 3, high: 7 },
  Business: { low: 5, avg: 10, high: 20 },
  Finance: { low: 6, avg: 12, high: 25 },
  Health: { low: 3, avg: 6, high: 12 },
  Sports: { low: 2, avg: 5, high: 10 },
  Vlogs: { low: 1, avg: 2, high: 5 },
  default: { low: 2, avg: 4, high: 8 },
};

export default function RevenueCalculator({ channel }: Props) {
  const [customCPM, setCustomCPM] = useState<number | null>(null);

  const nicheData = cpmByNiche[channel.niche] || cpmByNiche.default;

  const revenues = useMemo(() => {
    const views30days = channel.avgViewsPerVideo * channel.uploadFrequency;
    const views90days = views30days * 3;
    const views365days = views30days * 12;

    const cpmToUse = {
      low: customCPM || nicheData.low,
      avg: customCPM || nicheData.avg,
      high: customCPM || nicheData.high,
    };

    return {
      daily: {
        low: (channel.avgViewsPerVideo / 1000) * cpmToUse.low,
        avg: (channel.avgViewsPerVideo / 1000) * cpmToUse.avg,
        high: (channel.avgViewsPerVideo / 1000) * cpmToUse.high,
      },
      monthly: {
        low: (views30days / 1000) * cpmToUse.low,
        avg: (views30days / 1000) * cpmToUse.avg,
        high: (views30days / 1000) * cpmToUse.high,
      },
      quarterly: {
        low: (views90days / 1000) * cpmToUse.low,
        avg: (views90days / 1000) * cpmToUse.avg,
        high: (views90days / 1000) * cpmToUse.high,
      },
      yearly: {
        low: (views365days / 1000) * cpmToUse.low,
        avg: (views365days / 1000) * cpmToUse.avg,
        high: (views365days / 1000) * cpmToUse.high,
      },
    };
  }, [channel, customCPM, nicheData]);

  const revenueBreakdown = [
    {
      period: 'Daily',
      data: revenues.daily,
      icon: '📅',
    },
    {
      period: 'Monthly',
      data: revenues.monthly,
      icon: '📊',
    },
    {
      period: 'Quarterly',
      data: revenues.quarterly,
      icon: '📈',
    },
    {
      period: 'Yearly',
      data: revenues.yearly,
      icon: '🎯',
    },
  ];

  return (
    <div className="space-y-6">
      {/* CPM Settings */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          CPM Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Niche-based CPM Range: ${nicheData.low} - ${nicheData.high}
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Custom CPM (leave empty for average)</p>
                <input
                  type="number"
                  value={customCPM || ''}
                  onChange={(e) =>
                    setCustomCPM(e.target.value ? parseFloat(e.target.value) : null)
                  }
                  placeholder={`Default: $${nicheData.avg}`}
                  className="w-full px-3 py-2 bg-slate-700/30 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs text-gray-500 mb-1">Avg Monthly Views</p>
                <p className="text-lg font-bold text-green-400">
                  {(channel.avgViewsPerVideo * channel.uploadFrequency / 1000).toFixed(0)}K
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="space-y-4">
        {revenueBreakdown.map((item, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">{item.icon} {item.period} Revenue</h3>
              <span className="text-2xl font-bold text-green-400">
                ${item.data.avg.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* Range Display */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  <p className="text-xs text-gray-400 mb-1">Low Range</p>
                  <p className="text-sm font-bold text-red-400">
                    ${item.data.low.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                  <p className="text-xs text-gray-400 mb-1">Mid Range</p>
                  <p className="text-sm font-bold text-green-400">
                    ${item.data.avg.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                  <p className="text-xs text-gray-400 mb-1">High Range</p>
                  <p className="text-sm font-bold text-blue-400">
                    ${item.data.high.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-slate-700/30 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500"
                  style={{
                    width: '100%',
                  }}
                ></div>
                <div
                  className="absolute h-full w-2 bg-white border-l-2 border-white"
                  style={{
                    left: `${((item.data.avg - item.data.low) / (item.data.high - item.data.low)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 mt-3">
              💡 Based on YouTube Partner Program estimates. Actual earnings may vary based on engagement, viewer location, and content type.
            </p>
          </div>
        ))}
      </div>

      {/* Key Factors */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Revenue Factors
        </h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>✓ CPM varies by niche, location of viewers, and seasonality</li>
          <li>✓ Engagement rate affects ad rates (higher engagement = higher CPM)</li>
          <li>✓ Content type impacts monetization (educational content = higher CPM)</li>
          <li>✓ Time of year affects CPM (Q4 holiday season typically highest)</li>
        </ul>
      </div>
    </div>
  );
}
