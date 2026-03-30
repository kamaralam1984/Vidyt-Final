import React from 'react';
import { Users, Eye, Video, TrendingUp, MessageSquare } from 'lucide-react';

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

export default function ChannelOverview({ channel }: Props) {
  const stats = [
    {
      icon: Users,
      label: 'Subscribers',
      value: channel.subscribers.toLocaleString(),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Eye,
      label: 'Total Views',
      value: (channel.totalViews / 1000000).toFixed(1) + 'M',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Video,
      label: 'Total Videos',
      value: channel.totalVideos.toString(),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: TrendingUp,
      label: 'Avg Views/Video',
      value: (channel.avgViewsPerVideo / 1000).toFixed(0) + 'K',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      icon: MessageSquare,
      label: 'Engagement Rate',
      value: (channel.engagementRate * 100).toFixed(2) + '%',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: TrendingUp,
      label: '30-Day Growth',
      value: (channel.growthPercent30d > 0 ? '+' : '') + channel.growthPercent30d.toFixed(2) + '%',
      color: channel.growthPercent30d > 0 ? 'text-green-400' : 'text-red-400',
      bgColor: channel.growthPercent30d > 0 ? 'bg-green-500/10' : 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Channel Header */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-xl">
        <div className="flex items-start gap-6">
          {channel.thumbnailUrl && (
            <img
              src={channel.thumbnailUrl}
              alt={channel.name}
              className="w-24 h-24 rounded-full border-2 border-blue-500/30"
            />
          )}
          <div className="flex-1">
            <h3 className="text-3xl font-bold text-white mb-2">{channel.name}</h3>
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                {channel.niche}
              </span>
              <span>Channel ID: {channel.channelId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl hover:border-slate-600/50 transition group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg group-hover:scale-110 transition`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <h4 className="text-gray-400 text-sm font-medium mb-2">{stat.label}</h4>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
        <h4 className="text-white font-semibold mb-4">Upload Statistics</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Average Upload Frequency</span>
            <span className="text-white font-semibold">
              {channel.uploadFrequency.toFixed(1)} videos/month
            </span>
          </div>
          <div className="w-full bg-slate-700/30 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full"
              style={{ width: `${Math.min((channel.uploadFrequency / 10) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
