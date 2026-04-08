'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
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
import { CheckCircle2, X, Copy, Zap, TrendingUp, Star, Sparkles } from 'lucide-react';

interface AnalysisData {
  viralProbability: number;
  hookScore: number;
  thumbnailScore: number;
  titleScore: number;
  confidenceLevel: number;
  optimizedTitles?: string[];
  hashtags?: string[];
  trendingTopics?: Array<{ keyword: string; score: number }>;
  seoDescription?: string;
  postingTime?: { day: string; hour: number; confidence: number };
  bestPostingTime?: { day: string; hour: number; confidence: number };
}

// Floating particles
function Particles() {
  const particles = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.5 + 0.1,
    })), []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(255,${p.id % 2 === 0 ? '50' : '100'},${p.id % 3 === 0 ? '200' : '0'},${p.opacity}), transparent)`,
          }}
          animate={{
            y: [0, -80, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [p.opacity * 0.5, p.opacity, p.opacity * 0.3, p.opacity],
            scale: [1, 1.4, 0.8, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Gradient Orb background
function GradientOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <motion.div
        className="absolute -top-64 -left-64 w-[700px] h-[700px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0.02) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-64 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, rgba(139,92,246,0.02) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 0.9, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{ x: [0, 30, 0], y: [0, -50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

// Glowing stat chip
function StatChip({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className="relative flex items-center gap-3 px-4 py-3 rounded-xl border overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at center, ${color}15, transparent 70%)` }} />
      <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] text-[#666] uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const youtubeQuery = searchParams?.get('youtube');
  const [showYoutubeSuccess, setShowYoutubeSuccess] = useState(false);
  const [isYoutubeConnected, setIsYoutubeConnected] = useState(false);
  const [youtubeGoogleConnected, setYoutubeGoogleConnected] = useState(false);
  const [allowedSystems, setAllowedSystems] = useState<Record<string, boolean>>({});
  const [scanLine, setScanLine] = useState(0);

  // scan line animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine((v) => (v + 1) % 101);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/auth/me', { headers: getAuthHeaders() });
        if (res.data.user) {
          setIsYoutubeConnected(!!res.data.user.isYoutubeConnected);
          setYoutubeGoogleConnected(!!res.data.user.youtubeGoogleConnected);
        }
      } catch (_) { }
    };
    fetchUser();
  }, [youtubeQuery]);

  useEffect(() => {
    if (searchParams?.get('youtube') === 'connected') {
      setShowYoutubeSuccess(true);
      const timer = setTimeout(() => setShowYoutubeSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const res = await axios.get('/api/features/all', { headers: getAuthHeaders() });
        if (res.data.features) setAllowedSystems(res.data.features);
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
    <div className="flex-1 overflow-y-auto relative min-h-screen" style={{ background: '#080808' }}>
      <GradientOrbs />
      <Particles />

      <div className="relative z-10 p-6 pb-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* YouTube Connected Banner */}
          <AnimatePresence>
            {showYoutubeSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="relative overflow-hidden rounded-2xl border border-emerald-500/30 p-4 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))' }}
              >
                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.06), transparent)',
                    animation: 'shimmer 3s infinite',
                  }} />
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                  <div>
                    <p className="text-emerald-400 font-semibold">YouTube Connected!</p>
                    <p className="text-emerald-400/60 text-xs">Your channel is now linked and ready for analysis</p>
                  </div>
                </div>
                <button onClick={() => setShowYoutubeSuccess(false)} className="text-emerald-500/50 hover:text-emerald-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="relative rounded-3xl overflow-hidden border border-white/[0.06] p-8"
              style={{
                background: 'linear-gradient(135deg, rgba(20,20,20,0.9), rgba(10,10,10,0.95))',
                backdropFilter: 'blur(40px)',
              }}>
              {/* Red accent line top */}
              <div className="absolute top-0 left-0 right-0 h-[1px]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.8), rgba(220,38,38,0.4), transparent)' }} />

              {/* Scan line */}
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: `${scanLine}%`,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.15), transparent)',
                  transition: 'top 0.03s linear',
                }}
              />

              <div className="grid gap-6 lg:grid-cols-[1fr,auto]">
                <div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: 'auto' }}
                    className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 mb-4"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-red-500"
                    />
                    <span className="text-red-400 text-xs font-semibold tracking-wider uppercase">AI Powered Engine</span>
                  </motion.div>

                  <h1 className="text-4xl lg:text-5xl font-black text-white mb-3 leading-tight">
                    Welcome to{' '}
                    <span className="relative">
                      <span
                        className="bg-clip-text text-transparent"
                        style={{ backgroundImage: 'linear-gradient(135deg, #FF0000, #FF6B6B, #FF0000)' }}
                      >
                        Vid YT
                      </span>
                      <motion.span
                        className="absolute bottom-0 left-0 h-[2px] w-full"
                        style={{ background: 'linear-gradient(90deg, #FF0000, transparent)' }}
                        animate={{ scaleX: [0, 1, 0], originX: 0 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </span>
                  </h1>
                  <p className="text-[#777] text-base max-w-xl">
                    Analyze and optimize your videos for maximum viral potential using our AI-powered engine.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    <StatChip icon={Zap} label="AI Analysis" value="Real-time" color="#FF0000" />
                    <StatChip icon={TrendingUp} label="Viral Score" value="Precision" color="#8B5CF6" />
                    <StatChip icon={Star} label="Thumbnail" value="AI Vision" color="#F59E0B" />
                    <StatChip icon={Sparkles} label="SEO Engine" value="GPT-4" color="#10B981" />
                  </div>
                </div>

                {!analysis && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="hidden lg:block relative w-72 rounded-2xl border border-white/[0.06] p-5 overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)' }} />
                    <h2 className="text-xs font-bold text-[#888] uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-1 h-3 rounded-full bg-purple-500 inline-block" />
                      Recommended Flow
                    </h2>
                    <ol className="space-y-3">
                      {[
                        { step: '01', text: 'Upload a video to get your viral score, hook, title, and thumbnail scores.' },
                        { step: '02', text: 'Use YouTube SEO tab to choose search-based topics with keywords and titles.' },
                        { step: '03', text: 'Check Posting Time & Analytics pages to track and optimise performance.' },
                      ].map((item, i) => (
                        <motion.li
                          key={item.step}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="flex gap-3"
                        >
                          <span className="shrink-0 w-6 h-6 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-[10px] font-bold text-[#666]">
                            {item.step}
                          </span>
                          <p className="text-[11px] text-[#666] leading-relaxed">{item.text}</p>
                        </motion.li>
                      ))}
                    </ol>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Video Upload */}
          {allowedSystems['video_upload'] !== false && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.06]"
                style={{ background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(20px)' }}>
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.6), transparent)' }} />
                <VideoUpload
                  onAnalysisComplete={handleAnalysisComplete}
                  loading={loading}
                  setLoading={setLoading}
                  isYoutubeConnected={isYoutubeConnected}
                  youtubeGoogleConnected={youtubeGoogleConnected}
                  allowedSystems={allowedSystems}
                />
              </div>
            </motion.div>
          )}

          {/* Analysis Results */}
          <AnimatePresence>
            {analysis && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                variants={containerVariants}
                className="space-y-6"
              >
                {/* Analysis Result Header */}
                <motion.div
                  variants={itemVariants}
                  className="relative rounded-2xl border border-white/[0.06] p-5 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.06), rgba(139,92,246,0.04))' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{ background: 'linear-gradient(90deg, rgba(220,38,38,0.6), rgba(139,92,246,0.6), transparent)' }} />
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      className="w-10 h-10 rounded-full border border-red-500/30 flex items-center justify-center"
                      style={{ background: 'rgba(220,38,38,0.1)' }}
                    >
                      <Sparkles className="w-5 h-5 text-red-400" />
                    </motion.div>
                    <div>
                      <h2 className="text-white font-bold text-lg">Analysis Complete</h2>
                      <p className="text-[#666] text-xs">Your video has been analyzed by our AI engine</p>
                    </div>
                    <motion.div
                      className="ml-auto px-4 py-1.5 rounded-full text-xs font-bold"
                      style={{
                        background: 'linear-gradient(135deg, rgba(220,38,38,0.2), rgba(139,92,246,0.2))',
                        border: '1px solid rgba(220,38,38,0.3)',
                        color: '#FF6B6B',
                      }}
                      animate={{ boxShadow: ['0 0 0px rgba(220,38,38,0)', '0 0 20px rgba(220,38,38,0.3)', '0 0 0px rgba(220,38,38,0)'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Viral Score: {analysis.viralProbability}%
                    </motion.div>
                  </div>
                </motion.div>

                {/* Score cards */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {allowedSystems['viral_score'] !== false && (
                    <div className="lg:col-span-2 relative rounded-2xl border border-white/[0.06] overflow-hidden"
                      style={{ background: 'rgba(12,12,12,0.95)', backdropFilter: 'blur(20px)' }}>
                      <div className="absolute top-0 left-0 right-0 h-[1px]"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.5), transparent)' }} />
                      <ViralScoreMeter score={analysis.viralProbability} confidence={analysis.confidenceLevel} />
                    </div>
                  )}
                  {allowedSystems['score_cards'] !== false && (
                    <div className="space-y-4">
                      {[
                        { title: 'Hook Score', score: analysis.hookScore, color: 'blue' as const },
                        { title: 'Thumbnail Score', score: analysis.thumbnailScore, color: 'purple' as const },
                        { title: 'Title Score', score: analysis.titleScore, color: 'green' as const },
                      ].map((card, i) => (
                        <motion.div
                          key={card.title}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                          style={{ background: 'rgba(12,12,12,0.95)' }}
                        >
                          <div className="absolute top-0 left-0 right-0 h-[1px]"
                            style={{
                              background: card.color === 'blue' ?
                                'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' :
                                card.color === 'purple' ?
                                  'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)' :
                                  'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)'
                            }} />
                          <ScoreCard title={card.title} score={card.score} color={card.color} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Title Suggestions */}
                {analysis.optimizedTitles && allowedSystems['title_suggestions'] !== false && (
                  <motion.div variants={itemVariants}
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                    style={{ background: 'rgba(12,12,12,0.95)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)' }} />
                    <TitleSuggestions titles={analysis.optimizedTitles.slice(0, 5)} />
                  </motion.div>
                )}

                {/* SEO Description */}
                {analysis.seoDescription && (
                  <motion.div variants={itemVariants}
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden p-6"
                    style={{ background: 'rgba(12,12,12,0.95)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }} />
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-5 rounded-full bg-emerald-500 inline-block" />
                        SEO Description
                        <span className="text-xs text-emerald-500/70 font-normal ml-1">(CTR-focused)</span>
                      </h2>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => void navigator.clipboard.writeText(analysis.seoDescription || '')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-white hover:border-emerald-500/40 transition-all"
                        style={{ background: 'rgba(16,185,129,0.1)' }}
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </motion.button>
                    </div>
                    <p className="text-xs text-[#555] mb-3">Auto-generated after upload (max 200 words). Paste into YouTube or Shorts.</p>
                    <pre className="text-sm text-[#CCCCCC] whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      {analysis.seoDescription}
                    </pre>
                  </motion.div>
                )}

                {/* Hashtags */}
                {analysis.hashtags && allowedSystems['hashtag_recommendations'] !== false && (
                  <motion.div variants={itemVariants}
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                    style={{ background: 'rgba(12,12,12,0.95)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />
                    <HashtagRecommendations hashtags={analysis.hashtags} />
                  </motion.div>
                )}

                {/* Trending Topics */}
                {analysis.trendingTopics && allowedSystems['trending_topics'] !== false && (
                  <motion.div variants={itemVariants}
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                    style={{ background: 'rgba(12,12,12,0.95)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)' }} />
                    <TrendingTopics topics={analysis.trendingTopics} />
                  </motion.div>
                )}

                {/* Posting Time */}
                {analysis.bestPostingTime && allowedSystems['posting_time_heatmap'] !== false && (
                  <motion.div variants={itemVariants}
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                    style={{ background: 'rgba(12,12,12,0.95)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)' }} />
                    <PostingTimeHeatmap postingTime={analysis.bestPostingTime} />
                  </motion.div>
                )}

                {/* Engagement Graph */}
                {allowedSystems['engagement_graph'] !== false && (
                  <motion.div variants={itemVariants}
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                    style={{ background: 'rgba(12,12,12,0.95)' }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.5), transparent)' }} />
                    <EngagementGraph viralProbability={analysis.viralProbability} />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
