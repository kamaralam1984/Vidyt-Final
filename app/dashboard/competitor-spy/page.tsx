'use client';

import { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import {
  Search, AlertCircle, Loader2, TrendingUp, Zap,
  Target, Users, Eye, Globe, Play, ThumbsUp,
  Copy, Check, ExternalLink, Shield, Lightbulb,
  BarChart2, MessageSquare, DollarSign, Layers,
} from 'lucide-react';

interface RecentVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  performanceRatio: number;
  engagementRate: string;
}

interface RealChannelData {
  channelId: string;
  title: string;
  thumbnail: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  country: string;
  avgEngagementRate: string;
  postingCadence: string;
  recentVideos: RecentVideo[];
  topVideo: RecentVideo | null;
}

interface TopFormat {
  format: string;
  avgViews: string;
  whyItWorks: string;
}

interface AiAnalysis {
  channelSummary: string;
  growthVelocity: 'high' | 'medium' | 'low';
  estimatedMonthlyViews: string;
  spyScore: number;
  threatLevel: 'high' | 'medium' | 'low';
  contentPillars: string[];
  titleFormula: string;
  topFormats: TopFormat[];
  hookStyles: string[];
  thumbnailPatterns: string[];
  postingFrequency: string;
  viralTopics: string[];
  audienceInsights: string;
  weaknesses: string[];
  opportunitiesToBeat: string[];
  stealableIdeas: string[];
  titleTemplates: string[];
  monetizationHints: string;
}

