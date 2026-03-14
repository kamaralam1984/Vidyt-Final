'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { TrendingUp, Loader2, BarChart3, Lightbulb } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export default function YoutubeGrowthPage() {
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    channelUrl: string;
    channelTitle: string;
    subscriberCount: number;
    videos: { videoId: string; title: string; views: number; publishedAt: string; viralScore?: number }[];
    subscriberGrowthData: { date: string; count: number }[];
    viewsGrowthData: { date: string; views: number }[];
    aiInsights: string[];
  } | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelUrl.trim()) return;
    setLoading(true);
    setData(null);
    try {
      const res = await axios.post('/api/tools/youtube-growth', { channelUrl: channelUrl.trim() }, { headers: getAuthHeaders() });
      setData(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to fetch channel');
    } finally {
      setLoading(false);
    }
  };

  const topVideos = data?.videos?.slice().sort((a, b) => b.views - a.views).slice(0, 5) || [];
  const worstVideos = data?.videos?.slice().sort((a, b) => a.views - b.views).slice(0, 5) || [];
  const avgViral = data?.videos?.length
    ? Math.round(data.videos.reduce((s, v) => s + (v.viralScore || 0), 0) / data.videos.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#FF0000]" />
            YouTube Growth Tracker
          </h1>
          <p className="text-[#AAAAAA] mb-6">Connect channel – last 50 videos, growth charts, AI insights.</p>

          <form onSubmit={handleConnect} className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-8">
            <label className="block text-sm text-[#AAAAAA] mb-2">YouTube channel URL</label>
            <div className="flex gap-2">
              <input value={channelUrl} onChange={(e) => setChannelUrl(e.target.value)} placeholder="https://youtube.com/@channel or /channel/UC..." className="flex-1 px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white" />
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fetch'}
              </button>
            </div>
          </form>

          {data && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
                  <p className="text-[#AAAAAA] text-sm">Subscribers</p>
                  <p className="text-2xl font-bold text-white">{data.subscriberCount?.toLocaleString() ?? '–'}</p>
                </div>
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
                  <p className="text-[#AAAAAA] text-sm">Videos tracked</p>
                  <p className="text-2xl font-bold text-white">{data.videos?.length ?? 0}</p>
                </div>
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
                  <p className="text-[#AAAAAA] text-sm">Avg. viral score</p>
                  <p className="text-2xl font-bold text-white">{avgViral}</p>
                </div>
              </div>

              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Subscriber growth</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.subscriberGrowthData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" stroke="#888" fontSize={12} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333' }} />
                      <Line type="monotone" dataKey="count" stroke="#FF0000" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Views growth (last 50 videos)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(data.viewsGrowthData || []).slice(-20)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" stroke="#888" fontSize={10} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333' }} />
                      <Bar dataKey="views" fill="#FF0000" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-3">Top performing videos</h2>
                  <ul className="space-y-2">
                    {topVideos.map((v, i) => (
                      <li key={v.videoId} className="flex justify-between text-sm">
                        <span className="text-[#CCCCCC] truncate flex-1 mr-2">{v.title || `Video ${i + 1}`}</span>
                        <span className="text-white shrink-0">{v.views?.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-3">Worst performing videos</h2>
                  <ul className="space-y-2">
                    {worstVideos.map((v, i) => (
                      <li key={v.videoId} className="flex justify-between text-sm">
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
                  {(data.aiInsights || []).map((insight, i) => (
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
