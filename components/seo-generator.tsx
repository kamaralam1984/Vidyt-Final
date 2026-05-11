'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Copy, Check } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';

interface SEOGeneratorProps {
  onSelectKeyword: (keyword: string) => void;
  onSelectTitle: (title: string) => void;
  onSelectDescription: (desc: string) => void;
  onSelectHashtags: (hashtags: string) => void;
  currentTopic: string;
  currentTitle?: string;
  currentDescription?: string;
  currentKeywords?: string;
}

interface Tip {
  field: string;
  level: 'error' | 'warn' | 'ok';
  msg: string;
  fix: string;
}

function scoreTitleCtr(title: string): number {
  if (!title?.trim()) return 3.0;
  const t = title.trim();
  let s = 40;
  if (/\d+/.test(t)) s += 12;
  if (/\?|how|what|why|when|which|who/i.test(t)) s += 10;
  if (/[\[\(]/.test(t)) s += 8;
  if (/secret|amazing|shocking|incredible|insane|best|worst|ultimate|proven|hack|trick|mistake|never|always|must|watch|stop|urgent|breaking|exclusive|viral|free|instant|guaranteed/i.test(t)) s += 10;
  if (/now|today|hurry|limited|last/i.test(t)) s += 5;
  if (/202[4-9]|203\d/.test(t)) s += 4;
  const len = t.length;
  if (len >= 55 && len <= 70) s += 10;
  else if (len >= 40 && len <= 100) s += 6;
  else if (len >= 20 && len <= 110) s += 2;
  const caps = (t.match(/\b[A-Z]{3,}\b/g) || []).length;
  if (caps >= 1 && caps <= 3) s += 4;
  if (/[|]/.test(t)) s += 3;
  s = Math.min(100, Math.round(s));
  return Math.min(16, Math.max(3, parseFloat((3 + (s / 100) * 13).toFixed(1))));
}

function ctrBadgeClass(ctr: number): string {
  if (ctr >= 12.5) return 'text-yellow-300 bg-yellow-900/40 border-yellow-600';
  if (ctr >= 10.5) return 'text-green-400 bg-green-900/30 border-green-700';
  if (ctr >= 8.0) return 'text-blue-400 bg-blue-900/30 border-blue-700';
  return 'text-[#666] bg-[#1a1a1a] border-[#333]';
}

function auditContent(title: string, description: string, keywords: string): Tip[] {
  const tips: Tip[] = [];
  const t = title.trim();
  const d = description.trim();
  const kwList = keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);

  // Title checks
  if (!t) {
    tips.push({ field: 'Title', level: 'error', msg: 'Title is empty', fix: 'Add a title — it is the #1 CTR driver on YouTube.' });
  } else {
    if (t.length < 40) tips.push({ field: 'Title', level: 'warn', msg: `Too short (${t.length} chars)`, fix: 'Aim for 55-70 characters for best CTR. Add more detail.' });
    if (t.length > 100) tips.push({ field: 'Title', level: 'warn', msg: `Too long (${t.length} chars)`, fix: 'Keep under 100 chars. YouTube truncates long titles in search.' });
    if (!/\d/.test(t)) tips.push({ field: 'Title', level: 'warn', msg: 'No numbers', fix: 'Add a number (e.g. "5 Tips", "Top 10") — numbers boost CTR by up to 36%.' });
    if (!/\?|how|what|why|when|which|who/i.test(t)) tips.push({ field: 'Title', level: 'warn', msg: 'No question or curiosity gap', fix: 'Start with "How to", "Why", "What" or end with "?" to trigger curiosity.' });
    if (!/[\[\(]/.test(t)) tips.push({ field: 'Title', level: 'warn', msg: 'No brackets [ ] or ( )', fix: 'Add [PROVEN] or (2026 Guide) — brackets alone boost CTR by ~38%.' });
    if (!/secret|amazing|shocking|incredible|insane|best|worst|ultimate|proven|hack|trick|mistake|never|always|must|viral|free|instant|breaking|exclusive/i.test(t)) {
      tips.push({ field: 'Title', level: 'warn', msg: 'No power words', fix: 'Add power words: Secret, Ultimate, Proven, Shocking, Best, Must-See.' });
    }
  }

  // Keywords checks
  if (kwList.length === 0) {
    tips.push({ field: 'Keywords', level: 'error', msg: 'No keywords added', fix: 'Add 10-20 keywords mixing short-tail (1 word) and long-tail (3+ words).' });
  } else {
    if (kwList.length < 5) tips.push({ field: 'Keywords', level: 'warn', msg: `Only ${kwList.length} keyword(s)`, fix: 'Add at least 10-15 keywords for broader search reach.' });
    const longTail = kwList.filter((k) => k.split(/\s+/).length >= 3).length;
    if (longTail === 0) tips.push({ field: 'Keywords', level: 'warn', msg: 'No long-tail keywords', fix: 'Add 3-5 long-tail phrases (e.g. "how to grow youtube channel fast") — they rank easier.' });
  }

  // Description checks
  if (!d) {
    tips.push({ field: 'Description', level: 'error', msg: 'Description is empty', fix: 'Write 200+ chars. Descriptions with keywords rank higher in YouTube search.' });
  } else {
    if (d.length < 100) tips.push({ field: 'Description', level: 'error', msg: `Too short (${d.length} chars)`, fix: 'Expand to 200-500 chars. Include 3-5 keywords naturally in the first 2 lines.' });
    else if (d.length < 200) tips.push({ field: 'Description', level: 'warn', msg: `Short description (${d.length} chars)`, fix: 'Aim for 200+ chars. Add context, keyword-rich sentences, and a CTA.' });
    if (!/subscrib|like|comment|share|follow|turn on/i.test(d)) tips.push({ field: 'Description', level: 'warn', msg: 'No CTA (Call To Action)', fix: 'End with: "Subscribe for more. Like if this helped. Comment your question below."' });
    const hashCount = (d.match(/#\w+/g) || []).length;
    if (hashCount === 0) tips.push({ field: 'Hashtags', level: 'error', msg: 'No hashtags in description', fix: 'Add 15-20 hashtags at the end of description (e.g. #viral #youtube #tutorial).' });
    else if (hashCount < 5) tips.push({ field: 'Hashtags', level: 'warn', msg: `Only ${hashCount} hashtag(s)`, fix: 'Add 10-20 hashtags mixing topic-specific and trending tags.' });
    if (!/\d{1,2}:\d{2}/.test(d)) tips.push({ field: 'Description', level: 'warn', msg: 'No timestamps', fix: 'Add chapter timestamps (0:00 Intro, 1:30 Main Topic) — boosts watch time and CTR.' });
    if (!/https?:\/\//.test(d)) tips.push({ field: 'Description', level: 'warn', msg: 'No links', fix: 'Add social links or related video links in description for more engagement.' });
  }

  return tips;
}

export default function SEOGenerator({
  onSelectKeyword,
  onSelectTitle,
  onSelectDescription,
  onSelectHashtags,
  currentTopic,
  currentTitle,
  currentDescription,
  currentKeywords,
}: SEOGeneratorProps) {
  const [seoData, setSeoData] = useState<{
    keywords: string[];
    titles: string[];
    descriptions: string[];
    hashtags: string[];
    topic: string;
    _provider?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{
    keywords: boolean;
    titles: boolean;
    descriptions: boolean;
    hashtags: boolean;
  }>({
    keywords: false,
    titles: false,
    descriptions: false,
    hashtags: false,
  });

  const [copiedIndex, setCopiedIndex] = useState<{
    section: string;
    index: number;
  } | null>(null);

  const generateSEO = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        '/api/seo/trending-generator',
        {
          topic: currentTopic || 'viral content',
          title: currentTitle || '',
          description: currentDescription || '',
        },
        { headers: getAuthHeaders() }
      );
      setSeoData(res.data);
    } catch (err) {
      console.error('Failed to generate SEO:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTopic) {
      generateSEO();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = (text: string, section: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex({ section, index });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const SEOSection = ({
    title,
    items,
    icon,
    section,
    total,
    onSelect,
    showCtr,
  }: {
    title: string;
    items: string[];
    icon: string;
    section: keyof typeof expandedSections;
    total: number;
    onSelect: (item: string) => void;
    showCtr?: boolean;
  }) => {
    const progress = ((items?.length || 0) / total) * 100;

    // Local state for checkboxes
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const toggleItemSelection = (item: string) => {
      const newSel = new Set(selectedItems);
      if (newSel.has(item)) newSel.delete(item);
      else newSel.add(item);
      setSelectedItems(newSel);
    };

    const handleCopySelected = () => {
      if (selectedItems.size === 0) return;
      const arr = Array.from(selectedItems);
      let text = '';
      if (section === 'keywords') text = arr.join(', ');
      else if (section === 'hashtags') text = arr.join(' ');
      else if (section === 'titles' || section === 'descriptions') text = arr.join('\n\n');
      
      navigator.clipboard.writeText(text);
      setCopiedIndex({ section, index: -1 }); // -1 indicates bulk copy
      setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
      <motion.div className="bg-[#212121] border border-[#333] rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(section)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#2a2a2a] transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">{icon}</span>
            <div className="text-left">
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="text-xs text-[#888]">
                {items?.length || 0} of {total} generated
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-[#333] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-[#FF0000] to-[#FF6666]"
                />
              </div>
              <span className="text-xs font-bold text-[#FF0000]">{Math.round(progress)}%</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-[#888] transition-transform ${
                expandedSections[section] ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        <AnimatePresence>
          {expandedSections[section] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-[#333] bg-[#181818] flex flex-col"
            >
              {items?.length > 0 && (
                <div className="flex items-center justify-between p-3 border-b border-[#333] bg-[#1a1a1a]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (selectedItems.size === items.length) {
                          setSelectedItems(new Set());
                        } else {
                          setSelectedItems(new Set(items));
                        }
                      }}
                      className="text-xs text-[#AAA] hover:text-white transition-colors"
                    >
                      {selectedItems.size === items.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-xs text-[#666]">| {selectedItems.size} selected</span>
                  </div>
                  <button
                    onClick={handleCopySelected}
                    disabled={selectedItems.size === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#333] hover:bg-[#444] disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
                  >
                    {copiedIndex?.section === section && copiedIndex?.index === -1 ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedIndex?.section === section && copiedIndex?.index === -1 ? 'Copied!' : 'Copy Selected'}
                  </button>
                </div>
              )}
              <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                {items?.length ? (
                  items.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-start gap-3 p-2.5 rounded bg-[#0F0F0F] hover:bg-[#1f1f1f] border border-transparent hover:border-[#333] transition-colors group cursor-pointer"
                      onClick={() => toggleItemSelection(item)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item)}
                        onChange={() => toggleItemSelection(item)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 rounded border-[#444] bg-[#222] text-[#FF0000] focus:ring-[#FF0000] cursor-pointer"
                      />
                      <div className="flex-1 flex flex-col items-start min-w-0">
                        <div className="flex items-start gap-2 w-full">
                          <span className={`text-sm transition-colors flex-1 ${selectedItems.has(item) ? 'text-white' : 'text-[#AAA] group-hover:text-white'}`}>{item}</span>
                          {showCtr && (() => {
                            const ctr = scoreTitleCtr(item);
                            return (
                              <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${ctrBadgeClass(ctr)} flex items-center gap-0.5`}>
                                {ctr >= 12.5 && <span>⭐</span>}
                                {ctr.toFixed(1)}% CTR
                              </span>
                            );
                          })()}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); onSelect(item); }}
                            className="text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-300"
                          >
                            Apply to Inputs
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(item, section, i); }}
                        className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy individual item"
                      >
                        {copiedIndex?.section === section && copiedIndex?.index === i ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-[#666] hover:text-white" />
                        )}
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-[#666] text-sm p-2">No items generated</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#181818] border border-[#212121] rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            ✨ SEO Trending Generator
          </h2>
          <p className="text-xs text-[#888]">
            {seoData?.topic ? `Topic: "${seoData.topic}"` : 'Enter a title or keywords to generate topic-matched SEO'}
          </p>
        </div>
        <button
          onClick={generateSEO}
          disabled={loading || !currentTopic}
          className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          {loading ? 'Generating...' : 'Re-Generate'}
        </button>
      </div>

      {/* CTR Target Meter */}
      {currentTitle && (() => {
        const ctr = scoreTitleCtr(currentTitle);
        const target = 12.5;
        const pct = Math.min(100, (ctr / 16) * 100);
        const targetPct = (target / 16) * 100;
        const gap = Math.max(0, target - ctr);
        const missing: string[] = [];
        const t = currentTitle.trim();
        if (!/\d/.test(t)) missing.push('add a number');
        if (!/[\[\(]/.test(t)) missing.push('add [brackets]');
        if (!/secret|amazing|shocking|incredible|insane|best|worst|ultimate|proven|hack|trick|mistake|never|always|must|viral|breaking|exclusive/i.test(t)) missing.push('add power word');
        if (!/\?|how|what|why|when|which|who/i.test(t)) missing.push('add question word');
        if (t.length < 55 || t.length > 70) missing.push('aim 55-70 chars');
        return (
          <div className="bg-[#0F0F0F] border border-[#2a2a2a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white">Current Title CTR Prediction</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${ctr >= 12.5 ? 'text-yellow-300' : ctr >= 10 ? 'text-green-400' : ctr >= 8 ? 'text-blue-400' : 'text-red-400'}`}>
                  {ctr.toFixed(1)}%
                </span>
                <span className="text-xs text-[#666]">/ Target: {target}%</span>
              </div>
            </div>
            <div className="relative h-3 bg-[#222] rounded-full overflow-visible mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${ctr >= 12.5 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : ctr >= 10 ? 'bg-gradient-to-r from-green-700 to-green-400' : ctr >= 8 ? 'bg-gradient-to-r from-blue-700 to-blue-400' : 'bg-gradient-to-r from-red-800 to-red-500'}`}
              />
              {/* Target marker at 12.5% */}
              <div
                className="absolute top-0 h-full w-0.5 bg-yellow-400/80"
                style={{ left: `${targetPct}%` }}
              >
                <span className="absolute -top-5 -translate-x-1/2 text-[9px] text-yellow-400 font-bold whitespace-nowrap">12.5%</span>
              </div>
            </div>
            {gap > 0 ? (
              <p className="text-[11px] text-[#888] mt-1">
                <span className="text-yellow-400 font-semibold">+{gap.toFixed(1)}% needed</span>
                {missing.length > 0 && <span> — {missing.slice(0, 3).join(', ')}</span>}
              </p>
            ) : (
              <p className="text-[11px] text-yellow-400 font-semibold mt-1">Target reached! This title is optimized for 12.5%+ CTR.</p>
            )}
          </div>
        );
      })()}

      {/* CTR Improvement Audit Panel */}
      {(currentTitle || currentDescription || currentKeywords) && (() => {
        const tips = auditContent(currentTitle || '', currentDescription || '', currentKeywords || '');
        const errors = tips.filter((t) => t.level === 'error');
        const warns = tips.filter((t) => t.level === 'warn');
        if (tips.length === 0) return null;
        return (
          <div className="bg-[#0F0F0F] border border-[#2a2a2a] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                📊 CTR Improvement Guide
              </h3>
              <div className="flex gap-2 text-xs">
                {errors.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 border border-red-800 font-medium">
                    {errors.length} critical
                  </span>
                )}
                {warns.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400 border border-yellow-800 font-medium">
                    {warns.length} warning
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {tips.map((tip, i) => (
                <div key={i} className={`flex gap-3 p-2.5 rounded-lg border ${tip.level === 'error' ? 'bg-red-950/20 border-red-900/50' : 'bg-yellow-950/20 border-yellow-900/40'}`}>
                  <span className="text-base mt-0.5 shrink-0">{tip.level === 'error' ? '🔴' : '🟡'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/80">
                      <span className={`mr-1 ${tip.level === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>[{tip.field}]</span>
                      {tip.msg}
                    </p>
                    <p className="text-[11px] text-[#888] mt-0.5 leading-relaxed">{tip.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {seoData ? (
        <div className="space-y-3">
          <SEOSection
            title="Keywords"
            items={seoData.keywords}
            icon="🔑"
            section="keywords"
            total={20}
            onSelect={onSelectKeyword}
          />
          <SEOSection
            title="Titles"
            items={seoData.titles}
            icon="📝"
            section="titles"
            total={10}
            onSelect={onSelectTitle}
            showCtr
          />
          <SEOSection
            title="Descriptions"
            items={seoData.descriptions}
            icon="📄"
            section="descriptions"
            total={5}
            onSelect={onSelectDescription}
          />
          <SEOSection
            title="Hashtags"
            items={seoData.hashtags}
            icon="#️⃣"
            section="hashtags"
            total={50}
            onSelect={onSelectHashtags}
          />
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin text-[#FF0000] text-2xl">⏳</div>
        </div>
      ) : (
        <p className="text-[#888] text-sm text-center py-4">
          Enter a topic and click Auto-Generate SEO to start
        </p>
      )}
    </motion.div>
  );
}
