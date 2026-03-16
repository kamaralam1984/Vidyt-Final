'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import VideoUpload from './VideoUpload';
import ViralScoreMeter from './ViralScoreMeter';
import ScoreCard from './ScoreCard';
import TitleSuggestions from './TitleSuggestions';
import HashtagRecommendations from './HashtagRecommendations';
import TrendingTopics from './TrendingTopics';
import EngagementGraph from './EngagementGraph';
import PostingTimeHeatmap from './PostingTimeHeatmap';

interface AnalysisData {
  viralProbability: number;
  hookScore: number;
  thumbnailScore: number;
  titleScore: number;
  confidenceLevel: number;
  optimizedTitles?: string[];
  hashtags?: string[];
  trendingTopics?: Array<{ keyword: string; score: number }>;
  postingTime?: { day: string; hour: number; confidence: number };
  bestPostingTime?: { day: string; hour: number; confidence: number };
}

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalysisComplete = (data: AnalysisData) => {
    const bestPostingTime = data.bestPostingTime || data.postingTime;
    setAnalysis(bestPostingTime ? { ...data, bestPostingTime } : data);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to ViralBoost AI
          </h1>
          <p className="text-[#AAAAAA]">
            Analyze and optimize your videos for maximum viral potential
          </p>
        </div>

        <VideoUpload onAnalysisComplete={handleAnalysisComplete} loading={loading} setLoading={setLoading} />

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ViralScoreMeter score={analysis.viralProbability} confidence={analysis.confidenceLevel} />
              </div>
              <div className="space-y-4">
                <ScoreCard title="Hook Score" score={analysis.hookScore} color="blue" />
                <ScoreCard title="Thumbnail Score" score={analysis.thumbnailScore} color="purple" />
                <ScoreCard title="Title Score" score={analysis.titleScore} color="green" />
              </div>
            </div>

            {analysis.optimizedTitles && (
              <TitleSuggestions titles={analysis.optimizedTitles} />
            )}

            {analysis.hashtags && (
              <HashtagRecommendations hashtags={analysis.hashtags} />
            )}

            {analysis.trendingTopics && (
              <TrendingTopics topics={analysis.trendingTopics} />
            )}

            {analysis.bestPostingTime && (
              <PostingTimeHeatmap postingTime={analysis.bestPostingTime} />
            )}

            <EngagementGraph viralProbability={analysis.viralProbability} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
