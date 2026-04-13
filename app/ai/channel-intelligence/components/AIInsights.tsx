import React, { useState } from 'react';
import { Lightbulb, CheckCircle, AlertTriangle, TrendingUp, Sparkles, Loader2, Brain } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

interface ChannelData {
  channelId: string;
  name: string;
  subscribers: number;
  totalViews: number;
  totalVideos: number;
  avgViewsPerVideo: number;
  engagementRate: number;
  growthPercent30d: number;
  uploadFrequency: number;
  niche: string;
  thumbnailUrl?: string;
  aiInsights?: {
    strengths?: string[];
    improvements?: string[];
    strategy?: string[];
    postingTime?: string;
    growthTips?: string[];
  };
}

interface Props {
  channel: ChannelData;
}

function generateFallbackInsights(channel: ChannelData) {
  const insights = {
    strengths: [] as string[],
    improvements: [] as string[],
    strategy: [] as string[],
    postingTime: '',
    growthTips: [] as string[],
  };

  if (channel.subscribers > 500000) insights.strengths.push('Strong subscriber base with significant reach');
  if (channel.engagementRate > 0.05) insights.strengths.push('Exceptional engagement — your audience is highly interactive');
  if (channel.avgViewsPerVideo > 100000) insights.strengths.push('Consistent viewership with substantial views per video');
  if (channel.uploadFrequency > 4) insights.strengths.push('High upload frequency keeps audience engaged');
  if (channel.growthPercent30d > 5) insights.strengths.push('Strong growth momentum — channel is accelerating');
  if (insights.strengths.length === 0) insights.strengths.push('Building foundation — keep growing consistently');

  if (channel.engagementRate < 0.01) insights.improvements.push('Boost engagement with CTAs, respond to comments, encourage interaction');
  if (channel.uploadFrequency < 2) insights.improvements.push('Increase upload frequency to 2-4 times per month');
  if (channel.avgViewsPerVideo < 10000) insights.improvements.push('Optimize titles & thumbnails — A/B test to improve CTR');
  if (channel.subscribers < 10000) insights.improvements.push('Focus on subscriber growth via end screens & cards');
  if (channel.growthPercent30d < 0) insights.improvements.push('Address declining growth — review content strategy');

  insights.strategy.push('Create a content calendar aligned with trending topics in your niche');
  insights.strategy.push('Cross-promote on TikTok, Instagram, and Twitter for discovery');
  insights.strategy.push('Analyze top-performing videos and create more content in that format');

  insights.postingTime = channel.subscribers > 100000
    ? 'Post between 10 AM - 12 PM or 6 PM - 8 PM in your audience\'s timezone'
    : 'Test posting at 10 AM, 1 PM, and 6 PM to find peak engagement hours';

  insights.growthTips = [
    'Use keyword-rich titles and descriptions for YouTube search',
    'Create Shorts from your long-form content for algorithm boost',
    'Collaborate with channels in your niche for cross-promotion',
  ];

  return insights;
}

export default function AIInsights({ channel }: Props) {
  const hasAI = !!channel.aiInsights;
  const insights = hasAI ? channel.aiInsights! : generateFallbackInsights(channel);
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [askLoading, setAskLoading] = useState(false);

  const handleAsk = async () => {
    if (!askQuestion.trim() || askLoading) return;
    setAskLoading(true);
    setAskAnswer('');
    try {
      const res = await axios.post('/api/admin/super/audit', {
        action: 'ask',
        question: askQuestion,
        context: {
          channelName: channel.name,
          subscribers: channel.subscribers,
          totalViews: channel.totalViews,
          engagement: channel.engagementRate,
          niche: channel.niche,
          uploadFrequency: channel.uploadFrequency,
          growth30d: channel.growthPercent30d,
        },
      }, { headers: getAuthHeaders() });
      setAskAnswer(res.data.answer || 'No response received.');
    } catch {
      setAskAnswer('AI is unavailable right now. Please try again later.');
    } finally {
      setAskLoading(false);
    }
  };

  const sections = [
    {
      title: 'Strengths',
      icon: CheckCircle,
      iconColor: 'text-green-400',
      items: insights.strengths || [],
      itemBg: 'bg-green-500/5',
      itemBorder: 'border-green-500/10',
      itemDot: 'bg-green-400',
    },
    {
      title: 'Areas to Improve',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      items: insights.improvements || [],
      itemBg: 'bg-amber-500/5',
      itemBorder: 'border-amber-500/10',
      itemDot: 'bg-amber-400',
    },
    {
      title: 'Content Strategy',
      icon: Lightbulb,
      iconColor: 'text-blue-400',
      items: insights.strategy || [],
      itemBg: 'bg-blue-500/5',
      itemBorder: 'border-blue-500/10',
      itemDot: 'bg-blue-400',
    },
  ];

  return (
    <div className="space-y-3">
      {/* AI Badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          hasAI ? 'bg-purple-500/15 text-purple-400' : 'bg-[#1a1a1a] text-[#555]'
        }`}>
          <Sparkles className="w-3 h-3" />
          {hasAI ? 'AI-Generated Insights' : 'Rule-Based Insights'}
        </span>
      </div>

      {/* Insight Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${section.iconColor}`} />
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.items.length > 0 ? section.items.map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-2.5 p-2.5 rounded-lg ${section.itemBg} border ${section.itemBorder}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${section.itemDot} shrink-0 mt-1.5`} />
                    <span className="text-xs text-[#ccc] leading-relaxed">{item}</span>
                  </div>
                )) : (
                  <p className="text-xs text-[#444]">No data available</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Posting Time + Growth Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Posting Time */}
        <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Best Posting Time
          </h3>
          <div className="p-3 bg-cyan-500/5 rounded-lg border border-cyan-500/10">
            <p className="text-xs text-[#ccc] leading-relaxed">{insights.postingTime || 'Analyze more data for time recommendations'}</p>
          </div>
        </div>

        {/* Growth Tips */}
        {insights.growthTips && insights.growthTips.length > 0 && (
          <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Growth Tips
            </h3>
            <div className="space-y-2">
              {insights.growthTips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span className="text-xs text-[#ccc] leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ask AI */}
      <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          Ask AI About This Channel
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={askQuestion}
            onChange={(e) => setAskQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="e.g. How can this channel improve SEO?"
            className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#252525] rounded-lg text-white text-sm placeholder-[#444] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition"
          />
          <button
            onClick={handleAsk}
            disabled={askLoading || !askQuestion.trim()}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition disabled:opacity-50 shrink-0"
          >
            {askLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
          </button>
        </div>
        {askAnswer && (
          <div className="mt-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
            <p className="text-xs text-[#ccc] leading-relaxed whitespace-pre-wrap">{askAnswer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
