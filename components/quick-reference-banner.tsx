'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lightbulb, X } from 'lucide-react';
import { useState } from 'react';

export default function QuickReferenceBanner() {
  const [expanded, setExpanded] = useState(true);

  const steps = [
    { emoji: '✨', text: 'Generate 20 keywords, 10 titles, 5 descriptions, 50 hashtags' },
    { emoji: '🖱️', text: 'Click any keyword/title from the SEO Generator' },
    { emoji: '📝', text: 'It auto-fills the "Update Existing Videos" section' },
    { emoji: '📹', text: 'Select which old video to update' },
    { emoji: '✅', text: 'Review & edit the new metadata' },
    { emoji: '🚀', text: 'Click "Push to YouTube" to update LIVE' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#FF0000]/20 to-[#FF6666]/10 border border-[#FF0000]/30 rounded-lg overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#FF0000]/5 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <Lightbulb className="w-5 h-5 text-[#FF0000] flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-white">Quick Reference</h3>
            <p className="text-xs text-[#AAA]">Step-by-step to update YouTube videos with SEO content</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-[#FF0000] transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#FF0000]/20 px-6 py-4 bg-[#0F0F0F]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 bg-[#181818] rounded-lg border border-[#333] hover:border-[#555] transition-colors"
                >
                  <span className="text-xl flex-shrink-0">{step.emoji}</span>
                  <p className="text-xs text-[#AAA] pt-0.5">{step.text}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded text-xs text-[#AAA] flex items-start gap-2">
              <span className="flex-shrink-0">💡</span>
              <span>
                <strong>Pro Tip:</strong> No new uploads needed! Just update old video metadata with SEO-optimized content. Your videos stay the same, but with better titles, descriptions & tags for YouTube's algorithm.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
