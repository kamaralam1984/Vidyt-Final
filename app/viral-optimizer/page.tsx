'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import AuthGuard from '@/components/AuthGuard';
import axios from 'axios';
import { Youtube, Facebook, Instagram, Sparkles, AlertCircle, CheckCircle, Copy, Loader2 } from 'lucide-react';
import { getToken, isAuthenticated } from '@/utils/auth';
import { useTranslations } from '@/context/translations';

interface OptimizationResult {
  videoTitle: string;
  currentScore: number;
  viralScore: number;
  missingElements: string[];
  titleSuggestions: string[];
  viralTags: string[];
  hashtags: string[];
  recommendations: string[];
}

export default function ViralOptimizerPage() {
  const [platform, setPlatform] = useState<'youtube' | 'facebook' | 'instagram'>('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { t } = useTranslations();

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) {
      alert(`Please enter a ${platform} URL`);
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
    setResult(null);

    try {
      const token = getToken();
      
      // Determine API endpoint based on platform
      const apiEndpoint = 
        platform === 'youtube' ? '/api/videos/youtube' :
        platform === 'facebook' ? '/api/videos/facebook' :
        '/api/videos/instagram';
      
      const payload = 
        platform === 'youtube' ? { youtubeUrl: videoUrl } :
        platform === 'facebook' ? { facebookUrl: videoUrl } :
        { instagramUrl: videoUrl };

      // Import the video
      const importResponse = await axios.post(apiEndpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const analysis = importResponse.data.analysis;
      
      // Generate optimization recommendations
      const optimizationResult: OptimizationResult = {
        videoTitle: importResponse.data.video.title,
        currentScore: analysis.viralProbability,
        viralScore: 80, // Target score
        missingElements: generateMissingElements(analysis),
        titleSuggestions: analysis.optimizedTitles || [],
        viralTags: generateViralTags(analysis),
        hashtags: analysis.hashtags || [],
        recommendations: generateRecommendations(analysis),
      };

      setResult(optimizationResult);
    } catch (error: any) {
      console.error('Error analyzing video:', error);
      
      // Handle authentication errors
      if (error?.response?.status === 401) {
        const errorData = error?.response?.data;
        if (errorData?.error === 'Invalid token' || errorData?.message) {
          alert('Your session has expired. Please login again.');
        } else {
          alert('Please login to analyze videos.');
        }
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        alert(error.response?.data?.error || 'Failed to analyze video');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMissingElements = (analysis: any): string[] => {
    const missing: string[] = [];
    
    if (analysis.hookScore < 70) {
      missing.push(t('viral.optimizer.hookLow'));
    }
    if (analysis.thumbnailScore < 70) {
      missing.push(t('viral.optimizer.thumbLow'));
    }
    if (analysis.titleScore < 70) {
      missing.push(t('viral.optimizer.titleLow'));
    }
    if (!analysis.hashtags || analysis.hashtags.length < 10) {
      missing.push(t('viral.optimizer.hashtagLow'));
    }
    if (analysis.viralProbability < 70) {
      missing.push(t('viral.optimizer.overallLow'));
    }

    return missing;
  };

  const generateViralTags = (analysis: any): string[] => {
    const tags: string[] = [];
    
    // Add trending tags
    if (analysis.trendingTopics) {
      analysis.trendingTopics.slice(0, 5).forEach((topic: any) => {
        tags.push(topic.keyword);
      });
    }

    // Add viral tags based on content
    tags.push('viral', 'trending', 'fyp', 'foryou', 'shorts', 'viralvideo');
    
    // Add category-specific tags
    if (analysis.titleAnalysis?.keywords) {
      analysis.titleAnalysis.keywords.slice(0, 5).forEach((keyword: string) => {
        tags.push(keyword.toLowerCase());
      });
    }

    return [...new Set(tags)].slice(0, 20);
  };

  const generateRecommendations = (analysis: any): string[] => {
    const recommendations: string[] = [];
    
    if (analysis.hookScore < 70) {
      recommendations.push('✅ ' + t('viral.optimizer.rec.hook'));
    }
    
    if (analysis.thumbnailScore < 70) {
      recommendations.push('✅ ' + t('viral.optimizer.rec.thumb'));
    }
    
    if (analysis.titleScore < 70) {
      recommendations.push('✅ ' + t('viral.optimizer.rec.title'));
    }
    
    if (analysis.viralProbability < 70) {
      recommendations.push('✅ ' + t('viral.optimizer.rec.overall'));
    }

    return recommendations;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
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
            <Sparkles className="w-8 h-8 text-[#FF0000]" />
            <div>
              <h1 className="text-3xl font-bold text-white">Viral Optimizer</h1>
              <p className="text-[#AAAAAA]">
                Optimize your content for YouTube, Facebook, Instagram.
              </p>
            </div>
          </div>

          {/* Input Section */}
          <div className="bg-[#181818] border border-[#212121] rounded-lg p-6 mb-6">
            {/* Platform Selection */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPlatform('youtube')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  platform === 'youtube'
                    ? 'bg-[#FF0000] text-white'
                    : 'bg-[#212121] text-[#AAAAAA] hover:bg-[#2A2A2A]'
                }`}
              >
                <Youtube className="w-4 h-4" />
                YouTube
              </button>
              <button
                onClick={() => setPlatform('facebook')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  platform === 'facebook'
                    ? 'bg-[#1877F2] text-white'
                    : 'bg-[#212121] text-[#AAAAAA] hover:bg-[#2A2A2A]'
                }`}
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </button>
              <button
                onClick={() => setPlatform('instagram')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  platform === 'instagram'
                    ? 'bg-gradient-to-r from-[#E4405F] to-[#833AB4] text-white'
                    : 'bg-[#212121] text-[#AAAAAA] hover:bg-[#2A2A2A]'
                }`}
              >
                <Instagram className="w-4 h-4" />
                Instagram
              </button>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 relative">
                {platform === 'youtube' && (
                  <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                )}
                {platform === 'facebook' && (
                  <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                )}
                {platform === 'instagram' && (
                  <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AAAAAA]" />
                )}
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Suggested keywords, good title, good description..."
                  className="w-full pl-10 pr-4 py-3 bg-[#212121] border border-[#333333] rounded-lg text-white placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={loading || !videoUrl.trim()}
                className="px-6 py-3 bg-[#FF0000] text-white rounded-lg font-medium hover:bg-[#CC0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Optimize Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-6">
              {/* Score Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#181818] border border-[#212121] rounded-lg p-6 mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm mb-1 truncate">{result.videoTitle}</p>
                    <p className="text-[#AAAAAA] text-xs">Current Viral Score</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-white">{result.currentScore}%</div>
                    <div className="text-[#AAAAAA] text-sm">Target: {result.viralScore}%</div>
                  </div>
                </div>
                <div className="w-full bg-[#212121] rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.currentScore}%` }}
                    transition={{ duration: 1 }}
                    className="bg-[#FF0000] h-2 rounded-full"
                  />
                </div>
              </motion.div>

              {/* Missing Elements */}
              {result.missingElements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#181818] border border-[#212121] rounded-lg p-6 mb-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-6 h-6 text-[#FF0000]" />
                    <h2 className="text-xl font-bold text-white">
                      {t('viral.optimizer.missingElements')}
                    </h2>
                  </div>
                  <ul className="space-y-2">
                    {result.missingElements.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-[#AAAAAA]">
                        <span className="text-[#FF0000] mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Title Suggestions */}
              {result.titleSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#181818] border border-[#212121] rounded-lg p-6 mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-[#10b981]" />
                      <h2 className="text-xl font-bold text-white">
                        Viral Title Suggestions
                      </h2>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {result.titleSuggestions.map((title, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-[#212121] rounded-lg hover:bg-[#2A2A2A] transition-colors group"
                      >
                        <input
                          type="text"
                          value={title}
                          readOnly
                          className="flex-1 bg-transparent text-white font-medium focus:outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(title, `title-${index}`)}
                          className="p-2 rounded-lg hover:bg-[#333333] transition-colors"
                        >
                          {copied === `title-${index}` ? (
                            <CheckCircle className="w-5 h-5 text-[#10b981]" />
                          ) : (
                            <Copy className="w-5 h-5 text-[#AAAAAA] group-hover:text-white" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Viral Tags */}
              {result.viralTags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-[#181818] border border-[#212121] rounded-lg p-6 mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-[#f59e0b]" />
                      <h2 className="text-xl font-bold text-white">
                        Viral Tags (Video & Blog)
                      </h2>
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.viralTags.join(', '), 'tags')}
                      className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-white rounded-lg hover:bg-[#d97706] transition-colors text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      {copied === 'tags' ? 'Copied!' : 'Copy All'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={result.viralTags.join(', ')}
                    readOnly
                    className="w-full p-3 bg-[#212121] border border-[#333333] rounded-lg text-white mb-3 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    {result.viralTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-[#212121] text-[#AAAAAA] rounded-lg text-sm font-medium border border-[#333333]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Hashtags */}
              {result.hashtags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-[#181818] border border-[#212121] rounded-lg p-6 mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-[#FF0000]" />
                      <h2 className="text-xl font-bold text-white">
                        Viral Hashtags
                      </h2>
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' '), 'hashtags')}
                      className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      {copied === 'hashtags' ? 'Copied!' : 'Copy All'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={result.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
                    readOnly
                    className="w-full p-3 bg-[#212121] border border-[#333333] rounded-lg text-white mb-3 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    {result.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-[#212121] text-[#AAAAAA] rounded-lg text-sm font-medium border border-[#333333]"
                      >
                        #{hashtag.replace('#', '')}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-[#181818] border border-[#212121] rounded-lg p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-[#10b981]" />
                    <h2 className="text-xl font-bold text-white">
                      {t('viral.optimizer.recommendations')}
                    </h2>
                  </div>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-3 text-[#AAAAAA]">
                        <span className="text-[#10b981] mt-1">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
