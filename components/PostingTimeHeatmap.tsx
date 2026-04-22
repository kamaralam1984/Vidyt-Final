'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken, isAuthenticated } from '@/utils/auth';

interface PostingTimeHeatmapProps {
  postingTime: { day: string; hour: number; confidence: number };
  platform?: 'youtube' | 'facebook' | 'instagram';
  // Optional override when we already have per-slot engagement from a specific channel/link analysis
  slots?: { day: string; hour: number; engagement: number }[];
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function PostingTimeHeatmap({
  postingTime,
  platform = 'youtube',
  slots,
}: PostingTimeHeatmapProps) {
  const [heatmap, setHeatmap] = useState<number[][]>([]);

  // Percentile rank of every non-zero cell so the grid reads well regardless
  // of how concentrated the data is. Zero stays zero (grey).
  const percentileRank = (rawGrid: number[][]): number[][] => {
    const flat = rawGrid.flat().filter((v) => v > 0).sort((a, b) => a - b);
    if (flat.length === 0) return rawGrid;
    return rawGrid.map((row) =>
      row.map((v) => {
        if (v <= 0) return 0;
        // Find first index in sorted array that is >= v; rank = (index+1)/n
        let lo = 0, hi = flat.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (flat[mid] < v) lo = mid + 1;
          else hi = mid;
        }
        return Math.round(((lo + 1) / flat.length) * 100);
      })
    );
  };

  useEffect(() => {
    // If we receive explicit slots (from link-based analysis), build heatmap directly
    if (slots && slots.length > 0) {
      const rawGrid: number[][] = [];
      DAYS.forEach((day) => {
        const dayData: number[] = [];
        HOURS.forEach((hour) => {
          const entry = slots.find((s) => s.day === day && s.hour === hour);
          dayData.push(entry?.engagement ?? 0);
        });
        rawGrid.push(dayData);
      });
      setHeatmap(percentileRank(rawGrid));
      return;
    }

    const fetchHeatmap = async () => {
      try {
        if (!isAuthenticated()) {
          console.warn('User not authenticated, skipping heatmap fetch');
          return;
        }

        const token = getToken();
        const response = await axios.get(`/api/posting-time?platform=${platform}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Convert heatmap data to 2D array format
        const heatmapData = response.data.heatmap || [];
        const formattedHeatmap: number[][] = [];
        
        DAYS.forEach((day, dayIndex) => {
          const dayData: number[] = [];
          HOURS.forEach(hour => {
            const entry = heatmapData.find((h: any) => h.day === day && h.hour === hour);
            dayData.push(entry?.engagement || 0);
          });
          formattedHeatmap.push(dayData);
        });
        
        setHeatmap(percentileRank(formattedHeatmap));
      } catch (error: any) {
        // Silently handle errors - heatmap is optional
        if (error?.response?.status !== 401) {
          console.warn('Failed to fetch heatmap data:', error);
        }
      }
    };

    fetchHeatmap();
  }, [platform, slots]);

  const getHeatColor = (value: number) => {
    if (value <= 0) return 'bg-gray-700/40 dark:bg-gray-700/40';
    if (value >= 90) return 'bg-emerald-500';
    if (value >= 75) return 'bg-lime-500';
    if (value >= 55) return 'bg-amber-500';
    if (value >= 35) return 'bg-orange-500';
    return 'bg-rose-500/50';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Best Posting Time
        </h2>
      </div>
      
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-gray-900 dark:text-white font-medium">
          Recommended: {postingTime.day} at {postingTime.hour}:00
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Confidence: {postingTime.confidence}%
        </p>
      </div>

      {heatmap.length > 0 && (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="font-medium text-xs text-gray-600 dark:text-gray-400 p-2 text-left"></th>
                  {HOURS.map((hour) => (
                    <th
                      key={hour}
                      className="font-medium text-xs text-gray-600 dark:text-gray-400 p-2 text-center"
                    >
                      {hour}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, dayIndex) => (
                  <tr key={day}>
                    <td className="font-medium text-xs text-gray-600 dark:text-gray-400 p-2">
                      {day.slice(0, 3)}
                    </td>
                    {HOURS.map((hour) => {
                      const value = heatmap[dayIndex]?.[hour] || 0;
                      return (
                        <td key={`${day}-${hour}`} className="p-1">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: (dayIndex * 24 + hour) * 0.001 }}
                            className={`w-8 h-8 ${getHeatColor(value)} rounded cursor-pointer hover:scale-110 transition-transform mx-auto`}
                            title={`${day} ${hour}:00 - Score: ${value}%`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
