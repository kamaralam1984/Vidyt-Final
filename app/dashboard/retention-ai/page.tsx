'use client';

import { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import {
  Activity, AlertCircle, Loader2, TrendingDown, Clock,
  Zap, BarChart3, Target, Link, Eye, ThumbsUp, MessageCircle, Calendar, Scissors,
} from 'lucide-react';

interface RetentionPoint {
  timePercent: number;
  retentionPercent: number;
}

interface DropOffPoint {
  timePercent: number;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

interface BoringSegment {
  start: string;
  end: string;
  issue: string;
}

interface RetentionData {
  overallRetentionScore: number;
  avgViewDuration: string;
  hookStrength: number;
  midVideoEngagement: number;
  endScreenCTR: number;
  bestClipMoment: string;
  retentionCurve: RetentionPoint[];
  dropOffPoints: DropOffPoint[];
  boringSegments: BoringSegment[];
  pacingScore: number;
  emotionalEngagementScore: number;
  attentionPrediction: 'high' | 'medium' | 'low';
  fixes: string[];
}

interface RealVideoData {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  description: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  thumbnail: string;
}

const SEVERITY_COLORS = {
  high: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  low: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
};

function RetentionCurveChart({ curve }: { curve: RetentionPoint[] }) {
  if (!curve || curve.length < 2) return <p className="text-sm text-[#555]">Curve data unavailable.</p>;
  const width = 600;
  const height = 200;
  const pad = { top: 12, right: 12, bottom: 30, left: 40 };
  const cW = width - pad.left - pad.right;
  const cH = height - pad.top - pad.bottom;

  const pts = curve.map((p) => ({
    x: pad.left + (p.timePercent / 100) * cW,
    y: pad.top + ((100 - p.retentionPercent) / 100) * cH,
    ...p,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length - 1].x.toFixed(1)} ${(pad.top + cH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(pad.top + cH).toFixed(1)} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 280 }}>
        <defs>
          <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF0000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF0000" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((v) => {
          const y = pad.top + ((100 - v) / 100) * cH;
          return (
            <g key={v}>
              <line x1={pad.left} x2={pad.left + cW} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fill="#555" fontSize="10">{v}%</text>
            </g>
          );
        })}
        {[0, 25, 50, 75, 100].map((v) => (
          <text key={v} x={pad.left + (v / 100) * cW} y={height - 6} textAnchor="middle" fill="#555" fontSize="10">{v}%</text>
        ))}
        <path d={areaD} fill="url(#retGrad)" />
        <path d={pathD} fill="none" stroke="#FF0000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#FF0000" stroke="#0F0F0F" strokeWidth="1.5" />
        ))}
      </svg>
    </div>
  );
}

function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3">
      <span className="text-sm text-[#888]">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
        <span className="text-sm font-black w-10 text-right" style={{ color }}>{value}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-4 text-center">
      <p className="text-[10px] text-[#555] mb-1">{label}</p>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
    </div>
  );
}

