'use client';

import { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Zap, AlertCircle, CheckCircle2, ChevronRight, Copy,
  Loader2, ArrowRight, Target, Film, Image as ImageIcon,
  Search, TrendingUp, Flame,
} from 'lucide-react';
import Link from 'next/link';

interface Issue {
  area: string;
  severity: 'high' | 'medium' | 'low';
  problem: string;
  fix: string;
}

interface Diagnosis {
  overallDiagnosis: string;
  viralPotentialScore: number;
  issues: Issue[];
  betterTitles: string[];
  betterHook: string;
  actionPlan: string[];
}

const AREA_ICONS: Record<string, any> = {
  Title: Target,
  Thumbnail: ImageIcon,
  Hook: Film,
  'SEO & Keywords': Search,
};

const SEVERITY_COLORS = {
  high: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  low: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute">
        <p className="text-2xl font-black text-white text-center">{score}</p>
        <p className="text-[10px] text-[#666] text-center">/ 100</p>
      </div>
    </div>
  );
}

export default function FixMyVideoPage() {
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!videoTitle.trim() && !videoUrl.trim()) {
      setError('Enter at least a video title or URL.');
      return;
    }
    setError('');
    setLoading(true);
    setDiagnosis(null);
    try {
      const res = await axios.post('/api/fix-my-video', { videoTitle, videoUrl, description }, { headers: getAuthHeaders() });
      setDiagnosis(res.data.diagnosis);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#FF0000]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Fix My Video AI</h1>
              <p className="text-sm text-[#666]">Find out exactly why your video underperformed — and get the fixes.</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl overflow-hidden">
            <div style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.5), transparent)', height: '1px' }} />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Video Title</label>
              <input
                type="text"
                value={videoTitle}
                onChange={e => setVideoTitle(e.target.value)}
                placeholder="e.g. How I Made $10,000 In 30 Days With Dropshipping"
                className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#FF0000]/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">YouTube URL <span className="text-[#444] font-normal normal-case">(optional)</span></label>
              <input
                type="text"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#FF0000]/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Description / Context <span className="text-[#444] font-normal normal-case">(optional — helps AI diagnose better)</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Paste your video description or add context about the video topic..."
                rows={3}
                className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#FF0000]/40 transition-colors resize-none"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF0000] text-white font-semibold rounded-xl hover:bg-[#CC0000] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Diagnosing your video...</> : <><Zap className="w-4 h-4" /> Diagnose My Video</>}
            </button>
          </div>
        </div>

        {/* Results */}
        {diagnosis && (
          <div className="space-y-5">
            {/* Overall score + diagnosis */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start">
              <div className="relative flex items-center justify-center shrink-0">
                <ScoreGauge score={diagnosis.viralPotentialScore} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#FF0000]" /> AI Diagnosis
                </h2>
                <p className="text-[#AAAAAA] text-sm leading-relaxed">{diagnosis.overallDiagnosis}</p>
                <p className="text-xs text-[#555] mt-3">Viral potential score based on title, hook, SEO signals, and topic momentum.</p>
              </div>
            </div>

            {/* Issues */}
            <div>
              <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#FF0000]" /> What Went Wrong
              </h2>
              <div className="space-y-3">
                {diagnosis.issues.map((issue, i) => {
                  const colors = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.medium;
                  const Icon = AREA_ICONS[issue.area] || Target;
                  return (
                    <div key={i} className={`rounded-2xl border p-5 ${colors.bg} ${colors.border}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                        <span className="text-sm font-bold text-white">{issue.area}</span>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {issue.severity} priority
                        </span>
                      </div>
                      <p className="text-sm text-[#AAAAAA] mb-2"><span className="text-white font-medium">Problem: </span>{issue.problem}</p>
                      <p className="text-sm text-[#AAAAAA]"><span className={`font-semibold ${colors.text}`}>Fix: </span>{issue.fix}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Better Titles */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" /> Better Title Options
              </h2>
              <div className="space-y-2">
                {diagnosis.betterTitles.map((title, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 bg-[#181818] border border-white/[0.04] rounded-xl px-4 py-3">
                    <p className="text-sm text-white flex-1">{title}</p>
                    <button onClick={() => copyText(title, `title-${i}`)} className="shrink-0 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      {copied === `title-${i}` ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#666]" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Better Hook */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-blue-400" /> Rewritten Hook
                </h2>
                <button onClick={() => copyText(diagnosis.betterHook, 'hook')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 text-[#888] hover:text-white transition-colors">
                  {copied === 'hook' ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <p className="text-sm text-[#AAAAAA] leading-relaxed bg-[#181818] border border-white/[0.04] rounded-xl px-4 py-4">
                {diagnosis.betterHook}
              </p>
            </div>

            {/* Action Plan */}
            <div className="bg-gradient-to-br from-[#1a0a0a] to-[#0F0F0F] border border-[#FF0000]/20 rounded-2xl p-6">
              <div className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl overflow-hidden">
                <div style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.5), transparent)', height: '1px' }} />
              </div>
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#FF0000]" /> Your Action Plan
              </h2>
              <ol className="space-y-3">
                {diagnosis.actionPlan.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#AAAAAA]">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center text-[#FF0000] text-xs font-bold">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/ai/hook-generator" className="flex items-center gap-1.5 px-4 py-2 bg-[#FF0000]/10 border border-[#FF0000]/20 text-[#FF0000] text-sm font-semibold rounded-xl hover:bg-[#FF0000]/20 transition-all">
                  Rewrite Hook <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link href="/ai/thumbnail-generator" className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-all">
                  Fix Thumbnail <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link href="/dashboard/youtube-seo" className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-all">
                  Optimize SEO <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
