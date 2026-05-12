'use client';

import { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { Film, AlertCircle, Loader2, CheckCircle2, Zap, Copy, TrendingDown, Tag, BarChart3 } from 'lucide-react';

interface HookScores {
  pacing: number;
  energy: number;
  curiosityGap: number;
  clarity: number;
  emotionalPull: number;
}

interface WeakMoment { moment: string; issue: string; fix: string; }
interface RetentionPoint { second: number; retention: number; }
interface ViralComparison { creator: string; example: string; whyItWorks: string; }

interface HookData {
  hookScore: number;
  hookType?: string;
  hookFormula?: string;
  scores: HookScores;
  verdict: string;
  weakMoments: WeakMoment[];
  strengths: string[];
  rewrittenHook: string;
  alternativeOpeners: string[];
  retentionRisk: 'high' | 'medium' | 'low';
  improvements: string[];
  retentionBySecond?: RetentionPoint[];
  viralComparisons?: ViralComparison[];
}

const SCORE_META: { key: keyof HookScores; label: string; color: string }[] = [
  { key: 'pacing', label: 'Pacing', color: '#3b82f6' },
  { key: 'energy', label: 'Energy Level', color: '#f59e0b' },
  { key: 'curiosityGap', label: 'Curiosity Gap', color: '#8b5cf6' },
  { key: 'clarity', label: 'Clarity', color: '#22c55e' },
  { key: 'emotionalPull', label: 'Emotional Pull', color: '#f43f5e' },
];

const RISK_COLORS = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-green-400',
};

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

