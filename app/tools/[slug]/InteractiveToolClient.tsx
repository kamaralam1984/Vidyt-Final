'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SEOTool } from '@/data/seoToolsList';
import { ArrowRight, Sparkles, CheckCircle2, Copy, Check } from 'lucide-react';
import FeatureGate from '@/components/FeatureGate';
import { useUser } from '@/hooks/useUser';

const ENDPOINT_MAP: Record<string, string> = {
  title: '/api/generate/title',
  description: '/api/generate/description',
  hashtag: '/api/generate/tags',
};

export default function InteractiveToolClient({ tool }: { tool: SEOTool }) {
  const [inputVal, setInputVal] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const router = useRouter();
  const { user } = useUser();

  const isLoggedIn = !!user;
  const isPro = user?.subscription !== 'free' && !!user;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setIsGenerating(true);
    setResults([]);

    try {
      const endpoint = ENDPOINT_MAP[tool.toolType] || '/api/generate/title';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: inputVal }),
      });

      const data = await response.json();

      if (data.titles) setResults(data.titles);
      else if (data.description) setResults([data.description]);
      else if (data.hashtags) setResults(data.hashtags);
      else setResults([`Try "${inputVal}" the viral ${tool.category} way!`]);
    } catch (error) {
      console.error(error);
      setResults(['Error generating. Please try again.']);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {}
  };

  return (
    <section className="bg-[#0F111A] border border-white/10 rounded-3xl p-8 md:p-12 mb-16 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/10 to-red-900/20 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 text-center mb-8">
        <Sparkles className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Try the Live {tool.toolType} Engine
        </h2>
        <p className="text-white/60">Enter your keyword to see AI results instantly.</p>
      </div>

      <form
        onSubmit={handleGenerate}
        className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto relative z-10"
      >
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
          className="bg-red-600 disabled:opacity-50 text-white font-bold px-8 py-5 rounded-2xl hover:bg-red-700 transition flex justify-center items-center gap-2 whitespace-nowrap text-lg"
        >
          {isGenerating ? 'Generating…' : 'Generate Instantly'}
          {!isGenerating && <ArrowRight className="h-5 w-5" />}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-10 max-w-4xl mx-auto relative z-10">
          <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> AI Outputs Ready
          </h3>

          <FeatureGate
            items={results}
            visibleCount={2}
            isLoggedIn={isLoggedIn}
            isPro={isPro}
            feature={tool.title}
            onLoginClick={() => router.push('/auth?ref=tool-gate')}
            onUpgradeClick={() => router.push('/pricing?ref=tool-gate')}
          >
            {(result, idx) => (
              <div
                key={idx}
                className="group/item flex justify-between items-center p-4 bg-white/10 border border-white/10 rounded-xl hover:bg-white/15 transition"
              >
                <span className="font-semibold text-white text-base flex-1">{result}</span>
                <button
                  onClick={() => handleCopy(result, idx)}
                  className="ml-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition opacity-0 group-hover/item:opacity-100"
                  title="Copy"
                >
                  {copiedIdx === idx ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-white/60" />
                  )}
                </button>
              </div>
            )}
          </FeatureGate>
        </div>
      )}
    </section>
  );
}
