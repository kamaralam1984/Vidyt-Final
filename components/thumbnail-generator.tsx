'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Sparkles, Download, Loader2, RefreshCw, Copy, Check, Image as ImageIcon, Wand2, X, Pencil, ChevronRight, Upload } from 'lucide-react';
import { getAuthHeaders } from '@/utils/auth';
import axios from 'axios';
import { addTextOverlay } from '@/lib/textOverlay';

const STYLES = [
  { id: 'cinematic',  label: 'Cinematic Film Poster', desc: 'Hollywood movie poster quality', color: 'from-red-600 to-orange-600' },
  { id: 'mrbeast',   label: 'MrBeast Style',          desc: 'Bold, colorful, expressive',    color: 'from-yellow-500 to-red-500' },
  { id: 'realistic',  label: 'Photo Realistic',        desc: 'Hyper-realistic photography',   color: 'from-blue-600 to-cyan-600' },
  { id: 'anime',      label: 'Anime / Manga',          desc: 'Japanese anime art style',      color: 'from-pink-500 to-purple-600' },
  { id: '3d',         label: '3D Render',              desc: 'Pixar/3D cartoon style',        color: 'from-emerald-500 to-teal-600' },
  { id: 'neon',       label: 'Neon Cyberpunk',         desc: 'Neon lights, dark futuristic',  color: 'from-purple-600 to-blue-600' },
  { id: 'minimal',    label: 'Clean Minimal',          desc: 'Simple, modern, elegant',       color: 'from-gray-500 to-gray-700' },
  { id: 'vintage',    label: 'Retro Vintage',          desc: 'Old school, film grain',        color: 'from-amber-600 to-yellow-700' },
];

const EMOTIONS = ['curiosity', 'shock', 'fear', 'urgency', 'excitement', 'anger', 'joy', 'dramatic', 'mystery', 'hype'];
const NICHES   = ['entertainment', 'news', 'gaming', 'education', 'food', 'travel', 'tech', 'fitness', 'beauty', 'music', 'finance', 'comedy'];

type Step = 'input' | 'prompt' | 'generating' | 'done';

interface Result { url: string; prompt: string; ctr: number; provider: string; text: string }

function getStyleSuffix(style: string): string {
  const map: Record<string, string> = {
    anime:    'anime art style, vibrant colors, manga illustration, Japanese animation quality',
    '3d':     '3D render, Pixar quality, smooth cartoon CGI, high detail',
    neon:     'neon cyberpunk style, dark background, glowing neon lights, futuristic, purple and cyan',
    minimal:  'clean minimal design, simple modern layout, lots of whitespace, elegant typography',
    vintage:  'retro vintage style, film grain, warm colors, 70s-80s aesthetic',
    mrbeast:  'MrBeast YouTube style, extremely bold text, exaggerated expression, ultra colorful, high energy',
    realistic:'hyper-realistic photography, 8k, professional photo, studio lighting, ultra detailed',
    cinematic:'cinematic film poster, dramatic lighting, Hollywood quality, epic composition, volumetric light',
  };
  return map[style] || map.cinematic;
}

