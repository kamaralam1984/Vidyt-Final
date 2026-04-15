import React from 'react';
import NextImage from 'next/image';
import { Users, Eye, Video, TrendingUp, MessageSquare, Upload, ExternalLink } from 'lucide-react';

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
  description?: string;
  bannerUrl?: string;
  recentVideos?: any[];
}

interface Props {
  channel: ChannelData;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default function ChannelOverview({ channel }: Props) {
  const stats = [
    { icon: Users, label: 'Subscribers', value: formatNumber(channel.subscribers), color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { icon: Eye, label: 'Total Views', value: formatNumber(channel.totalViews), color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { icon: Video, label: 'Videos', value: channel.totalVideos.toLocaleString(), color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { icon: TrendingUp, label: 'Avg Views', value: formatNumber(channel.avgViewsPerVideo), color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { icon: MessageSquare, label: 'Engagement', value: (channel.engagementRate * 100).toFixed(2) + '%', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { icon: Upload, label: 'Uploads/mo', value: channel.uploadFrequency.toFixed(1), color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  ];

  return (
    <div className="space-y-4">
      {/* Channel Header Card */}
      <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] overflow-hidden">
        {/* Banner */}
        {channel.bannerUrl && (
          <div className="h-24 sm:h-32 md:h-40 bg-cover bg-center" style={{ backgroundImage: `url(${channel.bannerUrl})` }}>
            <div className="w-full h-full bg-gradient-to-b from-transparent to-[#111]" />
          </div>
        )}

        <div className="p-4 sm:p-6 -mt-8 relative">
          <div className="flex items-start gap-4">
            {channel.thumbnailUrl ? (
              <img
                src={channel.thumbnailUrl}
                alt={channel.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 border-[#111] shadow-xl shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF0000]/20 flex items-center justify-center shrink-0">
                <Users className="w-8 h-8 text-[#FF0000]" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{channel.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="bg-[#FF0000]/15 text-[#FF0000] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {channel.niche}
                </span>
                <a
                  href={`https://youtube.com/channel/${channel.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[#555] hover:text-[#888] flex items-center gap-1 transition"
                >
                  <ExternalLink className="w-3 h-3" /> View on YouTube
                </a>
              </div>
              {channel.description && (
                <p className="text-xs text-[#555] mt-2 line-clamp-2">{channel.description}</p>
              )}
            </div>
          </div>

          {/* Growth Badge */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              channel.growthPercent30d > 3 ? 'bg-green-500/15 text-green-400' :
              channel.growthPercent30d > 0 ? 'bg-blue-500/15 text-blue-400' :
              'bg-red-500/15 text-red-400'
            }`}>
              {channel.growthPercent30d > 0 ? '+' : ''}{channel.growthPercent30d.toFixed(1)}% / 30d
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`bg-[#111] rounded-xl border border-[#1f1f1f] p-3 sm:p-4 hover:border-[#333] transition group`}
            >
              <div className={`${stat.bg} ${stat.border} border w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-110 transition`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold mb-1">{stat.label}</p>
              <p className={`text-lg sm:text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Videos */}
      {channel.recentVideos && channel.recentVideos.length > 0 && (
        <div className="bg-[#111] rounded-2xl border border-[#1f1f1f] p-4 sm:p-5">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Video className="w-4 h-4 text-[#FF0000]" />
            Recent Videos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {channel.recentVideos.slice(0, 6).map((video: any, idx: number) => (
              <a
                key={idx}
                href={`https://youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] transition group"
              >
                {video.thumbnail && (
                  <NextImage src={video.thumbnail} alt="" width={96} height={56} className="w-24 h-14 rounded-md object-cover shrink-0" unoptimized />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white font-medium line-clamp-2 group-hover:text-[#FF0000] transition">{video.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[#555]">{formatNumber(video.views)} views</span>
                    <span className="text-[10px] text-[#555]">{video.engagementRate}%</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
