'use client';

import { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { Image as ImageIcon, AlertCircle, Loader2, CheckCircle2, Zap, Copy, TrendingUp } from 'lucide-react';

interface ThumbnailScores {
  readability: number;
  emotionalImpact: number;
  colorContrast: number;
  clutterScore: number;
  curiosityGap: number;
}

interface ThumbnailIssue {
  area: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface ThumbnailData {
  overallScore: number;
  ctrPrediction: string;
  scores: ThumbnailScores;
  issues: ThumbnailIssue[];
  strengths: string[];
  suggestions: string[];
  improvedVersionIdeas: string[];
  competitorBenchmark: string;
}

const SEVERITY_COLORS = {
  high: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  low: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
};

const SCORE_META: { key: keyof ThumbnailScores; label: string; color: string }[] = [
  { key: 'readability', label: 'Text Readability', color: '#3b82f6' },
  { key: 'emotionalImpact', label: 'Emotional Impact', color: '#f43f5e' },
  { key: 'colorContrast', label: 'Color Contrast', color: '#f59e0b' },
  { key: 'clutterScore', label: 'Clean Layout', color: '#8b5cf6' },
  { key: 'curiosityGap', label: 'Curiosity Gap', color: '#22c55e' },
];

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#888]">{label}</span>
        <span className="text-xs font-black" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function ThumbnailAnalyzerPage() {
  const [thumbnailDescription, setThumbnailDescription] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ThumbnailData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!thumbnailDescription.trim() && !videoTitle.trim()) {
      setError('Describe your thumbnail or enter a video title.');
      return;
    }
    setError('');
    setLoading(true);
    setData(null);
    try {
      const res = await axios.post('/api/thumbnail-analyzer', { thumbnailDescription, videoTitle, niche }, { headers: getAuthHeaders() });
      setData(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const scoreColor = data ? (data.overallScore >= 70 ? '#22c55e' : data.overallScore >= 45 ? '#f59e0b' : '#ef4444') : '#888';

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Thumbnail Intelligence</h1>
            <p className="text-sm text-[#666]">Predict your thumbnail CTR before you publish.</p>
          </div>
        </div>

        <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Describe Your Thumbnail <span className="text-[#FF0000]">*</span>
              </label>
              <textarea
                value={thumbnailDescription}
                onChange={e => setThumbnailDescription(e.target.value)}
                placeholder="e.g. Big red text 'I QUIT' on left, shocked face on right, dark background with money falling..."
                rows={3}
                className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-amber-500/40 transition-colors resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Video Title <span className="text-[#444] font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                  placeholder="Your video title..."
                  className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Niche <span className="text-[#444] font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  placeholder="e.g. Finance, Gaming, Fitness..."
                  className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-amber-500/40 transition-colors"
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
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing thumbnail...</> : <><ImageIcon className="w-4 h-4" /> Analyze Thumbnail CTR</>}
            </button>
          </div>
        </div>

        {data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Score overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center justify-center gap-2">
                <p className="text-[10px] text-[#555] uppercase tracking-wider">Overall Score</p>
                <p className="text-5xl font-black" style={{ color: scoreColor }}>{data.overallScore}</p>
                <p className="text-xs text-[#666]">/ 100</p>
              </div>
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center justify-center gap-2">
                <p className="text-[10px] text-[#555] uppercase tracking-wider">Predicted CTR</p>
                <p className="text-4xl font-black text-amber-400">{data.ctrPrediction}</p>
                <p className="text-xs text-[#666]">click-through rate</p>
              </div>
            </div>

            {/* Score bars */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" /> Performance Breakdown
              </h2>
              <div className="space-y-4">
                {SCORE_META.map((m) => (
                  <ScoreBar key={m.key} label={m.label} value={data.scores[m.key]} color={m.color} />
                ))}
              </div>
            </div>

            {/* Issues */}
            {data.issues.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" /> Issues Found
                </h2>
                <div className="space-y-3">
                  {data.issues.map((issue, i) => {
                    const c = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.medium;
                    return (
                      <div key={i} className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${c.text}`}>{issue.area}</span>
                          <span className={`ml-auto text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>{issue.severity}</span>
                        </div>
                        <p className="text-xs text-[#888]">{issue.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Strengths */}
            {data.strengths.length > 0 && (
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" /> What Works
                </h2>
                <div className="space-y-2">
                  {data.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[#888]">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div className="bg-gradient-to-br from-[#0a0a06] to-[#0F0F0F] border border-amber-500/20 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> How to Fix It
              </h2>
              <div className="space-y-3">
                {data.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-[#AAAAAA]">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">{i + 1}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Improved ideas */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" /> Better Thumbnail Concepts
              </h2>
              <div className="space-y-3">
                {data.improvedVersionIdeas.map((idea, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 bg-[#181818] border border-white/[0.04] rounded-xl px-4 py-3">
                    <p className="text-sm text-[#AAAAAA] flex-1">{idea}</p>
                    <button onClick={() => copy(idea, `idea-${i}`)} className="shrink-0 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      {copied === `idea-${i}` ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#666]" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Benchmark */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3">
              <p className="text-xs text-[#555] mb-1">Competitor Benchmark</p>
              <p className="text-sm text-[#888]">{data.competitorBenchmark}</p>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
