'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Image, Copy, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

const EMOTIONS = ['shock', 'curiosity', 'excitement'];

export default function ThumbnailGeneratorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [videoTitle, setVideoTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [emotion, setEmotion] = useState('curiosity');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ textSuggestions: string[]; layoutIdea: string; colorPalette: string[]; ctrScore: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post('/api/ai/thumbnail-generator', { videoTitle: videoTitle.trim(), topic, emotion, niche }, { headers: getAuthHeaders() });
      setResult(res.data);
    } catch (err: any) {
      setResult(null);
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
            <Image className="w-8 h-8 text-[#FF0000]" />
            AI Thumbnail Generator
          </h1>
          <p className="text-[#AAAAAA] mb-6">Get thumbnail text, layout, colors and CTR prediction.</p>

          <form onSubmit={handleSubmit} className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-[#AAAAAA] mb-1">Video title *</label>
                <input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} required className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white" placeholder="Your video title" />
              </div>
              <div>
                <label className="block text-sm text-[#AAAAAA] mb-1">Topic</label>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white" placeholder="e.g. Tech reviews" />
              </div>
              <div>
                <label className="block text-sm text-[#AAAAAA] mb-1">Emotion</label>
                <select value={emotion} onChange={(e) => setEmotion(e.target.value)} className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white">
                  {EMOTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-[#AAAAAA] mb-1">Niche</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)} className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white" placeholder="e.g. Gaming, Education" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate
            </button>
          </form>

          {result && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-3">Preview Card</h2>
                  <div className="rounded-lg overflow-hidden border-2 border-[#333333]" style={{ backgroundColor: result.colorPalette[0] || '#1a1a2e', minHeight: 180 }}>
                    <div className="p-4 flex flex-col justify-center items-center h-full text-center">
                      <p className="text-xl font-bold text-white drop-shadow-lg">{result.textSuggestions[0] || 'Thumbnail text'}</p>
                      <p className="text-sm text-white/90 mt-2">{result.textSuggestions[1]}</p>
                      <span className="mt-3 px-2 py-0.5 rounded text-xs bg-black/30 text-white">{emotion}</span>
                    </div>
                  </div>
                  <p className="text-[#AAAAAA] text-sm mt-2">Background: {result.colorPalette[0]}</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-2">Thumbnail Text Suggestions</h2>
                    <ul className="space-y-1">
                      {result.textSuggestions.map((t, i) => (
                        <li key={i} className="flex justify-between items-center p-2 bg-[#212121] rounded">
                          <span className="text-sm text-white">{t}</span>
                          <button onClick={() => copy(t, `text-${i}`)} className="p-1 hover:bg-[#333333] rounded"><Copy className="w-4 h-4 text-[#AAAAAA]" /></button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-2">CTR Prediction</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-4 bg-[#212121] rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF0000] rounded-full transition-all" style={{ width: `${result.ctrScore}%` }} />
                      </div>
                      <span className="text-white font-bold">{result.ctrScore}/100</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-2">Layout Idea</h2>
                <div className="flex justify-between items-start gap-2 p-3 bg-[#212121] rounded-lg">
                  <p className="text-[#CCCCCC] text-sm">{result.layoutIdea}</p>
                  <button onClick={() => copy(result.layoutIdea, 'layout')} className="p-1.5 rounded hover:bg-[#333333]"><Copy className="w-4 h-4 text-[#AAAAAA]" /></button>
                </div>
              </div>
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-2">Color Palette</h2>
                <div className="flex gap-3 flex-wrap">
                  {result.colorPalette.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-lg border border-[#333333]" style={{ backgroundColor: c }} />
                      <span className="text-[#AAAAAA] text-sm">{c}</span>
                      <button onClick={() => copy(c, `color-${i}`)} className="p-1 hover:bg-[#333333] rounded"><Copy className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
