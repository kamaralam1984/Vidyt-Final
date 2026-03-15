'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import TrendingTopics from '@/components/TrendingTopics';
import { getAuthHeaders } from '@/utils/auth';
import { TrendingUp, Flame, Youtube, Facebook, Instagram } from 'lucide-react';

export default function TrendingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [platform, setPlatform] = useState<'youtube' | 'facebook' | 'instagram'>('youtube');
  const [trendingTopics, setTrendingTopics] = useState<Array<{ keyword: string; score: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  const fetchTrendingTopics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/trending?platform=${platform}`, {
        headers: getAuthHeaders(),
      });
      setTrendingTopics(response.data.trendingTopics || []);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      setTrendingTopics([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <Flame className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Trending Topics</h1>
              <p className="text-[#AAAAAA]">
                Discover what&apos;s trending on {platform}
              </p>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Select Platform</h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPlatform('youtube')}
                className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  platform === 'youtube'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Youtube className="w-5 h-5" />
                YouTube
              </button>
              <button
                onClick={() => setPlatform('facebook')}
                className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  platform === 'facebook'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Facebook className="w-5 h-5" />
                Facebook
              </button>
              <button
                onClick={() => setPlatform('instagram')}
                className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  platform === 'instagram'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Instagram className="w-5 h-5" />
                Instagram
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <p className="mt-4 text-[#AAAAAA]">Loading trending topics...</p>
            </div>
          ) : trendingTopics.length > 0 ? (
            <TrendingTopics topics={trendingTopics} />
          ) : (
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-8 text-center">
              <Flame className="w-12 h-12 text-[#666] mx-auto mb-3" />
              <p className="text-[#AAAAAA] mb-4">No trending topics loaded. Make sure you&apos;re logged in, then try again.</p>
              <button
                type="button"
                onClick={() => fetchTrendingTopics()}
                className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-lg font-medium"
              >
                Retry
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
