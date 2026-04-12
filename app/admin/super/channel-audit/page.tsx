'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Target, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  SearchCode, 
  Loader2, 
  Send, 
  ChevronRight, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Youtube,
  ArrowUpRight,
  TrendingDown,
  MessageSquare,
  BarChart2,
  Play
} from 'lucide-react';
import axios from 'axios';
import { useUser } from '@/hooks/useUser';
import DashboardLayout from '@/components/DashboardLayout';

const glassmorphism = "bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-2xl";
const gradientText = "bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent";

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function SuperChannelAudit() {
  const { user } = useUser();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiChat, setAiChat] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChat]);

  const startAudit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setAuditData(null);
    setAiChat([]);
    setStatusMessage('INITIALIZING QUANTUM ANALYSIS...');

    try {
      setStatusMessage('RESOLVING CHANNEL ARCHITECTURE...');
      const response = await axios.post('/api/admin/super/audit', {
        action: 'recommend',
        url: url.trim()
      });

      setStatusMessage('ENRICHING DATA WITH AI...');
      setAuditData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to perform audit. Check API logs.');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const askAi = async () => {
    if (!aiQuestion.trim() || aiLoading) return;
    const q = aiQuestion;
    setAiQuestion('');
    setAiChat(prev => [...prev, { role: 'user', content: q }]);
    setAiLoading(true);

    try {
      const res = await axios.post('/api/admin/super/audit', {
        action: 'ask',
        question: q,
        context: auditData?.analytics
      });
      setAiChat(prev => [...prev, { role: 'ai', content: res.data.answer }]);
    } catch (err) {
      setAiChat(prev => [...prev, { role: 'error', content: 'AI logic failed. Check API config.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#020202] text-white p-6 md:p-12 overflow-x-hidden selection:bg-blue-500/30">
        {/* Animated Background VFX */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
          <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-indigo-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8"
          >
            <div className="text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black tracking-[0.2em] uppercase">
                  Super Admin Exclusive
                </span>
                <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black tracking-[0.2em] uppercase">
                  <Sparkles className="w-3.5 h-3.5" /> Premium Engine v2.0
                </span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight leading-[0.9]">
                Channel <br />
                <span className={gradientText}>Intelligence</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                Unlock deep-level insights with our advanced AI audit engine. Real-time data synthesis, neural growth mapping, and actionable strategic intelligence.
              </p>
            </div>
          </motion.div>

          {/* Input Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${glassmorphism} p-2 mb-16 flex flex-col md:flex-row items-stretch gap-4 transition-all duration-700 hover:border-white/20 hover:shadow-blue-500/5`}
          >
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
              <Youtube className="w-8 h-8 text-red-500/80" />
              <input 
                type="text" 
                placeholder="Enter YouTube Channel URL or @Handle..."
                className="flex-1 bg-transparent border-none outline-none text-2xl py-4 placeholder-gray-700 focus:ring-0 font-medium"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startAudit()}
              />
            </div>
            <button 
              onClick={startAudit}
              disabled={loading}
              className="bg-white text-black font-black text-lg py-5 px-10 rounded-xl flex items-center justify-center gap-3 hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-50 group overflow-hidden relative"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <span>ANALYZE ARCHITECTURE</span>
                  <ArrowUpRight className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="mb-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-4 shadow-lg shadow-red-500/5"
            >
              <AlertCircle className="w-6 h-6 shrink-0" /> 
              <span className="font-bold">{error}</span>
            </motion.div>
          )}

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {auditData ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Channel Profile Sidebar */}
                <div className="lg:col-span-3 space-y-8">
                  <div className={`${glassmorphism} p-8 text-center overflow-hidden relative`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                    <img 
                      src={auditData.analytics.channelInfo.thumbnails?.high?.url || auditData.analytics.channelInfo.thumbnails?.default?.url} 
                      alt="" 
                      className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-white/10 p-1"
                    />
                    <h2 className="text-2xl font-black mb-2 line-clamp-1">{auditData.analytics.channelInfo.title}</h2>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-6">@{auditData.analytics.channelInfo.customUrl}</p>
                    
                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Subscribers</span>
                        <span className="font-bold">{formatNumber(auditData.analytics.channelInfo.statistics.subscriberCount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Total Views</span>
                        <span className="font-bold">{formatNumber(auditData.analytics.channelInfo.statistics.viewCount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Video Content</span>
                        <span className="font-bold">{auditData.analytics.channelInfo.statistics.videoCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`${glassmorphism} p-8 space-y-6`}>
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Growth Pulse</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-lg font-black">{auditData.analytics.videoPerformance.growthVelocity} V/D</p>
                        <p className="text-xs text-gray-500 uppercase font-bold">Velocity</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-lg font-black">{auditData.analytics.videoPerformance.averageEngagementRate}%</p>
                        <p className="text-xs text-gray-500 uppercase font-bold">Avg Engagement</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-6 space-y-8">
                  {/* Hero Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Consistency', val: `${auditData.analytics.videoPerformance.consistencyScore}%`, icon: Target, color: 'text-blue-400' },
                      { label: 'Avg Views', val: formatNumber(auditData.analytics.videoPerformance.averageViews), icon: BarChart2, color: 'text-purple-400' },
                      { label: 'Recent Views', val: formatNumber(auditData.analytics.videoPerformance.totalRecentViews), icon: TrendingUp, color: 'text-emerald-400' },
                      { label: 'Recent Videos', val: auditData.analytics.recentVideos.length, icon: Play, color: 'text-rose-400' },
                    ].map((stat, i) => (
                      <div key={i} className={`${glassmorphism} p-4 text-center group transition-all`}>
                        <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color} opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all`} />
                        <p className="text-xl font-black">{stat.val}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter font-bold">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* AI Recommendations */}
                  <div className={`${glassmorphism} p-8 overflow-hidden relative`}>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-black flex items-center gap-3">
                        <SearchCode className="w-7 h-7 text-blue-400" />
                        Growth Levers
                      </h2>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 py-1 px-3 rounded-full">AI Generated</span>
                    </div>
                    
                    <div className="space-y-4">
                      {auditData.recommendations.map((rec: any, i: number) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="flex gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-black text-lg mb-1">{rec.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{rec.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Video Performance */}
                  <div className={`${glassmorphism} p-8`}>
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                      <BarChart3 className="w-7 h-7 text-purple-400" />
                      Video Velocity
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {auditData.analytics.recentVideos.slice(0, 4).map((video: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                          <img src={video.thumbnail} className="w-20 h-14 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold truncate mb-1">{video.title}</h4>
                            <div className="flex items-center gap-3 text-[10px] text-gray-500">
                              <span className="flex items-center gap-1"><Play className="w-2.5 h-2.5" /> {formatNumber(video.views)}</span>
                              <span className="flex items-center gap-1 text-emerald-400 font-black"><Zap className="w-2.5 h-2.5" /> {video.engagementRate}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Chat Area */}
                <div className="lg:col-span-3">
                  <div className={`${glassmorphism} flex flex-col h-[700px] border-l border-white/10 sticky top-12`}>
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                          <div className="absolute inset-0 bg-emerald-500/50 rounded-full animate-ping" />
                        </div>
                        <span className="font-black tracking-widest text-sm uppercase">Strategy Advisor</span>
                      </div>
                      <Sparkles className="w-5 h-5 text-purple-400 animate-spin-slow" />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                      {aiChat.length === 0 && (
                        <div className="text-center text-gray-600 mt-20 opacity-50">
                          <MessageSquare className="w-16 h-16 mx-auto mb-6" />
                          <p className="text-sm font-bold uppercase tracking-widest">Awaiting Command</p>
                          <p className="text-[10px] mt-2">Ask about content strategy, SEO, or thumbnail optimization.</p>
                        </div>
                      )}
                      {aiChat.map((msg, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 ml-4' 
                              : msg.role === 'error' 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                                : 'bg-white/5 border border-white/10 text-gray-300 mr-4'
                          }`}
                        >
                          {msg.content}
                        </motion.div>
                      ))}
                      {aiLoading && (
                        <div className="flex gap-2 p-4">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-.3s]" />
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-.5s]" />
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 bg-black/40 backdrop-blur-3xl border-t border-white/5">
                      <div className="relative group">
                        <input 
                          type="text" 
                          placeholder="Query strategic AI..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-700 text-sm font-bold"
                          value={aiQuestion}
                          onChange={(e) => setAiQuestion(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && askAi()}
                        />
                        <button 
                          onClick={askAi}
                          className="absolute right-2 top-2 h-10 w-10 bg-white text-black rounded-xl flex items-center justify-center hover:bg-white/90 transition-all shadow-xl group-active:scale-90"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div key="state" className="py-24 text-center">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center space-y-12"
                    >
                      <div className="relative">
                        <div className="w-48 h-48 border-[1px] border-white/5 rounded-full" />
                        <div className="w-48 h-48 border-t-2 border-blue-500 rounded-full absolute inset-0 animate-spin" />
                        <div className="w-40 h-40 border-r-2 border-purple-500 rounded-full absolute inset-4 animate-spin-reverse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Cpu className="w-12 h-12 text-blue-500/80 animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-2xl font-black tracking-[0.3em] text-blue-400 uppercase animate-pulse">{statusMessage}</p>
                        <div className="w-64 h-1 bg-white/5 rounded-full mx-auto overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            animate={{ x: [-256, 256] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full" />
                        <div className="relative p-12 rounded-full border border-white/5 bg-white/5 backdrop-blur-3xl">
                          <Search className="w-24 h-24 text-blue-500/40" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h2 className="text-4xl font-black tracking-tight">System Ready for Deployment</h2>
                        <p className="text-gray-500 text-lg max-w-sm mx-auto font-medium">
                          Input a channel handle to initiate deep-level strategic diagnostics across the YouTube network.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 3s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </DashboardLayout>
  );
}

// Dummy Cpu icon if lucide-react doesn't have it (it does usually)
function Cpu(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M15 2v2" />
      <path d="M15 20v2" />
      <path d="M2 15h2" />
      <path d="M2 9h2" />
      <path d="M20 15h2" />
      <path d="M20 9h2" />
      <path d="M9 2v2" />
      <path d="M9 20v2" />
    </svg>
  );
}
