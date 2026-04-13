import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, Sparkles, Youtube } from 'lucide-react';
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
  description?: string;
  bannerUrl?: string;
  recentVideos?: any[];
  aiInsights?: any;
  audit?: any;
}

interface Props {
  onChannelAnalyzed: (data: ChannelData) => void;
  isLoading: boolean;
}

export default function ChannelInputForm({ onChannelAnalyzed, isLoading }: Props) {
  const [input, setInput] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('Auto Detect');
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState('');

  const niches = [
    'Auto Detect', 'Technology', 'Gaming', 'Entertainment', 'Music',
    'Education', 'Travel', 'Food', 'Fashion', 'Business', 'Finance',
    'Health', 'Sports', 'Vlogs', 'Comedy', 'Science', 'DIY', 'Fitness',
  ];

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      setError('Please enter a channel URL or name');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setProgress('Connecting to YouTube API...');

    try {
      const progressTimer = setTimeout(() => setProgress('Fetching channel data & recent videos...'), 3000);
      const progressTimer2 = setTimeout(() => setProgress('Running AI analysis...'), 8000);
      const progressTimer3 = setTimeout(() => setProgress('Generating insights & predictions...'), 15000);

      const response = await axios.post(
        '/api/youtube/channel-intelligence',
        {
          channelInput: input.trim(),
          niche: selectedNiche === 'Auto Detect' ? null : selectedNiche,
        },
        { headers: getAuthHeaders(), timeout: 60000 }
      );

      clearTimeout(progressTimer);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);

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
      setProgress('');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-0">
      <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-6 sm:p-8 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#FF0000]/10 flex items-center justify-center">
              <Youtube className="w-8 h-8 text-[#FF0000]" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FF0000] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-1">Analyze Any Channel</h2>
        <p className="text-[#555] text-sm text-center mb-6">
          Get AI-powered insights, rankings, and growth predictions
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-[10px] text-[#555] uppercase tracking-wider font-bold mb-2">
              YouTube Channel
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-[#444]" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://youtube.com/@channel or channel name"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-[#252525] rounded-lg text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#FF0000]/50 focus:ring-1 focus:ring-[#FF0000]/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-[#555] uppercase tracking-wider font-bold mb-2">
              Content Niche
            </label>
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#252525] rounded-lg text-white text-sm focus:outline-none focus:border-[#FF0000]/50 focus:ring-1 focus:ring-[#FF0000]/20 transition appearance-none"
            >
              {niches.map((niche) => (
                <option key={niche} value={niche}>{niche}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={analyzing || isLoading}
            className="w-full py-3 rounded-lg bg-[#FF0000] hover:bg-[#cc0000] text-white text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {analyzing || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">{progress || 'Analyzing...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Channel
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#1a1a1a]">
          <p className="text-[10px] text-[#444] uppercase tracking-wider font-bold mb-2">Supported Formats</p>
          <div className="grid grid-cols-1 gap-1.5 text-[11px] text-[#555]">
            <span>youtube.com/@channelname</span>
            <span>youtube.com/channel/UC...</span>
            <span>youtube.com/watch?v=... (video URL)</span>
            <span>Channel name (search)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
