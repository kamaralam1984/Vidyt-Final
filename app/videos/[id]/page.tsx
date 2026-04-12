'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { ArrowLeft, Play, Eye, Calendar, Clock } from 'lucide-react';
import ViralScoreMeter from '@/components/ViralScoreMeter';
import ScoreCard from '@/components/ScoreCard';
import TitleSuggestions from '@/components/TitleSuggestions';
import HashtagRecommendations from '@/components/HashtagRecommendations';
import TrendingTopics from '@/components/TrendingTopics';
import EngagementGraph from '@/components/EngagementGraph';
import PostingTimeHeatmap from '@/components/PostingTimeHeatmap';

export default function VideoDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const videoId =
    typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] ?? '' : '';
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [video, setVideo] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoId) {
      fetchVideoData(videoId);
    }
  }, [videoId]);

  const fetchVideoData = async (videoId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/videos/${videoId}`, {
        headers: getAuthHeaders(),
      });
      setVideo(response.data.video);
      setAnalysis(response.data.analysis);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching video:', error);
      const msg = error.response?.data?.error || 'Failed to load video';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF0000] mb-4"></div>
            <p className="text-[#AAAAAA]">Loading video analysis...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !video) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.push('/videos')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Videos
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Video Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || 'The video you are looking for does not exist.'}
              </p>
              <button
                onClick={() => router.push('/videos')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to My Videos
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <button
            onClick={() => router.push('/videos')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Videos
          </button>

          {/* Video Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              {video.thumbnailUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full md:w-64 h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {video.title}
                </h1>
                {video.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {video.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {video.views !== undefined && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{video.views.toLocaleString()} views</span>
                    </div>
                  )}
                  {video.duration > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {Math.floor(video.duration / 60)}:
                        {(video.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {video.youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Watch on YouTube
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          {analysis ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ViralScoreMeter 
                    score={analysis.viralProbability} 
                    confidence={analysis.confidenceLevel} 
                  />
                </div>
                <div className="space-y-4">
                  <ScoreCard title="Hook Score" score={analysis.hookScore} color="blue" />
                  <ScoreCard title="Thumbnail Score" score={analysis.thumbnailScore} color="purple" />
                  <ScoreCard title="Title Score" score={analysis.titleScore} color="green" />
                </div>
              </div>

              {analysis.titleAnalysis?.optimizedTitles && (
                <TitleSuggestions titles={analysis.titleAnalysis.optimizedTitles} />
              )}

              {analysis.hashtags && analysis.hashtags.length > 0 && (
                <HashtagRecommendations hashtags={analysis.hashtags.map((tag: string) => `#${tag}`)} />
              )}

              {analysis.trendingTopics && analysis.trendingTopics.length > 0 && (
                <TrendingTopics topics={analysis.trendingTopics} />
              )}

              {analysis.bestPostingTime && (
                <PostingTimeHeatmap postingTime={analysis.bestPostingTime} />
              )}

              <EngagementGraph viralProbability={analysis.viralProbability} />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No analysis available for this video.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
