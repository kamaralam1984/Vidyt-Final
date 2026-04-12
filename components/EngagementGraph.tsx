'use client';

import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EngagementGraphProps {
  viralProbability: number;
}

export default function EngagementGraph({ viralProbability }: EngagementGraphProps) {
  // Generate sample engagement prediction data
  const generateData = () => {
    const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    const baseEngagement = viralProbability * 10;
    
    return days.map((day, index) => {
      // Simulate viral growth curve
      const growthFactor = index === 0 ? 1 : Math.pow(1.5, index);
      const randomVariation = 0.8 + Math.random() * 0.4; // 80-120% variation
      return {
        day,
        engagement: Math.round(baseEngagement * growthFactor * randomVariation),
        views: Math.round(baseEngagement * growthFactor * randomVariation * 2),
      };
    });
  };

  const data = generateData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Engagement Prediction
        </h2>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="day" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Line
            type="monotone"
            dataKey="engagement"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 4 }}
            name="Engagement"
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            name="Views"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
