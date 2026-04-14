'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoUpload from './VideoUpload';
import ViralScoreMeter from './ViralScoreMeter';
import ScoreCard from './ScoreCard';
import TitleSuggestions from './TitleSuggestions';
import HashtagRecommendations from './HashtagRecommendations';
import TrendingTopics from './TrendingTopics';
import EngagementGraph from './EngagementGraph';
import PostingTimeHeatmap from './PostingTimeHeatmap';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, X, Copy, Zap, TrendingUp, Star, Sparkles, Loader2,
  Search, Hash, Clock, BarChart3, FileText, Image as ImageIcon, Film,
  Youtube, ArrowRight, CreditCard, Target, Bell, Calendar,
  Play, Eye, ThumbsUp, RefreshCw, ChevronRight, Flame,
  Video, AlertCircle, ExternalLink, Activity,
} from 'lucide-react';

interface AnalysisData {
  viralProbability: number;
  hookScore: number;
  thumbnailScore: number;
  titleScore: number;
  confidenceLevel: number;
  optimizedTitles?: string[];
  hashtags?: string[];
  trendingTopics?: Array<{ keyword: string; score: number }>;
  seoDescription?: string;
  postingTime?: { day: string; hour: number; confidence: number };
  bestPostingTime?: { day: string; hour: number; confidence: number };
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="w-1 h-4 rounded-full bg-[#FF0000] inline-block" />
      <h2 className="text-sm font-bold text-white uppercase tracking-wider">{children}</h2>
    </div>
  );
}

function Widget({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl border border-white/[0.06] overflow-hidden ${className}`}
      style={{ background: 'rgba(13,13,13,0.98)' }}>
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,0,0,0.25), transparent)' }} />
      {children}
    </div>
  );
}

// ── Recent Analyzed Videos ───────────────────────────────────────────────────
function RecentVideosWidget() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/videos', { headers: getAuthHeaders() })
      .then(r => setVideos((r.data.videos || []).slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Widget>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#FF0000]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Recent Analyses</span>
          </div>
          <Link href="/dashboard/my-videos" className="text-[10px] text-[#555] hover:text-white flex items-center gap-1 transition-colors">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-12 h-9 rounded bg-white/5 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
                  <div className="h-2 bg-white/[0.03] rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="py-6 text-center">
            <Video className="w-8 h-8 text-[#333] mx-auto mb-2" />
            <p className="text-xs text-[#555]">No videos analyzed yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {videos.map((v) => (
              <div key={v._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors group">
                <div className="w-14 h-9 rounded-lg overflow-hidden bg-[#1a1a1a] shrink-0 relative">
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-3 h-3 text-[#444]" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate font-medium">{v.title || 'Untitled'}</p>
                  <p className="text-[10px] text-[#555]">
                    {v.uploadedAt ? new Date(v.uploadedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}
                  </p>
                </div>
                <ChevronRight className="w-3 h-3 text-[#333] group-hover:text-[#666] transition-colors shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Widget>
  );
}

// ── Trending Topics Widget ───────────────────────────────────────────────────
function TrendingWidget() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<'youtube'|'instagram'|'tiktok'>('youtube');

  const fetch = useCallback((p: string) => {
    setLoading(true);
    axios.get(`/api/trending?platform=${p}`, { headers: getAuthHeaders() })
      .then(r => setTopics((r.data.trendingTopics || []).slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(platform); }, [platform, fetch]);

  const tabs = [
    { id: 'youtube', label: 'YT' },
    { id: 'instagram', label: 'IG' },
    { id: 'tiktok', label: 'TT' },
  ] as const;

  return (
    <Widget>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Trending Now</span>
          </div>
          <div className="flex gap-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setPlatform(t.id)}
                className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                  platform === t.id ? 'bg-[#FF0000] text-white' : 'bg-white/[0.04] text-[#666] hover:text-white'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-2 p-1.5">
                <div className="w-4 h-4 bg-white/5 rounded animate-pulse shrink-0" />
                <div className="h-3 bg-white/5 rounded animate-pulse flex-1" />
                <div className="w-8 h-3 bg-white/[0.03] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="py-6 text-center">
            <Flame className="w-8 h-8 text-[#333] mx-auto mb-2" />
            <p className="text-xs text-[#555]">No trending data</p>
          </div>
        ) : (
          <div className="space-y-1">
            {topics.map((t, i) => (
              <div key={t.keyword} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                <span className="text-[10px] font-bold text-[#333] w-4 shrink-0">#{i + 1}</span>
                <span className="text-xs text-white flex-1 truncate">{t.keyword}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-12 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(t.score, 100)}%` }} />
                  </div>
                  <span className="text-[9px] text-[#555] w-6 text-right">{Math.round(t.score)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Widget>
  );
}

