'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThumbnailInput {
  video_title: string;
  topic: string;
  emotion: string;
  niche: string;
}

interface ThumbnailOutput {
  thumbnail_text: string;
  image_prompt: string;
  variations: string[];
  ctr_scores: number[];
  reasoning: string[];
  design: {
    colors: string[];
    layout: string;
    effects: string;
  };
  image_url?: string;
  original_title?: string;
  original_topic?: string;
  warning?: string;
  provider?: string;
  generationProvider?: string;
}

export default function ThumbnailGenerator() {
  const [input, setInput] = useState<ThumbnailInput>({
    video_title: '',
    topic: '',
    emotion: 'curiosity',
    niche: 'news'
  });
  
  const [images, setImages] = useState<(string | null)[]>([null, null, null]);

  const [output, setOutput] = useState<ThumbnailOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('Generating Thumbnail...');
  const [activeVariation, setActiveVariation] = useState(0);

  const emotions = ['curiosity', 'fear', 'urgency', 'shock', 'excitement', 'anger'];
  const niches = ['news', 'entertainment', 'gaming', 'education'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImages = [...images];
        newImages[index] = reader.result as string;
        setImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    // If no images, traditional title-based generation
    // If images, analysis-based generation
    const hasImages = images.some(img => img !== null);
    
    setLoading(true);
    setStatusText(hasImages ? 'Analyzing Images & Improving Prompt...' : 'Generating AI Prompt...');
    
    try {
      const endpoint = hasImages ? '/api/ai/thumbnail-from-image' : '/api/ai/thumbnail-generator';
      const validImages = images.filter(img => img !== null);

      const payload = hasImages 
        ? {
            imageBase64: validImages, // Send all uploaded images
            emotion: input.emotion,
            niche: input.niche,
            videoTitle: input.video_title, 
            topic: input.topic, 
            generateImage: true
          }
        : {
            videoTitle: input.video_title,
            topic: input.topic,
            emotion: input.emotion,
            niche: input.niche,
            generateImage: true
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result: ThumbnailOutput = await response.json();
      if (!response.ok) throw new Error((result as any).error || 'Generation failed');
      
      if (result.original_title && !input.video_title) {
        setInput(prev => ({ ...prev, video_title: result.original_title || prev.video_title }));
      }
      if (result.original_topic && !input.topic) {
        setInput(prev => ({ ...prev, topic: result.original_topic || prev.topic }));
      }

      setOutput(result);
    } catch (error: any) {
      console.error('Generation failed:', error);
      alert(error.message || 'Failed to generate thumbnail');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!output?.image_url) return;
    try {
      const response = await fetch(output.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thumbnail-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(output.image_url, '_blank');
    }
  };

  const allTexts = output ? [output.thumbnail_text, ...output.variations] : [];
  const allScores = output ? output.ctr_scores : [];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-yellow-900/20 animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.h1 
          className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent"
        >
          AI Thumbnail Generator
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <motion.div 
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20"
          >
            <h2 className="text-2xl font-semibold mb-6 text-red-400">🎯 Customize Your Thumbnail</h2>
            
            <div className="space-y-6">
              {/* Multi-Image Upload Area */}
              <div>
                <label className="block text-sm font-medium mb-4 text-gray-300">Upload Subject Images (Up to 3)</label>
                <div className="grid grid-cols-3 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square border-2 border-dashed border-red-500/30 rounded-xl bg-black/30 hover:border-red-500/60 transition-all flex items-center justify-center overflow-hidden group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, index)}
                        className="hidden"
                        id={`imageUpload-${index}`}
                      />
                      <label htmlFor={`imageUpload-${index}`} className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        {img ? (
                          <div className="relative w-full h-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[10px] text-white font-bold uppercase">Change</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 group-hover:text-red-400 flex flex-col items-center">
                            <span className="text-2xl">+</span>
                            <span className="text-[10px] uppercase font-bold tracking-tighter">Image {index + 1}</span>
                          </div>
                        )}
                      </label>
                      {img && (
                        <button 
                          onClick={() => {
                            const newImages = [...images];
                            newImages[index] = null;
                            setImages(newImages);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center shadow-lg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Video Title</label>
                  <input
                    type="text"
                    value={input.video_title}
                    onChange={(e) => setInput({ ...input, video_title: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-red-500/30 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
                    placeholder="Enter your video title (optional if using images)..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Target Topic</label>
                  <input
                    type="text"
                    value={input.topic}
                    onChange={(e) => setInput({ ...input, topic: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-red-500/30 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
                    placeholder="Main topic or keyword..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Emotion</label>
                  <select
                    value={input.emotion}
                    onChange={(e) => setInput({ ...input, emotion: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-red-500/30 rounded-lg focus:border-red-500 focus:outline-none text-white"
                  >
                    {emotions.map(emotion => (
                      <option key={emotion} value={emotion}>{emotion}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Niche</label>
                  <select
                    value={input.niche}
                    onChange={(e) => setInput({ ...input, niche: e.target.value })}
                    className="w-full px-4 py-3 bg-black/50 border border-red-500/30 rounded-lg focus:border-red-500 focus:outline-none text-white"
                  >
                    {niches.map(niche => (
                      <option key={niche} value={niche}>{niche}</option>
                    ))}
                  </select>
                </div>
              </div>

              <motion.button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 rounded-lg font-semibold text-lg hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-red-500/25"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? `🔄 ${statusText}` : '⚡ Generate Thumbnail Image'}
              </motion.button>
            </div>
          </motion.div>

          {/* Output Section */}
          <motion.div 
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20"
          >
            <h2 className="text-2xl font-semibold mb-6 text-yellow-400">🎨 Generated Final Thumbnail</h2>
            
            <AnimatePresence mode="wait">
              {output ? (
                <motion.div
                  key="output"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Generated Final Image */}
                  <div className="relative group">
                    <div className="w-full relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-gray-700">
                       {output.image_url ? (
                         <>
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img 
                             src={output.image_url} 
                             alt="Generated AI Thumbnail" 
                             className="w-full h-full object-cover"
                             onError={(e) => {
                               // If image fails to load, show a placeholder or error
                               const target = e.target as HTMLImageElement;
                               target.src = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=1024&q=80';
                             }}
                           />
                           {/* Overlay with Download Button */}
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button
                               onClick={handleDownload}
                               className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-xl transform scale-90 group-hover:scale-100 transition-transform"
                             >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                               Download Thumbnail
                             </button>
                           </div>
                         </>
                       ) : (
                         <div className="text-center p-6">
                           <div className="text-4xl mb-2">⚠️</div>
                           <p className="text-red-500 font-semibold">{output.warning || 'AI Image Generation failed'}</p>
                           <p className="text-xs text-gray-400 mt-2">Text variations and prompts are still available below.</p>
                         </div>
                       )}
                       
                      <div className="absolute top-4 right-4 bg-green-500 text-black px-3 py-1 rounded-full font-bold text-sm shadow-md z-20">
                        Pred. CTR: {allScores[activeVariation]}%
                      </div>
                    </div>
                  </div>

                  {/* Image Prompt */}
                  <div className="bg-black/30 p-4 rounded-lg border border-yellow-500/20">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-semibold text-yellow-400">🧠 AI Image Generation Prompt</h4>
                      {(output.provider || output.generationProvider) && (
                        <div className="flex gap-2">
                          {output.provider && (
                            <span className="text-[9px] bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded uppercase text-blue-400 tracking-wider">
                              Analysis: {output.provider}
                            </span>
                          )}
                          {output.generationProvider && (
                            <span className="text-[9px] bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded uppercase text-purple-400 tracking-wider">
                              Gen: {output.generationProvider}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed font-mono">{output.image_prompt}</p>
                  </div>

                  {/* Hook texts */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-300">✍️ Generated Title Variations</h4>
                    {allTexts.map((text, index) => (
                      <motion.div
                        key={index}
                        onClick={() => setActiveVariation(index)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          activeVariation === index 
                            ? 'bg-red-500/20 border-red-500' 
                            : 'bg-white/5 border-gray-600 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{text}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  className="flex items-center justify-center h-[400px] text-gray-500"
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4">🖼️</div>
                    <p>Generated image and AI prompts will appear here</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