export default function RetentionAIPage() {
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<RetentionData | null>(null);
  const [realVideo, setRealVideo] = useState<RealVideoData | null>(null);

  const handleAnalyze = async () => {
    if (!videoTitle.trim() && !youtubeUrl.trim()) {
      setError('Video title or YouTube URL is required.');
      return;
    }
    setError('');
    setLoading(true);
    setData(null);
    setRealVideo(null);
    try {
      const res = await axios.post('/api/retention-ai', { videoTitle, videoDescription, videoDuration, youtubeUrl }, { headers: getAuthHeaders() });
      const analysis = res.data.analysis;
      if (analysis) {
        analysis.retentionCurve = analysis.retentionCurve || [];
        analysis.dropOffPoints = analysis.dropOffPoints || [];
        analysis.boringSegments = analysis.boringSegments || [];
        analysis.fixes = analysis.fixes || [];
      }
      setData(analysis);
      setRealVideo(res.data.realVideoData || null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const attentionColor = data?.attentionPrediction === 'high' ? '#22c55e' : data?.attentionPrediction === 'medium' ? '#f59e0b' : '#ef4444';

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Retention AI</h1>
              <p className="text-sm text-[#666]">Predict where viewers drop off — before you upload.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="space-y-4">
            {/* YouTube URL — primary input */}
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                YouTube Video URL <span className="text-[#444] font-normal normal-case">(optional — gets real stats)</span>
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-[#181818] border border-white/[0.06] rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-blue-500/40 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Video Title <span className="text-[#444] font-normal normal-case">(required if no URL)</span>
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={e => setVideoTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder="e.g. I Tried Every AI Tool for 30 Days"
                className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-blue-500/40 transition-colors"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Duration <span className="text-[#444] font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={videoDuration}
                  onChange={e => setVideoDuration(e.target.value)}
                  placeholder="e.g. 12:30"
                  className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-blue-500/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Description <span className="text-[#444] font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={videoDescription}
                  onChange={e => setVideoDescription(e.target.value)}
                  placeholder="Brief topic or content description..."
                  className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-blue-500/40 transition-colors"
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
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing retention patterns...</>
                : <><Activity className="w-4 h-4" /> Predict Viewer Retention</>}
            </button>
          </div>
        </div>

        {data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Real Data card */}
            {realVideo && (
              <div className="bg-[#0F0F0F] border border-green-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Real Data — Live from YouTube</span>
                </div>
                <div className="flex gap-4">
                  {realVideo.thumbnail && (
                    <img
                      src={realVideo.thumbnail}
                      alt={realVideo.title}
                      className="w-32 h-[72px] object-cover rounded-xl shrink-0 border border-white/[0.06]"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white leading-snug mb-1 line-clamp-2">{realVideo.title}</p>
                    <p className="text-xs text-[#666] mb-3">{realVideo.channelTitle}</p>
                    <div className="flex flex-wrap gap-3">
                      <span className="flex items-center gap-1 text-xs text-[#888]">
                        <Eye className="w-3 h-3 text-blue-400" />
                        {Number(realVideo.viewCount).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#888]">
                        <ThumbsUp className="w-3 h-3 text-green-400" />
                        {Number(realVideo.likeCount).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#888]">
                        <MessageCircle className="w-3 h-3 text-amber-400" />
                        {Number(realVideo.commentCount).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#888]">
                        <Clock className="w-3 h-3 text-purple-400" />
                        {realVideo.duration}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#888]">
                        <Calendar className="w-3 h-3 text-[#555]" />
                        {new Date(realVideo.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats row — 8 stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Retention Score" value={`${data.overallRetentionScore}%`} color={data.overallRetentionScore >= 60 ? '#22c55e' : data.overallRetentionScore >= 40 ? '#f59e0b' : '#ef4444'} />
              <StatCard label="Avg View Duration" value={data.avgViewDuration} color="#3b82f6" />
              <StatCard label="Attention Level" value={data.attentionPrediction.charAt(0).toUpperCase() + data.attentionPrediction.slice(1)} color={attentionColor} />
              <StatCard label="Drop-off Points" value={String(data.dropOffPoints.length)} color="#f59e0b" />
              <StatCard label="Hook Strength" value={`${data.hookStrength}%`} color={data.hookStrength >= 70 ? '#22c55e' : data.hookStrength >= 50 ? '#f59e0b' : '#ef4444'} />
              <StatCard label="Mid-Video Engagement" value={`${data.midVideoEngagement}%`} color="#8b5cf6" />
              <StatCard label="End Screen CTR" value={`${data.endScreenCTR}%`} color="#06b6d4" />
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-4 text-center col-span-2 sm:col-span-4 md:col-span-1 flex flex-col items-center justify-center gap-1">
                <p className="text-[10px] text-[#555]">Best Clip Moment</p>
                <div className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <p className="text-sm font-black text-pink-400">{data.bestClipMoment}</p>
                </div>
              </div>
            </div>

            {/* Retention curve */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#FF0000]" /> Predicted Retention Curve
              </h2>
              <p className="text-xs text-[#555] mb-4">% of viewers still watching at each point in your video</p>
              <RetentionCurveChart curve={data.retentionCurve} />
            </div>

            {/* Drop-off + boring segments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-400" /> Drop-off Points
                </h2>
                <div className="space-y-3">
                  {data.dropOffPoints.map((d, i) => {
                    const c = SEVERITY_COLORS[d.severity] || SEVERITY_COLORS.medium;
                    return (
                      <div key={i} className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                          <span className={`text-xs font-bold ${c.text}`}>{d.timePercent}% through video</span>
                          <span className={`ml-auto text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>{d.severity}</span>
                        </div>
                        <p className="text-xs text-[#888] pl-4">{d.reason}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Slow Segments
                </h2>
                <div className="space-y-3">
                  {data.boringSegments.length === 0 ? (
                    <p className="text-sm text-[#555]">No slow segments detected.</p>
                  ) : data.boringSegments.map((s, i) => (
                    <div key={i} className="bg-amber-500/[0.05] border border-amber-500/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-amber-300">{s.start} → {s.end}</span>
                      </div>
                      <p className="text-xs text-[#888] pl-5">{s.issue}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality scores */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" /> Quality Scores
              </h2>
              <div className="space-y-3">
                <ScorePill label="Pacing Score" value={data.pacingScore} color="#8b5cf6" />
                <ScorePill label="Emotional Engagement" value={data.emotionalEngagementScore} color="#f43f5e" />
                <ScorePill label="Overall Retention" value={data.overallRetentionScore} color="#22c55e" />
              </div>
            </div>

            {/* Fixes */}
            <div className="bg-gradient-to-br from-[#060612] to-[#0F0F0F] border border-blue-500/20 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" /> How to Fix Your Retention
              </h2>
              <div className="space-y-3">
                {data.fixes.map((fix, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-[#AAAAAA]">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">{i + 1}</span>
                    {fix}
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
