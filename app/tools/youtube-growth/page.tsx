'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { TrendingUp, Loader2, BarChart3, Lightbulb, Users, PlayCircle, Heart, Video, Search, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { useTranslations } from '@/context/translations';
import { autoCreateSeoPage } from '@/lib/autoCreateSeoPage';
import {
  Line, Bar, Area, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, PieChart, Pie, Cell,
} from 'recharts';

export default function YoutubeGrowthPage() {
  const { t } = useTranslations();
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<any>(null);

  // Load saved URL on mount
  useEffect(() => {
    const lastUrl = localStorage.getItem('last_youtube_url');
    if (lastUrl) { setChannelUrl(lastUrl); fetchData(lastUrl, filter); }
  }, []);

  // Re-fetch when filter changes
  useEffect(() => {
    const lastUrl = channelUrl.trim() || localStorage.getItem('last_youtube_url');
    if (lastUrl) fetchData(lastUrl, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchData = async (url: string, currentFilter?: string) => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/tools/youtube-growth', { channelUrl: url.trim(), range: currentFilter || filter }, { headers: getAuthHeaders() });
      setData(res.data);
      localStorage.setItem('last_youtube_url', url.trim());
      autoCreateSeoPage(res.data?.channelTitle || url);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.needsAuth) {
        setData({ needsAuth: true, channelUrl: url.trim(), channelTitle: '', subscriberCount: 0, videos: [], subscriberGrowthData: [], viewsGrowthData: [], aiInsights: [] });
      } else {
        setError(err.response?.data?.error || 'Failed to fetch channel data');
      }
    } finally { setLoading(false); }
  };

  const handleConnect = (e: React.FormEvent) => { e.preventDefault(); fetchData(channelUrl, filter); };
  const formatXAxis = (ts: string) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '';
      if (filter === 'today') return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
      if (filter === 'year') return d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
      return d.toLocaleDateString('en', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  const topVideos = data?.videos ? [...data.videos].sort((a: any, b: any) => b.views - a.views).slice(0, 5) : [];
  const worstVideos = data?.videos ? [...data.videos].sort((a: any, b: any) => a.views - b.views).slice(0, 5) : [];
  const avgViews = data?.videos?.length ? Math.round(data.videos.reduce((s: number, v: any) => s + v.views, 0) / data.videos.length) : 0;
  const filterLabels = { today: 'Today', week: '7 Days', month: '30 Days', year: '365 Days' };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* YouTube Theme Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
          {/* YouTube red accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF0000] to-transparent" />
          <div className="relative bg-[#0F0F0F] border border-[#272727] rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FF0000] flex items-center justify-center shadow-lg shadow-[#FF0000]/20">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-black text-white">YouTube</h1>
                    <span className="text-2xl md:text-3xl font-light text-[#D0D0D0]">Growth Tracker</span>
                  </div>
                  <p className="text-sm text-[#B0B0B0] mt-0.5 font-medium">
                    {data?.channelTitle ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FF0000] animate-pulse" />
                        {data.channelTitle}
                      </span>
                    ) : 'Channel analytics — YouTube Studio style'}
                  </p>
                </div>
              </div>
              {/* YouTube-style pill filter */}
              <div className="flex gap-1.5 bg-transparent">
                {(['today', 'week', 'month', 'year'] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${filter === f ? 'bg-white text-[#0F0F0F]' : 'bg-[#272727] text-[#D0D0D0] hover:bg-[#3F3F3F]'}`}>
                    {filterLabels[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* YouTube-style search bar */}
            <form onSubmit={handleConnect} className="mt-5 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B0B0]" />
                <input value={channelUrl} onChange={(e) => setChannelUrl(e.target.value)}
                  placeholder="Paste YouTube channel URL or @handle..."
                  className="w-full pl-11 pr-4 py-2.5 bg-[#121212] border border-[#303030] rounded-full text-white placeholder-[#717171] focus:border-[#3EA6FF] focus:ring-0 focus:outline-none" />
              </div>
              <button type="submit" disabled={loading}
                className="px-6 py-2.5 bg-[#3EA6FF] hover:bg-[#65B8FF] text-[#0F0F0F] rounded-full font-bold text-sm disabled:opacity-50 transition flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                {loading ? t('common.analyzing') : t('common.analyze')}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Error */}
        {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

        {/* Loading */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-3" />
            <p className="text-sm text-[#888]">Analyzing channel growth data...</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Data info */}
            {data.message && (
              <div className="bg-[#1D1D1D] border border-[#272727] p-3 rounded-xl text-xs text-[#B0B0B0] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#2BA640] animate-pulse" />
                {data.message}
              </div>
            )}

            {/* YouTube Studio Style Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Subscribers', value: data.subscriberCount?.toLocaleString() ?? '—', icon: Users, color: '#3EA6FF' },
                { label: 'Watch time (hrs)', value: data.totalWatchTime ? Math.round(data.totalWatchTime / 60).toLocaleString() : '—', icon: PlayCircle, color: '#2BA640' },
                { label: 'Likes', value: data.totalLikes?.toLocaleString() ?? '—', icon: Heart, color: '#FF0000' },
                { label: 'Avg. views', value: avgViews.toLocaleString(), icon: Video, color: '#AAAAAA' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-[#1D1D1D] rounded-xl p-4 border border-[#272727] hover:bg-[#252525] transition">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4" style={{ color: stat.color }} />
                      <span className="text-xs font-medium text-[#D0D0D0]">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Performance Ring Chart + Channel Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ring Chart */}
              <div className="bg-[#1D1D1D] border border-[#272727] rounded-xl p-5 flex flex-col items-center justify-center">
                <h3 className="text-sm font-semibold text-[#D0D0D0] mb-3 self-start">Channel Health</h3>
                <div className="relative w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Score', value: Math.min(95, Math.round((data.subscriberCount > 1000 ? 30 : 10) + (data.totalLikes > 500 ? 25 : 10) + (avgViews > 1000 ? 25 : 10) + (data.videos?.length > 10 ? 15 : 5))) },
                          { name: 'Remaining', value: Math.max(5, 100 - Math.min(95, Math.round((data.subscriberCount > 1000 ? 30 : 10) + (data.totalLikes > 500 ? 25 : 10) + (avgViews > 1000 ? 25 : 10) + (data.videos?.length > 10 ? 15 : 5)))) },
                        ]}
                        cx="50%" cy="50%" innerRadius={50} outerRadius={65} startAngle={90} endAngle={-270} paddingAngle={2} dataKey="value"
                      >
                        <Cell fill="#3EA6FF" />
                        <Cell fill="#272727" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{Math.min(95, Math.round((data.subscriberCount > 1000 ? 30 : 10) + (data.totalLikes > 500 ? 25 : 10) + (avgViews > 1000 ? 25 : 10) + (data.videos?.length > 10 ? 15 : 5)))}</span>
                    <span className="text-[10px] text-[#B0B0B0] font-medium">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Engagement Breakdown Ring */}
              <div className="bg-[#1D1D1D] border border-[#272727] rounded-xl p-5 flex flex-col items-center justify-center">
                <h3 className="text-sm font-semibold text-[#D0D0D0] mb-3 self-start">Engagement Mix</h3>
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Views', value: avgViews || 1 },
                          { name: 'Likes', value: data.totalLikes || 1 },
                          { name: 'Watch', value: data.totalWatchTime || 1 },
                        ]}
                        cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value"
                      >
                        <Cell fill="#FF0000" />
                        <Cell fill="#3EA6FF" />
                        <Cell fill="#2BA640" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#272727', border: 'none', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#FFFFFF', fontSize: 12, fontWeight: 600 }} labelStyle={{ color: '#E0E0E0' }} formatter={(val: any, name: string) => [`${Number(val).toLocaleString()}`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 mt-2 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF0000]" /> Views</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3EA6FF]" /> Likes</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2BA640]" /> Watch</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-[#1D1D1D] border border-[#272727] rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-[#D0D0D0]">Quick Stats</h3>
                {[
                  { label: 'Total Videos', value: data.videos?.length || 0, color: '#AAAAAA' },
                  { label: 'Best Video Views', value: topVideos[0]?.views?.toLocaleString() || '—', color: '#2BA640' },
                  { label: 'Lowest Video Views', value: worstVideos[0]?.views?.toLocaleString() || '—', color: '#FF4E45' },
                  { label: 'Sub/Video Ratio', value: data.videos?.length ? Math.round(data.subscriberCount / data.videos.length).toLocaleString() : '—', color: '#3EA6FF' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#272727] last:border-0">
                    <span className="text-xs text-[#B0B0B0]">{s.label}</span>
                    <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscriber Growth — Line Chart */}
            <div className="bg-[#1D1D1D] border border-[#272727] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Subscriber Growth</h2>
                <span className="text-xs text-[#B0B0B0]">{filterLabels[filter]} · Total: {data.subscriberCount?.toLocaleString()}</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={(data.subscriberGrowthData || []).slice(-20)}>
                    <defs>
                      <linearGradient id="subAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3EA6FF" stopOpacity={0.3} />
                        <stop offset="50%" stopColor="#3EA6FF" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3EA6FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#272727" vertical={false} />
                    <XAxis dataKey="date" stroke="#999999" fontSize={10} tickFormatter={formatXAxis} axisLine={false} tickLine={false} />
                    <YAxis stroke="#999999" fontSize={10} axisLine={false} tickLine={false} width={55}
                      domain={[(dataMin: number) => Math.max(0, dataMin - Math.round(dataMin * 0.05)), 'auto']}
                      tickFormatter={(val: number) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(1)}K` : `${val}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#272727', border: 'none', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                      labelStyle={{ color: '#E0E0E0', fontSize: 11 }} itemStyle={{ color: '#FFFFFF', fontSize: 12, fontWeight: 600 }}
                      labelFormatter={(ts: any) => { try { return new Date(ts).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ts; } }}
                      formatter={(val: any, name: string) => {
                        if (name === 'Subscribers') return [`${Number(val).toLocaleString()}`, '👥 Subscribers'];
                        if (name === 'Gained') return [`+${Number(val).toLocaleString()}`, '📈 Gained'];
                        return [val, name];
                      }} />
                    <Area type="monotone" dataKey="count" fill="url(#subAreaGrad)" stroke="#3EA6FF" strokeWidth={3}
                      dot={{ r: 4, fill: '#3EA6FF', stroke: '#1D1D1D', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#3EA6FF', stroke: '#fff', strokeWidth: 2 }}
                      name="Subscribers" />
                    <Line type="monotone" dataKey="gained" stroke="#2BA640" strokeWidth={2} strokeDasharray="4 4"
                      dot={{ r: 3, fill: '#2BA640', stroke: '#1D1D1D', strokeWidth: 2 }}
                      name="Gained" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2 justify-center text-[10px] text-[#D0D0D0]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3EA6FF]" /> Total Subscribers</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#2BA640]" style={{ width: 8, height: 2 }} /> Gained per video</span>
              </div>
            </div>

            {/* Views — Modern 3-Color Style */}
            <div className="bg-[#1D1D1D] border border-[#272727] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Views Per Video</h2>
                <span className="text-xs text-[#B0B0B0]">{filterLabels[filter]}</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(data.viewsGrowthData || []).slice(-20).map((d: any, i: number, arr: any[]) => {
                    const maxV = Math.max(...arr.map((x: any) => x.views || 0));
                    const pct = maxV > 0 ? (d.views / maxV) * 100 : 0;
                    return { ...d, viewsPct: pct };
                  })} barGap={4}>
                    <defs>
                      <linearGradient id="viewsHigh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2BA640" stopOpacity={1} /><stop offset="100%" stopColor="#2BA640" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="viewsMed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3EA6FF" stopOpacity={1} /><stop offset="100%" stopColor="#3EA6FF" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="viewsLow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF0000" stopOpacity={1} /><stop offset="100%" stopColor="#FF0000" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#272727" vertical={false} />
                    <XAxis dataKey="date" stroke="#999999" fontSize={10} tickFormatter={formatXAxis} axisLine={false} tickLine={false} />
                    <YAxis stroke="#999999" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val: number) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}K` : `${val}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#272727', border: 'none', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                      labelStyle={{ color: '#E0E0E0', fontSize: 11 }} itemStyle={{ color: '#FFFFFF', fontSize: 12, fontWeight: 600 }}
                      labelFormatter={(ts: any) => { try { return new Date(ts).toLocaleDateString('en', { day: 'numeric', month: 'short' }); } catch { return ts; } }}
                      formatter={(val: any) => [`${Number(val).toLocaleString()} views`, '👁 Views']} />
                    <Bar dataKey="views" radius={[4, 4, 0, 0]} maxBarSize={20}>
                      {(data.viewsGrowthData || []).slice(-20).map((_: any, i: number) => {
                        const arr = (data.viewsGrowthData || []).slice(-20);
                        const maxV = Math.max(...arr.map((x: any) => x.views || 0));
                        const pct = maxV > 0 ? ((arr[i]?.views || 0) / maxV) * 100 : 0;
                        return <Cell key={i} fill={pct >= 70 ? 'url(#viewsHigh)' : pct >= 30 ? 'url(#viewsMed)' : 'url(#viewsLow)'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2 justify-center text-[10px] text-[#D0D0D0]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2BA640]" /> Top performing</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3EA6FF]" /> Average</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF0000]" /> Low</span>
              </div>
            </div>

            {/* Engagement Trend Line Chart */}
            <div className="bg-[#1D1D1D] border border-[#272727] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Engagement Trend</h2>
                <div className="flex gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF0000]" /> Views</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3EA6FF]" /> Likes</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2BA640]" /> Viral Score</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={(data.videos || []).slice().reverse().slice(-15).map((v: any) => ({
                    name: (v.title || '').slice(0, 12) + ((v.title || '').length > 12 ? '…' : ''),
                    views: v.views || 0,
                    likes: v.likes || 0,
                    comments: v.comments || 0,
                    engagementRate: v.engagementRate || (v.views > 0 ? Math.round(((v.likes || 0) / v.views) * 10000) / 100 : 0),
                    viralScore: v.viralScore || 0,
                  }))}>
                    <CartesianGrid stroke="#272727" vertical={false} />
                    <XAxis dataKey="name" stroke="#999999" fontSize={9} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis yAxisId="left" stroke="#999999" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val: number) => val >= 1000 ? `${(val/1000).toFixed(0)}K` : `${val}`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#999999" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#272727', border: 'none', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} itemStyle={{ color: '#FFFFFF', fontSize: 12 }} labelStyle={{ color: '#E0E0E0', fontSize: 11 }}
                      formatter={(val: any, name: string) => {
                        if (name === 'Views') return [`${Number(val).toLocaleString()}`, '👁 Views'];
                        if (name === 'Likes') return [`${Number(val).toLocaleString()}`, '❤ Likes'];
                        if (name === 'Viral Score') return [`${val}/100`, '🔥 Viral'];
                        return [val, name];
                      }} />
                    <Bar yAxisId="left" dataKey="views" fill="#FF0000" radius={[3, 3, 0, 0]} maxBarSize={16} opacity={0.25} name="Views" />
                    <Line yAxisId="left" type="monotone" dataKey="likes" stroke="#3EA6FF" strokeWidth={2.5} dot={{ r: 3, fill: '#3EA6FF', stroke: '#1D1D1D', strokeWidth: 2 }} activeDot={{ r: 5 }} name="Likes" />
                    <Line yAxisId="right" type="monotone" dataKey="viralScore" stroke="#2BA640" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#2BA640', stroke: '#1D1D1D', strokeWidth: 2 }} name="Viral Score" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top & Worst Videos — YouTube Studio Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1D1D1D] border border-[#272727] rounded-xl p-5">
                <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-[#2BA640]" /> Top content
                </h2>
                <div className="space-y-1">
                  {topVideos.map((v: any, i: number) => (
                    <div key={v.videoId || i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#272727] transition group cursor-pointer">
                      <span className="text-xs font-medium text-[#B0B0B0] w-4">{i + 1}</span>
                      <div className="w-16 h-9 rounded bg-[#272727] flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <PlayCircle className="w-4 h-4 text-[#B0B0B0]" />
                      </div>
                      <span className="text-sm text-white truncate flex-1 group-hover:text-[#3EA6FF]">{v.title || `Video ${i + 1}`}</span>
                      <span className="text-xs text-[#D0D0D0] flex-shrink-0 font-medium">{v.views?.toLocaleString()} views</span>
                    </div>
                  ))}
                  {topVideos.length === 0 && <p className="text-sm text-[#B0B0B0] py-4 text-center">No video data</p>}
                </div>
              </div>
              <div className="bg-[#1D1D1D] border border-[#272727] rounded-xl p-5">
                <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-[#FF4E45]" /> Needs improvement
                </h2>
                <div className="space-y-1">
                  {worstVideos.map((v: any, i: number) => (
                    <div key={v.videoId || i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#272727] transition group cursor-pointer">
                      <span className="text-xs font-medium text-[#B0B0B0] w-4">{i + 1}</span>
                      <div className="w-16 h-9 rounded bg-[#272727] flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <PlayCircle className="w-4 h-4 text-[#B0B0B0]" />
                      </div>
                      <span className="text-sm text-white truncate flex-1 group-hover:text-[#3EA6FF]">{v.title || `Video ${i + 1}`}</span>
                      <span className="text-xs text-[#B0B0B0] flex-shrink-0 font-medium">{v.views?.toLocaleString()} views</span>
                    </div>
                  ))}
                  {worstVideos.length === 0 && <p className="text-sm text-[#B0B0B0] py-4 text-center">No video data</p>}
                </div>
              </div>
            </div>

            {/* AI Insights — YouTube Studio "Key metrics" style */}
            {(data.aiInsights || []).length > 0 && (
              <div className="bg-[#1D1D1D] border border-[#272727] rounded-xl p-5">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#FFCA28]" /> AI insights
                </h2>
                <div className="space-y-2">
                  {data.aiInsights.map((insight: string, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 px-4 py-3 bg-[#272727] rounded-lg">
                      <div className="w-5 h-5 rounded-full bg-[#3EA6FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="w-3 h-3 text-[#3EA6FF]" />
                      </div>
                      <p className="text-sm text-white leading-relaxed">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
