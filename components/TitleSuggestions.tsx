'use client';

import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { YOUTUBE_TITLE_MAX_CHARS } from '@/lib/buildUploadSeo';

interface TitleSuggestionsProps {
  titles: string[];
}

/** Show at most 5 YouTube-style titles (server already caps length). */
export default function TitleSuggestions({ titles }: TitleSuggestionsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const list = titles.slice(0, 5);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-white mb-1">Optimized Title Suggestions</h2>
      <p className="text-xs text-[#888] mb-4">
        Up to 5 options · max {YOUTUBE_TITLE_MAX_CHARS} characters each (YouTube-friendly)
      </p>
      <div className="space-y-3">
        {list.map((title, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="flex items-center justify-between gap-3 p-4 bg-[#0F0F0F] rounded-lg border border-[#212121] hover:border-[#333] transition-colors group"
          >
            <p className="flex-1 text-white font-medium text-sm leading-snug break-words">
              {title}
            </p>
            <span className="text-[10px] text-[#666] shrink-0 tabular-nums">
              {title.length}/{YOUTUBE_TITLE_MAX_CHARS}
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(title, index)}
              className="p-2 rounded-lg hover:bg-[#212121] transition-colors shrink-0"
              aria-label="Copy title"
            >
              {copiedIndex === index ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-[#888] group-hover:text-white" />
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
