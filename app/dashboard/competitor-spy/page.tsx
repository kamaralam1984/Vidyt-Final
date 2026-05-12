'use client';

import { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { Search, AlertCircle, Loader2, TrendingUp, Zap, Target, Users, Eye } from 'lucide-react';

interface TopFormat {
  format: string;
  avgViews: string;
  whyItWorks: string;
}

interface CompetitorData {
  channelSummary: string;
  growthVelocity: 'high' | 'medium' | 'low';
  estimatedMonthlyViews: string;
  topFormats: TopFormat[];
  hookStyles: string[];
  thumbnailPatterns: string[];
  postingFrequency: string;
  viralTopics: string[];
  audienceInsights: string;
  weaknesses: string[];
  opportunitiesToBeat: string[];
}

const VELOCITY_COLORS = {
  high: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  medium: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  low: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

export default function CompetitorSpyPage() {
  const [channelName, setChannelName] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<CompetitorData | null>(null);

  const handleAnalyze = async () => {
    if (!channelName.trim()) { setError('Channel name is required.'); return; }
    setError('');
    setLoading(true);
    setData(null);
    try {
      const res = await axios.post('/api/competitor-spy', { channelName, niche }, { headers: getAuthHeaders() });
      setData(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Search className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Competitor Spy</h1>
            <p className="text-sm text-[#666]">Reverse-engineer any creator&apos;s growth playbook.</p>
          </div>
        </div>

        <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Channel Name <span className="text-[#FF0000]">*</span>
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={e => setChannelName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  placeholder="e.g. MrBeast, MKBHD, Graham Stephan..."
                  className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-purple-500/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Their Niche <span className="text-[#444] font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  placeholder="e.g. Finance, Tech Reviews, Gaming..."
                  className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-purple-500/40 transition-colors"
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing channel...</> : <><Search className="w-4 h-4" /> Spy on This Channel</>}
            </button>
          </div>
        </div>

        {data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Overview */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h2 className="text-lg font-bold text-white">{channelName}</h2>
                {data.growthVelocity && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${VELOCITY_COLORS[data.growthVelocity].bg} ${VELOCITY_COLORS[data.growthVelocity].text} ${VELOCITY_COLORS[data.growthVelocity].border}`}>
                    {data.growthVelocity.toUpperCase()} GROWTH
                  </span>
                )}
                <span className="text-xs text-[#555] ml-auto">{data.estimatedMonthlyViews}/mo · {data.postingFrequency}</span>
              </div>
              <p className="text-sm text-[#AAAAAA] leading-relaxed">{data.channelSummary}</p>
            </div>

            {/* Top formats */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Top Performing Formats
              </h2>
              <div className="space-y-3">
                {data.topFormats.map((f, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">{f.format}</span>
                      <span className="text-xs text-purple-400 font-bold">{f.avgViews} avg</span>
                    </div>
                    <p className="text-xs text-[#666]">{f.whyItWorks}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hook styles + Thumbnail patterns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" /> Hook Styles
                </h2>
                <div className="space-y-2">
                  {data.hookStyles.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[#888]">
                      <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      {h}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" /> Thumbnail Formula
                </h2>
                <div className="space-y-2">
                  {data.thumbnailPatterns.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[#888]">
                      <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Viral topics + audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400" /> Viral Topics
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.viralTopics.map((t, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300">{t}</span>
                  ))}
                </div>
              </div>
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" /> Audience Insights
                </h2>
                <p className="text-sm text-[#888] leading-relaxed">{data.audienceInsights}</p>
              </div>
            </div>

            {/* Opportunities to beat */}
            <div className="bg-gradient-to-br from-[#08060f] to-[#0F0F0F] border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" /> How to Beat Them
              </h2>
              <div className="space-y-3">
                {data.opportunitiesToBeat.map((opp, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-[#AAAAAA]">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold">{i + 1}</span>
                    {opp}
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Their Weaknesses
              </h2>
              <div className="space-y-2">
                {data.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-[#888]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
