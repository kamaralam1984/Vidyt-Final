'use client';

import { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Target,
  Zap,
  Loader2,
  Video,
  Download,
  Lightbulb,
  Scale,
  Search,
  Youtube,
  Users,
  PlaySquare,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { useTranslations } from '@/context/translations';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface ChannelAnalytics {
  channelInfo: {
    id: string;
    title: string;
    description: string;
    customUrl: string;
    thumbnails: any;
    bannerUrl?: string;
    statistics: {
      viewCount: number;
      subscriberCount: number;
      videoCount: number;
    };
  };
  videoPerformance: {
    averageViews: number;
    averageEngagementRate: number;
    totalRecentViews: number;
    growthVelocity: number;
    consistencyScore: number;
  };
  recentVideos: Array<{
    id: string;
    title: string;
    publishedAt: string;
    thumbnail: string;
    views: number;
    likes: number;
    comments: number;
    engagementRate: number;
    viralScore: number;
  }>;
  audit: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
}

interface AnalyticsOverview {
  totalVideos: number;
  totalAnalyses: number;
  averageViralScore: number;
  averageEngagementRate: number;
  topPerformingVideos: Array<{
    id: string;
    title: string;
    viralScore: number;
    views: number;
    engagementRate: number;
  }>;
  performanceTrend: Array<{
    date: string;
    viralScore: number;
    engagementRate: number;
  }>;
}

export default function AnalyticsPage() {
  const { t } = useTranslations();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [channelUrl, setChannelUrl] = useState('');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [channelData, setChannelData] = useState<ChannelAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const downloadGrowthPdf = async () => {
    if (!channelData || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const ch = channelData.channelInfo;
      const perf = channelData.videoPerformance;

      doc.setFontSize(20);
      doc.setTextColor(255, 0, 0);
      doc.text('Growth Analytics Report', 20, 25);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 33);
      doc.line(20, 37, 190, 37);

      doc.setFontSize(16);
      doc.setTextColor(30, 30, 30);
      doc.text(ch.title || 'Channel', 20, 48);

      const stats = [
        ['Subscribers', ch.statistics?.subscriberCount?.toLocaleString() || '0'],
        ['Total Views', ch.statistics?.viewCount?.toLocaleString() || '0'],
        ['Total Videos', ch.statistics?.videoCount?.toLocaleString() || '0'],
        ['Avg Engagement', `${perf?.averageEngagementRate || 0}%`],
        ['Growth Velocity', `${(perf?.growthVelocity || 0).toLocaleString()} views/day`],
        ['Consistency Score', `${perf?.consistencyScore || 0}%`],
      ];

      let y = 60;
      doc.setFontSize(13);
      doc.setTextColor(255, 0, 0);
      doc.text('Channel Metrics', 20, y);
      y += 8;
      stats.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(`${label}:`, 25, y);
        doc.setTextColor(30, 30, 30);
        doc.text(value, 110, y);
        y += 7;
      });

      // Audit section
      const audit = channelData.audit;
      if (audit) {
        y += 8;
        doc.setFontSize(13);
        doc.setTextColor(0, 150, 0);
        doc.text('Strengths', 20, y);
        y += 7;
        (audit.strengths || []).forEach((s) => {
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          doc.text(`+ ${s}`, 25, y);
          y += 6;
        });

        y += 4;
        doc.setFontSize(13);
        doc.setTextColor(255, 0, 0);
        doc.text('Weaknesses', 20, y);
        y += 7;
        (audit.weaknesses || []).forEach((w) => {
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          doc.text(`- ${w}`, 25, y);
          y += 6;
        });

        y += 4;
        doc.setFontSize(13);
        doc.setTextColor(0, 100, 200);
        doc.text('Opportunities', 20, y);
        y += 7;
        (audit.opportunities || []).forEach((o) => {
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          doc.text(`* ${o}`, 25, y);
          y += 6;
        });
      }

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Powered by Vid YT — Advanced Analytics', 20, 285);

      doc.save(`${(ch.title || 'channel').replace(/[^a-zA-Z0-9]/g, '_')}_growth_report.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Load saved channel URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('analytics-channel-url');
      if (saved) setChannelUrl(saved);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const startDate = dateRange !== 'all'
          ? new Date(Date.now() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000)
          : undefined;
      
      const res = await axios.get('/api/analytics/dashboard', {
        params: { startDate: startDate?.toISOString() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setOverview(res.data.overview);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeChannel = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!channelUrl) return;

    try {
      setAnalyzing(true);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/analytics/youtube-channel', 
        { url: channelUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setChannelData(res.data.analytics);
      // Refresh general stats to reflect new analysis
      loadDashboardStats();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to analyze channel. Make sure YouTube API key is configured.';
      setChannelData(null);
      // Show error inline instead of alert
      console.error('Channel analysis failed:', msg);
      if (typeof window !== 'undefined') {
        const el = document.getElementById('analytics-error');
        if (el) { el.textContent = msg; el.style.display = 'block'; setTimeout(() => { el.style.display = 'none'; }, 8000); }
      }
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading && !channelData) {
    return (
      <DashboardLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#FF0000]" />
          <p className="text-[#AAAAAA] animate-pulse">{t('common.loading')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* VFX Animated Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000]/15 via-purple-500/10 to-[#FF0000]/15 animate-pulse" />
          <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-[#FF0000]/20 rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF0000] to-purple-600 flex items-center justify-center shadow-lg shadow-[#FF0000]/30">
                  <BarChart3 className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#FF4444]">
                    {t('analytics.title')}
                  </h1>
                  <p className="text-sm text-[#888] mt-0.5">{t('analytics.subtitle')}</p>
                </div>
              </div>

              {/* Date Range Selector */}
              <div className="flex gap-1 p-1 bg-[#111] border border-[#333] rounded-xl">
                {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                  <button key={range} onClick={() => setDateRange(range)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition ${dateRange === range ? 'bg-[#FF0000] text-white' : 'text-[#888] hover:text-white'}`}>
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleAnalyzeChannel} className="mt-5 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF0000]/30 to-purple-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition" />
              <div className="relative flex items-center bg-[#111] border border-[#222] rounded-xl overflow-hidden">
                <div className="pl-4"><Youtube className="w-5 h-5 text-[#FF0000]" /></div>
                <input type="text"
                  placeholder="Paste YouTube Channel URL (@handle or link)..."
                  value={channelUrl}
                  onChange={(e) => {
                    setChannelUrl(e.target.value);
                    if (typeof window !== 'undefined') localStorage.setItem('analytics-channel-url', e.target.value);
                  }}
                  className="bg-transparent border-none focus:ring-0 text-white px-4 py-3.5 w-full placeholder-[#555]" />
                <button type="submit" disabled={analyzing}
                  className="mr-1.5 bg-gradient-to-r from-[#FF0000] to-[#CC0000] hover:from-[#E60000] hover:to-[#AA0000] text-white px-6 py-2.5 rounded-lg font-black text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-[#FF0000]/20">
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {analyzing ? t('common.analyzing') : t('common.analyze')}
                </button>
              </div>
            </form>
            <div id="analytics-error" style={{ display: 'none' }} className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm" />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {channelData ? (
            <motion.div
              key="channel-data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Channel Profile Header */}
              <div className="relative rounded-3xl overflow-hidden bg-[#181818] border border-[#222]">
                {channelData.channelInfo.bannerUrl && (
                  <div className="h-48 w-full relative">
                    <NextImage src={channelData.channelInfo.bannerUrl} alt="Banner" fill sizes="100vw" className="object-cover opacity-50 blur-sm" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent" />
                  </div>
                )}
                <div className={`${channelData.channelInfo.bannerUrl ? '-mt-16' : 'pt-8'} px-8 pb-8 flex flex-col md:flex-row items-end gap-6 relative z-10`}>
                  <div className="p-1 rounded-3xl bg-gradient-to-br from-[#FF0000] to-[#E60000] shadow-2xl">
                    <NextImage src={channelData.channelInfo.thumbnails?.high?.url || channelData.channelInfo.thumbnails?.default?.url} width={128} height={128} className="w-32 h-32 rounded-[22px] object-cover" alt="Avatar" unoptimized />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold text-white">{channelData.channelInfo.title}</h2>
                      <div className="bg-[#FF0000]/10 text-[#FF0000] text-xs font-black px-2 py-1 rounded uppercase tracking-wider">Verified Analysis</div>
                    </div>
                    <p className="text-[#888] line-clamp-1 max-w-2xl">{channelData.channelInfo.description}</p>
                    <div className="flex flex-wrap gap-6 mt-4">
                      <div className="flex items-center gap-2 text-[#AAA]">
                        <Users className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-bold">{channelData.channelInfo?.statistics?.subscriberCount?.toLocaleString() || '0'}</span> Subscribers
                      </div>
                      <div className="flex items-center gap-2 text-[#AAA]">
                        <Eye className="w-5 h-5 text-emerald-400" />
                        <span className="text-white font-bold">{channelData.channelInfo?.statistics?.viewCount?.toLocaleString() || '0'}</span> Total Views
                      </div>
                      <div className="flex items-center gap-2 text-[#AAA]">
                        <PlaySquare className="w-5 h-5 text-[#FF0000]" />
                        <span className="text-white font-bold">{channelData.channelInfo?.statistics?.videoCount?.toLocaleString() || '0'}</span> Videos
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => window.open(`https://youtube.com/channel/${channelData.channelInfo.id}`, '_blank')}
                      className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all flex items-center gap-2"
                    >
                      <Youtube className="w-5 h-5" /> Visit Channel
                    </button>
                  </div>
                </div>
              </div>

              {/* Channel Health Score + Fixes + Keywords + Hashtags */}
              {(() => {
                const engRate = channelData.videoPerformance?.averageEngagementRate || 0;
                const consistency = channelData.videoPerformance?.consistencyScore || 0;
                const velocity = channelData.videoPerformance?.growthVelocity || 0;
                const videoCount = channelData.channelInfo?.statistics?.videoCount || 0;
                const subCount = channelData.channelInfo?.statistics?.subscriberCount || 0;
                const strengths = channelData.audit?.strengths || [];
                const weaknesses = channelData.audit?.weaknesses || [];
                const opportunities = channelData.audit?.opportunities || [];

                // Health factors
                const factors = [
                  { label: 'Engagement Rate', score: Math.min(100, Math.round(engRate * 12)), fix: 'Ask questions in videos, add polls, reply to every comment within 1 hour', setting: 'Community Tab → Posts & Polls' },
                  { label: 'Upload Consistency', score: consistency, fix: 'Upload at least 2-3 videos per week on fixed days', setting: 'YouTube Studio → Content → Schedule' },
                  { label: 'Growth Velocity', score: Math.min(100, Math.round(velocity / 50)), fix: 'Collaborate with similar channels, use YouTube Shorts to reach new audience', setting: 'YouTube Studio → Analytics → Reach' },
                  { label: 'Video Library', score: Math.min(100, videoCount >= 50 ? 95 : videoCount >= 20 ? 75 : videoCount >= 10 ? 55 : 30), fix: videoCount < 20 ? 'Upload more videos — channels with 50+ videos get 3x more search traffic' : 'Good video count. Focus on quality and SEO now', setting: 'YouTube Studio → Content' },
                  { label: 'SEO Optimization', score: strengths.length > 2 ? 80 : weaknesses.length > 2 ? 35 : 55, fix: 'Add keywords in title (first 60 chars), description (first 2 lines), tags, and closed captions', setting: 'YouTube Studio → Video Details → Tags, Description' },
                  { label: 'Thumbnail Quality', score: weaknesses.some(w => /thumbnail/i.test(w)) ? 40 : 75, fix: 'Use bright colors, face close-up with emotion, bold 3-5 word text, high contrast', setting: 'YouTube Studio → Video Details → Thumbnail' },
                ];

                const health = Math.min(99, Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length));
                const healthColor = health >= 75 ? 'text-emerald-400' : health >= 50 ? 'text-amber-400' : 'text-red-400';
                const healthBar = health >= 75 ? 'from-emerald-500 to-emerald-400' : health >= 50 ? 'from-amber-500 to-amber-400' : 'from-red-500 to-red-400';
                const healthLabel = health >= 75 ? 'Excellent' : health >= 50 ? 'Good' : 'Needs Work';
                const weakFactors = factors.filter(f => f.score < 70);

                // Generate keywords from channel data
                const channelTitle = channelData.channelInfo?.title || '';
                const channelDesc = channelData.channelInfo?.description || '';
                const topVideoTitles = (channelData.recentVideos || []).slice(0, 5).map((v: any) => v.title).join(' ');
                const allText = `${channelTitle} ${channelDesc} ${topVideoTitles}`.toLowerCase();
                const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','have','has','had','do','does','did','will','would','could','should','may','might','can','this','that','these','those','i','you','we','they','my','your','our','me','us','it','its','as','so','if','about','how','what','when','where','why','who','which','not','no','very','just','also','more','most','some','all','each','every']);
                const words = allText.split(/[\s,;.!?|#@()\[\]{}]+/).filter(w => w.length > 3 && !stopWords.has(w) && !/^\d+$/.test(w));
                const wordFreq = new Map<string, number>();
                words.forEach(w => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));
                const topKeywords = Array.from(wordFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([w]) => w);
                const suggestedHashtags = topKeywords.slice(0, 10).map(k => `#${k}`);
                suggestedHashtags.push('#viral', '#trending', '#youtube', '#shorts', '#subscribe');

                return (
                  <div className="space-y-6">
                    {/* Health Score Card */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="relative rounded-3xl overflow-hidden bg-[#181818] border border-[#222] p-6">
                      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 10% 50%, ${health >= 75 ? 'rgba(16,185,129,0.05)' : health >= 50 ? 'rgba(245,158,11,0.05)' : 'rgba(239,68,68,0.05)'} 0%, transparent 60%)` }} />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#FF0000]" /> Channel Health Score
                          </h3>
                          <span className={`text-xs font-black px-3 py-1 rounded-full ${health >= 75 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : health >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {healthLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 mb-6">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                            className={`text-6xl font-black ${healthColor}`}>
                            {health}%
                          </motion.div>
                          <div className="flex-1">
                            <div className="w-full h-4 bg-[#222] rounded-full overflow-hidden mb-3">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${health}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                                className={`h-full rounded-full bg-gradient-to-r ${healthBar}`} />
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-[10px] text-[#666]">
                              <span>Engagement: {engRate.toFixed(1)}%</span>
                              <span>Consistency: {consistency}%</span>
                              <span>Growth: {velocity.toLocaleString()}/day</span>
                              <span>Videos: {videoCount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Factor Breakdown */}
                        <div className="space-y-2.5 mb-1">
                          {factors.map((f, i) => {
                            const fc = f.score >= 70 ? 'text-emerald-400' : f.score >= 50 ? 'text-amber-400' : 'text-red-400';
                            const fb = f.score >= 70 ? 'bg-emerald-500' : f.score >= 50 ? 'bg-amber-500' : 'bg-red-500';
                            const icon = f.score >= 70 ? '✓' : f.score >= 50 ? '⚡' : '✗';
                            return (
                              <div key={i}>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-[#AAA] flex items-center gap-1.5"><span className={fc}>{icon}</span> {f.label}</span>
                                  <span className={`font-bold ${fc}`}>{f.score}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${f.score}%` }} transition={{ delay: i * 0.1, duration: 0.6 }}
                                    className={`h-full rounded-full ${fb}`} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>

                    {/* What to Fix */}
                    {weakFactors.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6">
                        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-400" /> What Needs Fixing ({weakFactors.length} issues)
                        </h3>
                        <div className="space-y-4">
                          {weakFactors.map((f, i) => (
                            <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-white">{f.label}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${f.score < 50 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{f.score}%</span>
                              </div>
                              <p className="text-sm text-emerald-400 mb-1">→ {f.fix}</p>
                              <p className="text-xs text-[#666]">📍 Where to set: <span className="text-[#AAA]">{f.setting}</span></p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Recommended Keywords for Channel */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="bg-[#181818] border border-[#222] rounded-3xl p-6">
                      <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-400" /> Recommended Keywords for This Channel
                      </h3>
                      <p className="text-xs text-[#888] mb-4">Use these keywords in your video titles, descriptions, and tags to rank higher in search.</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {topKeywords.map((kw, i) => (
                          <span key={i} className={`px-3 py-1.5 rounded-xl text-sm font-medium border ${i < 5 ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : i < 10 ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-[#222] text-[#AAA] border-[#333]'}`}>
                            {i < 3 && <Zap className="w-3 h-3 inline mr-1" />}{kw}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-[#666]">💡 Top 5 keywords (purple) should be in EVERY video title. Blue keywords use in description and tags.</p>
                    </motion.div>

                    {/* Viral Hashtags for Channel */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                      className="bg-[#181818] border border-[#222] rounded-3xl p-6">
                      <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-amber-400" /> Viral Hashtags for This Channel
                      </h3>
                      <p className="text-xs text-[#888] mb-4">Add these hashtags in your video description to get discovered by more viewers.</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedHashtags.map((tag, i) => (
                          <span key={i} className={`px-3 py-1.5 rounded-xl text-sm font-medium border ${i < 5 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : i < 10 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-[#222] text-[#AAA] border-[#333]'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-[#666] mt-3">💡 Green hashtags = channel-specific (high relevance). Amber = niche. Gray = general viral tags. Use all 15 in every video.</p>
                    </motion.div>
                  </div>
                );
              })()}

              {/* Advanced Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                  title="Avg Engagement Rate" 
                  value={`${channelData.videoPerformance?.averageEngagementRate || 0}%`} 
                  icon={TrendingUp} 
                  color="text-emerald-400"
                  sub={`${(channelData.videoPerformance?.averageEngagementRate || 0) > 4 ? 'Excellent Performance' : 'Standard'}`}
                />
                <MetricCard 
                  title="Growth Velocity" 
                  value={`${(channelData.videoPerformance?.growthVelocity || 0).toLocaleString()}`} 
                  icon={Zap} 
                  color="text-[#FF0000]"
                  sub="Views per day (Recent)"
                />
                <MetricCard 
                  title="Viral Score" 
                  value={`${Math.round((channelData.videoPerformance?.averageEngagementRate || 0) * 15)}%`} 
                  icon={Sparkles} 
                  color="text-purple-400"
                  sub="Overall channel potential"
                />
                <MetricCard 
                  title="Consistency Score" 
                  value={`${channelData.videoPerformance?.consistencyScore || 0}%`} 
                  icon={Target} 
                  color="text-blue-400"
                  sub="Upload frequency index"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Performance Chart */}
                <div className="lg:col-span-2 bg-[#181818] border border-[#222] rounded-3xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                       <TrendingUp className="w-5 h-5 text-[#FF0000]" /> Recent Video Velocity
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-xs text-[#888]"><span className="w-2.5 h-2.5 rounded-full bg-[#FF0000]" /> Views</span>
                      <span className="flex items-center gap-1.5 text-xs text-[#888]"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Engagement</span>
                      <span className="text-xs text-[#555] uppercase font-black tracking-widest">Last 30 Videos</span>
                    </div>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={(channelData.recentVideos || []).slice().reverse()}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF0000" stopOpacity={0.4}/>
                            <stop offset="50%" stopColor="#FF0000" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                        <XAxis
                          dataKey="publishedAt"
                          tick={{ fill: '#555', fontSize: 10 }}
                          tickFormatter={(val: string) => { try { return new Date(val).toLocaleDateString('en', { month: 'short', day: 'numeric' }); } catch { return ''; } }}
                          axisLine={{ stroke: '#222' }}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fill: '#555', fontSize: 10 }}
                          tickFormatter={(val: number) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : `${val}`}
                          axisLine={false}
                          tickLine={false}
                          width={45}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', padding: '12px 16px' }}
                          labelStyle={{ color: '#888', fontSize: 11, marginBottom: 4 }}
                          labelFormatter={(val: string) => { try { return new Date(val).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return val; } }}
                          formatter={(value: any, name: string) => [
                            `${typeof value === 'number' ? value.toLocaleString() : value}${name === 'engagementRate' ? '%' : ''}`,
                            name === 'views' ? '👁 Views' : '📊 Engagement'
                          ]}
                        />
                        <Area type="monotone" dataKey="views" stroke="#FF0000" strokeWidth={2.5} fillOpacity={1} fill="url(#colorViews)" dot={false} activeDot={{ r: 5, fill: '#FF0000', stroke: '#fff', strokeWidth: 2 }} />
                        <Area type="monotone" dataKey="engagementRate" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorEngagement)" dot={false} activeDot={{ r: 4, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Audit Panel */}
                <div className="bg-[#181818] border border-[#222] rounded-3xl p-8 space-y-8 flex flex-col">
                   <h3 className="text-xl font-bold text-white flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5 text-emerald-400" /> Channel AI Audit
                   </h3>
                   
                   <div className="flex-1 space-y-6">
                      <div className="space-y-3">
                         <div className="text-[10px] uppercase font-black text-emerald-400 tracking-widest flex items-center gap-2">
                            <ArrowUpRight className="w-3 h-3" /> Core Strengths
                         </div>
                         <div className="space-y-2">
                            {(channelData.audit?.strengths || []).map((s, i) => (
                              <div key={i} className="flex gap-3 text-sm text-[#CCC] bg-emerald-400/5 border border-emerald-400/10 p-3 rounded-xl">
                                 <span className="text-emerald-400 font-bold">•</span> {s}
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div className="text-[10px] uppercase font-black text-[#FF0000] tracking-widest flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> Growth Inhibitors
                         </div>
                         <div className="space-y-2">
                            {(channelData.audit?.weaknesses || []).map((w, i) => (
                              <div key={i} className="flex gap-3 text-sm text-[#CCC] bg-[#FF0000]/5 border border-[#FF0000]/10 p-3 rounded-xl">
                                 <span className="text-[#FF0000] font-bold">•</span> {w}
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div className="text-[10px] uppercase font-black text-blue-400 tracking-widest flex items-center gap-2">
                            <Lightbulb className="w-3 h-3" /> Opportunities
                         </div>
                         <div className="space-y-2">
                            {(channelData.audit?.opportunities || []).map((o, i) => (
                              <div key={i} className="flex gap-3 text-sm text-[#CCC] bg-blue-400/5 border border-blue-400/10 p-3 rounded-xl">
                                 <span className="text-blue-400 font-bold">•</span> {o}
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>

                   <button
                      onClick={downloadGrowthPdf}
                      disabled={downloadingPdf}
                      className="w-full py-4 bg-gradient-to-r from-[#FF0000] to-[#E60000] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                      {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {downloadingPdf ? t('analytics.generatingPdf') : t('analytics.downloadPdf')}
                   </button>
                </div>
              </div>

              {/* Video Table */}
              <div className="bg-[#181818] border border-[#222] rounded-3xl overflow-hidden shadow-2xl">
                 <div className="p-8 border-b border-[#222] flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Video className="w-5 h-5 text-[#FF0000]" /> Video Performance Breakdown
                    </h3>
                    <div className="text-xs text-[#555] uppercase font-black tracking-widest">Global Ranking Data</div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="text-[10px] uppercase font-black text-[#666] tracking-widest border-b border-[#222]">
                             <th className="px-8 py-4">Video</th>
                             <th className="px-8 py-4">Views</th>
                             <th className="px-8 py-4">Engagement</th>
                             <th className="px-8 py-4">Viral Score</th>
                             <th className="px-8 py-4">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-[#222]">
                          {(channelData.recentVideos || []).map((video) => (
                            <tr key={video.id} className="group hover:bg-white/[0.02] transition-colors">
                               <td className="px-8 py-4 max-w-md">
                                  <div className="flex items-center gap-4">
                                     <div className="w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#111]">
                                        <NextImage src={video.thumbnail} alt="thumb" width={96} height={56} className="w-full h-full object-cover group-hover:scale-110 transition-transform" unoptimized />
                                     </div>
                                     <div className="space-y-1">
                                        <p className="text-sm font-bold text-white line-clamp-1">{video.title}</p>
                                        <p className="text-xs text-[#555]">{video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : 'N/A'}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-8 py-4">
                                  <div className="text-sm font-bold text-white">{(video.views || 0).toLocaleString()}</div>
                               </td>
                               <td className="px-8 py-4">
                                  <div className="flex items-center gap-2">
                                     <div className="w-16 h-1.5 bg-[#222] rounded-full overflow-hidden">
                                        <div className={`h-full ${video.engagementRate > 3 ? 'bg-emerald-400' : 'bg-yellow-400'}`} style={{ width: `${Math.min(100, video.engagementRate * 10)}%` }} />
                                     </div>
                                     <span className="text-xs text-white font-bold">{video.engagementRate || 0}%</span>
                                  </div>
                               </td>
                               <td className="px-8 py-4">
                                  <span className={`text-sm font-black ${video.viralScore > 70 ? 'text-[#FF0000]' : 'text-[#AAA]'}`}>{video.viralScore}%</span>
                               </td>
                               <td className="px-8 py-4">
                                  <button onClick={() => window.location.href = `/dashboard/viral-optimizer?title=${encodeURIComponent(video.title)}&videoId=${video.id}`}
                                    className="text-xs font-black uppercase text-[#FF0000] hover:text-white bg-[#FF0000]/10 hover:bg-[#FF0000] px-3 py-1 rounded-lg flex items-center gap-1 transition-all">
                                     {t('common.analyze')} <ChevronRight className="w-3 h-3" />
                                  </button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="dashboard-stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Dashboard Content for no-channel state */}
              {overview && (
                 <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <MetricCard title="Total Assets" value={overview.totalVideos.toString()} icon={Video} color="text-white" sub="Across all platforms" />
                      <MetricCard title="Total Analyses" value={overview.totalAnalyses.toString()} icon={Zap} color="text-[#FF0000]" sub="AI credits used" />
                      <MetricCard title="Avg Viral Probability" value={`${overview.averageViralScore}%`} icon={Target} color="text-emerald-400" sub="Performance score" />
                      <MetricCard title="Avg Engagement" value={`${overview.averageEngagementRate}%`} icon={TrendingUp} color="text-blue-400" sub="Content resonance" />
                   </div>

                   <div className="bg-[#181818] border border-[#222] rounded-3xl p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-[#FF0000]" /> Intelligence Workflow
                        </h3>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 text-xs text-[#888]"><span className="w-2.5 h-2.5 rounded-full bg-[#FF0000]" /> Viral Score</span>
                          <span className="flex items-center gap-1.5 text-xs text-[#888]"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Engagement</span>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={overview.performanceTrend} barGap={2}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FF4444" stopOpacity={1}/>
                              <stop offset="100%" stopColor="#FF0000" stopOpacity={0.6}/>
                            </linearGradient>
                            <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                              <stop offset="100%" stopColor="#10B981" stopOpacity={0.5}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1a1a1a" />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: '#555', fontSize: 10 }}
                            tickFormatter={(val: string) => { try { return new Date(val).toLocaleDateString('en', { month: 'short', day: 'numeric' }); } catch { return val; } }}
                            axisLine={{ stroke: '#222' }}
                            tickLine={false}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fill: '#555', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            width={35}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', padding: '12px 16px' }}
                            labelStyle={{ color: '#888', fontSize: 11, marginBottom: 4 }}
                            labelFormatter={(val: string) => { try { return new Date(val).toLocaleDateString('en', { month: 'long', day: 'numeric' }); } catch { return val; } }}
                            formatter={(value: any, name: string) => [`${value}%`, name === 'viralScore' ? '🔥 Viral Score' : '📊 Engagement']}
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                          />
                          <Bar dataKey="viralScore" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={20} />
                          <Bar dataKey="engagementRate" fill="url(#barGradient2)" radius={[6, 6, 0, 0]} maxBarSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>

                   {overview.topPerformingVideos.length > 0 && (
                     <div className="bg-[#181818] border border-[#222] rounded-3xl p-8 space-y-6">
                        <h3 className="text-xl font-bold text-white">Top Strategy Results</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {overview.topPerformingVideos.map(v => (
                             <div key={v.id} className="p-4 bg-[#111] border border-[#222] rounded-2xl flex items-center justify-between">
                                <div className="space-y-1">
                                   <p className="font-bold text-white line-clamp-1">{v.title}</p>
                                   <p className="text-xs text-[#555]">{v.views.toLocaleString()} Total Impressions</p>
                                </div>
                                <div className="bg-[#FF0000]/10 text-[#FF0000] px-3 py-1 rounded-full text-xs font-black">{v.viralScore}%</div>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                 </div>
              )}

              {/* Promo Banner if empty */}
              {!overview || overview.totalVideos === 0 ? (
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                   className="relative bg-[#181818] border-2 border-dashed border-[#333] rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-6 overflow-hidden">
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,0,0,0.05) 0%, transparent 70%)' }} />
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                      className="w-20 h-20 bg-[#FF0000]/10 rounded-full flex items-center justify-center relative">
                       <BarChart3 className="w-10 h-10 text-[#FF0000]" />
                    </motion.div>
                    <div className="space-y-2 relative">
                       <h3 className="text-2xl font-bold text-white">{t('analytics.noData')}</h3>
                       <p className="text-[#888] max-w-sm">{t('analytics.noDataDesc')}</p>
                    </div>
                    <button
                      onClick={() => document.querySelector('input')?.focus()}
                      className="relative px-8 py-3 bg-gradient-to-r from-[#FF0000] to-[#CC0000] text-white rounded-xl font-black hover:scale-105 transition-all shadow-xl shadow-[#FF0000]/20"
                    >
                      {t('analytics.analyzeFirst')}
                    </button>
                 </motion.div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ title, value, icon: Icon, color, sub }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#181818] border border-[#222] rounded-3xl p-6 space-y-4 hover:border-[#333] transition-colors relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16" />
      </div>
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="space-y-1">
        <p className="text-xs uppercase font-black text-[#555] tracking-widest">{title}</p>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
      <p className="text-[10px] text-[#666] font-medium flex items-center gap-1 uppercase tracking-tighter">
        <Info className="w-3 h-3" /> {sub}
      </p>
    </motion.div>
  );
}
