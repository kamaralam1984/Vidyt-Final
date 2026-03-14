'use client';

import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface TitleSuggestionsProps {
  titles: string[];
}

export default function TitleSuggestions({ titles }: TitleSuggestionsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Optimized Title Suggestions
      </h2>
      <div className="space-y-3">
        {titles.map((title, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
          >
            <p className="flex-1 text-gray-900 dark:text-white font-medium">
              {title}
            </p>
            <button
              onClick={() => copyToClipboard(title, index)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
            >
              {copiedIndex === index ? (
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
