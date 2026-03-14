'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
} from 'recharts';

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
  platformDistribution: Array<{
    platform: string;
    count: number;
    averageScore: number;
  }>;
}

interface EngagementHeatmap {
  day: string;
  hour: number;
  engagement: number;
  count: number;
}

interface Benchmark {
  userMetrics: { averageViralScore: number; averageEngagementRate: number; averageViews: number };
  industryBenchmarks: { averageViralScore: number; averageEngagementRate: number; averageViews: number };
  percentile: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function heatmapColor(value: number, max: number): string {
  if (max <= 0) return 'bg-[#212121]';
  const p = value / max;
  if (p >= 0.8) return 'bg-green-600';
  if (p >= 0.5) return 'bg-green-500/70';
  if (p >= 0.25) return 'bg-yellow-600/60';
  if (p > 0) return 'bg-[#333]';
  return 'bg-[#212121]';
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [heatmap, setHeatmap] = useState<EngagementHeatmap[]>([]);
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [retention, setRetention] = useState<{ averageRetention: number; dropOffPoints: Array<{ time: number; percentage: number }> } | null>(null);
  const [growthCurve, setGrowthCurve] = useState<{ dataPoints: Array<{ date: string; views: number }>; growthVelocity: number } | null>(null);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  useEffect(() => {
    if (!selectedVideoId) {
      setRetention(null);
      setGrowthCurve(null);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    Promise.all([
      axios.get(`/api/analytics/retention?videoId=${selectedVideoId}`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`/api/analytics/growth?videoId=${selectedVideoId}`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([retRes, growthRes]) => {
        setRetention(retRes.data.retention ? { averageRetention: retRes.data.retention.averageRetention, dropOffPoints: retRes.data.retention.dropOffPoints || [] } : null);
        setGrowthCurve(growthRes.data.growthCurve ? { dataPoints: growthRes.data.growthCurve.dataPoints || [], growthVelocity: growthRes.data.growthCurve.growthVelocity || 0 } : null);
      })
      .catch(() => {
        setRetention(null);
        setGrowthCurve(null);
      });
  }, [selectedVideoId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to view analytics');
        return;
      }
      const startDate =
        dateRange !== 'all'
          ? new Date(Date.now() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000)
          : undefined;
      const params: Record<string, string> = { endDate: new Date().toISOString() };
      if (startDate) params.startDate = startDate.toISOString();
      const res = await axios.get('/api/analytics/dashboard', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setOverview(res.data.overview);
      setHeatmap(res.data.heatmap ?? []);
      setBenchmark(res.data.benchmark ?? null);
      setInsights(res.data.insights ?? []);
    } catch (err: unknown) {
      console.error('Analytics load error:', err);
      alert('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const heatmapMax = heatmap.length ? Math.max(...heatmap.map((h) => h.engagement), 1) : 1;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-[#FF0000]" /> Advanced Analytics
              </h1>
              <p className="text-[#AAAAAA]">
                Deep insights into your video performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(['7d', '30d', '90d', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    dateRange === range
                      ? 'bg-[#FF0000] text-white'
                      : 'bg-[#181818] text-[#AAAAAA] hover:bg-[#212121] border border-[#212121]'
                  }`}
                >
                  {range === 'all' ? 'All Time' : range.toUpperCase()}
                </button>
              ))}
              <motion.button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                      alert('Please login to export');
                      return;
                    }
                    const startDate = dateRange !== 'all' 
                      ? new Date(Date.now() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000)
                      : undefined;
                    
                    const params = new URLSearchParams();
                    params.set('format', 'csv');
                    if (startDate) params.set('startDate', startDate.toISOString());
                    params.set('endDate', new Date().toISOString());
                    
                    const response = await fetch(`/api/export/analytics?${params}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `analytics-${dateRange}-${Date.now()}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (error) {
                    alert('Failed to export analytics');
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </motion.button>
            </div>
          </div>

          {overview && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Videos</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        {overview.totalVideos}
                      </p>
                    </div>
                    <Video className="w-12 h-12 text-[#FF0000] opacity-20" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Avg Viral Score</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                        {overview.averageViralScore}%
                      </p>
                    </div>
                    <Target className="w-12 h-12 text-[#FF0000] opacity-20" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Engagement Rate</p>
                      <p className="text-3xl font-bold text-[#FF0000] mt-2">
                        {overview.averageEngagementRate}%
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-[#FF0000] opacity-20" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Analyses</p>
                      <p className="text-3xl font-bold text-[#FF0000] mt-2">
                        {overview.totalAnalyses}
                      </p>
                    </div>
                    <Zap className="w-12 h-12 text-[#FF0000] opacity-20" />
                  </div>
                </motion.div>
              </div>

              {/* Performance Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-8"
              >
                <h2 className="text-xl font-semibold text-white mb-4">
                  Performance Trend
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={overview.performanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="viralScore" stroke="#3b82f6" name="Viral Score" />
                    <Line type="monotone" dataKey="engagementRate" stroke="#10b981" name="Engagement Rate" />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Platform Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-8"
              >
                <h2 className="text-xl font-semibold text-white mb-4">
                  Platform Distribution
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={overview.platformDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="platform" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333' }} />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Video Count" />
                    <Bar dataKey="averageScore" fill="#10b981" name="Avg Score" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Engagement heatmap 7x24 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-8"
              >
                <h2 className="text-xl font-semibold text-white mb-2">Engagement Heatmap</h2>
                <p className="text-sm text-[#AAAAAA] mb-4">Performance by day and hour (UTC)</p>
                <div className="overflow-x-auto">
                  <div className="inline-flex flex-col gap-0.5 min-w-[600px]">
                    <div className="flex gap-0.5 text-[10px] text-[#888] mb-1">
                      <div className="w-8 flex-shrink-0" />
                      {Array.from({ length: 24 }, (_, h) => (
                        <div key={h} className="w-4 flex-shrink-0 text-center">
                          {h}
                        </div>
                      ))}
                    </div>
                    {DAYS.map((dayLabel, d) => {
                      const fullDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d];
                      return (
                        <div key={dayLabel} className="flex gap-0.5 items-center">
                          <div className="w-8 flex-shrink-0 text-[10px] text-[#888]">{dayLabel}</div>
                          {Array.from({ length: 24 }, (_, h) => {
                            const cell = heatmap.find((x) => x.day === fullDay && x.hour === h);
                            const val = cell?.engagement ?? 0;
                            return (
                              <div
                                key={h}
                                title={`${dayLabel} ${h}:00 – ${val}% engagement`}
                                className={`w-4 h-4 flex-shrink-0 rounded-sm transition-colors ${heatmapColor(val, heatmapMax)}`}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Benchmark comparison */}
              {benchmark && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-8"
                >
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-[#FF0000]" />
                    Benchmark vs Industry
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-lg bg-[#212121]">
                      <p className="text-sm text-[#AAAAAA] mb-1">Your avg viral score</p>
                      <p className="text-2xl font-bold text-white">{benchmark.userMetrics.averageViralScore}%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#212121]">
                      <p className="text-sm text-[#AAAAAA] mb-1">Industry benchmark</p>
                      <p className="text-2xl font-bold text-white">{benchmark.industryBenchmarks.averageViralScore}%</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#212121]">
                      <p className="text-sm text-[#AAAAAA] mb-1">Percentile</p>
                      <p className="text-2xl font-bold text-[#FF0000]">{benchmark.percentile}%</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#888]">Your engagement rate</p>
                      <p className="text-white font-medium">{benchmark.userMetrics.averageEngagementRate}%</p>
                    </div>
                    <div>
                      <p className="text-[#888]">Industry engagement</p>
                      <p className="text-white font-medium">{benchmark.industryBenchmarks.averageEngagementRate}%</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* AI Insights */}
              {insights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-8"
                >
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    AI Insights
                  </h2>
                  <ul className="space-y-2">
                    {insights.map((text, i) => (
                      <li key={i} className="flex gap-2 text-[#CCCCCC] text-sm">
                        <span className="text-[#FF0000] mt-0.5">•</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Top Performing Videos */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-8"
              >
                <h2 className="text-xl font-semibold text-white mb-4">
                  Top Performing Videos
                </h2>
                <div className="space-y-4">
                  {overview.topPerformingVideos.map((video, index) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between p-4 bg-[#212121] rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#FF0000]/80 text-white flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{video.title}</p>
                          <div className="flex gap-4 mt-1 text-sm text-[#AAAAAA]">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" /> {video.views.toLocaleString()} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" /> {video.viralScore}% viral
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setSelectedVideoId(selectedVideoId === video.id ? null : video.id)}
                          className="px-3 py-1.5 text-sm rounded-lg bg-[#333] text-white hover:bg-[#FF0000] transition-colors"
                        >
                          {selectedVideoId === video.id ? 'Hide details' : 'Retention & growth'}
                        </button>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-500">{video.viralScore}%</p>
                          <p className="text-sm text-[#888]">Viral Score</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Retention & growth for selected video */}
              {selectedVideoId && (retention || growthCurve) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6"
                >
                  <h2 className="text-lg font-semibold text-white mb-4">Viewer retention & growth</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {retention && (
                      <div>
                        <p className="text-sm text-[#AAAAAA] mb-1">Average retention</p>
                        <p className="text-2xl font-bold text-white">{retention.averageRetention}%</p>
                        {retention.dropOffPoints?.length > 0 && (
                          <p className="text-xs text-[#888] mt-2">Drop-off points: {retention.dropOffPoints.length} detected</p>
                        )}
                      </div>
                    )}
                    {growthCurve && (
                      <div>
                        <p className="text-sm text-[#AAAAAA] mb-1">Growth velocity</p>
                        <p className="text-2xl font-bold text-white">{growthCurve.growthVelocity?.toLocaleString() ?? 0} views/day</p>
                        {growthCurve.dataPoints?.length > 0 && (
                          <ResponsiveContainer width="100%" height={120}>
                            <LineChart data={growthCurve.dataPoints.map((d) => ({ ...d, date: d.date.slice(0, 10) }))}>
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#666" />
                              <YAxis tick={{ fontSize: 10 }} stroke="#666" />
                              <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #333' }} />
                              <Line type="monotone" dataKey="views" stroke="#FF0000" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
