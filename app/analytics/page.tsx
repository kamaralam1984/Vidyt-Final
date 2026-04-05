'use client';

import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [channelUrl, setChannelUrl] = useState('');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [channelData, setChannelData] = useState<ChannelAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

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
      alert(err.response?.data?.error || 'Failed to analyze channel');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading && !channelData) {
    return (
      <DashboardLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#FF0000]" />
          <p className="text-[#AAAAAA] animate-pulse">Loading Analytics Dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Header & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-[#FF0000]" />
              ADVANCED <span className="text-[#FF0000]">ANALYTICS</span>
            </h1>
            <p className="text-[#888] mt-1 text-lg">Predict. Analyze. Grow. Build your viral engine.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 max-w-xl self-end"
          >
            <form onSubmit={handleAnalyzeChannel} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FF0000] to-[#E60000] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-[#111] border border-[#222] rounded-xl overflow-hidden p-1">
                <div className="pl-3">
                  <Youtube className="w-5 h-5 text-[#FF0000]" />
                </div>
                <input
                  type="text"
                  placeholder="Paste YouTube Channel URL (@handle or link)..."
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-white px-4 py-3 w-full placeholder-[#555]"
                />
                <button
                  type="submit"
                  disabled={analyzing}
                  className="bg-[#FF0000] hover:bg-[#E60000] text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  {analyzing ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

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
                    <img 
                      src={channelData.channelInfo.bannerUrl} 
                      alt="Banner" 
                      className="w-full h-full object-cover opacity-50 blur-sm"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181818] to-transparent" />
                  </div>
                )}
                <div className={`${channelData.channelInfo.bannerUrl ? '-mt-16' : 'pt-8'} px-8 pb-8 flex flex-col md:flex-row items-end gap-6 relative z-10`}>
                  <div className="p-1 rounded-3xl bg-gradient-to-br from-[#FF0000] to-[#E60000] shadow-2xl">
                    <img 
                      src={channelData.channelInfo.thumbnails?.high?.url || channelData.channelInfo.thumbnails?.default?.url} 
                      className="w-32 h-32 rounded-[22px] object-cover" 
                      alt="Avatar"
                    />
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
                    <span className="text-xs text-[#555] uppercase font-black tracking-widest">Last 30 Videos</span>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={(channelData.recentVideos || []).slice().reverse()}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF0000" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                        <XAxis dataKey="publishedAt" hide />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px' }}
                          labelStyle={{ color: '#888' }}
                          formatter={(value: any) => [`${value.toLocaleString()} Views`, 'Views']}
                        />
                        <Area type="monotone" dataKey="views" stroke="#FF0000" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
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

                   <button className="w-full py-4 bg-gradient-to-r from-[#FF0000] to-[#E60000] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all">
                      Download Growth PDF
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
                                        <img src={video.thumbnail} alt="thumb" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
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
                                  <button onClick={() => window.location.href = `/dashboard/viral-optimizer?title=${encodeURIComponent(video.title)}&videoId=${video.id}`} className="text-xs font-black uppercase text-[#FF0000] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                     Analyze <ChevronRight className="w-3 h-3" />
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
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-[#FF0000]" /> Intelligence Workflow
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={overview.performanceTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #222' }} />
                          <Bar dataKey="viralScore" fill="#FF0000" radius={[4, 4, 0, 0]} />
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
                 <div className="bg-[#181818] border-2 border-dashed border-[#333] rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-[#FF0000]/10 rounded-full flex items-center justify-center">
                       <BarChart3 className="w-10 h-10 text-[#FF0000]" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-bold text-white">No analytics data yet</h3>
                       <p className="text-[#888] max-w-sm">Link your YouTube channel or analyze a video to start gathering intelligence.</p>
                    </div>
                    <button 
                      onClick={() => document.querySelector('input')?.focus()}
                      className="px-8 py-3 bg-[#FF0000] text-white rounded-xl font-bold hover:scale-105 transition-all shadow-xl shadow-[#FF0000]/20"
                    >
                      Analyze First Channel
                    </button>
                 </div>
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
