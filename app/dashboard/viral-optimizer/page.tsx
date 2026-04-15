'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import NextImage from 'next/image';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import QuickReferenceBanner from '@/components/quick-reference-banner';
import StepByStepGuide from '@/components/step-by-step-guide';
import SEOGenerator from '@/components/seo-generator';
import ExistingVideoUpdater from '@/components/existing-video-updater';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  Zap,
  Clock,
  MessageCircle,
  BarChart3,
  Type,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Upload,
  FileText,
  TrendingUp,
  Target,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from '@/context/translations';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35 },
  }),
};

export default function ViralOptimizerPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [title, setTitle] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [script, setScript] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [generatingSEO, setGeneratingSEO] = useState(false);
  const autoGenerateSEO = async (promptHint: string) => {
    if (!promptHint) return;
    setGeneratingSEO(true);
    try {
      const fd = new FormData();
      fd.append('topic', promptHint);
      const res = await axios.post('/api/youtube/video-analyze', fd, { headers: getAuthHeaders() });
      const sug = res.data?.suggestions;
      if (sug) {
        setTitle((prev) => prev || sug.title);
        setDescription((prev) => prev || sug.description);
        setKeywords((prev) => prev || sug.keywords?.join(', '));
        const hashStr = sug.hashtags?.length ? sug.hashtags.join(' ') : '';
        if (hashStr && !sug.description?.includes('#')) {
          setDescription((prev) => (prev ? `${prev}\n\n${hashStr}` : hashStr));
        }
      }
    } catch(err) {
      console.error(err);
    } finally {
      setGeneratingSEO(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const titleParam = params.get('title');
      const vidParam = params.get('videoId');
      if (titleParam) {
        setTitle(titleParam);
        autoGenerateSEO(titleParam);
      }
      if (vidParam) {
        setVideoId(vidParam);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [analyzing, setAnalyzing] = useState(false);
  const [ctrData, setCtrData] = useState<{
    ctrScore: number;
    ctrPercent: string;
    factors: Record<string, number>;
    suggestions: string[];
  } | null>(null);
  const [retentionData, setRetentionData] = useState<{
    predictedRetention: number;
    dropPoints: string[];
    suggestions: string[];
    fromScript?: boolean;
  } | null>(null);
  const [engagementData, setEngagementData] = useState<{
    commentHook: string;
    audienceQuestion: string;
    callToAction: string;
    engagementRate: number;
  } | null>(null);
  const [titleOptimizerData, setTitleOptimizerData] = useState<{
    titles: { title: string; predictedCtr: number; recommended: boolean }[];
  } | null>(null);
  const [thumbnailData, setThumbnailData] = useState<{
    score: number;
    facePresence: number;
    emotionIntensity: number;
    colorContrast: number;
    textReadability: number;
    suggestions: string[];
  } | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get('/api/features/all', { headers: getAuthHeaders() });
        setAllowed(res.data?.features?.viral_optimizer === true);
      } catch {
        setAllowed(false);
      }
    };
    check();
  }, []);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setCtrData(null);
    setRetentionData(null);
    setEngagementData(null);
    setTitleOptimizerData(null);
    setThumbnailData(null);
    try {
      let thumbScore = 70,
        thumbContrast = 70,
        faceDetection = 0,
        textReadability = 70;

      if (thumbnailFile || thumbnailPreview) {
        const fd = new FormData();
        if (thumbnailFile) fd.append('thumbnail', thumbnailFile);
        else if (thumbnailPreview) {
          const blob = await (await fetch(thumbnailPreview)).blob();
          fd.append('thumbnail', blob, 'thumb.jpg');
        }
        const thumbRes = await axios.post('/api/viral/thumbnail-score', fd, { headers: getAuthHeaders() });
        const t = thumbRes.data;
        setThumbnailData(t);
        thumbScore = t.score ?? 70;
        thumbContrast = t.colorContrast ?? 70;
        faceDetection = t.facePresence ?? 0;
        textReadability = t.textReadability ?? 70;
      }

      const [ctrRes, retRes, engRes, titleRes] = await Promise.all([
        axios.post(
          '/api/viral/ctr',
          {
            title,
            keywords,
            description,
            thumbnailScore: thumbScore,
            thumbnailContrast: thumbContrast,
            faceDetection,
            textReadability,
          },
          { headers: getAuthHeaders() }
        ),
        axios.post('/api/viral/retention', { script, title }, { headers: getAuthHeaders() }),
        axios.post('/api/viral/engagement', { description, keywords }, { headers: getAuthHeaders() }),
        axios.post('/api/viral/title-optimizer', { title, keywords }, { headers: getAuthHeaders() }),
      ]);

      setCtrData(ctrRes.data);
      setRetentionData(retRes.data);
      setEngagementData(engRes.data);
      setTitleOptimizerData(titleRes.data);
    } catch (e) {
      console.error('Analysis error:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateYoutube = async () => {
    if (!videoId) return;
    setIsUpdating(true);
    setUpdateStatus(null);
    try {
      const res = await axios.post('/api/youtube/update-video', {
        videoId,
        title,
        description,
        keywords
      }, { headers: getAuthHeaders() });

      if (res.data.success) {
        setUpdateStatus({ type: 'success', message: 'Successfully updated on YouTube!' });
      }
    } catch (err: any) {
      if (err.response?.data?.needsAuth) {
        window.location.href = '/api/youtube/auth';
        return;
      }
      setUpdateStatus({ 
        type: 'error', 
        message: err.response?.data?.error || err.message || 'Failed to update video' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const viralScore = (() => {
    if (!ctrData || !retentionData || !engagementData) return null;
    const ctr = ctrData.ctrScore / 100;
    const retention = retentionData.predictedRetention / 100;
    const keywordScore = (ctrData.factors?.keywordRelevance ?? 60) / 100;
    const engagement = engagementData.engagementRate / 100;
    return Math.min(99, Math.round((0.3 * ctr + 0.3 * retention + 0.2 * keywordScore + 0.2 * engagement) * 100));
  })();

  const ctrPercentNumber = ctrData ? parseFloat(ctrData.ctrPercent) || 0 : 0;
  const meetsCtrTarget = ctrPercentNumber >= 12;
  const meetsRetentionTarget = (retentionData?.predictedRetention ?? 0) >= 65;
  const meetsViralTarget = viralScore != null && viralScore >= 75;

  const viralColor = viralScore != null ? (viralScore >= 70 ? '#22c55e' : viralScore >= 40 ? '#eab308' : '#ef4444') : '#666';

  const onThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  if (allowed === null) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 animate-spin text-[#FF0000]" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (allowed === false) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-6 max-w-lg mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">{t('page.accessRestricted')}</h1>
            <p className="text-[#AAAAAA] mb-4">
              Your current plan or role does not include the AI Viral Optimization Engine. Upgrade or ask an admin to enable it in the Feature Matrix.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000]"
            >
              {t('page.backToDashboard')}
            </button>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6 max-w-[1600px] mx-auto">
          {/* Animated Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000]/15 via-purple-500/10 to-[#FF0000]/15 animate-pulse" />
            <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-[#FF0000]/20 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF0000] to-purple-600 flex items-center justify-center shadow-lg shadow-[#FF0000]/30">
                    <Zap className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#FF4444]">
                      AI Viral Optimization Engine
                    </h1>
                    <p className="text-sm text-[#888] mt-0.5">Boost CTR, watch time, and engagement — YouTube Studio style</p>
                  </div>
                </div>
                {/* Live Score Badges */}
                {viralScore != null && (
                  <div className="flex gap-3">
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${meetsCtrTarget ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                      CTR: {ctrData?.ctrPercent ?? '0'}%
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${meetsRetentionTarget ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                      Retention: {retentionData?.predictedRetention ?? 0}%
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${meetsViralTarget ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                      Viral: {viralScore}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quick Reference Banner */}
          <div className="mb-6">
            <QuickReferenceBanner />
          </div>

          {/* Step-by-Step Guide */}
          <div className="mb-8">
            <StepByStepGuide />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* LEFT: Inputs */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-4"
            >
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> {t('viral.engine.title')}
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm text-[#AAAAAA]">{t('viral.engine.videoTitle')}</label>
                      <span className={`text-xs font-mono ${title.length >= 40 && title.length <= 65 ? 'text-emerald-400' : title.length > 70 ? 'text-red-400' : 'text-[#666]'}`}>
                        {title.length}/70 {title.length >= 40 && title.length <= 65 ? '✓' : ''}
                      </span>
                    </div>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. How to Get 8%+ CTR on YouTube"
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm text-[#AAAAAA]">{t('viral.engine.videoDesc')}</label>
                      <span className={`text-xs font-mono ${description.length >= 200 ? 'text-emerald-400' : 'text-[#666]'}`}>
                        {description.length} chars {description.length >= 200 ? '✓' : description.length > 0 ? '(200+ ideal)' : ''}
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000] resize-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm text-[#AAAAAA]">{t('viral.engine.keywordsTags')}</label>
                      <span className={`text-xs font-mono ${keywords.split(/[,;\n]/).filter(k => k.trim()).length >= 8 ? 'text-emerald-400' : 'text-[#666]'}`}>
                        {keywords.split(/[,;\n]/).filter(k => k.trim()).length} tags {keywords.split(/[,;\n]/).filter(k => k.trim()).length >= 8 ? '✓' : ''}
                      </span>
                    </div>
                    <input
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="keyword1, keyword2, ..."
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">{t('viral.engine.thumbUpload')}</label>
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-[#333] rounded-lg cursor-pointer hover:bg-[#212121] transition">
                      <input type="file" accept="image/*" className="hidden" onChange={onThumbnailChange} />
                      {thumbnailPreview ? (
                        <NextImage src={thumbnailPreview} alt="Thumb" width={120} height={64} className="h-16 object-contain rounded" unoptimized />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-[#666] mb-1" />
                          <span className="text-xs text-[#888]">Choose thumbnail</span>
                        </>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">{t('viral.engine.scriptOptional')}</label>
                    <textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      placeholder="Paste script or outline for retention analysis..."
                      rows={4}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000] resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => autoGenerateSEO(title || keywords || description || 'viral content')}
                      disabled={generatingSEO || (!title && !keywords && !description)}
                      className="w-full py-2.5 px-4 bg-[#222] hover:bg-[#333] border border-[#444] disabled:opacity-50 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-[#FF0000]"
                    >
                      {generatingSEO ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-400" />}
                      {generatingSEO ? 'AI is generating high-ranking SEO...' : 'Auto-Generate SEO ✨'}
                    </button>

                    <button
                      type="button"
                      onClick={runAnalysis}
                      disabled={analyzing}
                      className="w-full py-3 px-4 bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-50 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                    >
                      {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                      {analyzing ? 'Analyzing…' : 'Analyze Viral Potential'}
                    </button>

                    {videoId && (
                      <button
                        type="button"
                        onClick={handleUpdateYoutube}
                        disabled={isUpdating || !title}
                        className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : '🚀'}
                        {isUpdating ? 'Updating...' : 'Push Changes to YouTube'}
                      </button>
                    )}

                    {updateStatus && (
                        <div className={`mt-2 p-3 rounded-lg text-sm ${updateStatus.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {updateStatus.type === 'success' ? '✓ ' : '⚠️ '}
                            {updateStatus.message}
                        </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SEO Generator Component */}
              <SEOGenerator
                currentTopic={title || keywords || description || 'viral content'}
                onSelectKeyword={(kw) => setKeywords((prev) => (prev ? `${prev}, ${kw}` : kw))}
                onSelectTitle={(t) => setTitle(t)}
                onSelectDescription={(d) => setDescription(d)}
                onSelectHashtags={(h) => setDescription((prev) => (prev ? `${prev}\n\n${h}` : h))}
              />

              {/* Existing Video Updater */}
              <ExistingVideoUpdater
                onVideoSelected={(video) => {
                  setVideoId(video.videoId);
                  setTitle(video.title);
                  setDescription(video.description);
                }}
                onTitleUpdate={(title) => setTitle(title)}
                onDescriptionUpdate={(desc) => setDescription(desc)}
                onTagsUpdate={(tags) => setKeywords(tags)}
              />
            </motion.div>

            {/* RIGHT: Analysis cards */}
            <div className="lg:col-span-3 space-y-6">
              {(ctrData || retentionData || engagementData) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-lg px-4 py-2"
                >
                  ✓ Real analysis from your title, description, keywords, thumbnail & script. Change inputs and run again to see updated results.
                </motion.p>
              )}
              {/* 1. {t('viral.engine.ctrPredictor')} */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={ctrData ? 'visible' : 'hidden'}
                custom={0}
                className="bg-[#181818] border border-[#212121] rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#FF0000]" /> {t('viral.engine.ctrPredictor')}
                </h2>
                {ctrData ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-3xl font-black ${meetsCtrTarget ? 'text-emerald-400' : ctrPercentNumber >= 8 ? 'text-amber-400' : 'text-red-400'}`}>{ctrData.ctrPercent}%</span>
                      <div>
                        <span className="text-sm text-white font-medium">CTR Prediction</span>
                        <div className="mt-0.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meetsCtrTarget ? 'bg-emerald-500/20 text-emerald-400' : ctrPercentNumber >= 8 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                            {meetsCtrTarget ? '✓ Target achieved' : ctrPercentNumber >= 8 ? '⚡ Close to target' : '⚠ Needs improvement'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2.5 mb-4">
                      {Object.entries(ctrData.factors).map(([k, v]) => {
                        const val = Math.round(v);
                        const fc = val >= 80 ? 'text-emerald-400' : val >= 60 ? 'text-amber-400' : 'text-red-400';
                        const fb = val >= 80 ? 'bg-emerald-500' : val >= 60 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                          <div key={k}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#AAA] capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className={`font-bold ${fc}`}>{val}/100</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#222] rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.8 }} className={`h-full rounded-full ${fb}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {ctrData.suggestions.length > 0 && (
                      <div className="pt-3 border-t border-[#333]">
                        <p className="text-xs font-bold text-emerald-400 mb-2">💡 Improvements</p>
                        <ul className="text-sm text-[#AAA] space-y-1.5">
                          {ctrData.suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">→</span> {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[#666] text-sm">Run analysis to see CTR prediction with factor breakdown.</p>
                )}
              </motion.div>

              {/* 2. Watch Time / Retention */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={retentionData ? 'visible' : 'hidden'}
                custom={1}
                className="bg-[#181818] border border-[#212121] rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#FF0000]" /> {t('viral.engine.retention')}
                </h2>
                {retentionData ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-2xl font-bold text-white">Predicted Retention: {retentionData.predictedRetention}%</p>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          meetsRetentionTarget ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {meetsRetentionTarget ? 'Meets 65%+ target' : 'Below 65% target'}
                      </span>
                    </div>
                    {retentionData.fromScript === false && (
                      <p className="text-xs text-amber-400 mb-2">Estimate based on title. Add a script for accurate retention & drop points.</p>
                    )}
                    <p className="text-xs text-[#AAA] mb-2">Detected drop points:</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {retentionData.dropPoints.map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-[#333] rounded text-sm text-white">{t}</span>
                      ))}
                    </div>
                    <ul className="text-sm text-[#AAA] list-disc list-inside space-y-1">
                      {retentionData.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-[#666] text-sm">Run analysis to see retention prediction.</p>
                )}
              </motion.div>

              {/* 3. {t('viral.engine.engagement')} */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={engagementData ? 'visible' : 'hidden'}
                custom={2}
                className="bg-[#181818] border border-[#212121] rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#FF0000]" /> {t('viral.engine.engagement')}
                </h2>
                {engagementData ? (
                  <>
                    <p className="text-lg font-bold text-white mb-2">Predicted engagement rate: {engagementData.engagementRate}%</p>
                    <div className="space-y-2 text-sm">
                      <p className="text-[#AAA]"><span className="text-amber-400">Comment hook:</span> {engagementData.commentHook}</p>
                      <p className="text-[#AAA]"><span className="text-amber-400">Audience question:</span> {engagementData.audienceQuestion}</p>
                      <p className="text-[#AAA]"><span className="text-amber-400">Call to action:</span> {engagementData.callToAction}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-[#666] text-sm">Run analysis to see engagement suggestions.</p>
                )}
              </motion.div>

              {/* 4. {t('viral.engine.viralScore')} */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={viralScore != null ? 'visible' : 'hidden'}
                custom={3}
                className="bg-[#181818] border border-[#212121] rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#FF0000]" /> {t('viral.engine.viralScore')}
                </h2>
                {viralScore != null ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-2xl font-bold text-white">Viral Probability: {viralScore}%</p>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          meetsViralTarget ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {meetsViralTarget ? 'High viral setup (75%+)' : 'Below viral target (aim for 75%+)'}
                      </span>
                    </div>
                    <p className="text-xs text-[#AAA] mb-2">0.30×CTR + 0.30×Retention + 0.20×Keyword + 0.20×Engagement</p>
                    <div className="h-4 bg-[#212121] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${viralScore}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: viralColor }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-[#666] text-sm">Run analysis to see viral score.</p>
                )}
              </motion.div>

              {/* 5. {t('viral.engine.titleAB')} */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={titleOptimizerData ? 'visible' : 'hidden'}
                custom={4}
                className="bg-[#181818] border border-[#212121] rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Type className="w-5 h-5 text-[#FF0000]" /> {t('viral.engine.titleAB')}
                </h2>
                {titleOptimizerData?.titles?.length ? (
                  <ul className="space-y-2">
                    {titleOptimizerData.titles.map((t, i) => (
                      <li key={i} onClick={() => setTitle(t.title)}
                        className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[#111] border border-[#222] hover:border-[#FF0000]/40 cursor-pointer transition group">
                        <span className="text-white text-sm flex-1 min-w-0 truncate group-hover:text-[#FF4444] transition">{t.title}</span>
                        <span className={`text-xs font-bold shrink-0 ${t.predictedCtr >= 10 ? 'text-emerald-400' : t.predictedCtr >= 7 ? 'text-amber-400' : 'text-red-400'}`}>CTR {t.predictedCtr}%</span>
                        {t.recommended && (
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">Best</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#666] text-sm">Run analysis to see title variants.</p>
                )}
              </motion.div>

              {/* 6. {t('viral.engine.thumbAnalysis')} */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={thumbnailData ? 'visible' : 'hidden'}
                custom={5}
                className="bg-[#181818] border border-[#212121] rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#FF0000]" /> {t('viral.engine.thumbAnalysis')}
                </h2>
                {thumbnailData ? (
                  <>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className={`text-3xl font-black ${thumbnailData.score >= 70 ? 'text-emerald-400' : thumbnailData.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{thumbnailData.score}</span>
                      <span className="text-[#666]">/ 100</span>
                    </div>
                    <div className="space-y-2.5 mb-4">
                      {[
                        { label: 'Face Presence', value: thumbnailData.facePresence },
                        { label: 'Emotion Intensity', value: thumbnailData.emotionIntensity },
                        { label: 'Color Contrast', value: thumbnailData.colorContrast },
                        { label: 'Text Readability', value: thumbnailData.textReadability },
                      ].map((item) => {
                        const v = item.value ?? 0;
                        const c = v >= 70 ? 'text-emerald-400' : v >= 40 ? 'text-amber-400' : 'text-red-400';
                        const b = v >= 70 ? 'bg-emerald-500' : v >= 40 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                          <div key={item.label}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#AAA]">{item.label}</span>
                              <span className={`font-bold ${c}`}>{v}</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#222] rounded-full"><div className={`h-full rounded-full ${b}`} style={{ width: `${v}%` }} /></div>
                          </div>
                        );
                      })}
                    </div>
                    {thumbnailData.suggestions?.length > 0 && (
                      <div className="pt-3 border-t border-[#333]">
                        <p className="text-xs font-bold text-amber-400 mb-2">Improvements</p>
                        <ul className="text-sm text-[#AAA] space-y-1.5">
                          {thumbnailData.suggestions.map((s, i) => (
                            <li key={i} className="flex items-start gap-2"><span className="text-amber-400">•</span> {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[#666] text-sm">Upload a thumbnail and run analysis.</p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
