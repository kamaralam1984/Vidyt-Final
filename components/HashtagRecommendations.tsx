'use client';

import { motion } from 'framer-motion';
import { Hash, Copy } from 'lucide-react';
import { useState } from 'react';

interface HashtagRecommendationsProps {
  hashtags: string[];
}

export default function HashtagRecommendations({ hashtags }: HashtagRecommendationsProps) {
  const [copied, setCopied] = useState(false);

  const copyAllHashtags = () => {
    const hashtagsText = hashtags.join(' ');
    navigator.clipboard.writeText(hashtagsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          Hashtag Recommendations
        </h2>
        <button
          onClick={copyAllHashtags}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors text-sm font-medium"
        >
          <Copy className="w-4 h-4" />
          {copied ? 'Copied!' : 'Copy All'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {hashtags.map((hashtag, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#212121] text-[#FF0000] rounded-lg text-sm font-medium border border-[#212121]"
          >
            <Hash className="w-3 h-3" />
            {hashtag.replace('#', '')}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
