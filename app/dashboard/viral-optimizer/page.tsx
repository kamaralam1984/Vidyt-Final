'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
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
} from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35 },
  }),
};

export default function ViralOptimizerPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [script, setScript] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

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
        const res = await axios.get('/api/auth/me', { headers: getAuthHeaders() });
        const role = res.data?.user?.role;
        setAllowed(role === 'super-admin');
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

  const viralScore = (() => {
    if (!ctrData || !retentionData || !engagementData) return null;
    const ctr = ctrData.ctrScore / 100;
    const retention = retentionData.predictedRetention / 100;
    const keywordScore = (ctrData.factors?.keywordRelevance ?? 60) / 100;
    const engagement = engagementData.engagementRate / 100;
    return Math.min(99, Math.round((0.3 * ctr + 0.3 * retention + 0.2 * keywordScore + 0.2 * engagement) * 100));
  })();

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
            <h1 className="text-xl font-bold text-white mb-2">Access restricted</h1>
            <p className="text-[#AAAAAA] mb-4">AI Viral Optimization Engine is available only for Super Admin.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000]"
            >
              Back to Dashboard
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <Zap className="w-8 h-8 text-[#FF0000]" />
            <div>
              <h1 className="text-2xl font-bold text-white">AI Viral Optimization Engine</h1>
              <p className="text-sm text-[#AAAAAA]">Boost CTR, watch time, and engagement — YouTube Studio style</p>
            </div>
          </motion.div>

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
                  <FileText className="w-5 h-5" /> Video optimization inputs
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Video Title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. How to Get 8%+ CTR on YouTube"
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Video Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Keywords / Tags</label>
                    <input
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="keyword1, keyword2, ..."
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Thumbnail Upload</label>
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-[#333] rounded-lg cursor-pointer hover:bg-[#212121] transition">
                      <input type="file" accept="image/*" className="hidden" onChange={onThumbnailChange} />
                      {thumbnailPreview ? (
                        <img src={thumbnailPreview} alt="Thumb" className="h-16 object-contain rounded" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-[#666] mb-1" />
                          <span className="text-xs text-[#888]">Choose thumbnail</span>
                        </>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Video Script (optional)</label>
                    <textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      placeholder="Paste script or outline for retention analysis..."
                      rows={4}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000] resize-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="w-full py-3 px-4 bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-50 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                  >
                    {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                    {analyzing ? 'Analyzing…' : 'Analyze Viral Potential'}
                  </button>
                </div>
              </div>
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
              {/* 1. CTR Predictor */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={ctrData ? 'visible' : 'hidden'}
                custom={0}
                className="bg-[#181818] border border-[#212121] rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#FF0000]" /> CTR Predictor
                </h2>
                {ctrData ? (
                  <>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold text-white">CTR Prediction: {ctrData.ctrPercent}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      {Object.entries(ctrData.factors).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-[#AAA]">
                          <span>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-white">{v}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-amber-400 mb-1">Suggestions</p>
                    <ul className="text-sm text-[#AAA] list-disc list-inside space-y-1">
                      {ctrData.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-[#666] text-sm">Run analysis to see CTR prediction.</p>
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
                  <Clock className="w-5 h-5 text-[#FF0000]" /> Watch Time / Retention Predictor
                </h2>
                {retentionData ? (
                  <>
                    <p className="text-2xl font-bold text-white mb-2">Predicted Retention: {retentionData.predictedRetention}%</p>
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

              {/* 3. Engagement Booster */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={engagementData ? 'visible' : 'hidden'}
                custom={2}
                className="bg-[#181818] border border-[#212121] rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#FF0000]" /> Engagement Booster
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

              {/* 4. Viral Score Engine */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={viralScore != null ? 'visible' : 'hidden'}
                custom={3}
                className="bg-[#181818] border border-[#212121] rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#FF0000]" /> Viral Score Engine
                </h2>
                {viralScore != null ? (
                  <>
                    <p className="text-2xl font-bold text-white mb-2">Viral Probability: {viralScore}%</p>
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

              {/* 5. Title A/B Testing */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={titleOptimizerData ? 'visible' : 'hidden'}
                custom={4}
                className="bg-[#181818] border border-[#212121] rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Type className="w-5 h-5 text-[#FF0000]" /> Title A/B Testing
                </h2>
                {titleOptimizerData?.titles?.length ? (
                  <ul className="space-y-2">
                    {titleOptimizerData.titles.map((t, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 py-2 border-b border-[#333] last:border-0">
                        <span className="text-white text-sm flex-1 min-w-0 truncate">{t.title}</span>
                        <span className="text-[#AAA] text-sm shrink-0">CTR {t.predictedCtr}%</span>
                        {t.recommended && (
                          <span className="text-xs bg-[#FF0000] text-white px-2 py-0.5 rounded">Recommended</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#666] text-sm">Run analysis to see title variants.</p>
                )}
              </motion.div>

              {/* 6. Thumbnail Analysis */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={thumbnailData ? 'visible' : 'hidden'}
                custom={5}
                className="bg-[#181818] border border-[#212121] rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#FF0000]" /> Thumbnail Analysis
                </h2>
                {thumbnailData ? (
                  <>
                    <p className="text-2xl font-bold text-white mb-2">Thumbnail Score: {thumbnailData.score}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="text-[#AAA]">Face presence: <span className="text-white">{thumbnailData.facePresence}</span></div>
                      <div className="text-[#AAA]">Emotion intensity: <span className="text-white">{thumbnailData.emotionIntensity}</span></div>
                      <div className="text-[#AAA]">Color contrast: <span className="text-white">{thumbnailData.colorContrast}</span></div>
                      <div className="text-[#AAA]">Text readability: <span className="text-white">{thumbnailData.textReadability}</span></div>
                    </div>
                    {thumbnailData.suggestions?.length > 0 && (
                      <ul className="text-sm text-[#AAA] list-disc list-inside space-y-1">
                        {thumbnailData.suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
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
