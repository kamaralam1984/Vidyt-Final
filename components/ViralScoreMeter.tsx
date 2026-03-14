'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ViralScoreMeterProps {
  score: number;
  confidence: number;
}

export default function ViralScoreMeter({ score, confidence }: ViralScoreMeterProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">
        Viral Probability Score
      </h2>
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#AAAAAA]">Viral Potential</span>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </span>
        </div>
        <div className="w-full bg-[#212121] rounded-full h-4 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-4 rounded-full ${getScoreBgColor(score)}`}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
            <span className="font-medium text-gray-900 dark:text-white">{confidence}%</span>
          </div>
          {score >= 70 ? (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>High Potential</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
              <TrendingDown className="w-4 h-4" />
              <span>Needs Optimization</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
