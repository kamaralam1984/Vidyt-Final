'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Zap, Copy, Loader2, Sparkles, Check, RefreshCw, Hash, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { useTranslations } from '@/context/translations';
import { autoCreateSeoPage } from '@/lib/autoCreateSeoPage';

const PLATFORMS = ['YouTube', 'Shorts', 'Reels', 'TikTok', 'Facebook', 'Instagram'];
const TONES = ['Shocking', 'Curiosity', 'Emotional', 'Funny', 'Controversial', 'Educational', 'Motivational', 'Fear/Urgency'];
const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Spanish', 'Arabic', 'Urdu', 'Indonesian'];

export default function HookGeneratorPage() {
  const { t } = useTranslations();
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('YouTube');
  const [tone, setTone] = useState('Shocking');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ hooks: { hook: string; psychologyType: string; whyItWorks: string }[] } | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    try {
      const res = await axios.post('/api/ai/hook-generator', { topic: topic.trim(), niche, platform, tone, language }, { headers: getAuthHeaders() });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate hooks. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!result) return;
    const all = result.hooks.map((h, i) => `${i + 1}. "${h.hook}" [${h.psychologyType}]`).join('\n');
    copyText(all, 'all');
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Animated Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 animate-pulse" />
          <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-red-400 to-amber-400">
                  {t('ai.hook.title')}
                </h1>
                <p className="text-sm text-[#888] mt-0.5">{t('ai.hook.subtitle')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-[#AAA]">Video Topic *</label>
                <span className="text-xs text-[#666] font-mono">{topic.length} chars</span>
              </div>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} required
                placeholder="e.g. Iran War, Productivity Tips, Weight Loss Journey"
                className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-xl text-white placeholder-[#555] focus:ring-2 focus:ring-amber-500" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-[#888] mb-1 block">Niche</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. News, Gaming"
                  className="w-full px-3 py-2.5 bg-[#111] border border-[#333] rounded-xl text-white text-sm placeholder-[#555]" />
              </div>
              <div>
                <label className="text-xs text-[#888] mb-1 block">Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#111] border border-[#333] rounded-xl text-white text-sm">
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#888] mb-1 block">Tone</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#111] border border-[#333] rounded-xl text-white text-sm">
                  {TONES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#888] mb-1 block">Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#111] border border-[#333] rounded-xl text-white text-sm">
                  {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={loading || !topic.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-red-600 text-white rounded-xl font-black text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'Generating 10 Hooks...' : 'Generate 10 Viral Hooks'}
              </button>
              {result && (
                <button type="button" onClick={() => handleSubmit()}
                  className="px-4 py-3 bg-[#222] border border-[#444] text-white rounded-xl hover:bg-[#333] transition">
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Error */}
        {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
            <p className="text-sm text-[#888]">AI is crafting 10 viral hooks...</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-amber-400" /> 10 Viral Hooks
                </h2>
                <button onClick={copyAll}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#222] hover:bg-[#333] rounded-xl text-xs text-[#CCC] font-bold transition">
                  {copiedItem === 'all' ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied All!</> : <><Copy className="w-3.5 h-3.5" /> Copy All Hooks</>}
                </button>
              </div>

              {/* Hook Cards */}
              {result.hooks.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl p-5 hover:border-amber-500/30 transition group">
                  <div className="flex items-start gap-4">
                    {/* Rank Number */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm ${i < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-[#222] text-[#666]'}`}>
                      #{i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Psychology Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {item.psychologyType}
                        </span>
                        <button onClick={() => copyText(item.hook, `hook-${i}`)} className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-xs text-[#888] hover:text-white">
                          {copiedItem === `hook-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Hook Text */}
                      <p className="text-white font-bold text-base mb-2 leading-relaxed">&ldquo;{item.hook}&rdquo;</p>

                      {/* Why it works */}
                      <p className="text-xs text-[#888] flex items-start gap-1.5">
                        <Zap className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                        {item.whyItWorks}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
