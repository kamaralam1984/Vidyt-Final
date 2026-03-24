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
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, X } from 'lucide-react';

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
  const searchParams = useSearchParams();
  const [showYoutubeSuccess, setShowYoutubeSuccess] = useState(false);
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/auth/me', { headers: getAuthHeaders() });
        if (res.data.user) {
          setIsYoutubeConnected(!!res.data.user.googleRefreshToken);
        }
      } catch (_) {}
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (searchParams.get('youtube') === 'connected') {
      setShowYoutubeSuccess(true);
      // Automatically hide after 5 seconds
      const timer = setTimeout(() => setShowYoutubeSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const [allowedSystems, setAllowedSystems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const res = await axios.get('/api/features/all', { headers: getAuthHeaders() });
        if (res.data.features) {
          setAllowedSystems(res.data.features);
        }
      } catch (_) {
        setAllowedSystems({});
      }
    };
    fetchSystems();
  }, []);

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
        {showYoutubeSuccess && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-green-500 font-medium">YouTube channel connected successfully</p>
            </div>
            <button onClick={() => setShowYoutubeSuccess(false)} className="text-green-500/50 hover:text-green-500">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1.3fr)]">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to ViralBoost AI
            </h1>
            <p className="text-[#AAAAAA]">
              Analyze and optimize your videos for maximum viral potential
            </p>
          </div>
          {!analysis && (
            <div className="bg-[#111111] border border-[#262626] rounded-xl p-4">
              <h2 className="text-sm font-semibold text-white mb-2">
                Getting started (recommended flow)
              </h2>
              <ol className="space-y-1 text-xs text-[#CCCCCC] list-decimal list-inside">
                <li>Upload a video in this dashboard to get a viral score plus hook, title and thumbnail scores.</li>
                <li>
                  Then use the <span className="font-semibold">YouTube SEO</span> tab (keywords, titles, thumbnails) to choose search‑based topics.
                </li>
                <li>
                  Use the <span className="font-semibold">Posting Time</span> and <span className="font-semibold">Analytics</span> pages to find the best time to post and track performance.
                </li>
              </ol>
            </div>
          )}
        </div>

        {allowedSystems['video_upload'] !== false && (
          <VideoUpload 
            onAnalysisComplete={handleAnalysisComplete} 
            loading={loading} 
            setLoading={setLoading} 
            isYoutubeConnected={isYoutubeConnected}
            allowedSystems={allowedSystems}
          />
        )}

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {allowedSystems['viral_score'] !== false && (
                <div className="lg:col-span-2">
                  <ViralScoreMeter score={analysis.viralProbability} confidence={analysis.confidenceLevel} />
                </div>
              )}
              {allowedSystems['score_cards'] !== false && (
                <div className="space-y-4">
                  <ScoreCard title="Hook Score" score={analysis.hookScore} color="blue" />
                  <ScoreCard title="Thumbnail Score" score={analysis.thumbnailScore} color="purple" />
                  <ScoreCard title="Title Score" score={analysis.titleScore} color="green" />
                </div>
              )}
            </div>

            {analysis.optimizedTitles && allowedSystems['title_suggestions'] !== false && (
              <TitleSuggestions titles={analysis.optimizedTitles} />
            )}

            {analysis.hashtags && allowedSystems['hashtag_recommendations'] !== false && (
              <HashtagRecommendations hashtags={analysis.hashtags} />
            )}

            {analysis.trendingTopics && allowedSystems['trending_topics'] !== false && (
              <TrendingTopics topics={analysis.trendingTopics} />
            )}

            {analysis.bestPostingTime && allowedSystems['posting_time_heatmap'] !== false && (
              <PostingTimeHeatmap postingTime={analysis.bestPostingTime} />
            )}

            {allowedSystems['engagement_graph'] !== false && (
              <EngagementGraph viralProbability={analysis.viralProbability} />
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
