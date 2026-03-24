'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { TrendingUp, Loader2, BarChart3, Lightbulb, Users, PlayCircle, Heart, Video } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  LineChart,
  Line,
  Bar,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
} from 'recharts';

export default function YoutubeGrowthPage() {
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<{
    channelUrl: string;
    channelTitle: string;
    subscriberCount: number;
    videos: { videoId: string; title: string; views: number; publishedAt: string; viralScore?: number }[];
    subscriberGrowthData: { timestamp: string; count: number }[];
    viewsGrowthData: { timestamp: string; views: number }[];
    aiInsights: string[];
    totalWatchTime?: number;
    totalLikes?: number;
    isConnected?: boolean;
    needsAuth?: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    const lastUrl = localStorage.getItem('last_youtube_url');
    if (lastUrl) {
      setChannelUrl(lastUrl);
      fetchData(lastUrl, filter);
    }
  }, [filter]);

  const fetchData = async (url: string, currentFilter?: string) => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/tools/youtube-growth', { 
        channelUrl: url.trim(), 
        range: currentFilter || filter 
      }, { headers: getAuthHeaders() });
      setData(res.data);
      localStorage.setItem('last_youtube_url', url.trim());
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.needsAuth) {
        setData({ 
          needsAuth: true, 
          channelUrl: url.trim(),
          channelTitle: '',
          subscriberCount: 0,
          videos: [],
          subscriberGrowthData: [],
          viewsGrowthData: [],
          aiInsights: [],
          totalWatchTime: 0,
          totalLikes: 0,
        });
      } else {
        alert(err.response?.data?.error || 'Failed to fetch channel');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(channelUrl, filter);
  };

  const handleYouTubeAuth = () => {
    window.location.href = '/api/youtube/auth';
  };

  const formatXAxis = (ts: string) => {
    const d = new Date(ts);
    if (filter === 'today') return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    if (filter === 'year') return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const topVideos = data?.videos ? [...data.videos].sort((a, b) => b.views - a.views).slice(0, 5) : [];
  const worstVideos = data?.videos ? [...data.videos].sort((a, b) => a.views - b.views).slice(0, 5) : [];
  const avgViews = data?.videos?.length 
    ? Math.round(data.videos.reduce((s: number, v: any) => s + v.views, 0) / data.videos.length).toLocaleString()
    : '0';

  const filterLabels = { today: 'Today', week: '7 Days', month: '30 Days', year: '365 Days' };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#FF0000]" />
            YouTube Growth Tracker
          </h1>
          <p className="text-[#AAAAAA] mb-6">Real-time channel analytics matching YouTube Studio.</p>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <form onSubmit={handleConnect} className="flex-1 bg-[#181818] border border-[#212121] rounded-xl p-4 flex gap-2">
              <input value={channelUrl} onChange={(e) => setChannelUrl(e.target.value)} placeholder="Channel URL or @handle" className="flex-1 px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white" />
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze'}
              </button>
            </form>
            
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-2 flex gap-1">
              {(['today', 'week', 'month', 'year'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-[#FF0000] text-white shadow-lg' : 'text-[#AAAAAA] hover:bg-[#212121]'}`}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
          </div>

          {data && (
            <div className="space-y-8">
              {data.needsAuth && (
                <div className="bg-[#181818] border-l-4 border-yellow-500 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-500/10 p-2 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">Connect YouTube Studio for private metrics</p>
                      <p className="text-[#AAAAAA] text-xs">Unlock Watch Time (minutes), real-time engagement trends, and more.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleYouTubeAuth}
                    className="px-4 py-1.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                  >
                    Connect Studio 🚀
                  </button>
                </div>
              )}

              {data.message && !data.needsAuth && (
                <div className="bg-[#181818] border border-[#212121] p-3 rounded-lg text-xs text-[#AAAAAA] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {data.message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
                  <p className="text-[#AAAAAA] text-sm flex items-center gap-1"><Users className="w-4 h-4" /> Subscribers</p>
                  <p className="text-2xl font-bold text-white">{data.subscriberCount?.toLocaleString() ?? '–'}</p>
                </div>
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
                  <p className="text-[#AAAAAA] text-sm flex items-center gap-1"><PlayCircle className="w-4 h-4" /> Watch Time (min)</p>
                  <p className="text-2xl font-bold text-white text-green-500">{data.totalWatchTime?.toLocaleString() ?? '–'}</p>
                </div>
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
                  <p className="text-[#AAAAAA] text-sm flex items-center gap-1"><Heart className="w-4 h-4" /> Total Likes</p>
                  <p className="text-2xl font-bold text-white text-red-500">{data.totalLikes?.toLocaleString() ?? '–'}</p>
                </div>
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
                  <p className="text-[#AAAAAA] text-sm flex items-center gap-1"><Video className="w-4 h-4" /> Avg. Views</p>
                  <p className="text-2xl font-bold text-white">{avgViews}</p>
                </div>
              </div>

              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Subscriber growth ({filterLabels[filter as keyof typeof filterLabels]})</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.subscriberGrowthData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#888" 
                        fontSize={10} 
                        tickFormatter={formatXAxis}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#3B82F6" 
                        fontSize={10} 
                        axisLine={false}
                        tickLine={false}
                        domain={['dataMin - 1000', 'auto']}
                        tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val.toLocaleString()}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#22D3EE" 
                        fontSize={10} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px' }} 
                        labelFormatter={(ts: any) => new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                      
                      {/* Line 1: Total Subscribers (Blue) */}
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="count" 
                        name="Total Subs" 
                        stroke="#3B82F6" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      
                      {/* Line 2: Daily Change (Cyan) */}
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey={(d: any) => {
                          if (!data || !data.subscriberGrowthData) return 0;
                          const idx = data.subscriberGrowthData.indexOf(d);
                          if (idx <= 0) return 0;
                          return Math.abs(d.count - data.subscriberGrowthData[idx-1].count);
                        }} 
                        name="New Subs" 
                        stroke="#22D3EE" 
                        strokeWidth={2} 
                        dot={{ r: 3, fill: '#22D3EE', strokeWidth: 0 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Views growth ({filterLabels[filter as keyof typeof filterLabels]})</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.viewsGrowthData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#888" 
                        fontSize={10} 
                        tickFormatter={formatXAxis}
                      />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#181818', border: '1px solid #333' }} 
                        labelFormatter={(ts: string | number) => new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      />
                      <Bar dataKey="views" fill="#FF0000" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-3">Top performing videos</h2>
                  <ul className="space-y-2">
                    {topVideos.map((v: any, i: number) => (
                      <li key={v.videoId || i} className="flex justify-between text-sm">
                        <span className="text-[#CCCCCC] truncate flex-1 mr-2">{v.title || `Video ${i + 1}`}</span>
                        <span className="text-white shrink-0">{v.views?.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-3">Worst performing videos</h2>
                  <ul className="space-y-2">
                    {worstVideos.map((v: any, i: number) => (
                      <li key={v.videoId || i} className="flex justify-between text-sm">
                        <span className="text-[#CCCCCC] truncate flex-1 mr-2">{v.title || `Video ${i + 1}`}</span>
                        <span className="text-white shrink-0">{v.views?.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-[#FFD700]" /> AI Insights</h2>
                <ul className="space-y-2">
                  {(data.aiInsights || []).map((insight: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-[#CCCCCC] text-sm">
                      <span className="text-[#FF0000]">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
