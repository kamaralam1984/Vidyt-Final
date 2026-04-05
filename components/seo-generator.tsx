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
}

export default function SEOGenerator({
  onSelectKeyword,
  onSelectTitle,
  onSelectDescription,
  onSelectHashtags,
  currentTopic,
}: SEOGeneratorProps) {
  const [seoData, setSeoData] = useState<{
    keywords: string[];
    titles: string[];
    descriptions: string[];
    hashtags: string[];
    topic: string;
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
        { topic: currentTopic || 'viral content' },
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
  }: {
    title: string;
    items: string[];
    icon: string;
    section: keyof typeof expandedSections;
    total: number;
    onSelect: (item: string) => void;
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
                        <span className={`text-sm transition-colors ${selectedItems.has(item) ? 'text-white' : 'text-[#AAA] group-hover:text-white'}`}>{item}</span>
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
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            ✨ SEO Trending Generator
          </h2>
          <p className="text-xs text-[#888]">
            {seoData?.topic && `Generating for: "${seoData.topic}"`}
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
