'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import PostingTimeHeatmap from '@/components/PostingTimeHeatmap';
import { Clock, Youtube, Facebook, Instagram } from 'lucide-react';

export default function PostingTimePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [platform, setPlatform] = useState<'youtube' | 'facebook' | 'instagram'>('youtube');
  const [postingTime, setPostingTime] = useState({ day: 'Tuesday', hour: 14, confidence: 75 });

  useEffect(() => {
    fetchPostingTime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform]);

  const fetchPostingTime = async () => {
    try {
      const response = await axios.get(`/api/posting-time?platform=${platform}`);
      setPostingTime(response.data.postingTime || { day: 'Tuesday', hour: 14, confidence: 75 });
    } catch (error) {
      console.error('Error fetching posting time:', error);
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
            <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Best Posting Time</h1>
              <p className="text-[#AAAAAA]">
                Find the optimal time to post on {platform}
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

          <PostingTimeHeatmap postingTime={postingTime} platform={platform} />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