// ── Scheduled Posts Widget ───────────────────────────────────────────────────
function ScheduledPostsWidget() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/schedule/posts?status=scheduled&limit=4', { headers: getAuthHeaders() })
      .then(r => setPosts(r.data.posts || r.data.scheduledPosts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Widget>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Scheduled</span>
          </div>
          <Link href="/calendar" className="text-[10px] text-[#555] hover:text-white flex items-center gap-1 transition-colors">
            Manage <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1,2].map(i => (
              <div key={i} className="p-2 rounded-xl bg-white/[0.02]">
                <div className="h-3 bg-white/5 rounded animate-pulse w-2/3 mb-1.5" />
                <div className="h-2 bg-white/[0.03] rounded animate-pulse w-1/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-4 text-center">
            <Calendar className="w-7 h-7 text-[#333] mx-auto mb-2" />
            <p className="text-[11px] text-[#555] mb-3">No scheduled posts</p>
            <Link href="/calendar" className="text-[11px] text-[#FF0000] hover:underline">+ Schedule a post</Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {posts.map((p: any) => (
              <div key={p._id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-blue-500/20 transition-colors">
                <p className="text-xs text-white truncate font-medium">{p.title || p.caption || 'Untitled'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                    {p.platform || 'youtube'}
                  </span>
                  <span className="text-[10px] text-[#555]">
                    {p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Widget>
  );
}

// ── Notifications Widget ─────────────────────────────────────────────────────
function NotificationsWidget() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    axios.get('/api/notifications', { headers: getAuthHeaders() })
      .then(r => {
        setNotifs((r.data.notifications || []).slice(0, 4));
        setUnread(r.data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Widget>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
            {unread > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FF0000] text-white font-bold">{unread}</span>
            )}
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-2 p-1.5">
                <div className="w-5 h-5 bg-white/5 rounded-full animate-pulse shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-white/5 rounded animate-pulse w-4/5" />
                  <div className="h-2 bg-white/[0.03] rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="py-4 text-center">
            <Bell className="w-7 h-7 text-[#333] mx-auto mb-2" />
            <p className="text-[11px] text-[#555]">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifs.map((n: any) => (
              <div key={n._id} className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${!n.read ? 'bg-amber-500/[0.04]' : 'hover:bg-white/[0.02]'}`}>
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-amber-400' : 'bg-[#333]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white leading-snug">{n.message || n.title}</p>
                  <p className="text-[10px] text-[#555] mt-0.5">
                    {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Widget>
  );
}

// ── AI Stats Row ─────────────────────────────────────────────────────────────
function AiStatsRow({ usageData, userPlan, isYoutubeConnected }: {
  usageData: { used: number; limit: number; label: string } | null;
  userPlan: string;
  isYoutubeConnected: boolean;
}) {
  const pct = usageData ? Math.round((usageData.used / usageData.limit) * 100) : 0;
  const planColor = { free: '#6b7280', starter: '#60a5fa', pro: '#a78bfa', enterprise: '#fbbf24', owner: '#f87171' }[userPlan] || '#60a5fa';

  const stats = [
    {
      icon: CreditCard,
      label: 'Plan',
      value: userPlan.charAt(0).toUpperCase() + userPlan.slice(1),
      sub: 'current plan',
      color: planColor,
      bg: `${planColor}15`,
    },
    {
      icon: Zap,
      label: usageData?.label || 'AI Credits',
      value: usageData ? `${usageData.used}/${usageData.limit}` : '—',
      sub: `${pct}% used`,
      color: pct > 80 ? '#f87171' : '#FF0000',
      bg: pct > 80 ? 'rgba(248,113,113,0.1)' : 'rgba(255,0,0,0.1)',
      progress: pct,
    },
    {
      icon: Youtube,
      label: 'YouTube',
      value: isYoutubeConnected ? 'Connected' : 'Not Linked',
      sub: isYoutubeConnected ? 'channel active' : 'click to connect',
      color: isYoutubeConnected ? '#10B981' : '#F59E0B',
      bg: isYoutubeConnected ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
      href: isYoutubeConnected ? undefined : '/api/youtube/auth',
    },
    {
      icon: Activity,
      label: 'AI Engine',
      value: 'Active',
      sub: 'all systems go',
      color: '#10B981',
      bg: 'rgba(16,185,129,0.08)',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value, sub, color, bg, progress, href }) => {
        const inner = (
          <motion.div
            whileHover={{ scale: 1.02, y: -1 }}
            className="relative p-4 rounded-xl border border-white/[0.05] overflow-hidden cursor-default"
            style={{ background: 'rgba(15,15,15,0.9)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[#555] uppercase tracking-wider font-medium">{label}</p>
                <p className="text-sm font-bold text-white truncate">{value}</p>
                <p className="text-[10px]" style={{ color: `${color}90` }}>{sub}</p>
              </div>
            </div>
            {progress !== undefined && (
              <div className="mt-3 w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: color }}
                />
              </div>
            )}
          </motion.div>
        );
        return href ? <a key={label} href={href}>{inner}</a> : <div key={label}>{inner}</div>;
      })}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [analysis, setAnalysis] = useState<(AnalysisData & { id?: string; analysisId?: string; isPartial?: boolean }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [lazyLoading, setLazyLoading] = useState<Record<string, boolean>>({});
  const searchParams = useSearchParams();
  const youtubeQuery = searchParams?.get('youtube');
  const [showYoutubeSuccess, setShowYoutubeSuccess] = useState(false);
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);
  const [youtubeGoogleConnected, setYoutubeGoogleConnected] = useState(false);
  const [allowedSystems, setAllowedSystems] = useState<Record<string, boolean>>({});
  const [configLoaded, setConfigLoaded] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPlan, setUserPlan] = useState('free');
  const [usageData, setUsageData] = useState<{ used: number; limit: number; label: string } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/auth/me', { headers: getAuthHeaders() });
        if (res.data.user) {
          setIsYoutubeConnected(!!res.data.user.isYoutubeConnected);
          setYoutubeGoogleConnected(!!res.data.user.youtubeGoogleConnected);
          setUserName(res.data.user.name || res.data.user.email?.split('@')[0] || '');
          setUserPlan(res.data.user.subscription || res.data.user.plan || 'free');
        }
      } catch (_) {}
    };
    const fetchUsage = async () => {
      try {
        const res = await axios.get('/api/user/usage', { headers: getAuthHeaders() });
        if (res.data) {
          const used = res.data.used ?? res.data.totalUsed ?? 0;
          const limit = res.data.limit ?? res.data.totalLimit ?? 50;
          setUsageData({ used, limit, label: res.data.label || 'AI Credits' });
        }
      } catch (_) {}
    };
    fetchUser();
    fetchUsage();
  }, [youtubeQuery]);

  useEffect(() => {
    if (searchParams?.get('youtube') === 'connected') {
      setShowYoutubeSuccess(true);
      const t = setTimeout(() => setShowYoutubeSuccess(false), 5000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  useEffect(() => {
    axios.get('/api/features/all', { headers: getAuthHeaders() })
      .then(r => { if (r.data.features) setAllowedSystems(r.data.features); })
      .catch(() => setAllowedSystems({}))
      .finally(() => setConfigLoaded(true));
  }, []);

  // Lazy load analysis scores
  useEffect(() => {
    if (!analysis?.isPartial || !analysis?.id || !analysis?.analysisId) return;
    const fetchLazyData = async () => {
      const payload = { videoId: analysis.id, analysisId: analysis.analysisId };
      const headers = getAuthHeaders();
      setLazyLoading({ thumbnail: true, hook: true, title: true, predict: true });
      const results = await Promise.allSettled([
        axios.post('/api/analysis/thumbnail', payload, { headers }),
        axios.post('/api/analysis/hook', payload, { headers }),
        axios.post('/api/analysis/title', payload, { headers }),
      ]);
      setAnalysis(prev => {
        if (!prev) return null;
        const thumbnailData = results[0].status === 'fulfilled' ? (results[0].value as any).data : {};
        const hookData = results[1].status === 'fulfilled' ? (results[1].value as any).data : {};
        const titleData = results[2].status === 'fulfilled' ? (results[2].value as any).data : {};
        return {
          ...prev,
          thumbnailScore: thumbnailData.score || 0,
          thumbnailAnalysis: thumbnailData.analysis,
          hookScore: hookData.score || 0,
          hookAnalysis: hookData.analysis,
          titleScore: titleData.score || 0,
          titleAnalysis: titleData.analysis,
          optimizedTitles: titleData.analysis?.optimizedTitles || prev.optimizedTitles,
        };
      });
      setLazyLoading(prev => ({ ...prev, thumbnail: false, hook: false, title: false }));
      try {
        const predictRes = await axios.post('/api/analysis/predict', payload, { headers });
        const pd = predictRes.data;
        setAnalysis(prev => prev ? {
          ...prev,
          viralProbability: pd.viralProbability,
          confidenceLevel: pd.confidenceLevel,
          hashtags: pd.hashtags,
          trendingTopics: pd.trendingTopics,
          bestPostingTime: pd.bestPostingTime,
          isPartial: false,
        } : null);
      } catch (err) {
        console.error('Prediction fetch failed:', err);
      } finally {
        setLazyLoading(prev => ({ ...prev, predict: false }));
      }
    };
    fetchLazyData();
  }, [analysis?.id, analysis?.analysisId, analysis?.isPartial]);

  const handleAnalysisComplete = (data: AnalysisData) => {
    const bestPostingTime = (data as any).bestPostingTime || (data as any).postingTime;
    setAnalysis(bestPostingTime ? { ...data, bestPostingTime } : data);
  };

  if (!configLoaded) return null;

  return (
    <div className="flex-1 overflow-y-auto relative min-h-screen" style={{ background: '#080808' }}>
      {/* Subtle static background grid */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />
      {/* Red glow top-left */}
      {mounted && (
        <div className="fixed top-0 left-0 w-[500px] h-[300px] pointer-events-none z-0"
          style={{ background: 'radial-gradient(ellipse at top left, rgba(220,38,38,0.05) 0%, transparent 70%)' }} />
      )}

      <div className="relative z-10 p-6 pb-16 max-w-[1400px] mx-auto">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

          {/* YouTube Connected Banner */}
          <AnimatePresence>
            {showYoutubeSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden rounded-2xl border border-emerald-500/30 p-4 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm">YouTube Connected!</p>
                    <p className="text-emerald-400/60 text-xs">Your channel is now linked</p>
                  </div>
                </div>
                <button onClick={() => setShowYoutubeSuccess(false)} className="text-emerald-500/40 hover:text-emerald-400">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Hero Header ─────────────────────────────────────────────── */}
          <motion.div variants={itemVariants}>
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] p-6"
              style={{ background: 'linear-gradient(135deg, rgba(18,18,18,0.98), rgba(10,10,10,0.99))' }}>
              <div className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.7), rgba(220,38,38,0.3), transparent)' }} />
              <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at right, rgba(220,38,38,0.04), transparent 70%)' }} />

              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 mb-3">
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-red-500"
                    />
                    <span className="text-red-400 text-[10px] font-bold tracking-wider uppercase">AI Powered Engine</span>
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-black text-white mb-1 leading-tight">
                    {userName ? (
                      <>Welcome, <span className="text-[#FF0000]">{userName}</span></>
                    ) : (
                      <>Welcome to <span className="text-[#FF0000]">Vid YT</span></>
                    )}
                  </h1>
                  <p className="text-[#555] text-sm">
                    Analyze and optimize your videos for maximum viral potential.
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  {allowedSystems['dashboard_seo_analyzer_btn'] !== false && (
                    <Link href="/dashboard/youtube-seo"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#FF0000] text-white hover:bg-[#CC0000] transition-colors">
                      <Search className="w-4 h-4" /> SEO Analyzer
                    </Link>
                  )}
                  {allowedSystems['dashboard_ai_engine_btn'] !== false && (
                    <Link href="/dashboard/viral-intelligence"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-white/[0.08] text-white hover:bg-white/[0.05] transition-colors">
                      <Sparkles className="w-4 h-4 text-amber-400" /> AI Engine
                    </Link>
                  )}
                </div>
              </div>

              {/* Stats chips */}
              <div className="mt-5">
                <AiStatsRow
                  usageData={usageData}
                  userPlan={userPlan}
                  isYoutubeConnected={isYoutubeConnected}
                />
              </div>
            </div>
          </motion.div>

          {/* ── Video Analyzer ───────────────────────────────────────────── */}
          {allowedSystems['video_upload'] !== false && (
            <motion.div variants={itemVariants}>
              <SectionLabel>Video Analyzer</SectionLabel>
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.06]"
                style={{ background: 'rgba(13,13,13,0.98)', backdropFilter: 'blur(20px)' }}>
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.6), transparent)' }} />
                <VideoUpload
                  onAnalysisComplete={handleAnalysisComplete}
                  loading={loading}
                  setLoading={setLoading}
                  isYoutubeConnected={isYoutubeConnected}
                  youtubeGoogleConnected={youtubeGoogleConnected}
                  allowedSystems={allowedSystems}
                />
              </div>
            </motion.div>
          )}

          {/* ── Analysis Results ─────────────────────────────────────────── */}
          <AnimatePresence>
            {analysis && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                variants={containerVariants}
                className="space-y-5"
              >
                {/* Analysis Header */}
                <motion.div variants={itemVariants}
                  className="relative rounded-2xl border border-white/[0.06] p-4 flex items-center gap-4 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.06), rgba(139,92,246,0.04))' }}>
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background: 'linear-gradient(90deg, rgba(220,38,38,0.6), rgba(139,92,246,0.6), transparent)' }} />
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="w-9 h-9 rounded-full border border-red-500/30 flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(220,38,38,0.1)' }}
                  >
                    <Sparkles className="w-4 h-4 text-red-400" />
                  </motion.div>
                  <div className="flex-1">
                    <h2 className="text-white font-bold">Analysis Complete</h2>
                    <p className="text-[#555] text-xs">Your video has been analyzed by our AI engine</p>
                  </div>
                  <motion.div
                    className="px-4 py-1.5 rounded-full text-xs font-bold shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(220,38,38,0.2), rgba(139,92,246,0.2))',
                      border: '1px solid rgba(220,38,38,0.3)',
                      color: '#FF6B6B',
                    }}
                    animate={{ boxShadow: ['0 0 0px rgba(220,38,38,0)', '0 0 20px rgba(220,38,38,0.3)', '0 0 0px rgba(220,38,38,0)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {lazyLoading.predict ? (
                      <span className="flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Predicting...</span>
                    ) : (
                      `Viral Score: ${analysis.viralProbability}%`
                    )}
                  </motion.div>
                  <button onClick={() => setAnalysis(null)} className="text-[#333] hover:text-white transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>

                {/* Score cards */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {allowedSystems['viral_score'] !== false && (
                    <div className="lg:col-span-2 relative rounded-2xl border border-white/[0.06] overflow-hidden"
                      style={{ background: 'rgba(12,12,12,0.98)' }}>
                      <div className="absolute top-0 left-0 right-0 h-[1px]"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.5), transparent)' }} />
                      {lazyLoading.predict ? (
                        <div className="h-[300px] flex flex-col items-center justify-center gap-4">
                          <div className="w-20 h-20 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
                          <p className="text-white font-bold animate-pulse text-sm">Calculating Viral Probability...</p>
                        </div>
                      ) : (
                        <ViralScoreMeter score={analysis.viralProbability} confidence={analysis.confidenceLevel} />
                      )}
                    </div>
                  )}
                  {allowedSystems['score_cards'] !== false && (
                    <div className="space-y-3">
                      {[
                        { key: 'hook', title: 'Hook Score', score: analysis.hookScore, color: 'blue' as const },
                        { key: 'thumbnail', title: 'Thumbnail Score', score: analysis.thumbnailScore, color: 'purple' as const },
                        { key: 'title', title: 'Title Score', score: analysis.titleScore, color: 'green' as const },
                      ].map((card, i) => (
                        <motion.div key={card.title}
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                          style={{ background: 'rgba(12,12,12,0.98)' }}>
                          <div className="absolute top-0 left-0 right-0 h-[1px]"
                            style={{ background: card.color === 'blue' ? 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' : card.color === 'purple' ? 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)' : 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }} />
                          {lazyLoading[card.key] ? (
                            <div className="p-6 h-[100px] flex items-center justify-between">
                              <div>
                                <div className="w-24 h-4 bg-white/5 rounded animate-pulse mb-2" />
                                <div className="w-16 h-8 bg-white/10 rounded animate-pulse" />
                              </div>
                              <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                            </div>
                          ) : (
                            <ScoreCard title={card.title} score={card.score} color={card.color} />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Title Suggestions */}
                {allowedSystems['title_suggestions'] !== false && (
                  <motion.div variants={itemVariants}
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                    style={{ background: 'rgba(12,12,12,0.98)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)' }} />
                    {lazyLoading.title ? (
                      <div className="p-8 space-y-3">
                        <div className="w-1/3 h-5 bg-white/10 rounded animate-pulse" />
                        {[1,2,3].map(i => <div key={i} className="w-full h-11 bg-white/5 rounded-xl animate-pulse" />)}
                      </div>
                    ) : analysis.optimizedTitles && (
                      <TitleSuggestions titles={analysis.optimizedTitles.slice(0, 5)} />
                    )}
                  </motion.div>
                )}

                {/* SEO Description */}
                {analysis.seoDescription && (
                  <motion.div variants={itemVariants}
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden p-6"
                    style={{ background: 'rgba(12,12,12,0.98)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }} />
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-4 rounded-full bg-emerald-500 inline-block" />
                        SEO Description
                      </h2>
                      <button
                        type="button"
                        onClick={() => void navigator.clipboard.writeText(analysis.seoDescription || '')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 text-white hover:border-emerald-500/40 transition-all"
                        style={{ background: 'rgba(16,185,129,0.08)' }}>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                    </div>
                    <pre className="text-sm text-[#CCCCCC] whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      {analysis.seoDescription}
                    </pre>
                  </motion.div>
                )}

                {/* Hashtags */}
                {allowedSystems['hashtag_recommendations'] !== false && (
                  <motion.div variants={itemVariants}
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                    style={{ background: 'rgba(12,12,12,0.98)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />
                    {lazyLoading.predict ? (
                      <div className="p-8">
                        <div className="w-48 h-5 bg-white/10 rounded animate-pulse mb-5" />
                        <div className="flex flex-wrap gap-2">
                          {[1,2,3,4,5,6].map(i => <div key={i} className="w-20 h-7 bg-white/5 rounded-full animate-pulse" />)}
                        </div>
                      </div>
                    ) : analysis.hashtags && (
                      <HashtagRecommendations hashtags={analysis.hashtags} />
                    )}
                  </motion.div>
                )}

                {/* Trending Topics */}
                {analysis.trendingTopics && allowedSystems['trending_topics'] !== false && (
                  <motion.div variants={itemVariants}
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                    style={{ background: 'rgba(12,12,12,0.98)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)' }} />
                    <TrendingTopics topics={analysis.trendingTopics} />
                  </motion.div>
                )}

                {/* Posting Time */}
                {analysis.bestPostingTime && allowedSystems['posting_time_heatmap'] !== false && (
                  <motion.div variants={itemVariants}
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                    style={{ background: 'rgba(12,12,12,0.98)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)' }} />
                    <PostingTimeHeatmap postingTime={analysis.bestPostingTime} />
                  </motion.div>
                )}

                {/* Engagement Graph */}
                {allowedSystems['engagement_graph'] !== false && (
                  <motion.div variants={itemVariants}
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                    style={{ background: 'rgba(12,12,12,0.98)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.5), transparent)' }} />
                    <EngagementGraph viralProbability={analysis.viralProbability} />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Live Data Widgets (shown when no analysis) ───────────────── */}
          {!analysis && (
            <motion.div variants={itemVariants}>
              <SectionLabel>Live Intelligence</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <RecentVideosWidget />
                <TrendingWidget />
                <ScheduledPostsWidget />
                <NotificationsWidget />
              </div>
            </motion.div>
          )}

          {/* ── Quick Tools ──────────────────────────────────────────────── */}
          {!analysis && (
            <motion.div variants={itemVariants}>
              <SectionLabel>Quick Tools</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { href: '/dashboard/youtube-seo', icon: Search, label: 'YouTube SEO', color: '#FF0000', key: 'qt_youtube_seo' },
                  { href: '/dashboard/keyword-intelligence', icon: Zap, label: 'Keywords', color: '#8B5CF6', key: 'qt_keyword_intelligence' },
                  { href: '/dashboard/viral-intelligence', icon: Sparkles, label: 'Ultra AI', color: '#F59E0B', key: 'qt_viral_intelligence' },
                  { href: '/ai/script-generator', icon: FileText, label: 'Script Gen', color: '#10B981', key: 'qt_script_generator' },
                  { href: '/ai/thumbnail-generator', icon: ImageIcon, label: 'Thumbnails', color: '#EC4899', key: 'qt_thumbnail_generator' },
                  { href: '/trending', icon: Flame, label: 'Trending', color: '#EF4444', key: 'qt_trending' },
                  { href: '/hashtags', icon: Hash, label: 'Hashtags', color: '#6366F1', key: 'qt_hashtags' },
                  { href: '/posting-time', icon: Clock, label: 'Post Time', color: '#F97316', key: 'qt_posting_time' },
                  { href: '/analytics', icon: BarChart3, label: 'Analytics', color: '#14B8A6', key: 'qt_analytics' },
                  { href: '/ai/hook-generator', icon: Star, label: 'Hook Gen', color: '#3B82F6', key: 'qt_hook_generator' },
                  { href: '/ai/shorts-creator', icon: Film, label: 'Shorts', color: '#A855F7', key: 'qt_shorts_creator' },
                  { href: '/dashboard/viral-optimizer', icon: Target, label: 'Optimizer', color: '#DC2626', key: 'qt_viral_optimizer' },
                ]
                  .filter(item => allowedSystems[item.key] !== false)
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href}>
                        <motion.div
                          whileHover={{ scale: 1.04, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className="relative p-3 rounded-xl border border-white/[0.05] cursor-pointer group overflow-hidden text-center"
                          style={{ background: 'rgba(13,13,13,0.98)' }}>
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: `radial-gradient(circle at center, ${item.color}08, transparent 70%)` }} />
                          <div className="relative flex flex-col items-center gap-2">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15` }}>
                              <Icon className="w-4 h-4" style={{ color: item.color }} />
                            </div>
                            <p className="text-xs font-semibold text-white leading-none">{item.label}</p>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
