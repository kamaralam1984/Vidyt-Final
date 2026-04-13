'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Copy, Loader2, Sparkles, Check, RefreshCw, Zap, Hash, TrendingUp, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { useTranslations } from '@/context/translations';
import { autoCreateSeoPage } from '@/lib/autoCreateSeoPage';

const PLATFORMS = ['YouTube', 'Shorts', 'Reels', 'TikTok'];
const DURATIONS = ['30 sec', '1 min', '3 min', '5 min', '10 min'];
const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Spanish', 'Arabic', 'Indonesian', 'Urdu', 'French', 'Other'];
const TONES = ['Professional', 'Funny/Comedy', 'Educational', 'Dramatic', 'Motivational', 'Casual/Vlog', 'Storytelling', 'News/Report'];

function ScriptGeneratorContent() {
  const { t } = useTranslations();
  const searchParams = useSearchParams();
  const mode = (searchParams?.get('mode') || '').toLowerCase();
  const isIdeasMode = mode === 'ideas';
  const isCoachMode = mode === 'coach';

  const [topic, setTopic] = useState(isIdeasMode ? '' : isCoachMode ? '' : '');
  const [platform, setPlatform] = useState('YouTube');
  const [duration, setDuration] = useState('5 min');
  const [language, setLanguage] = useState('English');
  const [tone, setTone] = useState('Professional');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ hooks: string[]; script: string; titles: string[]; hashtags: string[]; cta: string } | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<{ title: string; score: number; day: string; hour: number; timeLabel: string }[]>([]);
  const [ideasMeta, setIdeasMeta] = useState<{ usedYouTubeTrending?: boolean; usedAI?: boolean } | null>(null);

  const copyText = (text: string, label: string) => {
    try { navigator.clipboard.writeText(text); } catch {}
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    autoCreateSeoPage(topic);
    if (isIdeasMode) { setIdeas([]); setIdeasMeta(null); }
    try {
      if (isIdeasMode) {
        const res = await axios.post('/api/ai/daily-ideas', { niche: topic.trim() }, { headers: getAuthHeaders() });
        setIdeas(res.data?.ideas || []);
        setIdeasMeta({ usedYouTubeTrending: res.data?.usedYouTubeTrending, usedAI: res.data?.usedAI });
      } else {
        const res = await axios.post('/api/ai/script-generator?mode=' + mode, { topic: topic.trim(), platform, duration, language, tone }, { headers: getAuthHeaders() });
        setResult(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const wordCount = result?.script ? result.script.split(/\s+/).filter(Boolean).length : 0;

  const copyAll = () => {
    if (!result) return;
    const all = `HOOKS:\n${result.hooks.join('\n')}\n\nSCRIPT:\n${result.script}\n\nTITLES:\n${result.titles.join('\n')}\n\nHASHTAGS:\n${result.hashtags.join(' ')}\n\nCTA:\n${result.cta}`;
    copyText(all, 'all');
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Animated Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000]/10 via-orange-500/10 to-[#FF0000]/10 animate-pulse" />
          <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-[#FF0000]/20 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF0000] to-orange-600 flex items-center justify-center shadow-lg shadow-[#FF0000]/30">
                {isCoachMode ? <MessageCircle className="w-6 h-6 text-white" /> : isIdeasMode ? <Zap className="w-6 h-6 text-white" /> : <FileText className="w-6 h-6 text-white" />}
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#FF4444]">
                  {isCoachMode ? 'AI Coach' : isIdeasMode ? 'Daily Video Ideas' : t('ai.script.title')}
                </h1>
                <p className="text-sm text-[#888] mt-0.5">{t('ai.script.subtitle')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-6">
          <div className="space-y-4">
            {/* Topic */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[#AAA]">
                  {isIdeasMode ? 'Channel Niche / Topic' : isCoachMode ? 'Your Question' : 'Video Topic'}
                </label>
                <span className="text-xs text-[#666] font-mono">{topic.length} chars</span>
              </div>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} required
                placeholder={isIdeasMode ? 'e.g. YouTube growth tips, gaming, finance' : isCoachMode ? 'e.g. How to grow my faceless YouTube channel' : 'e.g. How to grow on YouTube in 2025'}
                className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-xl text-white placeholder-[#555] focus:ring-2 focus:ring-[#FF0000]" />
            </div>

            {/* Options Row */}
            {!isIdeasMode && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-[#888] mb-1 block">Platform</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#111] border border-[#333] rounded-xl text-white text-sm">
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#888] mb-1 block">Duration</label>
                  <select value={duration} onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#111] border border-[#333] rounded-xl text-white text-sm">
                    {DURATIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#888] mb-1 block">Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#111] border border-[#333] rounded-xl text-white text-sm">
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#888] mb-1 block">Tone / Style</label>
                  <select value={tone} onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#111] border border-[#333] rounded-xl text-white text-sm">
                    {TONES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button type="submit" disabled={loading || !topic.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF0000] to-orange-600 text-white rounded-xl font-black text-sm shadow-lg shadow-[#FF0000]/20 hover:from-[#E60000] hover:to-orange-700 disabled:opacity-50 transition">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Generating...' : isIdeasMode ? 'Get Today\'s Ideas' : isCoachMode ? 'Ask AI Coach' : 'Generate Script'}
              </button>
              {result && (
                <button type="button" onClick={() => handleSubmit()}
                  className="px-4 py-3 bg-[#222] border border-[#444] text-white rounded-xl font-bold text-sm hover:bg-[#333] transition flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Regenerate
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-[#FF0000] mb-3" />
            <p className="text-sm text-[#888]">{isIdeasMode ? 'Finding trending ideas...' : 'AI is writing your script...'}</p>
          </div>
        )}

        {/* IDEAS MODE RESULTS */}
        <AnimatePresence>
          {isIdeasMode && ideas.length > 0 && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Today's Video Ideas</h2>
                {ideasMeta?.usedYouTubeTrending && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">YouTube Trending + AI</span>}
              </div>
              {ideas.map((idea, i) => (
                <motion.button key={i} type="button" onClick={() => setTopic(idea.title)}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="w-full text-left bg-[#181818] border border-[#222] rounded-xl p-4 hover:border-[#FF0000]/50 transition group">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white group-hover:text-[#FF4444] transition">{idea.title}</p>
                      <p className="text-xs text-[#888] mt-1">
                        Best time: <span className="text-emerald-400">{idea.day} {idea.timeLabel}</span>
                      </p>
                    </div>
                    <div className="text-center">
                      <span className={`text-xl font-black ${idea.score >= 80 ? 'text-emerald-400' : idea.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{idea.score}%</span>
                      <p className="text-[9px] text-[#666]">Viral</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCRIPT RESULTS */}
        <AnimatePresence>
          {!isIdeasMode && result && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Stats Bar */}
              <div className="bg-gradient-to-r from-[#FF0000]/5 to-orange-500/5 border border-[#FF0000]/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#FF0000]" /> Script Generated</h2>
                  <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#333] rounded-lg text-xs text-[#CCC]">
                    {copiedItem === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedItem === 'all' ? 'Copied All!' : 'Copy Everything'}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                  <div className="bg-[#111] rounded-lg p-2"><p className="text-[10px] text-[#888]">Platform</p><p className="text-sm font-bold text-white">{platform}</p></div>
                  <div className="bg-[#111] rounded-lg p-2"><p className="text-[10px] text-[#888]">Duration</p><p className="text-sm font-bold text-white">{duration}</p></div>
                  <div className="bg-[#111] rounded-lg p-2"><p className="text-[10px] text-[#888]">Words</p><p className="text-sm font-bold text-emerald-400">{wordCount}</p></div>
                  <div className="bg-[#111] rounded-lg p-2"><p className="text-[10px] text-[#888]">Tone</p><p className="text-sm font-bold text-amber-400">{tone}</p></div>
                  <div className="bg-[#111] rounded-lg p-2"><p className="text-[10px] text-[#888]">Language</p><p className="text-sm font-bold text-purple-400">{language}</p></div>
                </div>
              </div>

              {/* Hooks */}
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> Viral Hooks</h2>
                <div className="space-y-2">
                  {result.hooks.map((h, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 bg-[#111] border border-[#222] rounded-xl hover:border-amber-500/30 transition group">
                      <span className="text-amber-400 text-xs font-black w-6">{i + 1}</span>
                      <span className="text-sm text-white flex-1">{h}</span>
                      <button onClick={() => copyText(h, `hook-${i}`)} className="flex-shrink-0">
                        {copiedItem === `hook-${i}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#666] hover:text-white" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Script */}
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-[#FF0000]" /> Full Script</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#888]">{wordCount} words</span>
                    <button onClick={() => copyText(result.script, 'script')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222] hover:bg-[#333] rounded-lg text-xs text-[#CCC]">
                      {copiedItem === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedItem === 'script' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-[#CCC] bg-[#111] p-5 rounded-xl overflow-x-auto leading-relaxed border border-[#222]">{result.script}</pre>
              </div>

              {/* Titles */}
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> SEO Titles</h2>
                <div className="space-y-2">
                  {result.titles.map((title, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 bg-[#111] border border-[#222] rounded-xl hover:border-emerald-500/30 transition">
                      <span className={`text-xs font-black w-6 ${i === 0 ? 'text-emerald-400' : 'text-[#666]'}`}>{i + 1}</span>
                      <span className="text-sm text-white flex-1">{title}</span>
                      <button onClick={() => copyText(title, `title-${i}`)} className="flex-shrink-0">
                        {copiedItem === `title-${i}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#666] hover:text-white" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hashtags + CTA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><Hash className="w-5 h-5 text-purple-400" /> Hashtags</h2>
                    <button onClick={() => copyText(result.hashtags.join(' '), 'hashtags')} className="text-xs text-purple-400 hover:text-purple-300">
                      {copiedItem === 'hashtags' ? '✓ Copied!' : 'Copy All'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.hashtags.map((h, i) => (
                      <span key={i} className="px-2.5 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-xs">{h}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-blue-400" /> Call to Action</h2>
                  <div className="flex items-start justify-between gap-3 p-4 bg-[#111] border border-[#222] rounded-xl">
                    <p className="text-sm text-[#CCC]">{result.cta}</p>
                    <button onClick={() => copyText(result.cta, 'cta')} className="flex-shrink-0">
                      {copiedItem === 'cta' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#666] hover:text-white" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

export default function ScriptGeneratorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">{/* Loading */}</div>}>
      <ScriptGeneratorContent />
    </Suspense>
  );
}
