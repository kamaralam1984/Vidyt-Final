'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Sparkles, Download, Loader2, RefreshCw, Copy, Check, Image as ImageIcon, Zap, X, Wand2 } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';
import { useTranslations } from '@/context/translations';
import axios from 'axios';
import { addTextOverlay } from '@/lib/textOverlay';

const EMOTIONS = ['curiosity', 'shock', 'fear', 'urgency', 'excitement', 'anger', 'joy', 'dramatic', 'mystery', 'hype'];
const NICHES = ['news', 'entertainment', 'gaming', 'education', 'food', 'travel', 'tech', 'fitness', 'beauty', 'music', 'finance', 'comedy'];
const STYLES = [
  { id: 'cinematic', label: 'Cinematic Film Poster', desc: 'Hollywood movie poster quality' },
  { id: 'mrbeast', label: 'MrBeast Style', desc: 'Bold, colorful, expressive' },
  { id: 'realistic', label: 'Photo Realistic', desc: 'Hyper-realistic photography' },
  { id: 'anime', label: 'Anime / Manga', desc: 'Japanese anime art style' },
  { id: '3d', label: '3D Render', desc: 'Pixar/3D cartoon style' },
  { id: 'neon', label: 'Neon Cyberpunk', desc: 'Neon lights, dark futuristic' },
  { id: 'minimal', label: 'Clean Minimal', desc: 'Simple, modern, elegant' },
  { id: 'vintage', label: 'Retro Vintage', desc: 'Old school, film grain' },
];

interface GeneratedThumb {
  url: string;
  text: string;
  ctr: number;
  style: string;
  prompt: string;
  provider?: string;
}

