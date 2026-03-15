'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import AuthGuard from '@/components/AuthGuard';
import axios from 'axios';
import { Youtube, TrendingUp, AlertTriangle, CheckCircle, Copy, Loader2, BarChart3, Target, MessageCircle, Send } from 'lucide-react';
import { getToken, isAuthenticated, getAuthHeaders } from '@/utils/auth';

interface ChannelAnalysis {
  channelName: string;
  channelScore: number;
  totalVideos: number;
  analyzedVideos: number;
  averageViralScore: number;
  channelIssues: string[];
  videoAnalyses: VideoAnalysis[];
  trendingKeywords: string[];
  channelRecommendations: string[];
}

interface VideoAnalysis {
  videoId: string;
  title: string;
  currentScore: number;
  suggestedTitle: string;
  suggestedTags: string[];
  suggestedHashtags: string[];
  issues: string[];
}

export default function ChannelAuditPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [channelUrl, setChannelUrl] = useState('');
  const [videoUrls, setVideoUrls] = useState('');
  const [useManualUrls, setUseManualUrls] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ChannelAnalysis | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAudit = async () => {
    if (!useManualUrls && !channelUrl.trim()) {
      alert('Please enter a YouTube channel URL or use manual video URLs');
      return;
    }

    if (useManualUrls && !videoUrls.trim()) {
      alert('Please enter at least one video URL');
      return;
    }

    // Check authentication
    if (!isAuthenticated()) {
      alert('Please login to analyze videos. Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      let sampleVideoUrls: string[] = [];

      if (useManualUrls) {
        // Parse video URLs from textarea (one per line or comma-separated)
        sampleVideoUrls = videoUrls
          .split(/[,\n]/)
          .map(url => url.trim())
          .filter(url => url.length > 0 && (url.includes('youtube.com') || url.includes('youtu.be')));
        
        if (sampleVideoUrls.length === 0) {
          alert('Please enter valid YouTube video URLs');
          setLoading(false);
          return;
        }
      } else {
        // Extract channel ID or username from URL
        const channelId = extractChannelId(channelUrl);
        
        if (!channelId) {
          alert('Invalid channel URL format.\n\nSupported formats:\n' +
            '• youtube.com/@channelname\n' +
            '• youtube.com/c/channelname\n' +
            '• youtube.com/channel/CHANNEL_ID\n' +
            '• @channelname\n\n' +
            'या "Video URLs Manually Add करें" option use करें');
          setLoading(false);
          return;
        }

        // Try to get videos from channel
        sampleVideoUrls = await getChannelVideos(channelId);
        
        if (sampleVideoUrls.length === 0) {
          alert('Channel videos could not be fetched automatically.\n\nPossible reasons:\n• YouTube RSS feeds may not be available for this channel\n• Channel may have no public videos\n• YouTube API key not configured\n\nPlease use "Video URLs Manually Add करें" option and paste your video URLs directly.');
          setLoading(false);
          return;
        }
      }

      // Analyze each video
      const videoAnalyses: VideoAnalysis[] = [];
      let totalScore = 0;
      const allTrendingKeywords: Set<string> = new Set();
      const channelIssues: Set<string> = new Set();

      if (sampleVideoUrls.length === 0) {
        alert('No videos to analyze. Please add video URLs.');
        setLoading(false);
        return;
      }

      // Show progress
      const totalVideos = Math.min(sampleVideoUrls.length, 10);
      let analyzedCount = 0;

      const token = getToken();
      
      for (const videoUrl of sampleVideoUrls.slice(0, 10)) { // Limit to 10 videos for demo
        try {
          analyzedCount++;
          console.log(`Analyzing video ${analyzedCount}/${totalVideos}: ${videoUrl}`);
          
          const response = await axios.post('/api/videos/youtube', {
            youtubeUrl: videoUrl,
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const videoAnalysis = response.data.analysis;
          const videoData = response.data.video;

          // Generate suggestions for this video
          const videoAnalysisResult: VideoAnalysis = {
            videoId: videoData.youtubeId || videoUrl,
            title: videoData.title,
            currentScore: videoAnalysis.viralProbability,
            suggestedTitle: videoAnalysis.titleAnalysis?.optimizedTitles?.[0] || videoData.title,
            suggestedTags: generateTagsForVideo(videoAnalysis),
            suggestedHashtags: videoAnalysis.hashtags || [],
            issues: generateVideoIssues(videoAnalysis),
          };

          videoAnalyses.push(videoAnalysisResult);
          totalScore += videoAnalysis.viralProbability;

          // Collect trending keywords
          if (videoAnalysis.trendingTopics) {
            videoAnalysis.trendingTopics.forEach((topic: any) => {
              allTrendingKeywords.add(topic.keyword);
            });
          }

          // Collect channel-level issues
          if (videoAnalysis.viralProbability < 70) {
            channelIssues.add('कुछ videos का viral score कम है');
          }
          if (videoAnalysis.hookScore < 70) {
            channelIssues.add('कई videos में hook score कम है');
          }
          if (videoAnalysis.thumbnailScore < 70) {
            channelIssues.add('Thumbnails को improve करने की जरूरत है');
          }
        } catch (error: any) {
          console.error('Error analyzing video:', error);
          
          // Handle authentication errors
          if (error?.response?.status === 401) {
            alert('Your session has expired. Please login again.');
            localStorage.removeItem('token');
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
            setLoading(false);
            return;
          }
          
          // Continue with other videos even if one fails
          const errorMsg = error?.response?.data?.error || error?.message || 'Unknown error';
          console.error(`Failed to analyze ${videoUrl}: ${errorMsg}`);
        }
      }

      if (videoAnalyses.length === 0) {
        alert('No videos could be analyzed. Please check the video URLs and try again.');
        setLoading(false);
        return;
      }

      // Generate channel analysis
      const channelAnalysis: ChannelAnalysis = {
        channelName: useManualUrls ? 'Your Channel' : extractChannelName(channelUrl),
        channelScore: Math.round(totalScore / videoAnalyses.length),
        totalVideos: sampleVideoUrls.length,
        analyzedVideos: videoAnalyses.length,
        averageViralScore: Math.round(totalScore / videoAnalyses.length),
        channelIssues: Array.from(channelIssues),
        videoAnalyses,
        trendingKeywords: Array.from(allTrendingKeywords).slice(0, 20),
        channelRecommendations: generateChannelRecommendations(videoAnalyses),
      };

      setAnalysis(channelAnalysis);
    } catch (error: any) {
      console.error('Error auditing channel:', error);
      
      if (error?.response?.status === 401) {
        alert('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        alert(error.response?.data?.error || 'Failed to audit channel');
      }
    } finally {
      setLoading(false);
    }
  };

  const extractChannelId = (url: string): string | null => {
    // Support multiple channel URL formats
    // Normalize URL - handle both with and without www and https
    let normalizedUrl = url.trim();
    normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');
    normalizedUrl = normalizedUrl.replace(/^www\./, '');
    
    console.log('Extracting channel ID from:', normalizedUrl);
    
    const patterns = [
      /youtube\.com\/@([^\/\?\s&]+)/,  // @username format (most common)
      /youtube\.com\/c\/([^\/\?\s&]+)/,  // /c/ format
      /youtube\.com\/channel\/([^\/\?\s&]+)/,  // channel ID format
      /youtube\.com\/user\/([^\/\?\s&]+)/,  // user format
      /^@([^\/\?\s&]+)$/,  // Just @username
      /^([^\/\?\s&]+)$/,  // Just username
    ];

    for (const pattern of patterns) {
      const match = normalizedUrl.match(pattern);
      if (match && match[1]) {
        const channelId = match[1];
        console.log('✅ Extracted channel ID:', channelId);
        return channelId;
      }
    }

    console.log('❌ Could not extract channel ID');
    return null;
  };

  const extractChannelName = (url: string): string => {
    const channelId = extractChannelId(url);
    if (channelId) {
      // If it's @username format, return it nicely
      if (channelId.startsWith('@')) {
        return channelId;
      }
      return `@${channelId}`;
    }
    return 'YouTube Channel';
  };

  const getChannelVideos = async (channelId: string): Promise<string[]> => {
    try {
      console.log('🔍 Fetching videos for channel:', channelId);
      
      // Clean channel ID
      const cleanChannelId = channelId.replace('@', '').trim();
      console.log('Cleaned channel ID:', cleanChannelId);
      
      // Use API endpoint (server-side RSS fetching - no CORS issues)
      try {
        const channelUrlForApi = `youtube.com/@${cleanChannelId}`;
        console.log('Calling API with URL:', channelUrlForApi);
        
        // Add authentication if available
        const token = getToken();
        const headers: any = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await axios.post('/api/channel/videos', {
          channelUrl: channelUrlForApi,
        }, { headers });
        
        console.log('API response:', response.data);
        
        if (response.data.success && response.data.videoUrls && response.data.videoUrls.length > 0) {
          console.log(`✅ Found ${response.data.videoUrls.length} videos via API`);
          return response.data.videoUrls.slice(0, 20); // Limit to 20 videos
        } else {
          console.log('API returned no videos');
          if (response.data.message) {
            console.log('API message:', response.data.message);
          }
        }
      } catch (apiError: any) {
        console.log('❌ API method failed:', apiError.response?.data || apiError.message);
        
        // If 401 error, user needs to login
        if (apiError?.response?.status === 401) {
          console.log('Authentication required for channel video fetching');
        }
      }
      
      // If API fails, return empty array (client-side RSS won't work due to CORS)
      console.log('❌ Channel video fetching failed - please use manual video URLs');
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching channel videos:', error);
      return [];
    }
  };

  const generateTagsForVideo = (analysis: any): string[] => {
    const tags: string[] = [];
    
    if (analysis.trendingTopics) {
      analysis.trendingTopics.slice(0, 5).forEach((topic: any) => {
        tags.push(topic.keyword);
      });
    }

    if (analysis.titleAnalysis?.keywords) {
      analysis.titleAnalysis.keywords.slice(0, 5).forEach((keyword: string) => {
        tags.push(keyword.toLowerCase());
      });
    }

    tags.push('viral', 'trending', 'fyp', 'shorts');
    return [...new Set(tags)].slice(0, 15);
  };

  const generateVideoIssues = (analysis: any): string[] => {
    const issues: string[] = [];
    
    if (analysis.hookScore < 70) {
      issues.push('Hook score कम है');
    }
    if (analysis.thumbnailScore < 70) {
      issues.push('Thumbnail score कम है');
    }
    if (analysis.titleScore < 70) {
      issues.push('Title score कम है');
    }
    if (analysis.viralProbability < 70) {
      issues.push('Overall viral score कम है');
    }

    return issues;
  };

  const generateChannelRecommendations = (videoAnalyses: VideoAnalysis[]): string[] => {
    const recommendations: string[] = [];
    
    const lowScoreVideos = videoAnalyses.filter(v => v.currentScore < 70).length;
    if (lowScoreVideos > 0) {
      recommendations.push(`${lowScoreVideos} videos का score 70 से कम है - इन्हें optimize करें`);
    }

    const avgScore = videoAnalyses.reduce((sum, v) => sum + v.currentScore, 0) / videoAnalyses.length;
    if (avgScore < 75) {
      recommendations.push('Channel का average score improve करने के लिए consistent content strategy follow करें');
    }

    recommendations.push('हर video में trending keywords और hashtags use करें');
    recommendations.push('Thumbnails में consistent style maintain करें');
    recommendations.push('Titles में emotional triggers और numbers use करें');
    recommendations.push('Best posting time follow करें - Tuesday-Thursday, 2-3 PM या 8-9 PM');

    return recommendations;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const askAi = async () => {
    if (!aiQuestion.trim() || !analysis) return;
    const question = aiQuestion.trim();
    setAiQuestion('');
    setAiMessages((prev) => [...prev, { role: 'user', content: question }]);
    setAiLoading(true);
    try {
      const context = {
        channelName: analysis.channelName,
        channelScore: analysis.channelScore,
        totalVideos: analysis.totalVideos,
        analyzedVideos: analysis.analyzedVideos,
        averageViralScore: analysis.averageViralScore,
        channelIssues: analysis.channelIssues,
        channelRecommendations: analysis.channelRecommendations,
        trendingKeywords: analysis.trendingKeywords.slice(0, 15),
        videoSummaries: analysis.videoAnalyses.slice(0, 10).map((v) => ({
          title: v.title,
          score: v.currentScore,
          issues: v.issues,
        })),
      };
      const res = await axios.post(
        '/api/channel-audit/ask',
        { question, context },
        { headers: getAuthHeaders() }
      );
      const answer = res.data?.answer || 'No answer received.';
      setAiMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.error || err.message) : 'Failed to get answer';
      setAiMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${msg}` }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-8 h-8 text-[#FF0000]" />
            <div>
              <h1 className="text-3xl font-bold text-white">Channel Audit</h1>
              <p className="text-[#AAAAAA]">
                अपने पूरे YouTube channel को analyze करें और viral बनाएं
              </p>
            </div>
          </div>

          {/* Input Section */}
          <div className="bg-[#181818] border border-[#212121] rounded-lg p-6 mb-6">
            <div className="mb-4">
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 border-[#333333] hover:border-[#555555] transition-colors">
                  <input
                    type="radio"
                    checked={!useManualUrls}
                    onChange={() => setUseManualUrls(false)}
                    className="w-4 h-4 text-[#FF0000]"
                  />
                  <span className="text-sm font-medium text-[#AAAAAA]">
                    Channel URL
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 border-[#FF0000] bg-[#FF0000]/10 hover:border-[#CC0000] transition-colors">
                  <input
                    type="radio"
                    checked={useManualUrls}
                    onChange={() => setUseManualUrls(true)}
                    className="w-4 h-4 text-[#FF0000]"
                  />
                  <span className="text-sm font-medium text-white font-semibold">
                    ✅ Video URLs Manually Add करें (Recommended)
                  </span>
                </label>
              </div>
            </div>

            {!useManualUrls ? (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                    <input
                      type="text"
                      value={channelUrl}
                      onChange={(e) => setChannelUrl(e.target.value)}
                      placeholder="Channel URL paste करें (जैसे: youtube.com/@channelname)"
                      className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                  <button
                    onClick={handleAudit}
                    disabled={loading || !channelUrl.trim()}
                    className="px-6 py-3 bg-[#FF0000] text-white rounded-lg font-medium hover:bg-[#CC0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Auditing...
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5" />
                        Channel Audit करें
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-[#212121] border border-[#333333] rounded-lg">
                  <p className="text-xs text-[#AAAAAA]">
                    <strong className="text-white">Note:</strong> Automatic channel video fetching may not work for all channels. If it fails, use the &quot;Video URLs Manually Add करें&quot; option below.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Video URLs (एक line में एक URL, या comma से separated)
                  </label>
                  <textarea
                    value={videoUrls}
                    onChange={(e) => setVideoUrls(e.target.value)}
                    placeholder={`Example:
https://www.youtube.com/watch?v=VIDEO_ID_1
https://www.youtube.com/watch?v=VIDEO_ID_2
https://youtu.be/VIDEO_ID_3

या comma से separated:
https://www.youtube.com/watch?v=VIDEO_ID_1, https://www.youtube.com/watch?v=VIDEO_ID_2`}
                    rows={8}
                    className="w-full px-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:border-transparent font-mono text-sm"
                    disabled={loading}
                  />
                  <p className="text-xs text-[#AAAAAA] mt-2">
                    💡 <strong className="text-white">Tip:</strong> YouTube channel से videos copy करने के लिए, channel page पर जाएं और video links copy करें
                  </p>
                </div>
                <button
                  onClick={handleAudit}
                  disabled={loading || !videoUrls.trim()}
                  className="w-full px-6 py-3 bg-[#FF0000] text-white rounded-lg font-medium hover:bg-[#CC0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Videos...
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5" />
                      Channel Audit करें
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="mt-4 p-4 bg-[#212121] border border-[#333333] rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#FF0000]/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-[#FF0000]" />
                </div>
                <div>
                  <p className="text-sm text-white font-semibold mb-1">Recommended Method</p>
                  <p className="text-sm text-[#AAAAAA]">
                    Channel के सभी videos को analyze करने के लिए, <strong className="text-white">&quot;Video URLs Manually Add करें&quot;</strong> option use करें। यह method सबसे reliable है और हमेशा काम करता है।
                  </p>
                  <p className="text-xs text-[#666666] mt-2">
                    Automatic channel URL method YouTube RSS feeds पर depend करता है जो कभी-कभी available नहीं होते।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {analysis && (
            <div className="space-y-6">
              {/* Channel Score Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#181818] border border-[#212121] rounded-lg p-6 mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2 text-white">{analysis.channelName}</h2>
                    <p className="text-[#AAAAAA]">Channel Analysis Report</p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-white">{analysis.channelScore}%</div>
                    <div className="text-[#AAAAAA]">Channel Score</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-[#212121] border border-[#333333] rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">{analysis.totalVideos}</div>
                    <div className="text-sm text-[#AAAAAA]">Total Videos</div>
                  </div>
                  <div className="bg-[#212121] border border-[#333333] rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">{analysis.analyzedVideos}</div>
                    <div className="text-sm text-[#AAAAAA]">Analyzed</div>
                  </div>
                  <div className="bg-[#212121] border border-[#333333] rounded-lg p-4">
                    <div className="text-2xl font-bold text-white">{analysis.averageViralScore}%</div>
                    <div className="text-sm text-[#AAAAAA]">Avg Viral Score</div>
                  </div>
                </div>
              </motion.div>

              {/* Channel Issues */}
              {analysis.channelIssues.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#181818] border border-[#212121] rounded-lg p-6 mb-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-6 h-6 text-[#FF0000]" />
                    <h2 className="text-xl font-bold text-white">
                      Channel में क्या कमी है?
                    </h2>
                  </div>
                  <ul className="space-y-2">
                    {analysis.channelIssues.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2 text-[#AAAAAA]">
                        <span className="text-[#FF0000] mt-1">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Trending Keywords */}
              {analysis.trendingKeywords.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#181818] border border-[#212121] rounded-lg p-6 mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-[#f59e0b]" />
                      <h2 className="text-xl font-bold text-white">
                        Trending Keywords (Channel के लिए)
                      </h2>
                    </div>
                    <button
                      onClick={() => copyToClipboard(analysis.trendingKeywords.join(', '), 'keywords')}
                      className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-white rounded-lg hover:bg-[#d97706] transition-colors text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      {copied === 'keywords' ? 'Copied!' : 'Copy All'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.trendingKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-[#212121] border border-[#333333] text-[#AAAAAA] rounded-lg text-sm font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Channel Recommendations */}
              {analysis.channelRecommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[#181818] border border-[#212121] rounded-lg p-6 mb-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-[#10b981]" />
                    <h2 className="text-xl font-bold text-white">
                      Channel Recommendations
                    </h2>
                  </div>
                  <ul className="space-y-2">
                    {analysis.channelRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3 text-[#AAAAAA]">
                        <span className="text-[#10b981] mt-1">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Individual Video Analyses */}
              {analysis.videoAnalyses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-[#181818] border border-[#212121] rounded-lg p-6"
                >
                  <h2 className="text-xl font-bold text-white mb-4">
                    Individual Video Analysis ({analysis.videoAnalyses.length} videos)
                  </h2>
                  <div className="space-y-4">
                    {analysis.videoAnalyses.map((video, index) => (
                      <div
                        key={index}
                        className="bg-[#212121] border border-[#333333] rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-1">
                              {video.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-[#AAAAAA]">
                              <span>Current Score: <strong className="text-white">{video.currentScore}%</strong></span>
                              {video.issues.length > 0 && (
                                <span className="text-[#FF0000]">
                                  {video.issues.length} issues
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Suggested Title */}
                        <div className="mb-3">
                          <p className="text-sm font-medium text-white mb-1">
                            Suggested Title:
                          </p>
                          <div className="flex items-center gap-2 p-2 bg-[#181818] border border-[#333333] rounded">
                            <input
                              type="text"
                              value={video.suggestedTitle}
                              readOnly
                              className="flex-1 bg-transparent text-white focus:outline-none"
                            />
                            <button
                              onClick={() => copyToClipboard(video.suggestedTitle, `title-${index}`)}
                              className="p-1 rounded hover:bg-[#333333] transition-colors"
                            >
                              {copied === `title-${index}` ? (
                                <CheckCircle className="w-4 h-4 text-[#10b981]" />
                              ) : (
                                <Copy className="w-4 h-4 text-[#AAAAAA] hover:text-white" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Suggested Tags */}
                        {video.suggestedTags.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-white mb-1">
                              Suggested Tags:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {video.suggestedTags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="px-2 py-1 bg-[#212121] border border-[#333333] text-[#AAAAAA] rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Hashtags */}
                        {video.suggestedHashtags.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-white mb-1">
                              Suggested Hashtags:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {video.suggestedHashtags.slice(0, 10).map((hashtag, hashIndex) => (
                                <span
                                  key={hashIndex}
                                  className="px-2 py-1 bg-[#212121] border border-[#333333] text-[#AAAAAA] rounded text-xs"
                                >
                                  #{hashtag.replace('#', '')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Ask AI about your channel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#181818] border border-[#212121] rounded-lg p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="w-6 h-6 text-[#FF0000]" />
                  <h2 className="text-xl font-bold text-white">
                    Channel ke bare mein AI se sawal poochein
                  </h2>
                </div>
                <p className="text-sm text-[#AAAAAA] mb-4">
                  Apne channel audit report ke hisaab se koi bhi sawal poochhen – AI aapke data ke basis par jawab dega.
                </p>
                {aiMessages.length > 0 && (
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {aiMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg text-sm ${
                          msg.role === 'user'
                            ? 'bg-[#FF0000]/20 text-white ml-4'
                            : 'bg-[#212121] text-[#AAAAAA] border border-[#333333]'
                        }`}
                      >
                        <span className="font-medium text-[#888] block mb-1">
                          {msg.role === 'user' ? 'Aap' : 'AI'}
                        </span>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && askAi()}
                    placeholder="e.g. Mera channel score kaise improve ho? Sabse weak video kaun si hai?"
                    className="flex-1 px-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
                    disabled={aiLoading}
                  />
                  <button
                    type="button"
                    onClick={askAi}
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="px-4 py-3 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    {aiLoading ? '...' : 'Poochhen'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
