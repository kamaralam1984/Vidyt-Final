'use client';

import { Suspense, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import {
  Zap, TrendingUp, Hash, FileText, Image as ImageIcon, Target,
  Users, Cpu, Loader2, AlertCircle, Copy, Check, ChevronDown,
  ChevronUp, BarChart3, Lightbulb, X, Play, Sparkles,
} from 'lucide-react';

type Platform = 'youtube' | 'shorts' | 'instagram' | 'tiktok' | 'facebook';
type Language = 'hindi' | 'english' | 'hinglish';
type Region = 'india' | 'global';

interface TrendingTopic {
  title: string; category: string; platform: string;
  trend_score: string; freshness_hours: string; competition: string; reason: string;
}
interface ThumbnailSuggestion { text: string; emotion: string; color_style: string; composition: string; }
interface Scripts { short_script: string; long_script: string; }
interface BestPostingSlot { day: string; time: string; estimated_reach: string; }
interface CompetitorInsight { what_is_working: string; content_pattern: string; opportunity_gap: string; }
interface ApiStatus { primary: string; secondary: string; fallback_mode: string; }

interface LearningInsights {
  top_performing_pattern: string;
  recommended_strategy: string;
  confidence_score: string;
  personalized: boolean;
  data_points_used: number;
  top_hook_styles: string[];
  top_keywords: string[];
  learning_notes: string[];
}

interface UltraResult {
  session_id: string;
  trending_topics: TrendingTopic[];
  viral_hooks: string[];
  optimized_titles: string[];
  ai_descriptions: string[];
  thumbnail_suggestions: ThumbnailSuggestion[];
  scripts: Scripts;
  viral_keywords: string[];
  hashtags: string[];
  best_posting_time: { platform: string; time_slots: BestPostingSlot[] };
  competitor_insight: CompetitorInsight;
  api_status: ApiStatus;
  seo_score_estimate: string;
  viral_probability: string;
  learning_insights: LearningInsights;
  meta?: { topic: string; platform: string; region: string; language: string; generated_at: string };
}

function CopyButton({ text, onCopy }: { text: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch { }
  };
  return (
    <button onClick={copy} className="p-1.5 text-[#666] hover:text-white transition rounded">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CompBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    High: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[level] ?? map.Medium}`}>{level}</span>;
}

function ApiStatusBadge({ status, label }: { status: string; label: string }) {
  const ok = status === 'success' || status === 'used';
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#212121] border-[#333] text-[#888]'}`}>
      <span className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-[#555]'}`} />
      {label}: {status}
    </div>
  );
}

