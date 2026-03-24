'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { motion } from 'framer-motion';
import { Users, Activity, DollarSign, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminAnalyticsDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const headers = getAuthHeaders();
        const [overviewRes, plansRes, usageRes] = await Promise.all([
          axios.get('/api/admin/analytics/overview', { headers }),
          axios.get('/api/admin/analytics/plans', { headers }),
          axios.get('/api/admin/analytics/usage', { headers })
        ]);
        
        setOverview(overviewRes.data.data);
        setPlans(plansRes.data.data);
        setUsageData(usageRes.data.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
            router.push('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [router]);

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center p-8 text-[#AAAAAA]">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#FF0000] mr-4"></div>
             Loading Analytics...
          </div>
      );
  }

  if (!overview) {
      return (
         <div className="p-8 text-red-500 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Failed to load admin analytics. Check API permissions.
         </div>
      );
  }

  const { totalUsers, activeUsers, monthlyRevenue } = overview;
  const { topUsers, globalUsageStats } = usageData || {};

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Growth Analytics</h1>
        <p className="text-[#AAAAAA]">Monitor SaaS performance, plan distribution, and heavy users.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#181818] border border-[#212121] rounded-xl p-6 relative overflow-hidden">
           <div className="flex justify-between items-start">
             <div>
                <p className="text-[#AAAAAA] text-sm uppercase font-semibold">Total Users</p>
                <h3 className="text-3xl font-bold text-white mt-2">{totalUsers.toLocaleString()}</h3>
             </div>
             <div className="p-3 bg-[#212121] rounded-lg text-white">
                <Users className="w-6 h-6" />
             </div>
           </div>
        </motion.div>
        
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-[#181818] border border-[#212121] rounded-xl p-6 relative overflow-hidden">
           <div className="flex justify-between items-start">
             <div>
                <p className="text-[#AAAAAA] text-sm uppercase font-semibold">Active Users (30d)</p>
                <h3 className="text-3xl font-bold text-white mt-2">{activeUsers.toLocaleString()}</h3>
             </div>
             <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                <Activity className="w-6 h-6" />
             </div>
           </div>
        </motion.div>
        
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-[#181818] border border-[#212121] rounded-xl p-6 relative overflow-hidden">
           <div className="flex justify-between items-start">
             <div>
                <p className="text-[#AAAAAA] text-sm uppercase font-semibold">Est. Monthly MRR</p>
                <h3 className="text-3xl font-bold text-green-400 mt-2">${monthlyRevenue.toLocaleString()}</h3>
             </div>
             <div className="p-3 bg-green-500/20 rounded-lg text-green-400">
                <DollarSign className="w-6 h-6" />
             </div>
           </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-[#181818] border border-[#212121] rounded-xl p-6 relative overflow-hidden">
           <div className="flex justify-between items-start">
             <div>
                <p className="text-[#AAAAAA] text-sm uppercase font-semibold">Total Queries</p>
                <h3 className="text-3xl font-bold text-[#FF0000] mt-2">{(globalUsageStats?.totalVideos || 0).toLocaleString()}</h3>
             </div>
             <div className="p-3 bg-[#FF0000]/20 rounded-lg text-[#FF0000]">
                <Sparkles className="w-6 h-6" />
             </div>
           </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
         {/* Plan Distribution */}
         <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-[#181818] border border-[#212121] rounded-xl p-6 lg:col-span-1">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#AAAAAA]" />
                User Tier Distribution
            </h3>
            <div className="space-y-4">
               {plans.map((p, i) => {
                  const percent = totalUsers > 0 ? (p.count / totalUsers) * 100 : 0;
                  return (
                      <div key={i}>
                          <div className="flex justify-between items-center mb-1">
                              <span className="text-white capitalize font-medium">{p.plan}</span>
                              <span className="text-[#AAAAAA] text-sm">{p.count} users ({percent.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-[#212121] rounded-full h-2.5">
                              <div className="bg-[#FF0000] h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
                          </div>
                      </div>
                  );
               })}
            </div>
         </motion.div>

         {/* Top Users Table */}
         <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-[#181818] border border-[#212121] rounded-xl p-6 lg:col-span-2 overflow-x-auto">
            <h3 className="text-lg font-bold text-white mb-6">Top Users by Platform Activity</h3>
            <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr className="border-b border-[#212121] text-[#AAAAAA] text-sm">
                        <th className="pb-3 font-semibold">User</th>
                        <th className="pb-3 font-semibold">Tier</th>
                        <th className="pb-3 font-semibold">Analyses</th>
                        <th className="pb-3 font-semibold">Hashtags</th>
                        <th className="pb-3 font-semibold text-right">Joined</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                   {topUsers?.map((u: any, i: number) => (
                       <tr key={i} className="border-b border-[#212121]/50 hover:bg-[#212121]/20 transition-colors">
                           <td className="py-4">
                               <div className="font-medium text-white">{u.name || 'Anonymous'}</div>
                               <div className="text-xs text-[#AAAAAA]">{u.email}</div>
                           </td>
                           <td className="py-4">
                               <span className="px-2.5 py-1 bg-[#212121] rounded-md text-xs font-semibold capitalize tracking-wide text-gray-300">
                                   {u.subscription}
                               </span>
                           </td>
                           <td className="py-4 text-[#FF0000] font-bold">
                               {u.usageStats?.videosAnalyzed || 0}
                           </td>
                           <td className="py-4 text-white">
                               {u.usageStats?.hashtagsGenerated || 0}
                           </td>
                           <td className="py-4 text-right text-[#AAAAAA]">
                               {new Date(u.createdAt).toLocaleDateString()}
                           </td>
                       </tr>
                   ))}
                </tbody>
            </table>
         </motion.div>
      </div>

    </div>
  );
}
