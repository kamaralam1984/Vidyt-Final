'use client';

import { useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import DashboardLayout from '@/components/DashboardLayout';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, Loader2, Copy, CheckCircle2, FileText, Hash, Image as ImageIcon, Film, Target, Clock } from 'lucide-react';

interface ContentData {
  titles: string[];
  hook: string;
  description: string;
  tags: string[];
  thumbnailIdeas: string[];
  cta: string;
  chapterTimestamps: string[];
  communityPost: string;
  shortsAngle: string;
}

function CopyBlock({ label, icon: Icon, content, color, onCopy, copiedKey, itemKey }: {
  label: string;
  icon: any;
  content: string;
  color: string;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  itemKey: string;
}) {
  return (
    <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          {label}
        </h2>
        <button onClick={() => onCopy(content, itemKey)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 text-[#888] hover:text-white transition-colors">
          {copiedKey === itemKey ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
      </div>
      <p className="text-sm text-[#AAAAAA] leading-relaxed whitespace-pre-wrap bg-[#181818] border border-white/[0.04] rounded-xl px-4 py-3">
        {content}
      </p>
    </div>
  );
}

export default function ContentWorkflowPage() {
  const [videoTitle, setVideoTitle] = useState('');
  const [niche, setNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<ContentData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!videoTitle.trim()) { setError('Video title is required.'); return; }
    setError('');
    setLoading(true);
    setData(null);
    try {
      const res = await axios.post('/api/content-workflow', { videoTitle, niche, targetAudience }, { headers: getAuthHeaders() });
      setData(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(Array.isArray(text) ? (text as unknown as string[]).join('\n') : text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#FF0000]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">AI Content Workflow</h1>
            <p className="text-sm text-[#666]">One video title → complete content package in seconds.</p>
          </div>
        </div>

        <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Video Title <span className="text-[#FF0000]">*</span>
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={e => setVideoTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g. I Tried Every AI Tool for 30 Days — Here's What Happened"
                className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#FF0000]/40 transition-colors"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Niche <span className="text-[#444] font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  placeholder="e.g. AI Tools, Finance, Gaming..."
                  className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#FF0000]/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Target Audience <span className="text-[#444] font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  placeholder="e.g. Beginner content creators..."
                  className="w-full bg-[#181818] border border-white/[0.06] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#FF0000]/40 transition-colors"
                />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF0000] text-white font-bold rounded-xl hover:bg-[#CC0000] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating full content package...</>
                : <><Sparkles className="w-4 h-4" /> Generate Complete Package</>}
            </button>
          </div>
        </div>

        {data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Titles */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF0000]" /> Title Options
              </h2>
              <div className="space-y-2">
                {data.titles.map((title, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 bg-[#181818] border border-white/[0.04] rounded-xl px-4 py-3">
                    <p className="text-sm text-white flex-1">{title}</p>
                    <button onClick={() => copy(title, `title-${i}`)} className="shrink-0 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      {copied === `title-${i}` ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#666]" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Hook */}
            <CopyBlock label="Opening Hook" icon={Film} content={data.hook} color="#3b82f6" onCopy={copy} copiedKey={copied} itemKey="hook" />

            {/* Description */}
            <CopyBlock label="SEO Description" icon={FileText} content={data.description} color="#22c55e" onCopy={copy} copiedKey={copied} itemKey="desc" />

            {/* Tags + Chapters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Hash className="w-4 h-4 text-amber-400" /> Tags
                  </h2>
                  <button onClick={() => copy(data.tags.join(', '), 'tags')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 text-[#888] hover:text-white transition-colors">
                    {copied === 'tags' ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy All</>}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" /> Chapter Timestamps
                  </h2>
                  <button onClick={() => copy(data.chapterTimestamps.join('\n'), 'chapters')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 text-[#888] hover:text-white transition-colors">
                    {copied === 'chapters' ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
                <div className="space-y-1">
                  {data.chapterTimestamps.map((ch, i) => (
                    <p key={i} className="text-xs text-[#888] font-mono">{ch}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* Thumbnail ideas */}
            <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" /> Thumbnail Concepts
              </h2>
              <div className="space-y-2">
                {data.thumbnailIdeas.map((idea, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 bg-[#181818] border border-white/[0.04] rounded-xl px-4 py-3">
                    <p className="text-sm text-[#AAAAAA] flex-1">{idea}</p>
                    <button onClick={() => copy(idea, `thumb-${i}`)} className="shrink-0 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      {copied === `thumb-${i}` ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#666]" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <CopyBlock label="End-Screen CTA" icon={Target} content={data.cta} color="#f43f5e" onCopy={copy} copiedKey={copied} itemKey="cta" />

            {/* Community post */}
            <CopyBlock label="Community Post" icon={Sparkles} content={data.communityPost} color="#8b5cf6" onCopy={copy} copiedKey={copied} itemKey="community" />

            {/* Shorts angle */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-4 flex items-start gap-3">
              <Film className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-400 mb-1">Best Shorts Angle</p>
                <p className="text-sm text-[#888]">{data.shortsAngle}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
