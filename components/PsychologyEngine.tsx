'use client';

import { motion } from 'framer-motion';
import { Brain, Eye, Heart, Zap, TrendingUp, Users } from 'lucide-react';

interface Props {
  viralScore: number;
  hookScore: number;
  titleScore: number;
  confidenceLevel: number;
}

function MiniGauge({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export default function PsychologyEngine({ viralScore, hookScore, titleScore, confidenceLevel }: Props) {
  const emotionalImpact = Math.round(hookScore * 0.4 + viralScore * 0.3 + titleScore * 0.3);
  const curiosityScore = Math.round(titleScore * 0.5 + viralScore * 0.3 + hookScore * 0.2);
  const storytellingStrength = Math.round(hookScore * 0.6 + confidenceLevel * 0.4);
  const viewerIntent = Math.round(viralScore * 0.5 + titleScore * 0.3 + confidenceLevel * 0.2);

  const metrics = [
    {
      label: 'Emotional Impact',
      value: emotionalImpact,
      icon: Heart,
      color: '#f43f5e',
      desc: emotionalImpact >= 70 ? 'Strong emotional pull — viewers feel compelled to watch' : emotionalImpact >= 45 ? 'Moderate — tweak your hook for stronger emotional connection' : 'Weak — add curiosity, stakes, or relatable pain in the first 5 seconds',
    },
    {
      label: 'Curiosity Score',
      value: curiosityScore,
      icon: Eye,
      color: '#f59e0b',
      desc: curiosityScore >= 70 ? 'High curiosity gap — title creates a "need to know" feeling' : curiosityScore >= 45 ? 'Decent curiosity — sharpen the promise in your title' : 'Low curiosity — your title answers itself, leaving nothing to discover',
    },
    {
      label: 'Storytelling Strength',
      value: storytellingStrength,
      icon: Brain,
      color: '#8b5cf6',
      desc: storytellingStrength >= 70 ? 'Compelling narrative structure — viewers stay for the story' : storytellingStrength >= 45 ? 'Average structure — add tension or a clear transformation arc' : 'Weak story structure — viewers have no reason to stay past 30 seconds',
    },
    {
      label: 'Viewer Intent Match',
      value: viewerIntent,
      icon: Users,
      color: '#3b82f6',
      desc: viewerIntent >= 70 ? 'Strong intent match — your content delivers what viewers want' : viewerIntent >= 45 ? 'Partial match — be more specific about who this video is for' : 'Mismatch — your title and content may attract the wrong audience',
    },
  ];

  const topInsight = emotionalImpact >= curiosityScore && emotionalImpact >= storytellingStrength
    ? 'Focus on emotional triggers — your hook needs to create a felt response in the first 5 seconds.'
    : curiosityScore >= storytellingStrength
    ? 'Curiosity gap is your strongest lever — keep teasing the payoff without giving it away.'
    : 'Storytelling structure is your edge — build tension early and pay it off at the end.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
      style={{ background: 'rgba(12,12,12,0.98)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)' }} />

      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Audience Psychology Engine</h2>
            <p className="text-[11px] text-[#555]">Why viewers will — or won&apos;t — watch your video</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                    <span className="text-xs font-semibold text-white">{m.label}</span>
                  </div>
                  <span className="text-xs font-black" style={{ color: m.color }}>{m.value}%</span>
                </div>
                <MiniGauge value={m.value} color={m.color} />
                <p className="text-[10px] text-[#555] mt-2 leading-relaxed">{m.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="flex items-start gap-3 bg-purple-500/[0.05] border border-purple-500/10 rounded-xl p-4">
          <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-purple-300 mb-1">Key Psychological Insight</p>
            <p className="text-xs text-[#888] leading-relaxed">{topInsight}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
