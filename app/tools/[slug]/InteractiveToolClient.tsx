'use client';

import React, { useState } from 'react';
import { SEOTool } from '@/data/seoToolsList';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function InteractiveToolClient({ tool }: { tool: SEOTool }) {
  const [inputVal, setInputVal] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setIsGenerating(true);
    
    // Switch case for API endpoints based on ToolType
    const endpointMap: Record<string, string> = {
      title: '/api/generate/title',
      description: '/api/generate/description',
      hashtag: '/api/generate/tags'
    };

    try {
      const response = await fetch(endpointMap[tool.toolType] || '/api/generate/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: inputVal })
      });
      
      const data = await response.json();
      
      if (data.titles) setResults(data.titles);
      else if (data.description) setResults([data.description]);
      else if (data.hashtags) setResults(data.hashtags);
      else setResults([`Try "${inputVal}" the viral ${tool.category} way!`]);

    } catch (error) {
      console.error(error);
      setResults(['Error generating data. Please try again.']);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="bg-[#0F111A] border border-white/10 rounded-3xl p-8 md:p-12 mb-16 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/10 to-red-900/20 blur-3xl rounded-full" />
      <div className="relative z-10 text-center mb-8">
        <Sparkles className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Try the Live {tool.toolType} Engine</h2>
        <p className="text-white/60">Enter your core keyword to see the magic instantly.</p>
      </div>

      <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto relative z-10">
        <input 
          type="text" 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={`e.g., "${tool.category} beginners guide"`}
          className="flex-grow p-5 rounded-2xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-red-500 transition text-lg"
          required
        />
        <button 
          type="submit" 
          disabled={isGenerating || !inputVal.trim()}
          className="bg-red-600 disabled:bg-gray-600 text-white font-bold px-8 py-5 rounded-2xl hover:bg-red-700 transition flex justify-center items-center gap-2 whitespace-nowrap text-lg"
        >
          {isGenerating ? "Generating API..." : "Generate Instantly"}
          {!isGenerating && <ArrowRight className="h-5 w-5" />}
        </button>
      </form>

      <div className={`mt-10 transition-all duration-700 max-w-4xl mx-auto relative z-10 ${results.length > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 hidden"}`}>
        <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> AI Outputs Ready
        </h3>
        <div className="grid gap-3">
          {results.map((result, idx) => (
            <div key={idx} className="group/item flex justify-between items-center p-4 bg-white/10 border border-white/10 rounded-xl hover:bg-white/15 transition cursor-pointer">
              <span className="font-semibold text-white text-lg">{result}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
