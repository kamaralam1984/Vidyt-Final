'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import AuthGuard from '@/components/AuthGuard';
import axios from 'axios';
import { Facebook, TrendingUp, AlertTriangle, CheckCircle, Copy, Loader2, BarChart3, Target, Check, RefreshCw, X } from 'lucide-react';
import { getToken } from '@/utils/auth';
import { useTranslations } from '@/context/translations';

interface PageAnalysis {
  pageName: string; pageScore: number; totalVideos: number; analyzedVideos: number;
  averageViralScore: number; pageIssues: string[]; videoAnalyses: VideoAnalysis[];
  trendingKeywords: string[]; pageRecommendations: string[];
}

interface VideoAnalysis {
  videoId: string; title: string; currentScore: number; suggestedTitle: string;
  suggestedTags: string[]; suggestedHashtags: string[]; issues: string[];
}

export default function FacebookAuditPage() {
  const { t } = useTranslations();
  const [pageUrl, setPageUrl] = useState('');
  const [videoUrls, setVideoUrls] = useState('');
  const [useManualUrls, setUseManualUrls] = useState(true);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PageAnalysis | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'info' | 'error' | 'success'; message: string } | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const extractPageId = (url: string): string | null => {
    const n = url.trim().replace(/^https?:\/\//, '').replace(/^www\./, '');
    const patterns = [/facebook\.com\/([^\/\?\s&]+)/, /facebook\.com\/pages\/([^\/\?\s&]+)/, /facebook\.com\/([^\/\?\s&]+)\/videos/];
    for (const p of patterns) { const m = n.match(p); if (m?.[1]) return m[1]; }
    return null;
  };

  const extractPageName = (url: string): string => {
    const id = extractPageId(url);
    return id ? id.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Facebook Page';
  };

  const getPageVideos = async (pageId: string): Promise<string[]> => {
    try {
      const token = getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('/api/facebook/page/videos', { pageUrl: `facebook.com/${pageId}` }, { headers });
      if (res.data.success && res.data.videoUrls?.length > 0) return res.data.videoUrls.slice(0, 20);
    } catch (err: any) {
      if (err?.response?.status === 401) { window.location.href = '/login'; return []; }
    }
    return [];
  };

  const generateVideoIssues = (analysis: any): string[] => {
    const issues: string[] = [];
    if (analysis.hookScore < 60) issues.push(t('fb.audit.hookLow'));
    if (analysis.thumbnailScore < 60) issues.push(t('fb.audit.thumbLow'));
    if (analysis.titleScore < 60) issues.push(t('fb.audit.titleLow'));
    if (analysis.viralProbability < 60) issues.push(t('fb.audit.viralLow'));
    return issues;
  };

  const generateTagsForVideo = (analysis: any): string[] => {
    const tags: string[] = [];
    if (analysis.titleAnalysis?.keywords) analysis.titleAnalysis.keywords.slice(0, 5).forEach((kw: string) => tags.push(kw));
    if (analysis.trendingTopics) analysis.trendingTopics.slice(0, 5).forEach((topic: any) => tags.push(topic.keyword));
    return tags.slice(0, 10);
  };

  const generatePageRecommendations = (videoAnalyses: VideoAnalysis[]): string[] => {
    const recs: Set<string> = new Set();
    const avgScore = videoAnalyses.reduce((s, v) => s + v.currentScore, 0) / videoAnalyses.length;
    const lowHook = videoAnalyses.filter(v => v.issues.includes(t('fb.audit.hookLow'))).length;
    const lowThumb = videoAnalyses.filter(v => v.issues.includes(t('fb.audit.thumbLow'))).length;
    const lowTitle = videoAnalyses.filter(v => v.issues.includes(t('fb.audit.titleLow'))).length;
    const lowViral = videoAnalyses.filter(v => v.issues.includes(t('fb.audit.viralLow'))).length;

    if (lowHook > videoAnalyses.length / 2) recs.add('PROBLEM: Hook (first 3 seconds) is weak. SOLUTION: Show immediate action, use face close-up, or ask an intriguing question. This can increase views by 40-60%.');
    if (lowThumb > videoAnalyses.length / 2) recs.add('PROBLEM: Thumbnails are not attractive. SOLUTION: Use bright colors, clear face close-up, and bold text overlay. Good thumbnails can increase CTR 2-3x.');
    if (lowTitle > videoAnalyses.length / 2) recs.add('PROBLEM: Titles are not going viral. SOLUTION: Use emotional words, add numbers (e.g. "5 Ways"), and ask questions. This can increase engagement by 50%.');
    if (lowViral > videoAnalyses.length / 2) recs.add('PROBLEM: Videos are not going viral. SOLUTION: Create content on trending topics, use peak posting times (6-9 PM), and ask audience questions to increase comments.');
    if (avgScore < 50) recs.add('EARNINGS TIP: Average score is low. SOLUTION: Create short videos (30-60 seconds), use Facebook Reels format, and maintain consistent posting schedule (1-2 videos daily).');

    const allTags = new Set<string>();
    videoAnalyses.forEach(v => { v.suggestedTags.forEach(tag => allTags.add(tag)); v.suggestedHashtags.forEach(h => allTags.add(h.replace('#', ''))); });
    if (allTags.size > 0) recs.add(`TAGS: Use these tags: ${Array.from(allTags).slice(0, 10).join(', ')}. These are trending and will help reach more people.`);
    recs.add('POSTING TIME: Best posting times - Morning 7-9 AM and Evening 6-9 PM. More people are online at these times.');
    recs.add('ENGAGEMENT TIP: Add call-to-action at the end - "Like", "Share", "Comment below". More engagement = more reach from Facebook algorithm.');

    const highPerf = videoAnalyses.filter(v => v.currentScore > 70);
    if (highPerf.length > 0) recs.add(`SUCCESS PATTERN: ${highPerf.length} videos are performing well. Analyze their style and create similar content.`);
    if (recs.size === 0 || avgScore > 70) recs.add('Your page is performing well! Try A/B testing with different thumbnails, titles, and posting times.');
    return Array.from(recs);
  };

  const handleAudit = async () => {
    if (!useManualUrls && !pageUrl.trim()) { setNotification({ type: 'error', message: 'Please enter a Facebook page URL' }); setTimeout(() => setNotification(null), 5000); return; }
    if (useManualUrls && !videoUrls.trim()) { setNotification({ type: 'error', message: 'Please enter at least one video URL' }); setTimeout(() => setNotification(null), 5000); return; }

    setLoading(true);
    setAnalysis(null);
    try {
      let sampleVideoUrls: string[] = [];
      let currentPageName = 'Your Facebook Page';

      if (useManualUrls) {
        sampleVideoUrls = videoUrls.split(/[,\n]/).map(u => u.trim()).filter(u => u.length > 0 && (u.includes('facebook.com') || u.includes('fb.watch')));
        if (sampleVideoUrls.length === 0) { setNotification({ type: 'error', message: 'Please enter valid Facebook video URLs' }); setLoading(false); return; }
        currentPageName = 'Manually Added Videos';
      } else {
        const pageId = extractPageId(pageUrl);
        if (!pageId) { setNotification({ type: 'error', message: 'Invalid Facebook page URL format' }); setLoading(false); return; }
        currentPageName = extractPageName(pageUrl);
        sampleVideoUrls = await getPageVideos(pageId);
        if (sampleVideoUrls.length === 0) {
          setNotification({ type: 'info', message: 'Could not fetch videos automatically. Please use "Add Video URLs Manually" option.' });
          setUseManualUrls(true);
          setTimeout(() => setNotification(null), 8000);
          setLoading(false);
          return;
        }
      }

      const videoAnalyses: VideoAnalysis[] = [];
      let totalScore = 0;
      const allTrendingKeywords: Set<string> = new Set();
      const pageIssues: Set<string> = new Set();
      const token = getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      for (const videoUrl of sampleVideoUrls.slice(0, 10)) {
        try {
          const response = await axios.post('/api/videos/facebook', { facebookUrl: videoUrl }, { headers });
          const va = response.data.analysis;
          const vd = response.data.video;
          videoAnalyses.push({
            videoId: vd.facebookId || videoUrl, title: vd.title, currentScore: va.viralProbability,
            suggestedTitle: va.titleAnalysis?.optimizedTitles?.[0] || vd.title,
            suggestedTags: generateTagsForVideo(va), suggestedHashtags: va.hashtags || [],
            issues: generateVideoIssues(va),
          });
          totalScore += va.viralProbability;
          va.trendingTopics?.forEach((topic: any) => allTrendingKeywords.add(topic.keyword));
          if (va.viralProbability < 70) pageIssues.add(t('fb.audit.viralLow'));
          if (va.hookScore < 70) pageIssues.add(t('fb.audit.hookLow'));
          if (va.thumbnailScore < 70) pageIssues.add(t('fb.audit.thumbLow'));
        } catch (error: any) {
          if (error?.response?.status === 401) { window.location.href = '/login'; return; }
        }
      }

      if (videoAnalyses.length === 0) { setNotification({ type: 'error', message: 'No videos could be analyzed. Please check URLs.' }); setLoading(false); return; }

      setAnalysis({
        pageName: currentPageName, pageScore: Math.round(totalScore / videoAnalyses.length),
        totalVideos: sampleVideoUrls.length, analyzedVideos: videoAnalyses.length,
        averageViralScore: Math.round(totalScore / videoAnalyses.length),
        pageIssues: Array.from(pageIssues), videoAnalyses,
        trendingKeywords: Array.from(allTrendingKeywords).slice(0, 20),
        pageRecommendations: generatePageRecommendations(videoAnalyses),
      });
    } catch (error: any) {
      setNotification({ type: 'error', message: error.response?.data?.error || 'Failed to audit Facebook page' });
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s: number) => s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-amber-400' : 'text-red-400';
  const scoreBg = (s: number) => s >= 70 ? 'bg-emerald-500' : s >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Animated Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-blue-400/5 to-blue-600/10 animate-pulse" />
            <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <Facebook className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    {t('fb.audit.title')}
                  </h1>
                  <p className="text-sm text-[#888] mt-0.5">{t('fb.audit.subtitle')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notification */}
          {notification && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className={`mb-4 p-4 rounded-xl border flex items-center justify-between ${notification.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
              <p className="text-sm">{notification.message}</p>
              <button onClick={() => setNotification(null)} className="ml-4 hover:text-white"><X className="w-4 h-4" /></button>
            </motion.div>
          )}

          {/* Audit Form */}
          <div className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              {(['page', 'manual'] as const).map((mode) => (
                <button key={mode} onClick={() => setUseManualUrls(mode === 'manual')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${(mode === 'manual') === useManualUrls ? 'bg-blue-600 text-white' : 'bg-[#212121] text-[#888] hover:text-white'}`}>
                  {mode === 'manual' ? t('fb.audit.manualRecommended') : t('fb.audit.pageUrl')}
                </button>
              ))}
            </div>

            {useManualUrls ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">{t('fb.audit.videoUrls')}</label>
                <textarea rows={5} value={videoUrls} onChange={(e) => setVideoUrls(e.target.value)} disabled={loading}
                  placeholder="https://facebook.com/watch?v=1234567890&#10;https://fb.watch/ABCD1234"
                  className="w-full p-3 border border-[#333] rounded-lg bg-[#111] text-white placeholder-[#666] focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-[#666] mt-2">{t('fb.audit.howToGetUrls')}</p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-white mb-2">{t('fb.audit.pageUrl')}</label>
                <input type="text" value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} disabled={loading}
                  placeholder="e.g., facebook.com/pagename"
                  className="w-full p-3 border border-[#333] rounded-lg bg-[#111] text-white placeholder-[#666] focus:ring-2 focus:ring-blue-500" />
              </div>
            )}

            <button onClick={handleAudit} disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
              {loading ? t('fb.audit.auditing') : t('fb.audit.runAudit')}
            </button>
          </div>

          {/* Results */}
          {analysis && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-5">
                  <p className="text-xs text-[#888] uppercase font-bold mb-1">Page Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-black ${scoreColor(analysis.pageScore)}`}>{analysis.pageScore}</span>
                    <span className="text-[#666]">/100</span>
                  </div>
                  <div className="w-full h-2 bg-[#222] rounded-full mt-2"><div className={`h-full rounded-full ${scoreBg(analysis.pageScore)}`} style={{ width: `${analysis.pageScore}%` }} /></div>
                </div>
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-5">
                  <p className="text-xs text-[#888] uppercase font-bold mb-1">Videos Analyzed</p>
                  <p className="text-3xl font-black text-white">{analysis.analyzedVideos} <span className="text-sm text-[#666]">/ {analysis.totalVideos}</span></p>
                </div>
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-5">
                  <p className="text-xs text-[#888] uppercase font-bold mb-1">Avg Viral Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-black ${scoreColor(analysis.averageViralScore)}`}>{analysis.averageViralScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#222] rounded-full mt-2"><div className={`h-full rounded-full ${scoreBg(analysis.averageViralScore)}`} style={{ width: `${analysis.averageViralScore}%` }} /></div>
                </div>
              </div>

              {/* Page Issues */}
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" /> {t('fb.audit.pageIssues')}
                </h3>
                {analysis.pageIssues.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.pageIssues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#AAA]"><span className="text-red-400 mt-0.5">•</span> {issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-emerald-400">{t('fb.audit.noIssues')}</p>
                )}
              </div>

              {/* Trending Keywords */}
              {analysis.trendingKeywords.length > 0 && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" /> {t('fb.audit.trendingKeywords')}
                    </h3>
                    <button onClick={() => copyText(analysis.trendingKeywords.join(', '), 'keywords')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#333] rounded-lg text-xs text-[#CCC]">
                      {copiedItem === 'keywords' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedItem === 'keywords' ? t('common.copied') : t('hashtags.copyAll')}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.trendingKeywords.map((kw, i) => (
                      <button key={i} onClick={() => copyText(kw, `kw-${i}`)}
                        className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm hover:bg-blue-500/20 transition">
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" /> {t('fb.audit.recommendations')}
                </h3>
                <div className="space-y-3">
                  {analysis.pageRecommendations.map((rec, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="p-4 bg-[#111] border border-[#222] rounded-xl hover:border-emerald-500/30 transition">
                      <p className="text-sm text-[#CCC] leading-relaxed">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Individual Video Analysis */}
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">{t('fb.audit.videoAnalysis')}</h3>
                <div className="space-y-4">
                  {analysis.videoAnalyses.map((video, i) => (
                    <motion.div key={video.videoId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="p-5 bg-[#111] border border-[#222] rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-white truncate flex-1">{video.title}</h4>
                        <span className={`text-sm font-bold ml-3 ${scoreColor(video.currentScore)}`}>{video.currentScore}%</span>
                      </div>

                      {video.issues.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {video.issues.map((issue, j) => (
                            <span key={j} className="text-xs px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">{issue}</span>
                          ))}
                        </div>
                      )}

                      <div className="mb-3">
                        <p className="text-xs text-[#888] mb-1">Suggested Title:</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-400 font-medium truncate">{video.suggestedTitle}</span>
                          <button onClick={() => copyText(video.suggestedTitle, `title-${i}`)} className="flex-shrink-0">
                            {copiedItem === `title-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#666] hover:text-white" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {video.suggestedTags.map((tag, j) => (
                          <span key={j} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs">{tag}</span>
                        ))}
                        {video.suggestedHashtags.map((h, j) => (
                          <span key={`h-${j}`} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs">{h}</span>
                        ))}
                      </div>
                      <button onClick={() => copyText([...video.suggestedTags, ...video.suggestedHashtags].join(', '), `tags-${i}`)}
                        className="text-xs text-[#888] hover:text-white flex items-center gap-1">
                        {copiedItem === `tags-${i}` ? <><Check className="w-3 h-3 text-emerald-400" /> {t('common.copied')}</> : <><Copy className="w-3 h-3" /> {t('hashtags.copyAll')}</>}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
