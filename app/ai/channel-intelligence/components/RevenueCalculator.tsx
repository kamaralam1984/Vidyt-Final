import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Info } from 'lucide-react';

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

function formatMoney(n: number): string {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

export default function RevenueCalculator({ channel }: Props) {
  const [customCPM, setCustomCPM] = useState<number | null>(null);
  const nicheData = cpmByNiche[channel.niche] || cpmByNiche.default;

  const revenues = useMemo(() => {
    const views30days = channel.avgViewsPerVideo * channel.uploadFrequency;
    const cpm = {
      low: customCPM || nicheData.low,
      avg: customCPM || nicheData.avg,
      high: customCPM || nicheData.high,
    };

    const calc = (views: number) => ({
      low: (views / 1000) * cpm.low,
      avg: (views / 1000) * cpm.avg,
      high: (views / 1000) * cpm.high,
    });

    return {
      daily: calc(channel.avgViewsPerVideo),
      monthly: calc(views30days),
      quarterly: calc(views30days * 3),
      yearly: calc(views30days * 12),
    };
  }, [channel, customCPM, nicheData]);

  const periods = [
    { key: 'monthly', label: 'Monthly', data: revenues.monthly, highlight: true },
    { key: 'yearly', label: 'Yearly', data: revenues.yearly, highlight: false },
    { key: 'daily', label: 'Per Video', data: revenues.daily, highlight: false },
    { key: 'quarterly', label: 'Quarterly', data: revenues.quarterly, highlight: false },
  ];

  return (
    <div className="space-y-3">
      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {periods.map((p) => (
          <div
            key={p.key}
            className={`bg-[#111] rounded-xl border p-4 sm:p-5 transition ${
              p.highlight ? 'border-green-500/30 ring-1 ring-green-500/10' : 'border-[#1f1f1f] hover:border-[#333]'
            }`}
          >
            <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-2">{p.label}</p>
            <p className="text-xl sm:text-2xl font-bold text-green-400 mb-3">
              {formatMoney(p.data.avg)}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-red-400">Low</span>
                <span className="text-red-400 font-bold">{formatMoney(p.data.low)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-blue-400">High</span>
                <span className="text-blue-400 font-bold">{formatMoney(p.data.high)}</span>
              </div>
            </div>
            {/* Mini bar */}
            <div className="mt-2 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* CPM Settings */}
      <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          CPM Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-[#555] uppercase tracking-wider font-bold mb-2">
              Niche CPM: ${nicheData.low} - ${nicheData.high} (avg ${nicheData.avg})
            </label>
            <input
              type="number"
              value={customCPM || ''}
              onChange={(e) => setCustomCPM(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder={`Default: $${nicheData.avg}`}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#252525] rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition"
            />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">Monthly Views</p>
              <p className="text-lg font-bold text-green-400">
                {((channel.avgViewsPerVideo * channel.uploadFrequency) / 1000).toFixed(0)}K
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">Uploads/mo</p>
              <p className="text-lg font-bold text-white">{channel.uploadFrequency.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Factors */}
      <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-[#555]" />
          Revenue Factors
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            'CPM varies by niche, viewer location, and seasonality',
            'Higher engagement = higher ad rates from advertisers',
            'Educational & business content earns the highest CPM',
            'Q4 (Oct-Dec) typically has 2-3x higher CPM rates',
          ].map((text, i) => (
            <p key={i} className="text-[11px] text-[#555] flex items-start gap-2">
              <span className="text-green-500 shrink-0 mt-0.5">*</span> {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
