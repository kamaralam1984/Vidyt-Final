'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Activity, Globe, Clock, Smartphone, Monitor, Tablet, 
  MapPin, MousePointer2, TrendingUp, RefreshCw, Download, 
  ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { motion } from 'framer-motion';

const COLORS = ['#FF0000', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function PlatformAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get(`/api/admin/super/live-analytics?range=${range}`, {
        headers: getAuthHeaders()
      });
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Auto refresh every minute
    return () => clearInterval(interval);
  }, [range]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#FF0000]/20 border-t-[#FF0000] rounded-full animate-spin mb-4" />
        <p className="text-[#AAAAAA] animate-pulse">Gathering intelligence...</p>
      </div>
    );
  }

  const { live, overview, geoDistribution, trafficTrend, deviceBreakdown, topPages } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#FF0000]" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-[#888]">Complete website traffic & performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="bg-[#181818] border border-[#333] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#FF0000] transition-colors"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button 
            onClick={fetchData}
            className="p-2 bg-[#181818] border border-[#333] rounded-lg hover:border-[#FF0000] transition-all group"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-[#AAAAAA] group-hover:text-white ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-[#FF0000] text-white rounded-lg font-medium hover:bg-[#CC0000] transition-all shadow-lg shadow-red-600/20">
            <Download className="w-4 h-4" />
            Report CSV
          </button>
        </div>
      </div>

      {/* Live Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Online Now" value={live?.onlineNow} subValue="+12.5% vs last period" type="live" />
        <StatCard title="Logged In" value={live?.loggedInNow} subValue="2 active admins" type="auth" />
        <StatCard title="Total Hours" value="0h" subValue="User engagement time" type="time" />
        <StatCard title="Countries" value={live?.countriesActive} subValue="Global reach" type="geo" />
        <StatCard title="Total Visits" value={overview?.totalVisits} subValue="+2.1% vs last period" type="visits" />
        <StatCard title="Unique Visitors" value={overview?.uniqueVisitors} subValue="+8.3% vs last period" type="unique" />
        <StatCard title="Avg. Time Spent" value={`${Math.round(overview?.avgTimeSpent || 0)}s`} subValue="+14.3% vs last period" type="engagement" />
        <StatCard title="Active Sessions" value={live?.users?.length} subValue="Active tracking logs" type="sessions" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geographic Distribution */}
        <div className="bg-[#181818] border border-[#212121] rounded-2xl p-6 lg:col-span-1">
          <h2 className="text-base font-semibold mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#FF0000]" />
            Geographic Distribution
          </h2>
          <div className="space-y-4">
            {geoDistribution?.slice(0, 5).map((geo: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-xs">
                     {geo._id.country?.substring(0, 2).toUpperCase() || '??'}
                   </div>
                   <div>
                     <p className="text-sm font-medium text-white">{geo._id.city || 'Unknown'}, {geo._id.country}</p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{geo.visits}</p>
                </div>
              </div>
            ))}
            {geoDistribution?.length === 0 && <p className="text-center text-[#555] py-10">No geo data yet</p>}
          </div>
        </div>

        {/* Live Users */}
        <div className="bg-[#181818] border border-[#212121] rounded-2xl p-6 lg:col-span-2">
           <h2 className="text-base font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Online Users <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">Live</span>
          </h2>
          <div className="space-y-4">
            {live?.users?.map((u: any, i: number) => (
               <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#222] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF0000]/20 to-[#FF0000]/5 border border-[#333] flex items-center justify-center text-[#FF0000] font-bold">
                      {u.userId?.name?.[0] || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{u.userId?.name || 'Anonymous User'}</p>
                      <p className="text-xs text-[#666]">{u.city || 'Unknown City'}, {u.country || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-xs text-[#888] mb-1">{u.currentPage}</p>
                     <div className="flex items-center justify-end gap-2 text-[10px]">
                        <span className="text-emerald-500 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                     </div>
                  </div>
               </div>
            ))}
            {live?.users?.length === 0 && <p className="text-center text-[#555] py-10">No users online</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Trend */}
        <div className="bg-[#181818] border border-[#212121] rounded-2xl p-6">
          <h3 className="text-base font-semibold mb-6">Traffic Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficTrend}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF0000" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis 
                  dataKey="_id" 
                  stroke="#444" 
                  fontSize={10} 
                  tickFormatter={(val) => val.includes('T') ? val.split('T')[1].split(':')[0] + 'h' : val.split('-').slice(1).join('/')}
                />
                <YAxis stroke="#444" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#FF0000' }}
                />
                <Area type="monotone" dataKey="visits" stroke="#FF0000" fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-[#181818] border border-[#212121] rounded-2xl p-6">
          <h3 className="text-base font-semibold mb-6 text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            Device Breakdown
          </h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="_id"
                >
                  {deviceBreakdown?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Pages Table */}
      <div className="bg-[#181818] border border-[#212121] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#212121] flex justify-between items-center">
           <h3 className="text-base font-semibold">Top Pages</h3>
           <button className="text-xs text-[#888] hover:text-[#FF0000]">View Full Report</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[#666] border-b border-[#212121]">
                <th className="px-6 py-3 font-medium">Page Path</th>
                <th className="px-6 py-3 font-medium">Unique Visits</th>
                <th className="px-6 py-3 font-medium">Avg. Time</th>
                <th className="px-6 py-3 font-medium text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212121]">
              {topPages?.map((page: any, i: number) => (
                <tr key={i} className="hover:bg-[#222] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <MousePointer2 className="w-3.5 h-3.5 text-[#444] group-hover:text-[#FF0000]" />
                       <span className="font-mono text-white/80">{page._id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">{page.visits}</td>
                  <td className="px-6 py-4 text-[#AAAAAA]">{Math.round(page.avgTime)}s</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full text-[10px]">
                       <TrendingUp className="w-3 h-3" />
                       Stable
                    </span>
                  </td>
                </tr>
              ))}
              {topPages?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-[#555]">No page tracking data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, type }: { title: string, value: any, subValue: string, type: string }) {
  const iconMap: any = {
    live: { icon: Activity, color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10' },
    auth: { icon: Users, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    time: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    geo: { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    visits: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    unique: { icon: Users, color: 'text-sky-400', bg: 'bg-sky-400/10' },
    engagement: { icon: Clock, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    sessions: { icon: MousePointer2, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  };

  const { icon: Icon, color, bg } = iconMap[type];

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-[#181818] border border-[#212121] rounded-2xl p-5 hover:border-[#333] transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${bg}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {type === 'live' && (
          <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#FF0000]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-ping" />
            Live
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white mb-2">{value ?? '—'}</h3>
        <p className="text-[10px] text-[#555] flex items-center gap-1">
          {subValue.includes('+') ? <ArrowUpRight className="w-3 h-3 text-emerald-400" /> : <ArrowRight className="w-3 h-3" />}
          {subValue}
        </p>
      </div>
    </motion.div>
  );
}

function ArrowRight({ className }: { className: string }) {
  return <ChevronRight className={className} />;
}
