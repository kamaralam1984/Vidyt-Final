import React from 'react';
import { Lightbulb, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

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
}

interface Props {
  channel: ChannelData;
}

function generateInsights(channel: ChannelData) {
  const insights = {
    strengths: [] as string[],
    improvements: [] as string[],
    strategy: [] as string[],
    postingTime: '',
  };

  // Analyze strengths
  if (channel.subscribers > 500000) {
    insights.strengths.push('🏆 Strong subscriber base - You have significant reach');
  }
  if (channel.engagementRate > 0.05) {
    insights.strengths.push('🔥 Exceptional engagement - Your audience is highly interactive');
  }
  if (channel.avgViewsPerVideo > 100000) {
    insights.strengths.push('📊 Consistent viewership - Each video attracts substantial views');
  }
  if (channel.uploadFrequency > 4) {
    insights.strengths.push('⚡ High upload frequency - Regular content keeps audience engaged');
  }
  if (channel.growthPercent30d > 5) {
    insights.strengths.push('🚀 Strong growth momentum - Your channel is accelerating');
  }

  // Analyze improvements
  if (channel.engagementRate < 0.01) {
    insights.improvements.push('💬 Boost engagement - Add CTAs, respond to comments, encourage interaction');
  }
  if (channel.uploadFrequency < 2) {
    insights.improvements.push('📅 Increase upload frequency - Try uploading 2-4 times per month');
  }
  if (channel.avgViewsPerVideo < 10000) {
    insights.improvements.push('🎯 Optimize titles & thumbnails - A/B test to improve CTR');
  }
  if (channel.subscribers < 10000) {
    insights.improvements.push('👥 Focus on subscriber growth - Use end screens & cards effectively');
  }
  if (channel.growthPercent30d < 0) {
    insights.improvements.push('📉 Address declining growth - Review content strategy & audience feedback');
  }

  // Strategy recommendations
  if (channel.niche === 'Technology') {
    insights.strategy.push('💡 Focus on tutorials and industry news - Tech audiences value educational content');
    insights.strategy.push('⏰ Post reviews alongside product launches - Capitalize on trending topics');
  } else if (channel.niche === 'Gaming') {
    insights.strategy.push('🎮 Create playthroughs of trending games - Follow game release schedules');
    insights.strategy.push('⭐ Collaborate with other gaming channels - Cross-promote to grow audience');
  } else if (channel.niche === 'Entertainment') {
    insights.strategy.push('🎬 Follow entertainment news cycles - Create react/review content on trending topics');
    insights.strategy.push('🤝 Partner with other creators - Duets and collaborations drive discovery');
  } else {
    insights.strategy.push('📌 Create a content calendar - Plan content around seasonal trends');
    insights.strategy.push('🔗 Cross-promote on other platforms - Drive traffic from TikTok, Instagram, Twitter');
  }

  // Best posting time (based on general patterns)
  const hour = new Date().getHours();
  if (channel.subscribers > 100000) {
    insights.postingTime = '📺 Post at 10 AM - 12 PM or 6 PM - 8 PM in your audience\'s timezone';
  } else {
    insights.postingTime = '⏰ Test posting times: Try 10 AM, 1 PM, and 6 PM to find peak engagement hours';
  }

  if (insights.strengths.length === 0) {
    insights.strengths.push('💪 Keep growing! Every channel starts somewhere.');
  }

  return insights;
}

export default function AIInsights({ channel }: Props) {
  const insights = generateInsights(channel);

  return (
    <div className="space-y-6">
      {/* Strengths */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Your Strengths
        </h3>
        <div className="space-y-3">
          {insights.strengths.map((strength, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <span className="text-lg">✓</span>
              <span className="text-sm text-gray-300">{strength}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Areas for Improvement */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Areas to Improve
        </h3>
        <div className="space-y-3">
          {insights.improvements.length > 0 ? (
            insights.improvements.map((improvement, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <span className="text-lg">→</span>
                <span className="text-sm text-gray-300">{improvement}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">Your channel is performing well across all metrics!</p>
          )}
        </div>
      </div>

      {/* Content Strategy */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-400" />
          Content Strategy
        </h3>
        <div className="space-y-3">
          {insights.strategy.map((strategy, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <span className="text-lg">💡</span>
              <span className="text-sm text-gray-300">{strategy}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best Posting Time */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Optimal Posting Time
        </h3>
        <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
          <p className="text-gray-300">{insights.postingTime}</p>
        </div>
      </div>
    </div>
  );
}
