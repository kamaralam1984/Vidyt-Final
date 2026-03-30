import React, { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
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

interface Props {
  onChannelAnalyzed: (data: ChannelData) => void;
  isLoading: boolean;
}

export default function ChannelInputForm({ onChannelAnalyzed, isLoading }: Props) {
  const [input, setInput] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('auto');
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const niches = [
    'Auto Detect',
    'Technology',
    'Gaming',
    'Entertainment',
    'Music',
    'Education',
    'Travel',
    'Food',
    'Fashion',
    'Business',
    'Finance',
    'Health',
    'Sports',
    'Vlogs',
  ];

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      setError('Please enter a channel URL or name');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await axios.post(
        '/api/youtube/channel-intelligence',
        {
          channelInput: input.trim(),
          niche: selectedNiche === 'Auto Detect' ? null : selectedNiche,
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        onChannelAnalyzed(response.data.channelData);
      } else {
        setError(response.data.error || 'Failed to analyze channel');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to analyze channel. Please try again.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Start Analyzing</h2>
        <p className="text-gray-400 mb-8">
          Enter a YouTube channel URL or name to begin
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleAnalyze} className="space-y-6">
          {/* Channel Input */}
          <div>
            <label className="block text-sm text-gray-300 mb-3 font-semibold">
              YouTube Channel
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter URL (https://youtube.com/@channel) or channel name"
                className="w-full pl-12 pr-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
          </div>

          {/* Niche Selection */}
          <div>
            <label className="block text-sm text-gray-300 mb-3 font-semibold">
              Content Niche (Optional)
            </label>
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
            >
              {niches.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={analyzing || isLoading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {analyzing || isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Channel...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Analyze Channel
              </>
            )}
          </button>
        </form>

        {/* Tips */}
        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <p className="text-xs text-gray-500 mb-3 font-semibold">💡 TIPS:</p>
          <ul className="space-y-2 text-xs text-gray-400">
            <li>• Use full channel URL for most accurate results</li>
            <li>• Select your niche for personalized ranking & competitor data</li>
            <li>• Analysis takes 10-30 seconds depending on channel size</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