function Panel({ title, icon: Icon, iconColor = 'text-[#FF0000]', children, defaultOpen = true }: {
  title: string; icon: React.ElementType; iconColor?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#181818] border border-[#212121] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 hover:bg-[#1e1e1e] transition">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <h2 className="text-white font-semibold">{title}</h2>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#666]" /> : <ChevronDown className="w-4 h-4 text-[#666]" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UltraEngineContent() {
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [language, setLanguage] = useState<Language>('hindi');
  const [region, setRegion] = useState<Region>('india');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UltraResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptTab, setScriptTab] = useState<'short' | 'long'>('short');
  const resultRef = useRef<HTMLDivElement>(null);

  // Fire-and-forget tracking call
  const recordTrack = (type: string, content: string, index = 0, hookStyle?: string) => {
    if (!result?.session_id) return;
    axios.post('/api/learn/track', {
      sessionId: result.session_id,
      topic,
      niche,
      platform,
      language,
      region,
      interactionType: type,
      content: content.slice(0, 300),
      contentIndex: index,
      hookStyle,
    }, { headers: getAuthHeaders() }).catch(() => {});
  };

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await axios.post('/api/viral/ultra-intelligence', {
        topic: topic.trim(),
        niche: niche.trim() || topic.trim(),
        platform,
        language,
        region,
      }, { headers: getAuthHeaders() });
      setResult(res.data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hookStyles: Record<number, string> = {
    0: 'Curiosity', 1: 'Shock', 2: 'Urgency', 3: 'Story', 4: 'FOMO',
    5: 'Controversy', 6: 'Emotional', 7: 'Reverse', 8: 'Numbers', 9: 'Exclusive',
  };
  const hookColors: Record<number, string> = {
    0: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    1: 'text-red-400 bg-red-500/10 border-red-500/30',
    2: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    3: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    4: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    5: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    6: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    7: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    8: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    9: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  };

  const postingReachColors: Record<string, string> = {
    Low: 'text-red-400', Medium: 'text-amber-400', High: 'text-emerald-400', 'Very High': 'text-emerald-300', Peak: 'text-white font-bold',
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF0000] to-[#FF6B00] flex items-center justify-center shadow-lg shadow-[#FF0000]/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Ultra AI Engine</h1>
                <p className="text-xs text-[#AAAAAA]">Multi-source viral content intelligence — OpenAI → Gemini → AI prediction fallback</p>
              </div>
            </div>
          </motion.div>

          {/* Input Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#FF0000]" /> Configure Content Strategy
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div className="lg:col-span-2">
                <label className="block text-xs text-[#AAAAAA] mb-1">Topic / Keyword *</label>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generate()}
                  placeholder="e.g. Iran war news, viral tips, cricket 2026..."
                  className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#555] focus:ring-2 focus:ring-[#FF0000] focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#AAAAAA] mb-1">Niche (optional)</label>
                <input
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  placeholder="news, gaming, education..."
                  className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#555] focus:ring-2 focus:ring-[#FF0000] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#AAAAAA] mb-1">Platform</label>
                <select value={platform} onChange={e => setPlatform(e.target.value as Platform)} className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#FF0000]">
                  <option value="youtube">YouTube</option>
                  <option value="shorts">YouTube Shorts</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#AAAAAA] mb-1">Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value as Language)} className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white text-sm focus:ring-2 focus:ring-[#FF0000]">
                  <option value="hindi">Hindi</option>
                  <option value="hinglish">Hinglish</option>
                  <option value="english">English</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {(['india', 'global'] as Region[]).map(r => (
                  <button key={r} onClick={() => setRegion(r)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize ${region === r ? 'bg-[#FF0000] text-white' : 'bg-[#212121] text-[#AAA] hover:text-white'}`}>
                    {r === 'india' ? '🇮🇳 India' : '🌐 Global'}
                  </button>
                ))}
              </div>
              <button
                onClick={generate}
                disabled={loading || !topic.trim()}
                className="ml-auto flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-[#FF0000] to-[#FF4500] hover:from-[#CC0000] hover:to-[#CC3400] disabled:opacity-50 text-white rounded-xl font-bold transition shadow-lg shadow-[#FF0000]/25 group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:scale-110 transition" />}
                {loading ? 'Generating...' : 'Generate Strategy'}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
          </motion.div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-16">
              <div className="inline-flex items-center gap-4 bg-[#181818] border border-[#212121] rounded-2xl px-10 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
                <div className="text-left">
                  <p className="text-white font-semibold">Ultra AI Engine running...</p>
                  <p className="text-[#888] text-sm mt-1">Combining Google Trends + AI generation + viral prediction</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div ref={resultRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Summary bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'SEO Score', value: result.seo_score_estimate, icon: BarChart3, color: 'text-emerald-400' },
                    { label: 'Viral Probability', value: result.viral_probability, icon: TrendingUp, color: 'text-amber-400' },
                    { label: 'Keywords', value: `${result.viral_keywords.length}+`, icon: Hash, color: 'text-blue-400' },
                    { label: 'Hooks Generated', value: String(result.viral_hooks.length), icon: Zap, color: 'text-[#FF0000]' },
                  ].map((stat) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#181818] border border-[#212121] rounded-xl p-4 flex items-center gap-3">
                      <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      <div>
                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-[#888]">{stat.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* API Status */}
                <div className="flex flex-wrap gap-2">
                  <ApiStatusBadge status={result.api_status.primary} label="OpenAI" />
                  <ApiStatusBadge status={result.api_status.secondary} label="Gemini" />
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${result.api_status.fallback_mode === 'no' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                    <Cpu className="w-3.5 h-3.5" />
                    Fallback AI: {result.api_status.fallback_mode === 'yes' ? 'Active' : 'Not needed'}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {/* Panel 1: Trending Topics */}
                  <Panel title="Trend Radar" icon={TrendingUp} iconColor="text-red-400">
                    <div className="space-y-2">
                      {result.trending_topics.map((t, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-[#0F0F0F] rounded-lg border border-[#222]">
                          <span className="text-xs font-bold text-[#FF0000] mt-0.5 w-5">#{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white text-sm font-medium truncate">{t.title}</span>
                              <CompBadge level={t.competition} />
                              <span className="text-xs text-[#666]">{t.freshness_hours}h ago</span>
                            </div>
                            <p className="text-xs text-[#888] mt-0.5">{t.reason}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-sm font-bold ${parseInt(t.trend_score) >= 80 ? 'text-emerald-400' : parseInt(t.trend_score) >= 60 ? 'text-amber-400' : 'text-[#AAA]'}`}>{t.trend_score}</p>
                            <p className="text-[10px] text-[#666]">Score</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  {/* Panel 2: Viral Hooks */}
                  <Panel title="Viral Hook Generator (Multi-Style)" icon={Zap} iconColor="text-amber-400">
                    <div className="space-y-2">
                      {result.viral_hooks.map((hook, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-[#0F0F0F] rounded-lg border border-[#222] group">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${hookColors[i % 10]}`}>{hookStyles[i % 10]}</span>
                          <p className="text-sm text-[#DDD] flex-1">{hook}</p>
                          <CopyButton text={hook} onCopy={() => recordTrack('hook_copy', hook, i, hookStyles[i % 10])} />
                        </div>
                      ))}
                    </div>
                  </Panel>

                  {/* Panel 3: Optimized Titles */}
                  <Panel title="CTR-Optimized Titles" icon={Target} iconColor="text-emerald-400">
                    <div className="space-y-2">
                      {result.optimized_titles.map((title, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-[#0F0F0F] rounded-lg border border-[#222]">
                          <span className="text-xs font-bold text-[#FF0000] w-5">T{i + 1}</span>
                          <p className="text-sm text-white flex-1">{title}</p>
                          <CopyButton text={title} onCopy={() => recordTrack('title_copy', title, i)} />
                        </div>
                      ))}
                      {result.ai_descriptions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#222]">
                          <p className="text-xs text-[#888] font-semibold mb-2">AI DESCRIPTIONS</p>
                          {result.ai_descriptions.map((desc, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 bg-[#0F0F0F] rounded-lg border border-[#222] mb-2">
                              <p className="text-xs text-[#CCC] flex-1">{desc}</p>
                              <CopyButton text={desc} onCopy={() => recordTrack('desc_copy', desc, i)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Panel>

                  {/* Panel 4: Thumbnail Intelligence */}
                  <Panel title="Thumbnail Intelligence Engine" icon={ImageIcon} iconColor="text-purple-400">
                    <div className="space-y-3">
                      {result.thumbnail_suggestions.map((thumb, i) => (
                        <div key={i} className="p-4 bg-[#0F0F0F] rounded-xl border border-[#222]">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-white bg-[#FF0000] px-2 py-0.5 rounded">VARIANT {i + 1}</span>
                            <span className="text-xs font-medium text-purple-400 border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 rounded">{thumb.emotion}</span>
                          </div>
                          <p className="text-white font-bold text-lg mb-2">"{thumb.text}"</p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-[#888]">
                            <div><span className="text-[#666]">COLOR:</span> {thumb.color_style}</div>
                          </div>
                          <p className="text-xs text-[#AAA] mt-2 p-2 bg-[#1a1a1a] rounded-lg">{thumb.composition}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  {/* Panel 5: Script Writer */}
                  <Panel title="Script Writer Engine" icon={FileText} iconColor="text-blue-400">
                    <div className="flex gap-2 p-1 bg-[#212121] rounded-lg mb-4">
                      {(['short', 'long'] as const).map(tab => (
                        <button key={tab} onClick={() => setScriptTab(tab)} className={`flex-1 py-2 rounded-md text-sm font-medium transition flex items-center justify-center gap-2 ${scriptTab === tab ? 'bg-[#FF0000] text-white' : 'text-[#AAA] hover:text-white'}`}>
                          {tab === 'short' ? <><Play className="w-3.5 h-3.5" /> Shorts (60s)</> : <><FileText className="w-3.5 h-3.5" /> Long (8-10min)</>}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <pre className="text-sm text-[#CCC] whitespace-pre-wrap bg-[#0F0F0F] rounded-xl p-4 border border-[#222] max-h-96 overflow-y-auto leading-relaxed">
                        {scriptTab === 'short' ? result.scripts.short_script : result.scripts.long_script}
                      </pre>
                      <div className="absolute top-3 right-3">
                        <CopyButton text={scriptTab === 'short' ? result.scripts.short_script : result.scripts.long_script} />
                      </div>
                    </div>
                  </Panel>

                  {/* Panel 6: Competitor Insights */}
                  <Panel title="Competitor Intelligence" icon={Users} iconColor="text-pink-400">
                    <div className="space-y-3">
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                        <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> WHAT'S WORKING</p>
                        <p className="text-sm text-[#CCC]">{result.competitor_insight.what_is_working}</p>
                      </div>
                      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                        <p className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" /> CONTENT PATTERN</p>
                        <p className="text-sm text-[#CCC]">{result.competitor_insight.content_pattern}</p>
                      </div>
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-2"><Lightbulb className="w-3.5 h-3.5" /> OPPORTUNITY GAP</p>
                        <p className="text-sm text-[#CCC]">{result.competitor_insight.opportunity_gap}</p>
                      </div>
                    </div>
                  </Panel>

                  {/* Panel 7: Keyword Intelligence */}
                  <Panel title={`Keyword Intelligence (${result.viral_keywords.length} keywords)`} icon={Hash} iconColor="text-indigo-400">
                    <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
                      {result.viral_keywords.map((kw, i) => (
                        <button
                          key={i}
                          onClick={() => { navigator.clipboard?.writeText(kw); recordTrack('keyword_copy', kw, i); }}
                          className={`px-2.5 py-1.5 text-xs rounded-lg border transition hover:opacity-80 ${
                            kw.startsWith('#') ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' :
                            i < 10 ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                            i < 25 ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                            'bg-[#212121] border-[#333] text-[#AAA]'
                          }`}
                          title="Click to copy"
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-3 pt-3 border-t border-[#222] text-[10px]">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/30" /> High Volume</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/30" /> Medium</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500/30 border border-purple-500/30" /> Hashtags</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#212121] border border-[#333]" /> Long-tail</span>
                    </div>
                  </Panel>

                  {/* Panel 8: Best Posting Times */}
                  <Panel title="Best Posting Times" icon={BarChart3} iconColor="text-cyan-400">
                    <div className="space-y-2">
                      {result.best_posting_time.time_slots?.map((slot, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[#0F0F0F] rounded-lg border border-[#222]">
                          <div>
                            <p className="text-sm text-white font-medium">{slot.day}</p>
                            <p className="text-xs text-[#888]">{slot.time}</p>
                          </div>
                          <span className={`text-sm font-bold ${postingReachColors[slot.estimated_reach] || 'text-[#AAA]'}`}>
                            {slot.estimated_reach}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>

                {/* Learning Insights Panel */}
                {result.learning_insights && (
                  <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-indigo-500/30 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-white font-semibold">Adaptive Learning Engine</h2>
                        <p className="text-xs text-indigo-400">
                          {result.learning_insights.personalized
                            ? `🧠 Personalized — ${result.learning_insights.data_points_used} interactions analyzed`
                            : '📊 Global viral patterns (interact more to personalize)'}
                        </p>
                      </div>
                      <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full border ${
                        result.learning_insights.personalized
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                          : 'bg-[#212121] border-[#333] text-[#888]'
                      }`}>
                        Confidence: {result.learning_insights.confidence_score}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                        <p className="text-xs font-semibold text-indigo-400 mb-2">🏆 TOP PERFORMING PATTERN</p>
                        <p className="text-sm text-white font-medium">{result.learning_insights.top_performing_pattern}</p>
                      </div>
                      <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                        <p className="text-xs font-semibold text-violet-400 mb-2">🎯 RECOMMENDED STRATEGY</p>
                        <p className="text-sm text-[#CCC]">{result.learning_insights.recommended_strategy}</p>
                      </div>
                    </div>
                    {result.learning_insights.top_hook_styles?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs text-[#888] self-center">Your top hooks:</span>
                        {result.learning_insights.top_hook_styles.map((style, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">{style}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 space-y-1.5">
                      {result.learning_insights.learning_notes?.map((note, i) => (
                        <p key={i} className="text-xs text-[#AAA]">{note}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                <Panel title={`Hashtags (${result.hashtags.length})`} icon={Hash} iconColor="text-emerald-400" defaultOpen={false}>
                  <div className="flex flex-wrap gap-2">
                    {result.hashtags.map((tag, i) => (
                      <button key={i} onClick={() => { navigator.clipboard?.writeText(tag); recordTrack('hashtag_copy', tag, i); }} className="px-3 py-1.5 rounded-lg text-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition" title="Click to copy">
                        {tag}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => navigator.clipboard?.writeText(result.hashtags.join(' '))}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
                  >
                    <Copy className="w-4 h-4" /> Copy All Hashtags
                  </button>
                </Panel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default function UltraIntelligencePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#FF0000]" /></div>}>
      <UltraEngineContent />
    </Suspense>
  );
}
