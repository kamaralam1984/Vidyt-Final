'use client';

import React, { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useTranslations } from '@/context/translations';
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
  CheckCircle,
  ArrowLeft,
  Sparkles,
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
  description?: string;
  bannerUrl?: string;
  recentVideos?: any[];
  aiInsights?: any;
  audit?: any;
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
  const { t } = useTranslations();
  const [primaryChannel, setPrimaryChannel] = useState<ChannelData | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectionFlags, setSectionFlags] = useState<Record<string, boolean>>({});
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('overview');

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setLoadingFlags(false); return; }
        const res = await fetch('/api/admin/channel-intelligence-sections', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.sections) setSectionFlags(data.sections);
        }
      } catch {
        // Fallback: show all sections
      } finally {
        setLoadingFlags(false);
      }
    };
    fetchFlags();
  }, []);

  const handleChannelAnalyzed = async (channelData: ChannelData) => {
    setLoading(true);
    setError(null);
    try {
      setPrimaryChannel(channelData);
      setActiveSection('overview');
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

  const [exporting, setExporting] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  const exportReport = useCallback(async () => {
    if (!primaryChannel || exporting) return;
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const ch = primaryChannel;

      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246);
      doc.text('Channel Intelligence Report', 20, 25);

      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 33);

      doc.setDrawColor(200);
      doc.line(20, 37, 190, 37);

      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text(ch.name, 20, 48);
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Niche: ${ch.niche || 'N/A'}`, 20, 55);

      const stats = [
        ['Subscribers', ch.subscribers?.toLocaleString() || '0'],
        ['Total Views', ch.totalViews?.toLocaleString() || '0'],
        ['Total Videos', ch.totalVideos?.toLocaleString() || '0'],
        ['Avg Views/Video', ch.avgViewsPerVideo?.toLocaleString() || '0'],
        ['Engagement Rate', `${(ch.engagementRate || 0).toFixed(2)}%`],
        ['30d Growth', `${(ch.growthPercent30d || 0).toFixed(2)}%`],
        ['Upload Frequency', `${ch.uploadFrequency || 0} videos/month`],
      ];

      let y = 68;
      doc.setFontSize(13);
      doc.setTextColor(59, 130, 246);
      doc.text('Channel Statistics', 20, y);
      y += 8;

      stats.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(`${label}:`, 25, y);
        doc.setTextColor(30, 30, 30);
        doc.text(value, 100, y);
        y += 7;
      });

      if (competitors.length > 0) {
        y += 8;
        doc.setFontSize(13);
        doc.setTextColor(59, 130, 246);
        doc.text('Competitor Comparison', 20, y);
        y += 8;
        competitors.forEach((comp) => {
          doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
          doc.text(`${comp.name} — ${comp.subscribers?.toLocaleString()} subs, ${(comp.engagementRate || 0).toFixed(2)}% engagement`, 25, y);
          y += 7;
        });
      }

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Powered by Vid YT — Channel Intelligence Hub', 20, 285);

      doc.save(`${ch.name.replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [primaryChannel, competitors, exporting]);

  const handleShare = useCallback(async () => {
    if (!primaryChannel) return;
    const text = `Check out ${primaryChannel.name} on Vid YT!\n${primaryChannel.subscribers?.toLocaleString()} subscribers • ${primaryChannel.totalViews?.toLocaleString()} views • ${(primaryChannel.engagementRate || 0).toFixed(2)}% engagement`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${primaryChannel.name} — Channel Report`, text });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(text);
      setShareMsg('Copied!');
      setTimeout(() => setShareMsg(''), 2000);
    }
  }, [primaryChannel]);

  const sections = [
    { id: 'overview', label: 'Overview', icon: Search, flag: 'ci_channel_overview' },
    { id: 'ranking', label: 'Ranking', icon: Award, flag: 'ci_ranking_panel' },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp, flag: 'ci_revenue_calculator' },
    { id: 'insights', label: 'AI Insights', icon: Brain, flag: 'ci_ai_insights' },
    { id: 'growth', label: 'Growth', icon: Clock, flag: 'ci_growth_prediction' },
    { id: 'competitors', label: 'Competitors', icon: BarChart3, flag: 'ci_competitor_comparison' },
  ];

  const visibleSections = sections.filter(s => !loadingFlags && sectionFlags[s.flag] !== false);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {primaryChannel && (
                  <button
                    onClick={() => { setPrimaryChannel(null); setCompetitors([]); }}
                    className="p-2 rounded-lg bg-[#181818] border border-[#252525] text-[#888] hover:text-white hover:border-[#333] transition shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 truncate">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF0000] shrink-0" />
                    <span className="truncate">{primaryChannel ? primaryChannel.name : 'Channel Intelligence'}</span>
                  </h1>
                  <p className="text-xs text-[#555] mt-0.5 hidden sm:block">
                    {primaryChannel ? `${primaryChannel.niche} • ${primaryChannel.subscribers?.toLocaleString()} subscribers` : 'Deep YouTube channel analysis powered by AI'}
                  </p>
                </div>
              </div>
              {primaryChannel && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={exportReport}
                    disabled={exporting}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#FF0000] hover:bg-[#cc0000] text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {exporting ? 'Exporting...' : 'Export PDF'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#181818] border border-[#252525] text-[#aaa] hover:text-white hover:border-[#333] text-xs font-bold transition"
                  >
                    {shareMsg ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    {shareMsg || 'Share'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Main Content */}
          {!primaryChannel ? (
            <>
              {(!loadingFlags && sectionFlags.ci_channel_input !== false) && (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <ChannelInputForm onChannelAnalyzed={handleChannelAnalyzed} isLoading={loading} />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Section Tabs - Scrollable on mobile */}
              <div className="mb-6 -mx-4 sm:mx-0 px-4 sm:px-0">
                <div className="flex gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                  {visibleSections.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveSection(id)}
                      className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        activeSection === id
                          ? 'bg-[#FF0000] text-white shadow-lg shadow-red-600/20'
                          : 'bg-[#141414] text-[#666] hover:text-white hover:bg-[#1a1a1a] border border-[#1a1a1a]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Section Content */}
              {activeSection === 'overview' && sectionFlags.ci_channel_overview !== false && (
                <ChannelOverview channel={primaryChannel} />
              )}

              {activeSection === 'ranking' && sectionFlags.ci_ranking_panel !== false && (
                <RankingPanel channel={primaryChannel} />
              )}

              {activeSection === 'revenue' && sectionFlags.ci_revenue_calculator !== false && (
                <RevenueCalculator channel={primaryChannel} />
              )}

              {activeSection === 'insights' && sectionFlags.ci_ai_insights !== false && (
                <AIInsights channel={primaryChannel} />
              )}

              {activeSection === 'growth' && sectionFlags.ci_growth_prediction !== false && (
                <GrowthPrediction channel={primaryChannel} />
              )}

              {activeSection === 'competitors' && sectionFlags.ci_competitor_comparison !== false && (
                <CompetitorComparison
                  primaryChannel={primaryChannel}
                  competitors={competitors}
                  onAddCompetitor={addCompetitor}
                  onRemoveCompetitor={removeCompetitor}
                />
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