function RetentionMiniChart({ points }: { points: RetentionPoint[] }) {
  const w = 400, h = 80, padL = 30, padB = 20, padT = 8, padR = 8;
  const cW = w - padL - padR;
  const cH = h - padT - padB;
  const maxSec = points[points.length - 1]?.second || 30;
  const pts = points.map(p => ({
    x: padL + (p.second / maxSec) * cW,
    y: padT + ((100 - p.retention) / 100) * cH,
    ...p,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${padT+cH} L ${pts[0].x} ${padT+cH} Z`;
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ minWidth: 260 }}>
        <defs>
          <linearGradient id="hookGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0,30,60,100].map(v => {
          const y = padT + ((100-v)/100)*cH;
          return <text key={v} x={padL-4} y={y+3} textAnchor="end" fill="#444" fontSize="8">{v}%</text>;
        })}
        {points.map(p => (
          <text key={p.second} x={padL+(p.second/maxSec)*cW} y={h-4} textAnchor="middle" fill="#444" fontSize="8">{p.second}s</text>
        ))}
        <path d={areaD} fill="url(#hookGrad)" />
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="#0F0F0F" strokeWidth="1" />
        ))}
      </svg>
    </div>
  );
}

export default function HookAnalyzerPage() {
  const [hookText, setHookText] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<HookData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!hookText.trim()) { setError('Paste your hook script to analyze.'); return; }
    setError('');
    setLoading(true);
    setData(null);
    try {
      const res = await axios.post('/api/hook-analyzer', { hookText, videoTitle, targetAudience }, { headers: getAuthHeaders() });
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

  const scoreColor = data ? (data.hookScore >= 70 ? '#22c55e' : data.hookScore >= 45 ? '#f59e0b' : '#ef4444') : '#888';

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Hook Analyzer</h1>
            <p className="text-sm text-[#666]">Find out if your first 30 seconds will keep viewers watching.</p>
          </div>
        </div>

        <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Your Hook Script <span className="text-[#FF0000]">*</span>
              </label>
              <textarea
                value={hookText}
                onChange={e => setHookText(e.target.value)}
                placeholder="Paste your video opening / first 30 seconds script here..."
                rows={5}
                className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-blue-500/40 transition-colors resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Video Title <span className="text-[#444] font-normal normal-case">(optional)</span>
                </label>
                <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)}
                  placeholder="Your video title..."
                  className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-blue-500/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Target Audience <span className="text-[#444] font-normal normal-case">(optional)</span>
                </label>
                <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                  placeholder="e.g. Beginner investors, Gamers 18-25..."
                  className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-blue-500/40 transition-colors" />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <button onClick={handleAnalyze} disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing hook...</> : <><Film className="w-4 h-4" /> Analyze My Hook</>}
            </button>
          </div>
        </div>

        {data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Score + verdict + type badges */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <p className="text-[10px] text-[#555] uppercase tracking-wider">Hook Score</p>
                <p className="text-5xl font-black" style={{ color: scoreColor }}>{data.hookScore}</p>
                <p className="text-xs text-[#666]">/ 100</p>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-bold ${RISK_COLORS[data.retentionRisk]}`}>
                    {data.retentionRisk.toUpperCase()} RETENTION RISK
                  </span>
                  {data.hookType && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {data.hookType}
                    </span>
                  )}
                  {data.hookFormula && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                      {data.hookFormula}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-[#555] uppercase tracking-wider">AI Verdict</p>
                <p className="text-sm text-[#AAAAAA] leading-relaxed italic">&ldquo;{data.verdict}&rdquo;</p>
              </div>
            </div>

            {/* Retention by second mini chart */}
            {data.retentionBySecond && data.retentionBySecond.length > 0 && (
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" /> Viewer Retention — First 30 Seconds
                </h2>
                <p className="text-xs text-[#555] mb-4">Predicted % of viewers still watching at each second</p>
                <RetentionMiniChart points={data.retentionBySecond} />
                <div className="flex gap-4 mt-2">
                  {data.retentionBySecond.map((p, i) => (
                    <div key={i} className="text-center">
                      <p className="text-[10px] text-[#555]">{p.second}s</p>
                      <p className="text-xs font-bold" style={{ color: p.retention >= 70 ? '#22c55e' : p.retention >= 50 ? '#f59e0b' : '#ef4444' }}>{p.retention}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score breakdown */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">Score Breakdown</h2>
              <div className="space-y-4">
                {SCORE_META.map((m) => (
                  <ScoreBar key={m.key} label={m.label} value={data.scores[m.key]} color={m.color} />
                ))}
              </div>
            </div>

            {/* Viral comparisons */}
            {data.viralComparisons && data.viralComparisons.length > 0 && (
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Viral Hook Examples (Learn From These)
                </h2>
                <div className="space-y-3">
                  {data.viralComparisons.map((vc, i) => (
                    <div key={i} className="bg-amber-500/[0.04] border border-amber-500/10 rounded-xl p-4">
                      <p className="text-xs font-bold text-amber-400 mb-1">{vc.creator}</p>
                      <p className="text-sm text-white italic mb-2">&ldquo;{vc.example}&rdquo;</p>
                      <p className="text-xs text-[#888]"><span className="text-amber-300 font-medium">Why it works: </span>{vc.whyItWorks}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weak moments */}
            {data.weakMoments.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400" /> Dead Moments
                </h2>
                <div className="space-y-3">
                  {data.weakMoments.map((m, i) => (
                    <div key={i} className="bg-red-500/[0.05] border border-red-500/10 rounded-xl p-4">
                      <p className="text-xs font-bold text-red-300 mb-1 italic">&ldquo;{m.moment}&rdquo;</p>
                      <p className="text-xs text-[#888] mb-2"><span className="text-red-400 font-medium">Issue: </span>{m.issue}</p>
                      <p className="text-xs text-[#888]"><span className="text-green-400 font-medium">Fix: </span>{m.fix}</p>
                    </div>
                  ))}
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
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rewritten hook */}
            <div className="bg-gradient-to-br from-[#060612] to-[#0F0F0F] border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" /> AI Rewritten Hook
                </h2>
                <button onClick={() => copy(data.rewrittenHook, 'hook')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 text-[#888] hover:text-white transition-colors">
                  {copied === 'hook' ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <p className="text-sm text-[#AAAAAA] leading-relaxed bg-[#181818] border border-white/[0.04] rounded-xl px-4 py-4 whitespace-pre-wrap">
                {data.rewrittenHook}
              </p>
            </div>

            {/* Alternative openers */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">Alternative Opening Lines</h2>
              <div className="space-y-2">
                {data.alternativeOpeners.map((line, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 bg-[#181818] border border-white/[0.04] rounded-xl px-4 py-3">
                    <p className="text-sm text-[#AAAAAA] flex-1">{line}</p>
                    <button onClick={() => copy(line, `opener-${i}`)} className="shrink-0 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      {copied === `opener-${i}` ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#666]" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvements */}
            {data.improvements && data.improvements.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-5">
                <h2 className="text-sm font-bold text-white mb-3">Quick Improvements</h2>
                <div className="space-y-2">
                  {data.improvements.map((imp, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[#888]">
                      <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
                      {imp}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
