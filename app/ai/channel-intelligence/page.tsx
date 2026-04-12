'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Search,
  TrendingUp,
  Target,
  BarChart3,
  Brain,
  Clock,
  Award,
  Download,
  Share2,
  Loader2,
} from 'lucide-react';
import ChannelInputForm from './components/ChannelInputForm';
import ChannelOverview from './components/ChannelOverview';
import RankingPanel from './components/RankingPanel';
import RevenueCalculator from './components/RevenueCalculator';
import CompetitorComparison from './components/CompetitorComparison';
import AIInsights from './components/AIInsights';
import GrowthPrediction from './components/GrowthPrediction';

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

interface CompetitorChannel {
  channelId: string;
  name: string;
  subscribers: number;
  totalViews: number;
  avgViewsPerVideo: number;
  engagementRate: number;
  uploadFrequency: number;
}

export default function ChannelIntelligenceHub() {
  const [primaryChannel, setPrimaryChannel] = useState<ChannelData | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChannelAnalyzed = async (channelData: ChannelData) => {
    setLoading(true);
    setError(null);
    try {
      // In a real scenario, this would fetch from your API
      setPrimaryChannel(channelData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze channel');
      setLoading(false);
    }
  };

  const addCompetitor = (competitor: CompetitorChannel) => {
    if (competitors.length < 3) {
      setCompetitors([...competitors, competitor]);
    }
  };

  const removeCompetitor = (channelId: string) => {
    setCompetitors(competitors.filter((c) => c.channelId !== channelId));
  };

  const exportReport = () => {
    // TODO: Implement PDF export
    alert('Report export feature coming soon!');
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  <Target className="w-10 h-10 text-blue-400" />
                  Channel Intelligence Hub
                </h1>
                <p className="text-gray-400">
                  Analyze your YouTube channel, rank against competitors, and predict growth
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={exportReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          {/* Main Content */}
          {!primaryChannel ? (
            <div className="mb-12">
              <ChannelInputForm onChannelAnalyzed={handleChannelAnalyzed} isLoading={loading} />
            </div>
          ) : (
            <>
              {/* Channel Overview */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Search className="w-6 h-6 text-blue-400" />
                  Channel Overview
                </h2>
                <ChannelOverview channel={primaryChannel} />
              </div>

              {/* Ranking & Revenue Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Ranking Panel */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Award className="w-6 h-6 text-amber-400" />
                    Channel Rank
                  </h2>
                  <RankingPanel channel={primaryChannel} />
                </div>

                {/* Revenue Calculator */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    Revenue Estimate
                  </h2>
                  <RevenueCalculator channel={primaryChannel} />
                </div>
              </div>

              {/* AI Insights & Growth Prediction Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* AI Insights */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-400" />
                    AI Insights
                  </h2>
                  <AIInsights channel={primaryChannel} />
                </div>

                {/* Growth Prediction */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-cyan-400" />
                    Growth Prediction
                  </h2>
                  <GrowthPrediction channel={primaryChannel} />
                </div>
              </div>

              {/* Competitor Comparison */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-red-400" />
                  Competitor Comparison
                </h2>
                <CompetitorComparison
                  primaryChannel={primaryChannel}
                  competitors={competitors}
                  onAddCompetitor={addCompetitor}
                  onRemoveCompetitor={removeCompetitor}
                />
              </div>

              {/* Back to Analysis */}
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => {
                    setPrimaryChannel(null);
                    setCompetitors([]);
                  }}
                  className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition"
                >
                  ← Analyze New Channel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
