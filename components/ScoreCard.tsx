'use client';

import { motion } from 'framer-motion';

interface ScoreCardProps {
  title: string;
  score: number;
  color: 'blue' | 'purple' | 'green';
}

export default function ScoreCard({ title, score, color }: ScoreCardProps) {
  const colorClasses = {
    blue: 'bg-[#FF0000]',
    purple: 'bg-[#FF0000]',
    green: 'bg-[#FF0000]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-4"
    >
      <h3 className="text-sm font-medium text-[#AAAAAA] mb-2">
        {title}
      </h3>
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16">
          <svg className="transform -rotate-90 w-16 h-16">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-[#212121]"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className={colorClasses[color]}
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - score / 100)}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - score / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {score}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-2 rounded-full ${colorClasses[color]}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
