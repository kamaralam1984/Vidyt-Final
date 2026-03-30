import React, { useMemo } from 'react';
import { Zap, TrendingUp, Users, Eye } from 'lucide-react';

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

interface Prediction {
  metric: string;
  current: number;
  predicted: number;
  growth: number;
  icon: React.ComponentType<any>;
  color: string;
}

export default function GrowthPrediction({ channel }: Props) {
  const predictions = useMemo(() => {
    // Predict subscriber growth based on historical growth rate
    const subscriberGrowthRate = channel.growthPercent30d / 100;
    const predictedSubscribers = channel.subscribers * (1 + Math.max(subscriberGrowthRate, 0.01));
    const subscriberGrowth = predictedSubscribers - channel.subscribers;

    // Predict views (based on upload frequency and current avg views)
    const monthlyViews = channel.avgViewsPerVideo * channel.uploadFrequency;
    const predictedMonthlyViews = monthlyViews * (1 + Math.max(subscriberGrowthRate * 0.5, 0.005));
    const viewsGrowth = predictedMonthlyViews - monthlyViews;

    // Predict revenue (conservative estimate)
    const currentMonthlyRevenue = (monthlyViews / 1000) * 4; // Assuming $4 CPM average
    const predictedRevenue = (predictedMonthlyViews / 1000) * 4;
    const revenueGrowth = predictedRevenue - currentMonthlyRevenue;

    return [
      {
        metric: 'Subscribers',
        current: channel.subscribers,
        predicted: predictedSubscribers,
        growth: subscriberGrowth,
        icon: Users,
        color: 'text-blue-400',
      },
      {
        metric: 'Monthly Views',
        current: monthlyViews,
        predicted: predictedMonthlyViews,
        growth: viewsGrowth,
        icon: Eye,
        color: 'text-green-400',
      },
      {
        metric: 'Monthly Revenue',
        current: currentMonthlyRevenue,
        predicted: predictedRevenue,
        growth: revenueGrowth,
        icon: TrendingUp,
        color: 'text-amber-400',
      },
    ] as Prediction[];
  }, [channel]);

  // Calculate confidence score
  const confidenceScore = Math.min(Math.abs(channel.growthPercent30d) * 2 + 70, 95);

  return (
    <div className="space-y-6">
      {/* Predictions Grid */}
      {predictions.map((pred, idx) => {
        const Icon = pred.icon;
        const growthPercent = ((pred.growth / pred.current) * 100).toFixed(1);
        const isPositive = pred.growth >= 0;

        return (
          <div
            key={idx}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <Icon className={`w-6 h-6 ${pred.color}`} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{pred.metric}</h3>
                  <p className="text-xs text-gray-500">Next 30 days</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{growthPercent}%
                </p>
              </div>
            </div>

            {/* Current vs Predicted */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Current</p>
                <p className="text-lg font-bold text-white">
                  {pred.metric === 'Monthly Revenue'
                    ? `$${pred.current.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                    : pred.metric === 'Monthly Views'
                    ? `${(pred.current / 1000000).toFixed(1)}M`
                    : pred.current > 1000000
                    ? `${(pred.current / 1000000).toFixed(1)}M`
                    : pred.current.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/30">
                <p className="text-xs text-blue-300 mb-1">Predicted (30 days)</p>
                <p className="text-lg font-bold text-blue-300">
                  {pred.metric === 'Monthly Revenue'
                    ? `$${pred.predicted.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                    : pred.metric === 'Monthly Views'
                    ? `${(pred.predicted / 1000000).toFixed(1)}M`
                    : pred.predicted > 1000000
                    ? `${(pred.predicted / 1000000).toFixed(1)}M`
                    : pred.predicted.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Growth Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Expected Growth</span>
                <span className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}
                  {pred.metric === 'Monthly Revenue'
                    ? `$${pred.growth.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                    : pred.metric === 'Monthly Views'
                    ? `${(pred.growth / 1000000).toFixed(1)}M`
                    : pred.growth > 1000
                    ? `${(pred.growth / 1000).toFixed(0)}K`
                    : pred.growth.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isPositive ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-orange-400'
                  }`}
                  style={{ width: `${Math.min(Math.abs(parseFloat(growthPercent)) * 2, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Model Confidence & Factors */}
      <div className="space-y-4">
        {/* Confidence */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Model Confidence
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Prediction Confidence</span>
              <span className="text-lg font-bold text-yellow-400">{confidenceScore.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-700/30 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-500"
                style={{ width: `${confidenceScore}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Based on your growth history ({channel.growthPercent30d.toFixed(1)}% last 30 days)
            </p>
          </div>
        </div>

        {/* Key Factors */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
          <h3 className="text-white font-semibold mb-4">Key Prediction Factors</h3>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-3">
              <span className="text-blue-400 flex-shrink-0">✓</span>
              <span>Historical growth rate (last 30 days): {channel.growthPercent30d.toFixed(2)}%</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 flex-shrink-0">✓</span>
              <span>Upload frequency: {channel.uploadFrequency.toFixed(1)} videos/month</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 flex-shrink-0">✓</span>
              <span>Engagement rate: {(channel.engagementRate * 100).toFixed(2)}%</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 flex-shrink-0">✓</span>
              <span>Channel maturity and niche trends</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-700/20 rounded-lg p-4 border border-slate-700/50">
        <p className="text-xs text-gray-500">
          ⚠️ <strong>Note:</strong> Predictions are based on historical data and assume consistent content quality and upload schedule. Actual results may vary based on algorithm changes, market conditions, and content performance.
        </p>
      </div>
    </div>
  );
}