const VELOCITY_COLORS = {
  high: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  medium: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  low: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

function fmtNum(n: string | number) {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return String(num);
}

function SpyScoreGauge({ score, level }: { score: number; level: string }) {
  const color = level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e';
  const label = level === 'high' ? 'HIGH THREAT' : level === 'medium' ? 'MEDIUM THREAT' : 'LOW THREAT';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 100) * 263.9} 263.9`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{score}</span>
          <span className="text-[9px] text-[#555]">/ 100</span>
        </div>
      </div>
      <span className="text-[10px] font-bold mt-1" style={{ color }}>{label}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="ml-auto shrink-0 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-[#555]" />}
    </button>
  );
}

function PerformanceBar({ ratio, max }: { ratio: number; max: number }) {
  const pct = max > 0 ? Math.min((ratio / max) * 100, 100) : 0;
  const color = pct > 66 ? '#22c55e' : pct > 33 ? '#f59e0b' : '#ef4444';
  return (
    <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden mt-1">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function CompetitorSpyPage() {
  const [channelName, setChannelName] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ realData: RealChannelData | null; aiAnalysis: AiAnalysis } | null>(null);

  const handleAnalyze = async () => {
    if (!channelName.trim()) { setError('Channel name is required.'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post('/api/competitor-spy', { channelName, niche }, { headers: getAuthHeaders() });
      const ai = res.data.aiAnalysis;
      if (ai) {
        ai.contentPillars = Array.isArray(ai.contentPillars) ? ai.contentPillars : [];
        ai.topFormats = Array.isArray(ai.topFormats) ? ai.topFormats : [];
        ai.hookStyles = Array.isArray(ai.hookStyles) ? ai.hookStyles : [];
        ai.thumbnailPatterns = Array.isArray(ai.thumbnailPatterns) ? ai.thumbnailPatterns : [];
        ai.viralTopics = Array.isArray(ai.viralTopics) ? ai.viralTopics : [];
        ai.weaknesses = Array.isArray(ai.weaknesses) ? ai.weaknesses : [];
        ai.opportunitiesToBeat = Array.isArray(ai.opportunitiesToBeat) ? ai.opportunitiesToBeat : [];
        ai.stealableIdeas = Array.isArray(ai.stealableIdeas) ? ai.stealableIdeas : [];
        ai.titleTemplates = Array.isArray(ai.titleTemplates) ? ai.titleTemplates : [];
        ai.spyScore = Number(ai.spyScore) || 50;
        ai.threatLevel = ['high', 'medium', 'low'].includes(ai.threatLevel) ? ai.threatLevel : 'medium';
        ai.growthVelocity = ['high', 'medium', 'low'].includes(ai.growthVelocity) ? ai.growthVelocity : 'medium';
      }
      setResult({ realData: res.data.realData || null, aiAnalysis: ai });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ai = result?.aiAnalysis;
  const rd = result?.realData;
  const maxRatio = rd ? Math.max(...rd.recentVideos.map(v => v.performanceRatio), 1) : 1;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Search className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Competitor Spy</h1>
            <p className="text-sm text-[#666]">Reverse-engineer any creator&apos;s growth playbook.</p>
          </div>
        </div>

        {/* Input */}
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
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing channel...</>
                : <><Search className="w-4 h-4" /> Spy on This Channel</>}
            </button>
          </div>
        </div>

        {result && ai && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Channel Overview + Spy Score */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Channel info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {rd?.thumbnail && (
                    <img src={rd.thumbnail} alt={rd.title} className="w-16 h-16 rounded-full object-cover border-2 border-white/10 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-lg font-bold text-white truncate">{rd?.title || channelName}</h2>
                      {rd ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400">Live Data</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">AI Estimate</span>
                      )}
                      {ai.growthVelocity && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${VELOCITY_COLORS[ai.growthVelocity].bg} ${VELOCITY_COLORS[ai.growthVelocity].text} ${VELOCITY_COLORS[ai.growthVelocity].border}`}>
                          {ai.growthVelocity.toUpperCase()} GROWTH
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
                      {rd && (
                        <>
                          <span className="flex items-center gap-1.5 text-sm">
                            <Users className="w-3.5 h-3.5 text-purple-400" />
                            <span className="font-bold text-white">{rd.subscriberCount}</span>
                            <span className="text-[#555]">subs</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-sm">
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-bold text-white">{rd.viewCount}</span>
                            <span className="text-[#555]">views</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-sm">
                            <Play className="w-3.5 h-3.5 text-red-400" />
                            <span className="font-bold text-white">{rd.videoCount}</span>
                            <span className="text-[#555]">videos</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-sm">
                            <ThumbsUp className="w-3.5 h-3.5 text-green-400" />
                            <span className="font-bold text-white">{rd.avgEngagementRate}%</span>
                            <span className="text-[#555]">eng rate</span>
                          </span>
                          {rd.country && (
                            <span className="flex items-center gap-1 text-sm text-[#888]">
                              <Globe className="w-3.5 h-3.5 text-[#555]" /> {rd.country}
                            </span>
                          )}
                          {rd.channelId && (
                            <a
                              href={`https://youtube.com/channel/${rd.channelId}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" /> Open Channel
                            </a>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-[#AAAAAA] leading-relaxed">{ai.channelSummary}</p>
                  </div>
                </div>

                {/* Spy Score */}
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <SpyScoreGauge score={ai.spyScore} level={ai.threatLevel} />
                  <span className="text-[10px] text-[#555] text-center">Competitor<br/>Threat Score</span>
                </div>
              </div>
            </div>

            {/* Content Pillars */}
            {ai.contentPillars.length > 0 && (
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" /> Content Pillars
                </h2>
                <div className="flex flex-wrap gap-2">
                  {ai.contentPillars.map((p, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Videos with Performance Bars */}
            {rd && rd.recentVideos.length > 0 && (
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-red-400" /> Recent Videos — Performance Analysis
                </h2>
                <p className="text-xs text-[#555] mb-4">Performance ratio = views ÷ subscribers × 100 (higher = better relative to channel size)</p>
                <div className="space-y-3">
                  {rd.recentVideos.map((v, i) => (
                    <div key={v.videoId || i} className="flex items-start gap-3 bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
                      {v.thumbnail && (
                        <img src={v.thumbnail} alt={v.title} className="w-20 h-12 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <a
                          href={`https://youtube.com/watch?v=${v.videoId}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-sm text-white font-medium line-clamp-1 hover:text-purple-300 transition-colors"
                        >
                          {v.title}
                        </a>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#666]">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{fmtNum(v.viewCount)}</span>
                          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{v.engagementRate}%</span>
                          <span>{new Date(v.publishedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <PerformanceBar ratio={v.performanceRatio} max={maxRatio} />
                          <span className="text-[10px] text-[#555] shrink-0">{v.performanceRatio}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Title Formula */}
            {ai.titleFormula && (
              <div className="bg-[#0F0F0F] border border-purple-500/20 rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" /> Their Title Formula
                </h2>
                <div className="flex items-start gap-2 bg-purple-500/[0.05] border border-purple-500/10 rounded-xl p-4">
                  <p className="text-sm text-purple-200 flex-1">{ai.titleFormula}</p>
                  <CopyButton text={ai.titleFormula} />
                </div>
              </div>
            )}

            {/* Top Formats */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Top Performing Formats
              </h2>
              <div className="space-y-3">
                {ai.topFormats.map((f, i) => (
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

            {/* Hook Styles + Thumbnail Formula */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" /> Hook Styles
                </h2>
                <div className="space-y-2">
                  {ai.hookStyles.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[#888]">
                      <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
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
                  {ai.thumbnailPatterns.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[#888]">
                      <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Steal These Ideas — unique feature */}
            <div className="bg-gradient-to-br from-[#0a0614] to-[#0F0F0F] border border-purple-500/30 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" /> Steal These Ideas
              </h2>
              <p className="text-xs text-[#555] mb-4">5 specific video ideas inspired by their top content — make them better</p>
              <div className="space-y-3">
                {ai.stealableIdeas.map((idea, i) => (
                  <div key={i} className="flex items-start gap-3 bg-purple-500/[0.04] border border-purple-500/10 rounded-xl p-4">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 text-xs font-bold">{i + 1}</span>
                    <p className="text-sm text-[#CCCCCC] flex-1 leading-relaxed">{idea}</p>
                    <CopyButton text={idea} />
                  </div>
                ))}
              </div>
            </div>

            {/* Title Templates — copy-paste */}
            {ai.titleTemplates.length > 0 && (
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-400" /> Title Templates
                </h2>
                <p className="text-xs text-[#555] mb-4">Fill-in-blank templates based on their proven title style</p>
                <div className="space-y-2">
                  {ai.titleTemplates.map((tmpl, i) => (
                    <div key={i} className="flex items-center gap-2 bg-green-500/[0.04] border border-green-500/10 rounded-xl px-4 py-3">
                      <p className="text-sm text-green-200 flex-1 font-mono">{tmpl}</p>
                      <CopyButton text={tmpl} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Viral Topics + Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400" /> Viral Topics
                </h2>
                <div className="flex flex-wrap gap-2">
                  {ai.viralTopics.map((t, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300">{t}</span>
                  ))}
                </div>
              </div>
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" /> Audience Insights
                </h2>
                <p className="text-sm text-[#888] leading-relaxed">{ai.audienceInsights}</p>
                <p className="text-xs text-[#555] mt-3">
                  {rd ? rd.postingCadence : ai.postingFrequency} · {ai.estimatedMonthlyViews}/mo est.
                </p>
              </div>
            </div>

            {/* Monetization */}
            {ai.monetizationHints && (
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Monetization Strategy
                </h2>
                <p className="text-sm text-[#888] leading-relaxed">{ai.monetizationHints}</p>
              </div>
            )}

            {/* How to Beat Them */}
            <div className="bg-gradient-to-br from-[#060612] to-[#0F0F0F] border border-purple-500/20 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" /> How to Beat Them
              </h2>
              <div className="space-y-3">
                {ai.opportunitiesToBeat.map((opp, i) => (
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
                {ai.weaknesses.map((w, i) => (
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