export default function ThumbnailGenerator() {
  const [step, setStep] = useState<Step>('input');

  // Inputs
  const [title, setTitle]     = useState('');
  const [topic, setTopic]     = useState('');
  const [style, setStyle]     = useState('cinematic');
  const [emotion, setEmotion] = useState('curiosity');
  const [niche, setNiche]     = useState('entertainment');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // base64
  const [whiskMode, setWhiskMode] = useState(false); // true = user image as subject

  // Prompt step
  const [imagePrompt, setImagePrompt]       = useState('');
  const [overlayText, setOverlayText]       = useState('');
  const [promptLoading, setPromptLoading]   = useState(false);

  // Result
  const [result, setResult]   = useState<Result | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = (reader.result as string).split(',')[1];
      setUploadedImage(b64);
      setWhiskMode(true);
    };
    reader.readAsDataURL(file);
  };

  // ── Step 1 → Step 2: generate image prompt ──────────────────────────────
  const handleGeneratePrompt = async () => {
    if (!title.trim() && !topic.trim()) {
      setError('Video title ya topic zaroor bharo');
      return;
    }
    setPromptLoading(true);
    setError(null);
    const mainTopic = topic.trim() || title.trim();
    const mainTitle = title.trim() || topic.trim();

    try {
      // Call thumbnail generator with promptOnly flag — returns image_prompt without generating image
      const res = await axios.post('/api/ai/thumbnail-generator', {
        videoTitle: mainTitle,
        topic: mainTopic,
        emotion,
        niche,
        generateImage: false, // prompt only
        customPrompt: '',
      }, { headers: getAuthHeaders() });

      const rawPrompt = res.data.image_prompt || '';
      const styleSuffix = getStyleSuffix(style);
      const finalPrompt = `${rawPrompt} Style: ${styleSuffix}. YouTube thumbnail 16:9 aspect ratio, no text in image.`;
      setImagePrompt(finalPrompt);
      setOverlayText(mainTitle.slice(0, 60));
      setStep('prompt');
    } catch (e: any) {
      // Fallback: build prompt client-side
      const fallback = buildFallbackPrompt(topic.trim() || title.trim(), emotion, style);
      setImagePrompt(fallback);
      setOverlayText((title.trim() || topic.trim()).slice(0, 60));
      setStep('prompt');
    } finally {
      setPromptLoading(false);
    }
  };

  function buildFallbackPrompt(topic: string, emotion: string, style: string): string {
    const styleSuffix = getStyleSuffix(style);
    return `A dramatic, cinematic scene about "${topic}". ${emotion} mood, epic composition, hyper-realistic, 8K quality, cinematic lighting. ${styleSuffix}. YouTube thumbnail 16:9 aspect ratio, no text in image.`;
  }

  // ── Step 2 → Step 3: generate actual thumbnail ──────────────────────────
  const handleCreateThumbnail = async () => {
    setStep('generating');
    setError(null);
    setResult(null);

    try {
      let imageUrl = '';
      let provider = 'ai';
      let ctr = 75;

      if (whiskMode && uploadedImage) {
        // Photo mode: use uploaded image as subject, generate scene around it
        const res = await axios.post('/api/ai/thumbnail-from-image', {
          imageBase64: [uploadedImage],
          videoTitle: title.trim() || topic.trim(),
          topic: topic.trim() || title.trim(),
          emotion,
          niche,
          generateImage: true,
          customPrompt: imagePrompt,
        }, { headers: getAuthHeaders() });
        imageUrl = res.data.image_url || '';
        provider = res.data.generationProvider || 'ai';
        ctr = res.data.ctr_scores?.[0] || 75;
      } else {
        // Standard: generate background image from prompt
        const res = await axios.post('/api/ai/thumbnail-generator', {
          videoTitle: title.trim() || topic.trim(),
          topic: topic.trim() || title.trim(),
          emotion,
          niche,
          generateImage: true,
          customPrompt: imagePrompt,
        }, { headers: getAuthHeaders() });
        imageUrl = res.data.image_url || '';
        provider = res.data.generationProvider || 'ai';
        ctr = res.data.ctr_scores?.[0] || 75;
      }

      if (!imageUrl) throw new Error('Image generation failed. Check API keys in Super Admin.');

      // Add bold text overlay (like a real thumbnail)
      const textToOverlay = overlayText.trim() || title.trim() || 'VIRAL';
      let finalUrl = imageUrl;
      try {
        finalUrl = await addTextOverlay(imageUrl, textToOverlay, {
          position: 'bottom',
          glowColor: '#FF4400',
          color: '#FFFFFF',
        });
      } catch { finalUrl = imageUrl; }

      setResult({ url: finalUrl, prompt: imagePrompt, ctr, provider, text: textToOverlay });
      setStep('done');
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Generation failed');
      setStep('prompt');
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const res = await fetch(result.url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `thumbnail-${Date.now()}.png`;
      a.click();
    } catch { window.open(result.url, '_blank'); }
  };

  const handleReset = () => {
    setStep('input');
    setResult(null);
    setImagePrompt('');
    setOverlayText('');
    setError(null);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-purple-500/10 to-amber-500/10" />
          <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 via-purple-500 to-amber-500 flex items-center justify-center shadow-lg">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-amber-400">
                  थंबनेल जेनेरेटर
                </h1>
                <p className="text-sm text-[#888]">Title से prompt बनाओ, फिर AI thumbnail create करो</p>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-4">
              {(['input','prompt','generating','done'] as Step[]).map((s, i) => {
                const labels = ['1. Title & Style', '2. Image Prompt', '3. Generating...', '4. Done!'];
                const active = step === s;
                const past = ['input','prompt','generating','done'].indexOf(step) > i;
                return (
                  <React.Fragment key={s}>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold transition ${active ? 'bg-red-600 text-white' : past ? 'bg-green-600/30 text-green-400' : 'bg-[#222] text-[#555]'}`}>
                      {labels[i]}
                    </div>
                    {i < 3 && <ChevronRight className="w-3 h-3 text-[#444]" />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT PANEL */}
          <div className="lg:col-span-2 space-y-4">

            {/* ── STEP 1: Title & Style ── */}
            <AnimatePresence mode="wait">
              {step === 'input' && (
                <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl p-5 space-y-4">

                  {/* Upload image */}
                  <div>
                    <label className="text-sm font-bold text-[#AAA] mb-2 block">
                      <Upload className="w-4 h-4 inline mr-1" />
                      Apni Photo Upload (Optional)
                    </label>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    {uploadedImage ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#333] group">
                        <img src={`data:image/jpeg;base64,${uploadedImage}`} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition gap-2">
                          <button onClick={() => fileRef.current?.click()}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-bold">Change</button>
                          <button onClick={() => { setUploadedImage(null); setWhiskMode(false); }}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg font-bold">Remove</button>
                        </div>
                        <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Photo Mode ON
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => fileRef.current?.click()}
                        className="w-full h-20 border-2 border-dashed border-[#333] rounded-xl hover:border-purple-500/50 transition flex flex-col items-center justify-center gap-1 text-[#555] hover:text-purple-400">
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">Photo ya subject upload karo</span>
                      </button>
                    )}
                    {uploadedImage && (
                      <p className="text-xs text-purple-400 mt-1">✓ Tumhari photo subject banega, AI cinematic background banayega</p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-sm font-bold text-[#AAA] mb-1 block">Video Title *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Bigg Boss winner ka secret reveal"
                      className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-xl text-white placeholder-[#555] focus:ring-2 focus:ring-red-500 text-sm" />
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="text-sm font-bold text-[#AAA] mb-1 block">Topic / Keyword</label>
                    <input value={topic} onChange={e => setTopic(e.target.value)}
                      placeholder="e.g. Bigg Boss, cricket, gaming"
                      className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-xl text-white placeholder-[#555] focus:ring-2 focus:ring-red-500 text-sm" />
                  </div>

                  {/* Emotion + Niche */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#888] mb-1 block">Emotion</label>
                      <select value={emotion} onChange={e => setEmotion(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#111] border border-[#333] rounded-xl text-white text-sm">
                        {EMOTIONS.map(em => <option key={em}>{em}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#888] mb-1 block">Niche</label>
                      <select value={niche} onChange={e => setNiche(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#111] border border-[#333] rounded-xl text-white text-sm">
                        {NICHES.map(n => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Art Style */}
                  <div>
                    <label className="text-xs text-[#888] mb-2 block">Art Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {STYLES.map(s => (
                        <button key={s.id} onClick={() => setStyle(s.id)}
                          className={`p-2.5 rounded-xl text-left transition border ${style === s.id ? 'bg-red-500/10 border-red-500/50 text-white' : 'border-[#333] text-[#888] hover:border-[#555]'}`}>
                          <p className="text-xs font-bold leading-tight">{s.label}</p>
                          <p className="text-[9px] opacity-60 mt-0.5">{s.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-xs">{error}</p>}

                  {/* Generate Prompt Button */}
                  <button onClick={handleGeneratePrompt} disabled={promptLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 to-purple-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg hover:shadow-red-500/20 transition">
                    {promptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {promptLoading ? 'AI Prompt Bana rha hai...' : 'Image Prompt Generate Karo →'}
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2: Image Prompt ── */}
              {(step === 'prompt' || step === 'done') && (
                <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl p-5 space-y-4">

                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Pencil className="w-4 h-4 text-purple-400" />
                      AI Image Prompt
                    </h3>
                    <button onClick={handleReset} className="text-xs text-[#555] hover:text-white flex items-center gap-1">
                      <X className="w-3 h-3" /> Reset
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-[#888] mb-1 block">Prompt edit kar sakte ho</label>
                    <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} rows={6}
                      className="w-full px-4 py-3 bg-[#111] border border-purple-500/30 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-purple-500 resize-none leading-relaxed" />
                  </div>

                  <div>
                    <label className="text-xs text-[#888] mb-1 block">Thumbnail Text (title overlay)</label>
                    <input value={overlayText} onChange={e => setOverlayText(e.target.value)} maxLength={70}
                      placeholder="Text jo thumbnail pe dikhega"
                      className="w-full px-4 py-3 bg-[#111] border border-[#333] rounded-xl text-white text-sm focus:ring-2 focus:ring-red-500" />
                    <p className="text-[10px] text-[#555] mt-1">{overlayText.length}/70 characters</p>
                  </div>

                  {uploadedImage && (
                    <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                      <img src={`data:image/jpeg;base64,${uploadedImage}`} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="text-xs font-bold text-purple-300">Photo Mode Active</p>
                        <p className="text-[10px] text-[#888]">Tumhari photo subject banega, AI cinematic background banayega</p>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-red-400 text-xs">{error}</p>}

                  <button onClick={handleCreateThumbnail}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 via-purple-600 to-amber-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/20 transition">
                    <Sparkles className="w-4 h-4" />
                    Thumbnail Create Karo ✨
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT PANEL — Preview */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">

              {/* Generating */}
              {step === 'generating' && (
                <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl aspect-video flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-black text-lg">AI Thumbnail Bana rha hai...</p>
                    <p className="text-[#888] text-xs mt-1">Image generate ho rhi hai + text overlay lag rha hai</p>
                  </div>
                  {/* Animated progress dots */}
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-red-500"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Empty state */}
              {(step === 'input' || step === 'prompt') && !result && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-[#181818] border border-[#212121] rounded-xl overflow-hidden">
                  <div className="aspect-video flex flex-col items-center justify-center gap-3">
                    <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                      <ImageIcon className="w-16 h-16 text-[#2a2a2a]" />
                    </motion.div>
                    <p className="text-[#555] font-bold">Tumhara AI thumbnail yahan dikhega</p>
                    <p className="text-[#333] text-xs">Title bharo aur Prompt Generate karo</p>
                  </div>
                </motion.div>
              )}

              {/* Result */}
              {step === 'done' && result && (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4">
                  {/* Thumbnail Preview */}
                  <div className="bg-[#181818] border border-[#212121] rounded-xl overflow-hidden group relative">
                    <div className="relative aspect-video bg-[#111]">
                      <img src={result.url} alt="Generated Thumbnail" className="w-full h-full object-cover" />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                        <button onClick={handleDownload}
                          className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition">
                          <Download className="w-4 h-4" /> Download PNG
                        </button>
                        <button onClick={handleCreateThumbnail}
                          className="px-5 py-2.5 bg-[#333] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#444] transition">
                          <RefreshCw className="w-4 h-4" /> Regenerate
                        </button>
                      </div>

                      {/* CTR Badge */}
                      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black shadow-lg
                        ${result.ctr >= 85 ? 'bg-emerald-500 text-white' : result.ctr >= 70 ? 'bg-amber-500 text-black' : 'bg-red-500 text-white'}`}>
                        CTR: {result.ctr}%
                      </div>

                      <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 backdrop-blur rounded-full text-[10px] font-bold text-white">
                        {result.provider}
                      </div>
                    </div>

                    {/* Action buttons below image */}
                    <div className="p-4 flex gap-2">
                      <button onClick={handleDownload}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition">
                        <Download className="w-4 h-4" /> Download
                      </button>
                      <button onClick={handleCreateThumbnail}
                        className="flex-1 py-2.5 bg-[#222] border border-[#444] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#333] transition">
                        <RefreshCw className="w-4 h-4" /> Dobara Generate
                      </button>
                    </div>
                  </div>

                  {/* Prompt used */}
                  <div className="bg-[#181818] border border-[#212121] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-purple-400">Used Image Prompt</p>
                      <button onClick={() => { navigator.clipboard.writeText(result.prompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="flex items-center gap-1 text-[10px] text-[#888] hover:text-white">
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </button>
                    </div>
                    <p className="text-[10px] text-[#666] font-mono leading-relaxed line-clamp-4">{result.prompt}</p>
                  </div>

                  {/* Try again with new prompt */}
                  <button onClick={() => setStep('prompt')}
                    className="w-full py-3 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-bold hover:bg-purple-500/10 transition flex items-center justify-center gap-2">
                    <Pencil className="w-4 h-4" /> Prompt Edit karke Dobara Banao
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