export default function ThumbnailGenerator() {
  const { t } = useTranslations();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [emotion, setEmotion] = useState('curiosity');
  const [niche, setNiche] = useState('entertainment');
  const [style, setStyle] = useState('cinematic');
  const [images, setImages] = useState<(string | null)[]>([null, null]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedThumb[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [usePromptMode, setUsePromptMode] = useState(false);

  const copyText = (text: string, label: string) => {
    try { navigator.clipboard.writeText(text); } catch {}
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newImages = [...images];
      newImages[index] = (reader.result as string).split(',')[1]; // base64 without prefix
      setImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  const getStylePromptSuffix = () => {
    switch (style) {
      case 'anime': return 'anime art style, vibrant colors, manga illustration, Japanese animation quality';
      case '3d': return '3D render, Pixar quality, smooth cartoon style, high detail CGI';
      case 'neon': return 'neon cyberpunk style, dark background, glowing neon lights, futuristic, purple and cyan';
      case 'minimal': return 'clean minimal design, simple modern layout, lots of whitespace, elegant typography';
      case 'vintage': return 'retro vintage style, film grain, warm colors, 70s-80s aesthetic, old school';
      case 'mrbeast': return 'MrBeast YouTube thumbnail style, extremely bold text, exaggerated expression, ultra colorful, high energy';
      case 'realistic': return 'hyper-realistic photography, 8k, professional photo, studio lighting, ultra detailed';
      default: return 'cinematic film poster, dramatic lighting, Hollywood quality, epic composition, volumetric light';
    }
  };

  const handleGenerate = async () => {
    if (!title.trim() && !customPrompt.trim() && !topic.trim()) {
      setError('Please enter a title, topic, or custom prompt');
      return;
    }

    setLoading(true);
    setResults([]);
    setError(null);

    const hasImages = images.some(img => img !== null);
    const validImages = images.filter(img => img !== null);
    const styleSuffix = getStylePromptSuffix();

    try {
      // All 3 variations use the SAME topic — only angle/composition changes
      const mainTopic = topic || title || customPrompt.split(' ').slice(0, 6).join(' ') || 'viral content';
      const mainTitle = title || topic || 'Viral Content';

      // Build topic-locked prompts so ALL 3 images match the topic
      const baseScenePrompt = usePromptMode && customPrompt.trim()
        ? `${customPrompt.trim()}. Style: ${styleSuffix}`
        : `A dramatic, cinematic scene about "${mainTopic}". ${getStylePromptSuffix()}. The image must clearly show what "${mainTopic}" is about. Hyper-realistic, 8K quality, dramatic lighting, cinematic composition.`;

      const variations = [
        { label: STYLES.find(s => s.id === style)?.label || 'Custom', promptExtra: `Wide shot, epic composition, full scene visible.` },
        { label: 'Close-Up Dramatic', promptExtra: `Close-up dramatic shot, intense facial expression or detail, shallow depth of field.` },
        { label: 'Action Shot', promptExtra: `Dynamic action angle, motion blur, high energy, intense moment captured.` },
      ];

      const promises = variations.map(async (variant) => {
        const endpoint = hasImages ? '/api/ai/thumbnail-from-image' : '/api/ai/thumbnail-generator';
        const topicPrompt = `${baseScenePrompt} ${variant.promptExtra}`;

        const payload = hasImages ? {
          imageBase64: validImages,
          emotion,
          niche,
          videoTitle: mainTitle,
          topic: mainTopic,
          generateImage: true,
          customPrompt: topicPrompt,
        } : {
          videoTitle: mainTitle,
          topic: mainTopic,
          emotion,
          niche,
          generateImage: true,
          customPrompt: topicPrompt,
        };

        const res = await axios.post(endpoint, payload, { headers: getAuthHeaders() });
        return {
          url: res.data.image_url || '',
          text: res.data.thumbnail_text || '',
          ctr: res.data.ctr_scores?.[0] || 75,
          style: variant.label,
          prompt: res.data.image_prompt || '',
          provider: res.data.generationProvider || 'ai',
        };
      });

      const settled = await Promise.allSettled(promises);
      const thumbs: GeneratedThumb[] = [];
      for (const r of settled) {
        if (r.status === 'fulfilled' && r.value.url) {
          thumbs.push(r.value);
        }
      }

      if (thumbs.length === 0) {
        setError('Image generation failed. Check if API keys are configured in Super Admin.');
      } else {
        // Overlay bold 3D VFX text on each thumbnail
        const overlayText = title.trim() || topic.trim() || customPrompt.split(' ').slice(0, 5).join(' ') || 'VIRAL';
        const withText = await Promise.all(
          thumbs.map(async (t) => {
            try {
              const overlaid = await addTextOverlay(t.url, overlayText, {
                position: 'top',
                glowColor: '#FF4400',
                color: '#FFFFFF',
              });
              return { ...t, url: overlaid };
            } catch {
              return t; // fallback to original if overlay fails
            }
          })
        );
        setResults(withText);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url: string, index: number) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `thumbnail-${index + 1}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-purple-500/10 to-amber-500/10 animate-pulse" />
          <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 via-purple-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <ImageIcon className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-amber-400">
                  {t('ai.thumbnail.title')}
                </h1>
                <p className="text-sm text-[#888] mt-0.5">Create AI-powered thumbnails like ChatGPT, Gemini & Whisk</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Input */}
          <div className="lg:col-span-2 space-y-4">
            {/* Mode Toggle */}
            <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
              <div className="flex gap-2 p-1 bg-[#111] rounded-xl">
                <button onClick={() => setUsePromptMode(false)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${!usePromptMode ? 'bg-red-600 text-white' : 'text-[#888] hover:text-white'}`}>
                  Title + Niche Mode
                </button>
                <button onClick={() => setUsePromptMode(true)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${usePromptMode ? 'bg-purple-600 text-white' : 'text-[#888] hover:text-white'}`}>
                  <Wand2 className="w-4 h-4 inline mr-1" /> Custom Prompt
                </button>
              </div>
            </div>

            <div className="bg-[#181818] border border-[#212121] rounded-xl p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium text-[#AAA] mb-2 block">Upload Photos (optional, max 2)</label>
                <div className="flex gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl border-2 border-dashed border-[#333] overflow-hidden group hover:border-red-500/50 transition">
                      <input type="file" accept="image/*" className="hidden" id={`img-${i}`} onChange={(e) => handleImageUpload(e, i)} />
                      <label htmlFor={`img-${i}`} className="cursor-pointer w-full h-full flex items-center justify-center">
                        {img ? (
                          <img src={`data:image/png;base64,${img}`} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#555] text-2xl">+</span>
                        )}
                      </label>
                      {img && (
                        <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {usePromptMode ? (
                /* Custom Prompt Mode */
                <div>
                  <label className="text-sm font-medium text-[#AAA] mb-1 block">Describe what you want (like ChatGPT/Gemini)</label>
                  <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={4}
                    placeholder="e.g. A shocked face person looking at a giant gold play button floating in the sky, dramatic lightning, cinematic movie poster style..."
                    className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-xl text-white placeholder-[#555] focus:ring-2 focus:ring-purple-500 resize-none" />
                </div>
              ) : (
                /* Title + Niche Mode */
                <>
                  <div>
                    <label className="text-sm font-medium text-[#AAA] mb-1 block">Video Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. How to Go Viral on YouTube 2025"
                      className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-xl text-white placeholder-[#555] focus:ring-2 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#AAA] mb-1 block">Topic / Keyword</label>
                    <input value={topic} onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. YouTube growth, cooking, gaming"
                      className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-xl text-white placeholder-[#555] focus:ring-2 focus:ring-red-500" />
                  </div>
                </>
              )}

              {/* Emotion + Niche */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#888] mb-1 block">Emotion</label>
                  <select value={emotion} onChange={(e) => setEmotion(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#111] border border-[#333] rounded-xl text-white text-sm">
                    {EMOTIONS.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#888] mb-1 block">Niche</label>
                  <select value={niche} onChange={(e) => setNiche(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#111] border border-[#333] rounded-xl text-white text-sm">
                    {NICHES.map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              {/* Style Selector */}
              <div>
                <label className="text-xs text-[#888] mb-2 block">Art Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map(s => (
                    <button key={s.id} onClick={() => setStyle(s.id)}
                      className={`p-2.5 rounded-xl text-left transition border ${style === s.id ? 'bg-red-500/10 border-red-500/50 text-white' : 'border-[#333] text-[#888] hover:border-[#555]'}`}>
                      <p className="text-xs font-bold">{s.label}</p>
                      <p className="text-[9px] opacity-60">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex gap-2">
                <button onClick={handleGenerate} disabled={loading}
                  className="flex-1 py-3.5 bg-gradient-to-r from-red-600 via-purple-600 to-amber-600 text-white rounded-xl font-black text-sm shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition hover:shadow-red-500/40">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Generating 3 Variations...' : 'Generate AI Thumbnails'}
                </button>
                {results.length > 0 && (
                  <button onClick={handleGenerate} disabled={loading}
                    className="px-4 py-3.5 bg-[#222] border border-[#444] text-white rounded-xl hover:bg-[#333] transition">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Results */}
          <div className="lg:col-span-3 space-y-4">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
            )}

            {loading && (
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-16 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-red-500 mx-auto mb-4" />
                <p className="text-white font-bold mb-1">AI is creating 3 thumbnail variations...</p>
                <p className="text-xs text-[#888]">Using {style} style with {emotion} emotion</p>
              </div>
            )}

            {!loading && results.length === 0 && !error && (
              <div className="bg-[#181818] border border-[#212121] rounded-xl p-16 text-center">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <ImageIcon className="w-16 h-16 text-[#333] mx-auto mb-3" />
                </motion.div>
                <p className="text-white font-bold mb-1">Your AI thumbnails will appear here</p>
                <p className="text-xs text-[#888]">Enter a title or custom prompt and click Generate</p>
              </div>
            )}

            {/* Generated Thumbnails */}
            <AnimatePresence>
              {results.map((thumb, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl overflow-hidden group">
                  {/* Image */}
                  <div className="relative aspect-video bg-[#111]">
                    <img src={thumb.url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                      <button onClick={() => handleDownload(thumb.url, i)}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition shadow-lg">
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </div>
                    {/* CTR Badge */}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black ${thumb.ctr >= 85 ? 'bg-emerald-500 text-white' : thumb.ctr >= 70 ? 'bg-amber-500 text-black' : 'bg-red-500 text-white'}`}>
                      CTR: {thumb.ctr}%
                    </div>
                    {/* Style Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur rounded-full text-xs font-bold text-white">
                      {thumb.style}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-white">{thumb.text}</p>
                      <span className="text-[10px] text-[#888]">{thumb.provider}</span>
                    </div>
                    {/* Prompt */}
                    <details className="group/details">
                      <summary className="text-xs text-purple-400 cursor-pointer hover:text-purple-300">View AI Prompt</summary>
                      <div className="mt-2 p-3 bg-[#111] rounded-lg border border-[#222]">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-[10px] text-[#888] font-mono leading-relaxed flex-1">{thumb.prompt.slice(0, 300)}...</p>
                          <button onClick={() => copyText(thumb.prompt, `prompt-${i}`)} className="ml-2 flex-shrink-0">
                            {copiedItem === `prompt-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#666]" />}
                          </button>
                        </div>
                      </div>
                    </details>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
