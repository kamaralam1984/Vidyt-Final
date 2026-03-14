'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Hash, Copy, Check, Youtube, Facebook, Instagram } from 'lucide-react';

export default function HashtagsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [platform, setPlatform] = useState<'youtube' | 'facebook' | 'instagram'>('youtube');
  const [copied, setCopied] = useState(false);

  const platformHashtags = {
    youtube: [
      'viral', 'fyp', 'foryou', 'trending', 'shorts', 'viralvideo',
      'explore', 'subscribe', 'comedy', 'dance', 'music', 'food',
      'travel', 'fitness', 'beauty', 'fashion', 'tech', 'gaming',
      'youtubeshorts', 'shortsfeed', 'viralvideos', 'trendingnow'
    ],
    facebook: [
      'viral', 'trending', 'fyp', 'foryou', 'facebookvideo', 'fbviral',
      'explore', 'love', 'like', 'share', 'comment', 'follow',
      'comedy', 'dance', 'music', 'food', 'travel', 'fitness',
      'beauty', 'fashion', 'tech', 'gaming', 'reels', 'viralpost'
    ],
    instagram: [
      'viral', 'fyp', 'foryou', 'trending', 'reels', 'viralreels',
      'instagood', 'love', 'like', 'follow', 'share', 'comment',
      'comedy', 'dance', 'music', 'food', 'travel', 'fitness',
      'beauty', 'fashion', 'tech', 'gaming', 'explore', 'instadaily'
    ]
  };

  const popularHashtags = platformHashtags[platform];

  const copyAllHashtags = () => {
    const hashtagsText = popularHashtags.map(tag => `#${tag}`).join(' ');
    navigator.clipboard.writeText(hashtagsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Hash className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Hashtag Generator</h1>
                <p className="text-[#AAAAAA]">
                  Popular hashtags for {platform} content
                </p>
              </div>
            </div>
            <button
              onClick={copyAllHashtags}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy All
                </>
              )}
            </button>
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

          <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6">
            <div className="flex flex-wrap gap-2">
              {popularHashtags.map((hashtag, index) => (
                <motion.span
                  key={hashtag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(`#${hashtag}`);
                  }}
                >
                  <Hash className="w-3 h-3" />
                  {hashtag}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
