'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import AuthGuard from '@/components/AuthGuard';
import axios from 'axios';
import { Facebook, TrendingUp, AlertTriangle, CheckCircle, Copy, Loader2, BarChart3, Target } from 'lucide-react';
import { getToken } from '@/utils/auth';

interface PageAnalysis {
  pageName: string;
  pageScore: number;
  totalVideos: number;
  analyzedVideos: number;
  averageViralScore: number;
  pageIssues: string[];
  videoAnalyses: VideoAnalysis[];
  trendingKeywords: string[];
  pageRecommendations: string[];
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

export default function FacebookAuditPage() {
  const [pageUrl, setPageUrl] = useState('');
  const [videoUrls, setVideoUrls] = useState('');
  const [useManualUrls, setUseManualUrls] = useState(true); // Default to manual URLs
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PageAnalysis | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'info' | 'error' | 'success'; message: string } | null>(null);

  const handleAudit = async () => {
    if (!useManualUrls && !pageUrl.trim()) {
      alert('Please enter a Facebook page URL or use manual video URLs');
      return;
    }

    if (useManualUrls && !videoUrls.trim()) {
      alert('Please enter at least one video URL');
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      let sampleVideoUrls: string[] = [];
      let currentPageName = 'Your Facebook Page';

      if (useManualUrls) {
        // Parse video URLs from textarea (one per line or comma-separated)
        sampleVideoUrls = videoUrls
          .split(/[,\n]/)
          .map(url => url.trim())
          .filter(url => url.length > 0 && (url.includes('facebook.com') || url.includes('fb.watch')));

        if (sampleVideoUrls.length === 0) {
          alert('Please enter valid Facebook video URLs');
          setLoading(false);
          return;
        }
        currentPageName = 'Manually Added Videos';
      } else {
        // Extract page ID or username from URL
        const pageId = extractPageId(pageUrl);

        if (!pageId) {
          alert('Invalid Facebook page URL format.\n\nSupported formats:\n' +
            '• facebook.com/pagename\n' +
            '• facebook.com/pages/pagename\n' +
            '• facebook.com/pagename/videos\n\n' +
            'या "Video URLs Manually Add करें" option use करें');
          setLoading(false);
          return;
        }

        currentPageName = extractPageName(pageUrl);
        sampleVideoUrls = await getPageVideos(pageId);

        if (sampleVideoUrls.length === 0) {
          // Show helpful notification with instructions
          setNotification({
            type: 'info',
            message: `Facebook page "${pageId}" के videos automatically fetch नहीं हो सके (Facebook scraping allow नहीं करता)। कृपया "Video URLs Manually Add करें" option select करें। Instructions नीचे दिए गए हैं।`
          });
          
          // Automatically switch to manual mode for better UX
          setUseManualUrls(true);
          
          // Clear notification after 10 seconds
          setTimeout(() => setNotification(null), 10000);
          setLoading(false);
          return;
        } else {
          // Show success notification when videos are found
          setNotification({
            type: 'success',
            message: `✅ ${sampleVideoUrls.length} videos मिले! Page audit शुरू हो रहा है...`
          });
          
          // Clear notification after 5 seconds
          setTimeout(() => setNotification(null), 5000);
        }
      }

      if (sampleVideoUrls.length === 0) {
        alert('No videos to analyze. Please add video URLs.');
        setLoading(false);
        return;
      }

      // Show progress
      const totalVideos = Math.min(sampleVideoUrls.length, 10);
      let analyzedCount = 0;

      // Analyze each video
      const videoAnalyses: VideoAnalysis[] = [];
      let totalScore = 0;
      const allTrendingKeywords: Set<string> = new Set();
      const pageIssues: Set<string> = new Set();

      for (const videoUrl of sampleVideoUrls.slice(0, 10)) { // Limit to 10 videos for demo
        console.log(`Analyzing video ${++analyzedCount}/${totalVideos}: ${videoUrl}`);
        try {
          // Add authentication headers
          const token = getToken();
          const headers: any = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const response = await axios.post('/api/videos/facebook', {
            facebookUrl: videoUrl,
          }, { headers });

          const videoAnalysis = response.data.analysis;
          const videoData = response.data.video;

          // Generate suggestions for this video
          const videoAnalysisResult: VideoAnalysis = {
            videoId: videoData.facebookId || videoUrl,
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
          videoAnalysis.trendingTopics?.forEach((topic: any) => {
            allTrendingKeywords.add(topic.keyword);
          });

          // Collect page-level issues
          if (videoAnalysis.viralProbability < 70) {
            pageIssues.add('कुछ videos का viral score कम है');
          }
          if (videoAnalysis.hookScore < 70) {
            pageIssues.add('कई videos में hook score कम है');
          }
          if (videoAnalysis.thumbnailScore < 70) {
            pageIssues.add('Thumbnails को improve करने की जरूरत है');
          }
        } catch (error: any) {
          console.error('Error analyzing video:', error);
          
          // Handle 401 Unauthorized errors
          if (error?.response?.status === 401) {
            console.error('Authentication required. Redirecting to login...');
            alert('Your session has expired. Please login again.');
            window.location.href = '/login';
            return;
          }
          
          // Handle share URL errors with helpful message
          const errorMsg = error?.response?.data?.error || error?.message || 'Unknown error';
          if (videoUrl.includes('/share/') && (errorMsg.includes('Invalid') || errorMsg.includes('Failed'))) {
            console.error(`Share URL failed: ${videoUrl}`);
            setNotification({
              type: 'error',
              message: `Share URL analyze नहीं हो सका: ${videoUrl}\n\nकृपया video को Facebook में open करें और address bar से watch URL copy करें (facebook.com/watch?v=...)`
            });
            setTimeout(() => setNotification(null), 10000);
          }
          
          // Continue with other videos even if one fails
          console.error(`Failed to analyze ${videoUrl}: ${errorMsg}`);
        }
      }

      if (videoAnalyses.length === 0) {
        alert('No videos could be analyzed. Please check the video URLs and try again.');
        setLoading(false);
        return;
      }

      // Generate page analysis
      const pageAnalysis: PageAnalysis = {
        pageName: currentPageName,
        pageScore: Math.round(totalScore / videoAnalyses.length),
        totalVideos: sampleVideoUrls.length,
        analyzedVideos: videoAnalyses.length,
        averageViralScore: Math.round(totalScore / videoAnalyses.length),
        pageIssues: Array.from(pageIssues),
        videoAnalyses,
        trendingKeywords: Array.from(allTrendingKeywords).slice(0, 20),
        pageRecommendations: generatePageRecommendations(videoAnalyses),
      };

      setAnalysis(pageAnalysis);
    } catch (error: any) {
      console.error('Error auditing page:', error);
      alert(error.response?.data?.error || 'Failed to audit Facebook page');
    } finally {
      setLoading(false);
    }
  };

  const extractPageId = (url: string): string | null => {
    let normalizedUrl = url.trim();
    normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');
    normalizedUrl = normalizedUrl.replace(/^www\./, '');

    console.log('Extracting page ID from:', normalizedUrl);

    const patterns = [
      /facebook\.com\/([^\/\?\s&]+)/,  // facebook.com/pagename
      /facebook\.com\/pages\/([^\/\?\s&]+)/,  // facebook.com/pages/pagename
      /facebook\.com\/([^\/\?\s&]+)\/videos/,  // facebook.com/pagename/videos
    ];

    for (const pattern of patterns) {
      const match = normalizedUrl.match(pattern);
      if (match && match[1]) {
        const pageId = match[1];
        console.log('✅ Extracted page ID:', pageId);
        return pageId;
      }
    }

    console.log('❌ Could not extract page ID');
    return null;
  };

  const extractPageName = (url: string): string => {
    const pageId = extractPageId(url);
    if (pageId) {
      return pageId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return 'Facebook Page';
  };

  const getPageVideos = async (pageId: string): Promise<string[]> => {
    try {
      console.log('🔍 Fetching videos for Facebook page:', pageId);

      // Try API endpoint
      try {
        const pageUrlForApi = `facebook.com/${pageId}`;
        console.log('Calling API with URL:', pageUrlForApi);

        // Add authentication headers
        const token = getToken();
        const headers: any = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios.post('/api/facebook/page/videos', {
          pageUrl: pageUrlForApi,
        }, { headers });

        console.log('API response:', response.data);

        if (response.data.success && response.data.videoUrls && response.data.videoUrls.length > 0) {
          console.log(`✅ Found ${response.data.videoUrls.length} videos via API`);
          return response.data.videoUrls.slice(0, 20); // Limit to 20 videos
        } else {
          console.log('API returned no videos');
        }
      } catch (apiError: any) {
        console.log('❌ API method failed:', apiError.response?.data || apiError.message);
        
        // If 401 error, user needs to login
        if (apiError?.response?.status === 401) {
          console.log('Authentication required for Facebook page video fetching');
          alert('Your session has expired. Please login again.');
          window.location.href = '/login';
        }
      }

      // Facebook doesn't have a public RSS feed like YouTube
      // So we return empty and suggest manual URLs
      console.log('❌ No automatic method available for Facebook');
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching Facebook page videos:', error);
      return [];
    }
  };

  const generateTagsForVideo = (analysis: any): string[] => {
    const tags: string[] = [];

    if (analysis.titleAnalysis?.keywords) {
      analysis.titleAnalysis.keywords.slice(0, 5).forEach((kw: string) => tags.push(kw));
    }
    if (analysis.trendingTopics) {
      analysis.trendingTopics.slice(0, 5).forEach((topic: any) => tags.push(topic.keyword));
    }
    return tags.slice(0, 10);
  };

  const generateVideoIssues = (analysis: any): string[] => {
    const issues: string[] = [];
    if (analysis.hookScore < 60) issues.push('Hook Score कम है');
    if (analysis.thumbnailScore < 60) issues.push('Thumbnail Score कम है');
    if (analysis.titleScore < 60) issues.push('Title Score कम है');
    if (analysis.viralProbability < 60) issues.push('Viral Probability कम है');
    return issues;
  };

  const generatePageRecommendations = (videoAnalyses: VideoAnalysis[]): string[] => {
    const recommendations: Set<string> = new Set();
    const lowHookCount = videoAnalyses.filter(v => v.issues.includes('Hook Score कम है')).length;
    const lowThumbnailCount = videoAnalyses.filter(v => v.issues.includes('Thumbnail Score कम है')).length;
    const lowTitleCount = videoAnalyses.filter(v => v.issues.includes('Title Score कम है')).length;
    const lowViralCount = videoAnalyses.filter(v => v.issues.includes('Viral Probability कम है')).length;
    const avgScore = videoAnalyses.reduce((sum, v) => sum + v.currentScore, 0) / videoAnalyses.length;

    // Hook Score Issues & Solutions
    if (lowHookCount > videoAnalyses.length / 2) {
      recommendations.add('🚨 PROBLEM: आपके videos के पहले 3 सेकंड (hook) कमजोर हैं। SOLUTION: पहले 3 सेकंड में तुरंत action दिखाएं, चेहरे का close-up use करें, या intriguing question पूछें। इससे views 40-60% तक बढ़ सकते हैं।');
    }

    // Thumbnail Issues & Solutions
    if (lowThumbnailCount > videoAnalyses.length / 2) {
      recommendations.add('🚨 PROBLEM: Thumbnails आकर्षक नहीं हैं। SOLUTION: Bright colors use करें, चेहरे का clear close-up दिखाएं, और bold text overlay add करें। अच्छे thumbnails से click-through rate 2-3x बढ़ सकता है।');
    }

    // Title Issues & Solutions
    if (lowTitleCount > videoAnalyses.length / 2) {
      recommendations.add('🚨 PROBLEM: Titles viral नहीं बन रहे। SOLUTION: Emotional words use करें (जैसे "अविश्वसनीय", "शॉकिंग"), numbers add करें (जैसे "5 तरीके"), और questions पूछें। इससे engagement 50% तक बढ़ सकता है।');
    }

    // Viral Probability Issues & Solutions
    if (lowViralCount > videoAnalyses.length / 2) {
      recommendations.add('🚨 PROBLEM: Videos viral नहीं हो रहे। SOLUTION: Trending topics पर content बनाएं, peak posting times (6-9 PM) use करें, और audience से questions पूछकर comments बढ़ाएं। Comments और shares बढ़ने से Facebook algorithm आपके content को ज्यादा दिखाता है।');
    }

    // Overall Score Issues
    if (avgScore < 50) {
      recommendations.add('💰 EARNINGS TIP: आपके videos का average score कम है। SOLUTION: Short videos (30-60 seconds) बनाएं जो quickly viral हो सकें, Facebook Reels format use करें, और consistent posting schedule maintain करें (daily 1-2 videos)। Consistent posting से Facebook आपको ज्यादा reach देता है।');
    }

    // Tag Recommendations
    const allTags = new Set<string>();
    videoAnalyses.forEach(v => {
      v.suggestedTags.forEach(tag => allTags.add(tag));
      v.suggestedHashtags.forEach(hashtag => allTags.add(hashtag.replace('#', '')));
    });
    
    if (allTags.size > 0) {
      const topTags = Array.from(allTags).slice(0, 10).join(', ');
      recommendations.add(`🏷️ TAGS: इन tags का use करें: ${topTags}। ये tags trending हैं और आपके content को ज्यादा लोगों तक पहुंचाएंगे।`);
    }

    // Posting Time & Engagement Tips
    recommendations.add('⏰ POSTING TIME: Best posting times - सुबह 7-9 AM और शाम 6-9 PM। इन समय पर ज्यादा लोग online होते हैं, इसलिए views और engagement ज्यादा मिलता है।');

    // Engagement & Earnings Tips
    recommendations.add('💬 ENGAGEMENT TIP: Videos के अंत में call-to-action add करें - "Like करें", "Share करें", "Comment में बताएं"। ज्यादा engagement से Facebook आपके content को ज्यादा दिखाता है, जिससे views और potential earnings बढ़ती है।');

    // Content Strategy
    if (videoAnalyses.length > 0) {
      const highPerformingVideos = videoAnalyses.filter(v => v.currentScore > 70);
      if (highPerformingVideos.length > 0) {
        recommendations.add(`✅ SUCCESS PATTERN: आपके ${highPerformingVideos.length} videos अच्छा perform कर रहे हैं। इन videos की style और format को analyze करें और similar content बनाएं।`);
      }
    }

    // Default positive message
    if (recommendations.size === 0 || avgScore > 70) {
      recommendations.add('🎉 आपका page अच्छा perform कर रहा है! A/B testing करें - different thumbnails, titles, और posting times try करें। Data देखकर best performing content का pattern identify करें और उसे repeat करें।');
    }

    return Array.from(recommendations);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
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
          {/* Notification Banner */}
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-4 p-4 rounded-lg border ${
                notification.type === 'error' 
                  ? 'bg-red-900/20 border-red-500/50 text-red-200' 
                  : notification.type === 'success'
                  ? 'bg-green-900/20 border-green-500/50 text-green-200'
                  : 'bg-blue-900/20 border-blue-500/50 text-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm">{notification.message}</p>
                <button
                  onClick={() => setNotification(null)}
                  className="text-white/70 hover:text-white ml-4"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}

          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Facebook className="w-7 h-7 text-blue-600" /> Facebook Page Audit
          </h1>
          <p className="text-[#AAAAAA] mb-6">
            अपने Facebook page का complete audit करें। हम आपको बताएंगे: क्या problems हैं, क्या करने से ठीक होगा, कौन से tags use करें, और कैसे views और कमाई बढ़ाएं।
          </p>

          <div className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Page Audit Options</h2>
            <div className="flex items-center space-x-4 mb-4">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="urlInputMethod"
                  className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                  checked={!useManualUrls}
                  onChange={() => setUseManualUrls(false)}
                />
                <span className="ml-2 text-[#AAAAAA] group-hover:text-white transition-colors">Page URL से (Limited - Try करें)</span>
              </label>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="urlInputMethod"
                  className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                  checked={useManualUrls}
                  onChange={() => setUseManualUrls(true)}
                />
                <span className="ml-2 text-white font-bold group-hover:text-blue-400 transition-colors">✅ Video URLs Manually Add करें (Recommended - Best Results)</span>
              </label>
            </div>

            {!useManualUrls ? (
              <div className="mb-4">
                <label htmlFor="pageUrl" className="block text-sm font-medium text-white mb-2">
                  Facebook Page URL
                </label>
                <input
                  type="text"
                  id="pageUrl"
                  className="w-full p-3 border border-[#333333] rounded-lg bg-[#212121] text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-[#666666]"
                  placeholder="e.g., facebook.com/kvlnews or facebook.com/pages/pagename"
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  disabled={loading}
                />
                <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-200 mb-2">
                    <strong>⚠️ Note:</strong> Facebook automatic video fetching limited है। Facebook page link से videos automatically fetch नहीं हो सकते।
                  </p>
                  <p className="text-sm text-yellow-200/80">
                    <strong>✅ Best Option:</strong> &quot;Video URLs Manually Add करें&quot; option use करें और अपने page के video URLs copy-paste करें।
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label htmlFor="videoUrls" className="block text-sm font-medium text-white mb-2">
                  Facebook Video URLs (एक line में एक URL, या comma-separated)
                </label>
                <textarea
                  id="videoUrls"
                  rows={6}
                  className="w-full p-3 border border-[#333333] rounded-lg bg-[#212121] text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-[#666666]"
                  placeholder="e.g., https://facebook.com/watch?v=1234567890&#10;https://fb.watch/ABCD1234&#10;https://www.facebook.com/share/v/VIDEO_CODE&#10;https://www.facebook.com/share/r/VIDEO_CODE"
                  value={videoUrls}
                  onChange={(e) => setVideoUrls(e.target.value)}
                  disabled={loading}
                ></textarea>
                <div className="mt-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-200 mb-2">
                    <strong>📋 कैसे Video URLs लें:</strong>
                  </p>
                  <ol className="text-sm text-blue-200/80 space-y-1 list-decimal list-inside">
                    <li>अपने Facebook page पर जाएं</li>
                    <li>&quot;Videos&quot; section में जाएं</li>
                    <li>हर video पर click करें</li>
                    <li>Browser address bar से URL copy करें</li>
                    <li>यहां paste करें (एक line में एक URL)</li>
                  </ol>
                  <p className="text-sm text-blue-200/80 mt-2">
                    <strong>✅ Supported URL Formats (Best to Worst):</strong>
                  </p>
                  <ul className="text-sm text-blue-200/80 mt-1 space-y-1 list-decimal list-inside ml-4">
                    <li><code className="bg-[#181818] px-1 rounded">facebook.com/watch?v=VIDEO_ID</code> <span className="text-green-400">✅ Best</span></li>
                    <li><code className="bg-[#181818] px-1 rounded">facebook.com/reel/VIDEO_ID</code> <span className="text-green-400">✅ Good (Reels)</span></li>
                    <li><code className="bg-[#181818] px-1 rounded">fb.watch/VIDEO_ID</code> <span className="text-green-400">✅ Good</span></li>
                    <li><code className="bg-[#181818] px-1 rounded">facebook.com/share/v/VIDEO_CODE</code> <span className="text-yellow-400">⚠️ May not work</span></li>
                  </ul>
                  <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs text-yellow-200/80">
                    <strong>⚠️ Important:</strong> Share URLs (facebook.com/share/...) may not work reliably. If you get an error, please:
                    <ol className="list-decimal list-inside mt-1 ml-2 space-y-0.5">
                      <li>Open the video in Facebook</li>
                      <li>Click on the video to open it full screen</li>
                      <li>Copy the URL from address bar (should be facebook.com/watch?v=...)</li>
                      <li>Use that URL instead</li>
                    </ol>
                  </div>
                  <p className="text-sm text-blue-200/80 mt-2">
                    <strong>💡 Tip:</strong> आप 5-10 videos के URLs paste कर सकते हैं। हम सभी का analysis करेंगे और page-level recommendations देंगे।
                  </p>
                </div>
              </div>
            )}

            <motion.button
              onClick={handleAudit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              disabled={loading}
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? 'Auditing Page...' : 'Page Audit करें'}
            </motion.button>
          </div>

          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#181818] border border-[#212121] rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-green-600" /> Page Audit Results for {analysis.pageName}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-inner">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Overall Page Score</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analysis.pageScore}/100</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-inner">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Analyzed Videos</p>
                  <p className="text-3xl font-bold text-white">{analysis.analyzedVideos} / {analysis.totalVideos}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-inner">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average Viral Score</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{analysis.averageViralScore}%</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" /> Page Issues (क्या कमी है?)
                </h3>
                {analysis.pageIssues.length > 0 ? (
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    {analysis.pageIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">कोई बड़ी समस्या नहीं मिली. अच्छा काम!</p>
                )}
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" /> Trending Keywords for Your Page
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {analysis.trendingKeywords.map((keyword, index) => (
                    <span key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
                <motion.button
                  onClick={() => copyToClipboard(analysis.trendingKeywords.join(', '))}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  {copied === analysis.trendingKeywords.join(', ') ? 'Copied!' : 'Copy All Keywords'}
                </motion.button>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#10b981]" /> Page Recommendations (क्या करें - Problems & Solutions)
                </h3>
                <div className="space-y-3">
                  {analysis.pageRecommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-[#212121] border border-[#333333] rounded-lg p-4 hover:border-[#10b981]/50 transition-colors"
                    >
                      <p className="text-[#AAAAAA] leading-relaxed">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4 mt-8">Individual Video Analysis</h3>
              <div className="space-y-8">
                {analysis.videoAnalyses.map((video, index) => (
                  <motion.div
                    key={video.videoId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl shadow-inner"
                  >
                    <h4 className="text-lg font-semibold text-white mb-2">{video.title}</h4>
                    <p className="text-sm text-[#AAAAAA] mb-3">Current Viral Score: <span className="font-bold text-blue-600">{video.currentScore}%</span></p>

                    {video.issues.length > 0 && (
                      <div className="mb-3">
                        <p className="font-medium text-red-500 mb-1">Issues:</p>
                        <ul className="list-disc list-inside text-red-400 text-sm">
                          {video.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                        </ul>
                      </div>
                    )}

                    <div className="mb-3">
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Suggested Title:</p>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">{video.suggestedTitle}</span>
                        <motion.button
                          onClick={() => copyToClipboard(video.suggestedTitle)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Copy className="w-4 h-4 text-[#AAAAAA]" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Suggested Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {video.suggestedTags.map((tag, i) => (
                          <span key={i} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <motion.button
                        onClick={() => copyToClipboard(video.suggestedTags.join(', '))}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-2 flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-xs"
                      >
                        <Copy className="w-3 h-3" />
                        {copied === video.suggestedTags.join(', ') ? 'Copied!' : 'Copy All Tags'}
                      </motion.button>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Suggested Hashtags:</p>
                      <div className="flex flex-wrap gap-2">
                        {video.suggestedHashtags.map((hashtag, i) => (
                          <span key={i} className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full text-xs">
                            {hashtag}
                          </span>
                        ))}
                      </div>
                      <motion.button
                        onClick={() => copyToClipboard(video.suggestedHashtags.join(' '))}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-2 flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-xs"
                      >
                        <Copy className="w-3 h-3" />
                        {copied === video.suggestedHashtags.join(' ') ? 'Copied!' : 'Copy All Hashtags'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
