'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { FileText, Copy, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

const PLATFORMS = ['YouTube', 'Shorts', 'Reels', 'TikTok'];
const DURATIONS = ['30 sec', '1 min', '3 min', '5 min', '10 min'];
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Other'];

function ScriptGeneratorContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const searchParams = useSearchParams();
  const mode = (searchParams?.get('mode') || '').toLowerCase();
  const isIdeasMode = mode === 'ideas';
  const [topic, setTopic] = useState(
    mode === 'ideas'
      ? 'Daily video ideas for my YouTube channel'
      : mode === 'coach'
      ? 'Channel growth coaching tips for my content'
      : ''
  );
  const [platform, setPlatform] = useState('YouTube');
  const [duration, setDuration] = useState('5 min');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ hooks: string[]; script: string; titles: string[]; hashtags: string[]; cta: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<
    { title: string; score: number; day: string; hour: number; timeLabel: string }[]
  >([]);
  const [ideasMeta, setIdeasMeta] = useState<{ usedYouTubeTrending?: boolean; usedAI?: boolean } | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    if (isIdeasMode) setIdeas([]);
    if (isIdeasMode) setIdeasMeta(null);
    try {
      if (isIdeasMode) {
        const res = await axios.post(
          '/api/ai/daily-ideas',
          { niche: topic.trim() },
          { headers: getAuthHeaders() }
        );
        setIdeas(res.data?.ideas || []);
        setIdeasMeta({ usedYouTubeTrending: res.data?.usedYouTubeTrending, usedAI: res.data?.usedAI });
      } else {
        const res = await axios.post(
          '/api/ai/script-generator?mode=' + mode,
          { topic: topic.trim(), platform, duration, language },
          { headers: getAuthHeaders() }
        );
        setResult(res.data);
      }
    } catch (err: any) {
      setResult(null);
      setIdeas([]);
      alert(err.response?.data?.error || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <FileText className="w-8 h-8 text-[#FF0000]" />
            AI Script Generator
          </h1>
          <p className="text-[#AAAAAA] mb-6">
            {isIdeasMode
              ? 'Daily Ideas mode: sirf niche / channel topic likho, AI aaj ke trending-style video ideas, viral score % aur best posting time bata dega.'
              : mode === 'coach'
              ? 'AI Coach mode: topic likho, AI tumhe channel growth ke liye coaching-style script aur tips dega.'
              : 'Generate viral hooks, full script, titles, hashtags and CTA.'}
          </p>

          <form onSubmit={handleSubmit} className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-[#AAAAAA] mb-1">
                  {isIdeasMode ? 'Channel niche / topic *' : 'Video topic *'}
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white"
                  placeholder={
                    isIdeasMode ? 'e.g. YouTube growth tips, gaming, finance' : 'e.g. How to grow on YouTube'
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-[#AAAAAA] mb-1">Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white">
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#AAAAAA] mb-1">Duration</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white">
                  {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#AAAAAA] mb-1">Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {isIdeasMode ? 'Get today’s ideas' : 'Generate'}
            </button>
          </form>

          {isIdeasMode && ideas.length > 0 && (
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Aaj ke ideas (score + best time)</h2>
                {ideasMeta && (
                  <p className="text-xs text-[#888]">
                    {ideasMeta.usedYouTubeTrending
                      ? 'Source: YouTube ke recent trending videos + AI analysis.'
                      : 'Source: Offline AI model (YouTube API / AI key set nahi mile) – general best ideas.'}
                  </p>
                )}
              </div>
              {ideas.map((idea, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTopic(idea.title)}
                  className="w-full text-left bg-[#181818] border border-[#212121] rounded-xl p-4 hover:border-[#FF0000]/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white mb-1">{idea.title}</p>
                      <p className="text-xs text-[#888]">
                        Recommended: <span className="text-emerald-400">{idea.day}</span>{' '}
                        <span className="text-emerald-400">{idea.timeLabel}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-[#AAA]">Viral score</span>
                      <span className="text-lg font-semibold text-emerald-400">{idea.score}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isIdeasMode && result && (
            <div className="space-y-6">
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3">3 Viral Hooks</h2>
                <ul className="space-y-2">
                  {result.hooks.map((h, i) => (
                    <li key={i} className="flex items-start justify-between gap-2 p-3 bg-[#212121] rounded-lg">
                      <span className="text-white text-sm">{h}</span>
                      <button onClick={() => copy(h, `hook-${i}`)} className="p-1.5 rounded hover:bg-[#333333] shrink-0">
                        {copied === `hook-${i}` ? <span className="text-green-400 text-xs">Copied</span> : <Copy className="w-4 h-4 text-[#AAAAAA]" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3">Full Script</h2>
                <div className="flex justify-end mb-2">
                  <button onClick={() => copy(result.script, 'script')} className="flex items-center gap-1 text-sm text-[#AAAAAA] hover:text-white">
                    {copied === 'script' ? 'Copied' : <><Copy className="w-4 h-4" /> Copy</>}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-[#CCCCCC] bg-[#0F0F0F] p-4 rounded-lg overflow-x-auto">{result.script}</pre>
              </div>
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3">5 Optimized Titles</h2>
                <ul className="space-y-2">
                  {result.titles.map((t, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 p-3 bg-[#212121] rounded-lg">
                      <span className="text-white text-sm">{t}</span>
                      <button onClick={() => copy(t, `title-${i}`)} className="p-1.5 rounded hover:bg-[#333333]"><Copy className="w-4 h-4 text-[#AAAAAA]" /></button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3">15 Hashtags</h2>
                <div className="flex flex-wrap gap-2 mb-2">
                  {result.hashtags.map((h, i) => (
                    <span key={i} className="px-2 py-1 bg-[#212121] rounded text-sm text-[#CCCCCC]">{h}</span>
                  ))}
                </div>
                <button onClick={() => copy(result.hashtags.join(' '), 'hashtags')} className="text-sm text-[#FF0000] hover:underline">{copied === 'hashtags' ? 'Copied' : 'Copy all'}</button>
              </div>
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3">CTA Suggestion</h2>
                <div className="flex justify-between items-start gap-2 p-3 bg-[#212121] rounded-lg">
                  <p className="text-[#CCCCCC] text-sm">{result.cta}</p>
                  <button onClick={() => copy(result.cta, 'cta')} className="p-1.5 rounded hover:bg-[#333333]"><Copy className="w-4 h-4 text-[#AAAAAA]" /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ScriptGeneratorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading...</div>}>
      <ScriptGeneratorContent />
    </Suspense>
  );
}
