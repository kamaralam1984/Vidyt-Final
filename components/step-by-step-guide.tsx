'use client';

import { motion } from 'framer-motion';
import { Check, ArrowDown, Sparkles, Video, RefreshCw, Send } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Generate SEO Content',
    description: 'Use SEO Generator to create trending content',
    details: '20 Keywords • 10 Titles • 5 Descriptions • 50 Hashtags',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
  },
  {
    number: 2,
    title: 'Click & Auto-Fill',
    description: 'Click any keyword/title/description from SEO box',
    details: 'It auto-fills the Update Video section below',
    icon: ArrowDown,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    number: 3,
    title: 'Select Old Video',
    description: 'Choose which video to update from dropdown',
    details: 'Shows thumbnail & current metadata',
    icon: Video,
    color: 'from-orange-500 to-red-500',
  },
  {
    number: 4,
    title: 'Review Metadata',
    description: 'Check new title, description & tags',
    details: 'Edit if needed before pushing',
    icon: RefreshCw,
    color: 'from-green-500 to-emerald-500',
  },
  {
    number: 5,
    title: 'Push to YouTube',
    description: 'Click "Push to YouTube" button',
    details: 'Updates live - no new upload needed',
    icon: Send,
    color: 'from-red-500 to-pink-500',
  },
  {
    number: 6,
    title: 'Video Updated LIVE ✓',
    description: 'Your video metadata is now live on YouTube',
    details: 'Refresh YouTube to see changes',
    icon: Check,
    color: 'from-green-500 to-blue-500',
  },
];

export default function StepByStepGuide() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#181818] border border-[#212121] rounded-xl p-8"
    >
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          📋 Step-by-Step Workflow
        </h2>
        <p className="text-sm text-[#888]">Follow these steps to update your YouTube videos with SEO-optimized content</p>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-20 w-0.5 h-12 bg-gradient-to-b from-[#FF0000] to-transparent opacity-30" />
              )}

              <div className="flex gap-6">
                {/* Step number circle */}
                <div
                  className={`relative flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-8 h-8 text-white" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF0000] rounded-full border-2 border-[#181818] flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{step.number}</span>
                  </div>
                </div>

                {/* Step content */}
                <div className="flex-1 pt-2">
                  <div className="bg-[#0F0F0F] border border-[#333] rounded-lg p-4 hover:border-[#555] transition-colors">
                    <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-[#AAA] mb-2">{step.description}</p>
                    <p className="text-xs text-[#666]">→ {step.details}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-12 p-6 bg-gradient-to-r from-[#FF0000]/10 to-[#FF6666]/10 border border-[#FF0000]/30 rounded-lg"
      >
        <div className="flex items-start gap-4">
          <Check className="w-6 h-6 text-[#FF0000] flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-white mb-2">Why This Workflow Works:</h4>
            <ul className="text-sm text-[#AAA] space-y-1">
              <li>✓ <strong>No new uploads</strong> - Just update existing videos</li>
              <li>✓ <strong>SEO-optimized</strong> - Uses trending topics & keywords</li>
              <li>✓ <strong>Fast updates</strong> - Live in seconds</li>
              <li>✓ <strong>Keep viewers</strong> - Same video, better metadata</li>
              <li>✓ <strong>Boost discovery</strong> - Better titles & descriptions help YouTube recommend</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
