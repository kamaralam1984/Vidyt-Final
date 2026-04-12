'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface TrendingTopicsProps {
  topics: Array<{ keyword: string; score: number }>;
}

export default function TrendingTopics({ topics }: TrendingTopicsProps) {
  const getScoreStyles = (score: number) => {
    if (score >= 75) {
      return {
        bar: 'bg-green-500',
        text: 'text-green-400',
      };
    }
    if (score >= 55) {
      return {
        bar: 'bg-yellow-400',
        text: 'text-yellow-300',
      };
    }
    return {
      bar: 'bg-red-500',
      text: 'text-red-400',
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#FF0000]" />
        <h2 className="text-xl font-bold text-white">
          Trending Topics
        </h2>
      </div>
      <div className="space-y-3">
        {topics.slice(0, 10).map((topic, index) => (
          // Viral = green, normal = yellow, low = red
          <motion.div
            key={topic.keyword}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-3 bg-[#212121] rounded-lg border border-[#2A2A2A]"
          >
            <span className="text-white font-medium">
              {topic.keyword}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-[#212121] rounded-full h-2">
                {(() => {
                  const styles = getScoreStyles(topic.score);
                  return (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.score}%` }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                      className={`h-2 rounded-full ${styles.bar}`}
                    />
                  );
                })()}
              </div>
              {(() => {
                const styles = getScoreStyles(topic.score);
                return (
                  <span
                    className={`text-sm font-semibold w-12 text-right ${styles.text}`}
                  >
                    {topic.score}%
                  </span>
                );
              })()}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
