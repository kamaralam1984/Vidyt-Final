'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Zap, Copy, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

export default function HookGeneratorPage() {
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('YouTube');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ hooks: { hook: string; psychologyType: string; whyItWorks: string }[] } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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
    try {
      const res = await axios.post('/api/ai/hook-generator', { topic: topic.trim(), niche, platform }, { headers: getAuthHeaders() });
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
            <Zap className="w-8 h-8 text-[#FF0000]" />
            Viral Hook Generator
          </h1>
          <p className="text-[#AAAAAA] mb-6">10 hooks with psychology type and why it works.</p>

          <form onSubmit={handleSubmit} className="bg-[#181818] border border-[#212121] rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm text-[#AAAAAA] mb-1">Video topic *</label>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} required className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white" placeholder="e.g. Productivity tips" />
              </div>
              <div>
                <label className="block text-sm text-[#AAAAAA] mb-1">Niche</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)} className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white" placeholder="e.g. Self-improvement" />
              </div>
              <div>
                <label className="block text-sm text-[#AAAAAA] mb-1">Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#333333] rounded-lg text-white">
                  <option value="YouTube">YouTube</option>
                  <option value="Shorts">Shorts</option>
                  <option value="Reels">Reels</option>
                  <option value="TikTok">TikTok</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate 10 Hooks
            </button>
          </form>

          {result && (
            <div className="space-y-4">
              {result.hooks.map((item, i) => (
                <div key={i} className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-medium text-[#FF0000] bg-[#FF0000]/10 px-2 py-0.5 rounded">{item.psychologyType}</span>
                    <button onClick={() => copy(item.hook, `hook-${i}`)} className="p-1.5 rounded hover:bg-[#333333]">
                      {copied === `hook-${i}` ? <span className="text-green-400 text-xs">Copied</span> : <Copy className="w-4 h-4 text-[#AAAAAA]" />}
                    </button>
                  </div>
                  <p className="text-white font-medium mb-2">&ldquo;{item.hook}&rdquo;</p>
                  <p className="text-sm text-[#AAAAAA]">Why it works: {item.whyItWorks}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
