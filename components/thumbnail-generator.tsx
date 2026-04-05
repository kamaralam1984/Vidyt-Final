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
}

export default function ThumbnailGenerator() {
  const [input, setInput] = useState<ThumbnailInput>({
    video_title: '',
    topic: '',
    emotion: 'curiosity',
    niche: 'news'
  });
  
  const [output, setOutput] = useState<ThumbnailOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeVariation, setActiveVariation] = useState(0);

  const emotions = ['curiosity', 'fear', 'urgency', 'shock', 'excitement', 'anger'];
  const niches = ['news', 'entertainment', 'gaming', 'education'];

  const handleGenerate = async () => {
    if (!input.video_title || !input.topic) {
      alert('Please fill in video title and topic');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/ai/thumbnail-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoTitle: input.video_title,
          topic: input.topic,
          emotion: input.emotion,
          niche: input.niche
        }),
      });

      const result: ThumbnailOutput = await response.json();
      setOutput(result);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate thumbnail');
    } finally {
      setLoading(false);
    }
  };

  const allTexts = output ? [output.thumbnail_text, ...output.variations] : [];
  const allScores = output ? output.ctr_scores : [];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-yellow-900/20 animate-pulse" />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-red-500 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.h1 
          className="text-5xl font-bold text-center mb-12 bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          AI Thumbnail Generator
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <motion.div 
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-2xl font-semibold mb-6 text-red-400">🎯 Input Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Video Title</label>
                <input
                  type="text"
                  value={input.video_title}
                  onChange={(e) => setInput({ ...input, video_title: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-red-500/30 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
                  placeholder="Enter your video title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Topic</label>
                <input
                  type="text"
                  value={input.topic}
                  onChange={(e) => setInput({ ...input, topic: e.target.value })}
                  className="w-full px-4 py-3 bg-black/50 border border-red-500/30 rounded-lg focus:border-red-500 focus:outline-none text-white placeholder-gray-500"
                  placeholder="Main topic or keyword..."
                />
              </div>

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

              <motion.button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 rounded-lg font-semibold text-lg hover:from-red-700 hover:to-red-600 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-red-500/25"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? '🔄 Generating...' : '⚡ Generate Thumbnail'}
              </motion.button>
            </div>
          </motion.div>

          {/* Output Section */}
          <motion.div 
            className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-2xl font-semibold mb-6 text-yellow-400">🎨 Generated Thumbnail</h2>
            
            <AnimatePresence mode="wait">
              {output ? (
                <motion.div
                  key="output"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Main Thumbnail Preview */}
                  <div className="relative">
                    <div 
                      className="w-full h-64 rounded-lg bg-gradient-to-br from-red-900 to-black flex items-center justify-center relative overflow-hidden"
                      style={{
                        boxShadow: '0 0 40px rgba(255, 0, 0, 0.3)'
                      }}
                    >
                      {/* Background Effects */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Main Text */}
                      <motion.h3 
                        className="text-4xl font-black text-center text-white px-4 relative z-10"
                        style={{
                          textShadow: '0 0 20px rgba(255, 255, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.8)'
                        }}
                        animate={{
                          scale: [1, 1.05, 1],
                          textShadow: [
                            '0 0 20px rgba(255, 255, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.8)',
                            '0 0 30px rgba(255, 0, 0, 1), 2px 2px 4px rgba(0,0,0,0.8)',
                            '0 0 20px rgba(255, 255, 0, 0.8), 2px 2px 4px rgba(0,0,0,0.8)'
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity
                        }}
                      >
                        {allTexts[activeVariation]}
                      </motion.h3>
                      
                      {/* CTR Score Badge */}
                      <div className="absolute top-4 right-4 bg-green-500 text-black px-3 py-1 rounded-full font-bold text-sm">
                        CTR: {allScores[activeVariation]}%
                      </div>
                    </div>
                  </div>

                  {/* Variations */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-300">🔄 Variations (A/B Testing)</h4>
                    {allTexts.map((text, index) => (
                      <motion.div
                        key={index}
                        onClick={() => setActiveVariation(index)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          activeVariation === index 
                            ? 'bg-red-500/20 border-red-500' 
                            : 'bg-white/5 border-gray-600 hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{text}</span>
                          <span className="text-sm text-gray-400">CTR: {allScores[index]}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">{output.reasoning[index]}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Design Specs */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-300">🎨 Design Specifications</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {output.design.colors.map((color, index) => (
                        <div key={index} className="text-center">
                          <div 
                            className="w-full h-12 rounded-lg border border-gray-600"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-gray-400">{color}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-black/30 p-4 rounded-lg">
                      <p className="text-sm text-gray-300"><strong>Layout:</strong> {output.design.layout}</p>
                      <p className="text-sm text-gray-300 mt-2"><strong>Effects:</strong> {output.design.effects}</p>
                    </div>
                  </div>

                  {/* Image Prompt */}
                  <div className="bg-black/30 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">🖼️ Image Generation Prompt</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{output.image_prompt}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-64 text-gray-500"
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎨</div>
                    <p>Generated thumbnail will appear here</p>
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
