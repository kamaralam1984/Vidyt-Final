import React, { useState } from 'react';
import { Plus, X, AlertCircle, Loader2, Users, Eye, TrendingUp, MessageSquare, Upload } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

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

interface CompetitorChannel {
  channelId: string;
  name: string;
  subscribers: number;
  totalViews: number;
  avgViewsPerVideo: number;
  engagementRate: number;
  uploadFrequency: number;
}

interface Props {
  primaryChannel: ChannelData;
  competitors: CompetitorChannel[];
  onAddCompetitor: (competitor: CompetitorChannel) => void;
  onRemoveCompetitor: (channelId: string) => void;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default function CompetitorComparison({ primaryChannel, competitors, onAddCompetitor, onRemoveCompetitor }: Props) {
  const [competitorInput, setCompetitorInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddCompetitor = async () => {
    if (!competitorInput.trim()) {
      setError('Please enter a channel name or URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        '/api/youtube/channel-intelligence',
        { channelInput: competitorInput.trim(), niche: primaryChannel.niche },
        { headers: getAuthHeaders(), timeout: 60000 }
      );

      if (response.data.success && response.data.channelData) {
        const d = response.data.channelData;
        onAddCompetitor({
          channelId: d.channelId,
          name: d.name,
          subscribers: d.subscribers,
          totalViews: d.totalViews,
          avgViewsPerVideo: d.avgViewsPerVideo,
          engagementRate: d.engagementRate,
          uploadFrequency: d.uploadFrequency,
        });
        setCompetitorInput('');
      } else {
        setError(response.data.error || 'Failed to add competitor');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add competitor');
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { label: 'Subscribers', key: 'subscribers', icon: Users, format: (v: number) => formatNumber(v), color: 'text-blue-400' },
    { label: 'Total Views', key: 'totalViews', icon: Eye, format: (v: number) => formatNumber(v), color: 'text-green-400' },
    { label: 'Avg Views', key: 'avgViewsPerVideo', icon: TrendingUp, format: (v: number) => formatNumber(v), color: 'text-cyan-400' },
    { label: 'Engagement', key: 'engagementRate', icon: MessageSquare, format: (v: number) => (v * 100).toFixed(2) + '%', color: 'text-red-400' },
    { label: 'Uploads/mo', key: 'uploadFrequency', icon: Upload, format: (v: number) => v.toFixed(1), color: 'text-amber-400' },
  ];

  const allChannels: (ChannelData | CompetitorChannel)[] = [primaryChannel, ...competitors];

  return (
    <div className="space-y-3">
      {/* Add Competitor */}
      <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5">
        <h3 className="text-sm font-bold text-white mb-3">Add Competitor ({competitors.length}/3)</h3>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {competitors.length < 3 ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={competitorInput}
              onChange={(e) => setCompetitorInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
              placeholder="Enter competitor channel URL or name"
              className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#252525] rounded-lg text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#FF0000]/50 focus:ring-1 focus:ring-[#FF0000]/20 transition"
            />
            <button
              onClick={handleAddCompetitor}
              disabled={loading}
              className="px-4 py-2 bg-[#FF0000] hover:bg-[#cc0000] text-white rounded-lg text-xs font-bold transition disabled:opacity-50 shrink-0 flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-[#555]">Maximum 3 competitors added</p>
        )}

        {/* Competitor tags */}
        {competitors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {competitors.map((comp) => (
              <div key={comp.channelId} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1a1a] border border-[#252525] rounded-full">
                <span className="text-xs text-white font-medium">{comp.name}</span>
                <button
                  onClick={() => onRemoveCompetitor(comp.channelId)}
                  className="text-[#555] hover:text-red-400 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparison - Card view for mobile, table for desktop */}
      {competitors.length > 0 && (
        <>
          {/* Mobile: Card view */}
          <div className="block md:hidden space-y-3">
            {metrics.map((metric) => {
              const values = allChannels.map(ch => (ch as any)[metric.key] as number);
              const maxValue = Math.max(...values);
              const Icon = metric.icon;

              return (
                <div key={metric.key} className="bg-[#111] rounded-xl border border-[#1f1f1f] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-4 h-4 ${metric.color}`} />
                    <span className="text-xs font-bold text-white">{metric.label}</span>
                  </div>
                  <div className="space-y-2">
                    {allChannels.map((ch, cidx) => {
                      const value = (ch as any)[metric.key] as number;
                      const isMax = value === maxValue;
                      const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
                      return (
                        <div key={cidx}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] text-[#888] truncate max-w-[50%]">
                              {ch.name} {cidx === 0 && <span className="text-[#FF0000]">(You)</span>}
                            </span>
                            <span className={`text-xs font-bold ${isMax ? 'text-green-400' : 'text-[#888]'}`}>
                              {metric.format(value)}
                            </span>
                          </div>
                          <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-500 ${
                                isMax ? 'bg-green-500' : cidx === 0 ? 'bg-[#FF0000]' : 'bg-[#333]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table view */}
          <div className="hidden md:block bg-[#111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a1a1a]">
                    <th className="px-4 py-3 text-left text-[10px] text-[#555] uppercase tracking-wider font-bold">Metric</th>
                    {allChannels.map((ch, idx) => (
                      <th key={idx} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-bold">
                        <div className="flex items-center justify-between">
                          <span className={idx === 0 ? 'text-[#FF0000]' : 'text-white'}>
                            {ch.name} {idx === 0 && '(You)'}
                          </span>
                          {idx > 0 && (
                            <button onClick={() => onRemoveCompetitor(ch.channelId)} className="text-[#444] hover:text-red-400 transition">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, midx) => {
                    const values = allChannels.map(ch => (ch as any)[metric.key] as number);
                    const maxValue = Math.max(...values);

                    return (
                      <tr key={midx} className="border-b border-[#141414] hover:bg-[#0d0d0d] transition">
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#888] font-medium">{metric.label}</span>
                        </td>
                        {allChannels.map((ch, cidx) => {
                          const value = (ch as any)[metric.key] as number;
                          const isMax = value === maxValue;
                          const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;

                          return (
                            <td key={cidx} className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${isMax ? 'text-green-400' : 'text-[#888]'}`}>
                                  {metric.format(value)}
                                </span>
                                {isMax && <span className="text-[8px] text-green-400 font-bold uppercase">Best</span>}
                              </div>
                              <div className="w-full bg-[#1a1a1a] rounded-full h-1 mt-1.5">
                                <div
                                  className={`h-1 rounded-full transition-all duration-500 ${
                                    isMax ? 'bg-green-500' : cidx === 0 ? 'bg-[#FF0000]' : 'bg-[#333]'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5">
            <h3 className="text-sm font-bold text-white mb-3">Competitive Insights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#181818]">
                <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">Your Engagement</p>
                <p className="text-lg font-bold text-[#FF0000]">{(primaryChannel.engagementRate * 100).toFixed(2)}%</p>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#181818]">
                <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">Avg Competitor</p>
                <p className="text-lg font-bold text-white">
                  {((competitors.reduce((a, c) => a + c.engagementRate, 0) / competitors.length) * 100).toFixed(2)}%
                </p>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#181818]">
                <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">Your Uploads/mo</p>
                <p className="text-lg font-bold text-white">{primaryChannel.uploadFrequency.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {competitors.length === 0 && (
        <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-8 text-center">
          <Users className="w-10 h-10 text-[#252525] mx-auto mb-3" />
          <p className="text-sm text-[#555] mb-1">No competitors added yet</p>
          <p className="text-xs text-[#444]">Add up to 3 competitor channels to see how you compare</p>
        </div>
      )}
    </div>
  );
}
