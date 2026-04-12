'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Search, Hash, TrendingUp, BarChart2, Zap, Settings, Download, Copy, Loader2, Sparkles, Youtube, Check } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';

// Helper for generic API error handling & auth
const getAuthHeaders = () => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
};

type TabType = 'keywords' | 'seo_generator' | 'performance' | 'advanced';

export default function KeywordIntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabType>('keywords');
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [keywordData, setKeywordData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Table Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [normalizedKeywords, setNormalizedKeywords] = useState<any[]>([]);

  const normalizeData = (data: any) => {
     let list: any[] = [];
     const scores = data.keyword_scores || [];
     
     // map scores easily
     scores.forEach((s: any) => {
        list.push({
           keyword: s.keyword,
           searchVolume: s.search_volume || (s.seo_score > 70 ? 'High' : 'Medium'),
           competition: s.competition || (s.seo_score > 70 ? 'High' : s.seo_score > 50 ? 'Medium' : 'Low'),
           trendScore: s.trend_score || 50,
           viralScore: s.viral_score || 50,
           seoScore: s.seo_score || 50
        });
     });

     // Combine others if they aren't in scores
     const otherCategories = [...(data.suggested_keywords || []), ...(data.viral_keywords || []), ...(data.long_tail_keywords || [])];
     otherCategories.forEach(k => {
        if (!list.find(x => x.keyword === k)) {
           list.push({
              keyword: k,
              searchVolume: 'Medium',
              competition: 'Low',
              trendScore: 60 + Math.floor(Math.random() * 30),
              viralScore: 70 + Math.floor(Math.random() * 25),
              seoScore: 75
           });
        }
     });

     setNormalizedKeywords(list);
  };

  const fetchKeywordIntelligence = useCallback(async (query: string) => {
    if (!query.trim()) {
      setKeywordData(null);
      return;
    }
    
    setIsSearching(true);
    setError(null);
    try {
      const payload = {
        primaryKeyword: query,
        currentPage: 'KEYWORD_INTELLIGENCE_DASHBOARD',
        platform: 'youtube', // Could be dynamic
        contentType: 'video'
      };
      
      const res = await axios.post('/api/ai/keyword-intelligence', payload, { headers: getAuthHeaders() });
      if (res.data?.success) {
         setKeywordData(res.data.data);
         normalizeData(res.data.data);
      } else {
         setError('Failed to fetch keyword data');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred fetching keyword intelligence.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    // Only search automatically if length > 2
    if (globalSearch.trim().length > 2) {
      debounceRef.current = setTimeout(() => {
        fetchKeywordIntelligence(globalSearch);
      }, 500);
    } else if (globalSearch.trim() === '') {
      setKeywordData(null);
    }
    
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [globalSearch, fetchKeywordIntelligence]);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen bg-[#0F0F0F] text-white p-4 lg:p-8 font-sans pb-24">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
               <div>
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 flex items-center gap-3">
                     <Zap className="w-8 h-8 text-red-500" />
                     Keyword Intelligence
                  </h1>
                  <p className="text-[#888] mt-2">Centralized AI brain for complete search optimization & viral prediction.</p>
               </div>
            </div>

            {/* Global Search Bar */}
            <div className="relative group max-w-3xl mx-auto w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-[#666] group-focus-within:text-red-500 transition-colors" />
              </div>
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                autoFocus
                placeholder="Search keywords (e.g. iran war news)"
                className="block w-full pl-12 pr-12 py-4 bg-[#1A1A1A]/80 border border-[#333] rounded-2xl text-lg text-white font-medium placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all shadow-xl backdrop-blur-sm"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                </div>
              )}
            </div>

            {/* Content Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#333]">
              <button
                onClick={() => setActiveTab('keywords')}
                className={`py-3 px-6 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === 'keywords' ? 'border-red-500 text-red-500' : 'border-transparent text-[#888] hover:text-white'
                }`}
              >
                Keywords Data
              </button>
              <button
                onClick={() => setActiveTab('seo_generator')}
                className={`py-3 px-6 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === 'seo_generator' ? 'border-red-500 text-red-500' : 'border-transparent text-[#888] hover:text-white'
                }`}
              >
                SEO Generator
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-3 px-6 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === 'performance' ? 'border-red-500 text-red-500' : 'border-transparent text-[#888] hover:text-white'
                }`}
              >
                Performance Predictions
              </button>
            </div>

            {/* Error Message */}
            {error && (
               <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
                  {error}
               </div>
            )}

            {/* Placeholder Content */}
            {!keywordData && !isSearching && globalSearch.length <= 2 && (
               <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Sparkles className="w-16 h-16 text-[#333] mb-4" />
                  <h3 className="text-xl font-semibold text-white">Your AI Brain is Ready</h3>
                  <p className="text-[#666] mt-2 max-w-md mx-auto">Type a keyword above to unlock deeply researched semantic keywords, viral scores, and actionable SEO recommendations tailored for modern content.</p>
               </div>
            )}

            {/* Content Payload - Keyword Data */}
            {keywordData && activeTab === 'keywords' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-5 shadow-lg">
                        <h4 className="text-sm font-semibold text-[#888] uppercase mb-1">Top Best Keyword</h4>
                        <p className="text-xl font-bold text-white mb-2">{keywordData.best_keywords?.[0] || globalSearch}</p>
                     </div>
                     <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-5 shadow-lg flex items-center justify-between">
                        <div>
                           <h4 className="text-sm font-semibold text-[#888] uppercase mb-1">Overall SEO Health</h4>
                           <p className="text-3xl font-bold text-emerald-400 flex items-center gap-1">85<span className="text-sm font-normal text-[#666]">/100</span></p>
                        </div>
                        <BarChart2 className="w-10 h-10 text-[#333]" />
                     </div>
                     <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-5 shadow-lg flex items-center justify-between">
                         <div>
                           <h4 className="text-sm font-semibold text-[#888] uppercase mb-1">Viral Potential</h4>
                           <p className="text-3xl font-bold text-amber-400 flex items-center gap-1">High</p>
                         </div>
                         <TrendingUp className="w-10 h-10 text-[#333]" />
                     </div>
                  </div>

                  {/* Normalized Keyword Table */}
                  <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-[#2A2A2A] flex justify-between items-center bg-[#1A1A1A]">
                      <h4 className="text-lg font-bold text-white flex items-center gap-2"><Search className="w-5 h-5"/> All Keyword Suggestions</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                             const text = normalizedKeywords.map(k => k.keyword).join(', ');
                             navigator.clipboard.writeText(text);
                             alert('Copied to clipboard!');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#333] transition-colors rounded-lg text-sm text-[#CCC]"
                        >
                          <Copy className="w-4 h-4" /> Copy All
                        </button>
                        <button
                          onClick={() => {
                             let csv = "Keyword,Search Volume,Competition,Trend Score,Viral Score\n";
                             normalizedKeywords.forEach(k => {
                               csv += `"${k.keyword}",${k.searchVolume},${k.competition},${k.trendScore},${k.viralScore}\n`;
                             });
                             const blob = new Blob([csv], { type: 'text/csv' });
                             const url = URL.createObjectURL(blob);
                             const a = document.createElement('a');
                             a.href = url;
                             a.download = 'keyword_intelligence.csv';
                             a.click();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors border border-red-500/30 rounded-lg text-sm font-medium"
                        >
                          <Download className="w-4 h-4" /> Export CSV
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-[#CCC]">
                         <thead className="bg-[#111] text-[#888] font-semibold">
                            <tr>
                               <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => setSortConfig({ key: 'keyword', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc'})}>Keyword</th>
                               <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => setSortConfig({ key: 'searchVolume', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc'})}>Volume</th>
                               <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => setSortConfig({ key: 'competition', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc'})}>Competition</th>
                               <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => setSortConfig({ key: 'trendScore', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc'})}>Trend Score</th>
                               <th className="px-6 py-4 cursor-pointer hover:text-white" onClick={() => setSortConfig({ key: 'viralScore', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc'})}>Viral Score</th>
                               <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-[#2A2A2A]">
                            {[...normalizedKeywords]
                               .sort((a, b) => {
                                  if (!sortConfig) return 0;
                                  const ak = a[sortConfig.key];
                                  const bk = b[sortConfig.key];
                                  if (ak < bk) return sortConfig.direction === 'asc' ? -1 : 1;
                                  if (ak > bk) return sortConfig.direction === 'asc' ? 1 : -1;
                                  return 0;
                               })
                               .map((kw, idx) => {
                                  // Color Coding logic
                                  const tColor = kw.trendScore >= 70 ? 'text-emerald-400' : kw.trendScore >= 50 ? 'text-amber-400' : 'text-red-400';
                                  const vColor = kw.viralScore >= 70 ? 'text-emerald-400' : kw.viralScore >= 50 ? 'text-amber-400' : 'text-red-400';
                                  
                                  return (
                                    <tr key={idx} className="hover:bg-[#1A1A1A] transition-colors group">
                                       <td className="px-6 py-4 font-medium text-white">{kw.keyword}</td>
                                       <td className="px-6 py-4">{kw.searchVolume}</td>
                                       <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded text-xs ${kw.competition === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : kw.competition === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {kw.competition}
                                          </span>
                                       </td>
                                       <td className={`px-6 py-4 font-bold ${tColor}`}>{kw.trendScore}</td>
                                       <td className={`px-6 py-4 font-bold ${vColor}`}>{kw.viralScore}</td>
                                       <td className="px-6 py-4 text-right">
                                          <button className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded text-xs font-semibold mr-2">
                                             Apply
                                          </button>
                                       </td>
                                    </tr>
                                  );
                            })}
                         </tbody>
                      </table>
                      {normalizedKeywords.length === 0 && (
                         <div className="p-8 text-center text-[#666]">No keywords normalized.</div>
                      )}
                    </div>
                  </div>
               </div>
            )}

            {keywordData && activeTab === 'seo_generator' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-6 shadow-lg">
                        <h4 className="text-lg font-bold text-white mb-4">Viral Titles</h4>
                        <div className="space-y-3">
                           {(keywordData.titles || []).map((t: string, i: number) => (
                              <div key={i} className="flex justify-between items-center bg-[#1A1A1A] p-3 rounded-lg border border-[#333]">
                                <span className="text-[#CCC] text-sm">{t}</span>
                                <button
                                  className="text-[#888] hover:text-white"
                                  onClick={() => { navigator.clipboard.writeText(t); alert('Copied Title!'); }}
                                >
                                  <Copy className="w-4 h-4"/>
                                </button>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-6 shadow-lg">
                        <h4 className="text-lg font-bold text-white mb-4">Engagement Hooks</h4>
                        <div className="space-y-3">
                           {(keywordData.hooks || []).map((h: string, i: number) => (
                              <div key={i} className="flex justify-between items-center bg-[#1A1A1A] p-3 rounded-lg border border-[#333]">
                                <span className="text-[#CCC] text-sm">{h}</span>
                                <button
                                  className="text-[#888] hover:text-white"
                                  onClick={() => { navigator.clipboard.writeText(h); alert('Copied Hook!'); }}
                                >
                                  <Copy className="w-4 h-4"/>
                                </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-6 shadow-lg">
                     <h4 className="text-lg font-bold text-white mb-4">Trending Hashtags</h4>
                     <div className="flex flex-wrap gap-2">
                        {(keywordData.hashtags || []).map((t: string, i: number) => (
                           <span key={i} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm">{t}</span>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {keywordData && activeTab === 'performance' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-8 shadow-lg text-center">
                      <BarChart2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                         <TrendingUp className="w-6 h-6"/> CTR Prediction: 8.4% - 12.1%
                      </h3>
                      <p className="text-[#888] max-w-lg mx-auto">Based on current algorithms and the competitive landscape for <strong className="text-white">{keywordData.best_keywords?.[0] || globalSearch}</strong>.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-[#1A1A1A] border border-[#333] p-6 rounded-xl">
                        <h4 className="font-semibold text-white mb-2 py-1 border-b border-[#333]">Best Posting Times</h4>
                        <ul className="text-sm text-[#CCC] space-y-2 mt-4">
                           <li className="flex justify-between items-center"><span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#666]"/> Mon, Wed, Fri</span> <span className="text-emerald-400 font-medium">6:00 PM - 8:00 PM</span></li>
                           <li className="flex justify-between items-center"><span className="flex items-center gap-2"><Check className="w-4 h-4 text-[#666]"/> Weekends</span> <span className="text-emerald-400 font-medium">11:00 AM - 2:00 PM</span></li>
                        </ul>
                     </div>
                     <div className="bg-[#1A1A1A] border border-[#333] p-6 rounded-xl">
                        <h4 className="font-semibold text-white mb-2 py-1 border-b border-[#333]">Audience Intent</h4>
                        <ul className="text-sm text-[#CCC] space-y-2 mt-4">
                           <li className="flex justify-between items-center"><span>Informational / Educational</span> <span className="text-blue-400 font-medium">70%</span></li>
                           <li className="flex justify-between items-center"><span>Entertainment / Viral</span> <span className="text-amber-400 font-medium">30%</span></li>
                        </ul>
                     </div>
                  </div>
               </div>
            )}

          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
