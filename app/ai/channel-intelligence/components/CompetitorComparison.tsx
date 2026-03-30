import React, { useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
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

export default function CompetitorComparison({
  primaryChannel,
  competitors,
  onAddCompetitor,
  onRemoveCompetitor,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
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
        {
          channelInput: competitorInput.trim(),
          niche: primaryChannel.niche,
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success && response.data.channelData) {
        const channelData = response.data.channelData;
        onAddCompetitor({
          channelId: channelData.channelId,
          name: channelData.name,
          subscribers: channelData.subscribers,
          totalViews: channelData.totalViews,
          avgViewsPerVideo: channelData.avgViewsPerVideo,
          engagementRate: channelData.engagementRate,
          uploadFrequency: channelData.uploadFrequency,
        });
        setCompetitorInput('');
        setShowAddForm(false);
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
    { label: 'Subscribers', key: 'subscribers', format: (v: number) => (v / 1000000).toFixed(1) + 'M' },
    { label: 'Total Views', key: 'totalViews', format: (v: number) => (v / 1000000).toFixed(1) + 'M' },
    { label: 'Avg Views/Video', key: 'avgViewsPerVideo', format: (v: number) => (v / 1000).toFixed(0) + 'K' },
    { label: 'Engagement Rate', key: 'engagementRate', format: (v: number) => (v * 100).toFixed(2) + '%' },
    { label: 'Monthly Uploads', key: 'uploadFrequency', format: (v: number) => v.toFixed(1) },
  ];

  const allChannels = [
    { ...primaryChannel, isPrimary: true },
    ...competitors,
  ];

  return (
    <div className="space-y-6">
      {/* Add Competitor Section */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <h3 className="text-white font-semibold mb-4">Add Competitors</h3>
        {competitors.length < 3 ? (
          <>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            {showAddForm ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  placeholder="Enter competitor channel URL or name"
                  className="w-full px-4 py-2 bg-slate-700/30 border border-slate-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCompetitor()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCompetitor}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {loading ? '🔄 Adding...' : 'Add Competitor'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setError(null);
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 border-2 border-dashed border-slate-600/50 rounded-lg text-blue-400 hover:border-blue-500/50 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Competitor ({competitors.length}/3)
              </button>
            )}
          </>
        ) : (
          <p className="text-gray-400">Maximum 3 competitors added</p>
        )}
      </div>

      {/* Comparison Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Metric</th>
                {allChannels.map((channel, idx) => (
                  <th key={idx} className="px-6 py-4 text-left text-sm font-semibold text-white">
                    <div className="flex items-center justify-between">
                      <span>
                        {channel.name}
                        {(channel as any).isPrimary && (
                          <span className="text-xs text-blue-400 ml-2">(Your Channel)</span>
                        )}
                      </span>
                      {!( channel as any).isPrimary && (
                        <button
                          onClick={() => onRemoveCompetitor(channel.channelId)}
                          className="text-gray-500 hover:text-red-400 transition ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, midx) => {
                const values = allChannels.map(
                  (ch) => (ch as any)[metric.key as keyof typeof ch]
                );
                const maxValue = Math.max(...values);

                return (
                  <tr key={midx} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-400">{metric.label}</td>
                    {allChannels.map((channel, cidx) => {
                      const value = (channel as any)[metric.key as keyof typeof channel];
                      const percentOfMax = (value / maxValue) * 100;
                      const isMax = value === maxValue;

                      return (
                        <td key={cidx} className="px-6 py-4 text-sm relative">
                          <div className="relative z-10">
                            <span
                              className={`font-semibold ${
                                isMax ? 'text-green-400' : 'text-gray-300'
                              }`}
                            >
                              {metric.format(value)}
                            </span>
                          </div>
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded"
                            style={{ width: `${percentOfMax}%` }}
                          ></div>
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
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <h3 className="text-white font-semibold mb-4">Competitive Insights</h3>
        <div className="space-y-3 text-sm text-gray-400">
          {competitors.length === 0 ? (
            <p>Add competitors to see comparative insights</p>
          ) : (
            <>
              <p>
                ✓ Your engagement rate:{' '}
                <span className="text-white font-semibold">
                  {(primaryChannel.engagementRate * 100).toFixed(2)}%
                </span>
              </p>
              <p>
                ✓ Average competitor engagement:{' '}
                <span className="text-white font-semibold">
                  {(
                    (competitors.reduce((a, c) => a + c.engagementRate, 0) / competitors.length) *
                    100
                  ).toFixed(2)}
                  %
                </span>
              </p>
              <p>
                ✓ Your upload frequency:{' '}
                <span className="text-white font-semibold">
                  {primaryChannel.uploadFrequency.toFixed(1)} videos/month
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
