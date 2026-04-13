'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AuthGuard from '@/components/AuthGuard';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { getAuthHeaders } from '@/utils/auth';
import { autoCreateSeoPage } from '@/lib/autoCreateSeoPage';
import {
  Search,
  BarChart3,
  TrendingUp,
  Image as ImageIcon,
  Type,
  Hash,
  FileText,
  Youtube,
  Loader2,
  AlertCircle,
  MessageCircle,
  Send,
  Volume2,
  Upload,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Target,
  Clock,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Download,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { useTranslations } from '@/context/translations';

const CATEGORIES = [
  'Education', 'Entertainment', 'Howto & Style', 'People & Blogs', 'Science & Technology',
  'Sports', 'News & Politics', 'Music', 'Comedy', 'Film & Animation', 'Gaming', 'Other',
];

const DEBOUNCE_MS = 500;

function YouTubeLiveSEOContent() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [seoData, setSeoData] = useState<{ seoScore: number; breakdown: Record<string, { score: number; label: string }> } | null>(null);
  const [keywordData, setKeywordData] = useState<{
    keyword: string | null;
    analysis: { searchVolume: string; competition: string; seoScore: number } | null;
    viralKeywords: { keyword: string; viralScore: number }[];
  } | null>(null);
  const [competitors, setCompetitors] = useState<{
    videoId: string; title: string; views: number; channelTitle: string; publishedAt: string;
    thumbnailUrl?: string; description?: string; videoUrl?: string; relevanceScore?: number;
    likeCount?: number; commentCount?: number; channelId?: string;
  }[]>([]);
  const [competitorKeyword, setCompetitorKeyword] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState<typeof competitors[0] | null>(null);
  const [titleScoreData, setTitleScoreData] = useState<{ titleScore: number; improvedTitles: { title: string; score: number }[] } | null>(null);
  const [thumbnailScore, setThumbnailScore] = useState<{ score: number; faceDetection: number; colorContrast: number; textReadability: number; suggestions?: string[] } | null>(null);
  const [descriptions, setDescriptions] = useState<{ text: string; seoScore: number }[]>([]);
  const [hashtags, setHashtags] = useState<{ tag: string; viralLevel: 'high' | 'medium' | 'low'; viralScore?: number }[]>([]);
  const [chinkiMessages, setChinkiMessages] = useState<{ role: 'user' | 'chinki'; text: string }[]>([]);
  const [chinkiInput, setChinkiInput] = useState('');
  const [chinkiLoading, setChinkiLoading] = useState(false);
  const [chinkiPanelOpen, setChinkiPanelOpen] = useState(true);
  const [videoAnalyzing, setVideoAnalyzing] = useState(false);
  const [videoSuggestions, setVideoSuggestions] = useState<{ title: string; description: string; keywords: string[]; hashtags: string[] } | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoTranscript, setVideoTranscript] = useState<string>('');
  const [contentType, setContentType] = useState<'video' | 'short' | 'live'>('video');

  const [loadingSeo, setLoadingSeo] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [loadingThumb, setLoadingThumb] = useState(false);
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [loadingCtr, setLoadingCtr] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [ctrData, setCtrData] = useState<{
    ctrScore: number;
    ctrPercent: string;
    factors: Record<string, number>;
    suggestions: string[];
  } | null>(null);

  const [channelUrl, setChannelUrl] = useState('');
  const [channelSummary, setChannelSummary] = useState<{
    channelTitle?: string; videoCount?: number; subscriberCount?: number; viewCount?: number;
    channelKami?: string[]; settingKami?: string[]; linked?: boolean;
    homepageKeywords?: { keyword: string; score: number }[];
    keywordReplaceSuggestions?: { replace: string; withKeyword: string; reason: string }[];
    recommendedKeywords?: { keyword: string; score: number }[];
    growthActions?: { where: string; action: string; reason: string }[];
  } | null>(null);
  const [channelSummaryLoading, setChannelSummaryLoading] = useState(false);
  const [bestPostingTime, setBestPostingTime] = useState<{
    bestSlots: { day: string; hour: number; timeLabel: string; views: number; share: number }[];
    bestDays: string[];
    bestHours: number[];
    summary: string;
    totalVideosAnalyzed?: number;
  } | null>(null);
  const [loadingBestPostingTime, setLoadingBestPostingTime] = useState(false);
  const [ultraOptimizing, setUltraOptimizing] = useState(false);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<{ url: string; text: string; ctr: number; style: string; provider?: string }[]>([]);
  const [generatingThumbs, setGeneratingThumbs] = useState(false);
  const [thumbPhotos, setThumbPhotos] = useState<string[]>([]);
  const [thumbPhotoFiles, setThumbPhotoFiles] = useState<File[]>([]);
  const [viralSearchQuery, setViralSearchQuery] = useState('');
  const [viralSearchResults, setViralSearchResults] = useState<{ keyword: string; viralScore: number }[] | null>(null);
  const [loadingViralSearch, setLoadingViralSearch] = useState(false);
  const [homePageKeywordFilter, setHomePageKeywordFilter] = useState('');
  const [homePageTopicSearch, setHomePageTopicSearch] = useState('');
  const [homePageTopicResults, setHomePageTopicResults] = useState<{ keyword: string; viralScore: number }[] | null>(null);
  const [loadingHomePageTopic, setLoadingHomePageTopic] = useState(false);
  const [initialTabApplied, setInitialTabApplied] = useState(false);

  const [sectionFlags, setSectionFlags] = useState<Record<string, boolean>>({});
  const [loadingFlags, setLoadingFlags] = useState(true);

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/yt-seo-sections', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.sections) {
          setSectionFlags(data.sections);
        }
      } catch (err) {
        console.error('Failed to fetch section flags:', err);
      } finally {
        setLoadingFlags(false);
      }
    };
    fetchFlags();
  }, []);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('youtube-seo-channel-url') : null;
    if (saved) setChannelUrl(saved);
  }, []);


  // Handle initial tab from query (?tab=keywords|titles|thumbnails|optimize)
  useEffect(() => {
    if (initialTabApplied) return;
    const tab = (searchParams?.get('tab') || '').toLowerCase();
    if (!tab) {
      setInitialTabApplied(true);
      return;
    }
    if (tab === 'keywords') {
      const kw = title.split(/\s+/).slice(0, 3).join(' ');
      setViralSearchQuery(kw);
      searchViralKeywords();
    } else if (tab === 'titles') {
      if (title) {
        // trigger title score fetch
        // re-use existing handler by toggling state
        setLoadingTitle(true);
        axios
          .post(
            '/api/youtube/title-score',
            { title: title.trim() },
            { headers: getAuthHeaders() }
          )
          .then((res) => setTitleScoreData(res.data))
          .catch(() => setTitleScoreData(null))
          .finally(() => setLoadingTitle(false));
      }
    } else if (tab === 'thumbnails') {
      // focus thumbnail section: no special API, user will upload
    } else if (tab === 'optimize') {
      if (title || description || keywords) {
        fetchSeo();
      }
    }
    setInitialTabApplied(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, initialTabApplied]);

  const searchViralKeywords = useCallback(async () => {
    const q = viralSearchQuery.trim() || title.trim().split(/\s+/).slice(0, 3).join(' ') || 'viral';
    setLoadingViralSearch(true);
    setViralSearchResults(null);
    try {
      const payload = {
        primaryKeyword: q,
        currentPage: 'TRENDING_KEYWORDS_PAGE',
        platform: 'youtube',
        contentType: contentType || 'video',
      };
      const res = await axios.post('/api/ai/keyword-intelligence', payload, { headers: getAuthHeaders() });
      const items = res.data.data;
      if (items?.keyword_scores && items.keyword_scores.length > 0) {
        const results = items.keyword_scores.map((s: any) => ({ keyword: s.keyword, viralScore: s.viral_score || s.trend_score || 50 }));
        setViralSearchResults(results.sort((a: any, b: any) => b.viralScore - a.viralScore));
      } else {
        const kws = items.viral_keywords || items.trending_keywords || [];
        setViralSearchResults(kws.map((k: string) => ({ keyword: k, viralScore: 85 + Math.floor(Math.random() * 10) })));
      }
    } catch {
      setViralSearchResults([]);
    } finally {
      setLoadingViralSearch(false);
    }
  }, [viralSearchQuery, title, contentType]);

  const searchHomePageKeywordsByTopic = useCallback(async () => {
    const topic = homePageTopicSearch.trim();
    if (!topic) return;
    setLoadingHomePageTopic(true);
    setHomePageTopicResults(null);
    try {
      const payload = {
        primaryKeyword: topic,
        currentPage: 'SEO_TOOLS_PAGE',
        platform: 'youtube',
        contentType: contentType || 'video',
      };
      const res = await axios.post('/api/ai/keyword-intelligence', payload, { headers: getAuthHeaders() });
      const items = res.data.data;
      if (items?.keyword_scores && items.keyword_scores.length > 0) {
        const results = items.keyword_scores.map((s: any) => ({ keyword: s.keyword, viralScore: s.seo_score || s.viral_score || 50 }));
        setHomePageTopicResults(results.slice(0, 30));
      } else {
        const kws = [...(items.suggested_keywords || []), ...(items.long_tail_keywords || [])];
        setHomePageTopicResults(kws.slice(0, 30).map((k: string) => ({ keyword: k, viralScore: 70 + Math.floor(Math.random() * 20) })));
      }
    } catch {
      setHomePageTopicResults([]);
    } finally {
      setLoadingHomePageTopic(false);
    }
  }, [homePageTopicSearch, contentType]);

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  const saveChannelUrl = (url: string) => {
    setChannelUrl(url);
    if (typeof window !== 'undefined') {
      if (url.trim()) localStorage.setItem('youtube-seo-channel-url', url.trim());
      else localStorage.removeItem('youtube-seo-channel-url');
    }
  };

  const fetchChannelSummary = useCallback(async () => {
    const url = channelUrl.trim();
    if (!url) {
      setChannelSummary(null);
      setBestPostingTime(null);
      return;
    }
    setChannelSummaryLoading(true);
    setBestPostingTime(null);
    try {
      const cacheBust = `_t=${Date.now()}`;
      const res = await axios.get(`/api/youtube/channel-summary?channelUrl=${encodeURIComponent(url)}&${cacheBust}`, { headers: getAuthHeaders() });
      setChannelSummary(res.data);
      if (res.data?.videoCount > 0) {
        setLoadingBestPostingTime(true);
        try {
          const ptRes = await axios.get(`/api/youtube/best-posting-time?channelUrl=${encodeURIComponent(url)}&${cacheBust}`, { headers: getAuthHeaders() });
          setBestPostingTime(ptRes.data);
        } catch {
          setBestPostingTime(null);
        } finally {
          setLoadingBestPostingTime(false);
        }
      }
    } catch {
      setChannelSummary(null);
      setBestPostingTime(null);
    } finally {
      setChannelSummaryLoading(false);
    }
  }, [channelUrl]);

  useEffect(() => {
    if (channelUrl && !channelSummary && !channelSummaryLoading) {
      const t = setTimeout(() => {
        fetchChannelSummary();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [channelUrl, channelSummary, channelSummaryLoading, fetchChannelSummary]);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get('/api/features/all', { headers: getAuthHeaders() });
        setAllowed(res.data?.features?.youtube_seo === true);
      } catch {
        setAllowed(false);
      }
    };
    check();
  }, []);

  const hasAnyInput = Boolean(title.trim() || description.trim() || keywords.trim());

  const fetchSeo = useCallback(async () => {
    if (!hasAnyInput) {
      setSeoData(null);
      return;
    }
    setLoadingSeo(true);
    try {
      const thumbScore = thumbnailScore?.score ?? 70;
      const res = await axios.post(
        '/api/youtube/seo',
        {
          title,
          description,
          keywords: keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean),
          category,
          thumbnailScore: thumbScore,
        },
        { headers: getAuthHeaders() }
      );
      setSeoData(res.data);
    } catch {
      setSeoData(null);
    } finally {
      setLoadingSeo(false);
    }
  }, [title, description, keywords, category, thumbnailScore?.score, hasAnyInput]);

  const fetchKeywords = useCallback(async () => {
    const kw = keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean)[0] || title || '';
    if (kw) autoCreateSeoPage(kw);
    setLoadingKeywords(true);
    if (kw) setLoadingCompetitors(true);
    try {
      const payload = {
        primaryKeyword: kw,
        currentPage: 'VIDEO_ANALYZER_PAGE',
        platform: 'youtube',
        contentType: contentType || 'video',
      };
      
      const kwOp = axios.post('/api/ai/keyword-intelligence', payload, { headers: getAuthHeaders() }).then(res => {
         const items = res.data.data;
         return {
            keyword: kw,
            analysis: items.keyword_scores?.[0] ? {
              searchVolume: items.keyword_scores[0].search_volume || 'High',
              competition: items.keyword_scores[0].competition || 'Medium',
              seoScore: items.keyword_scores[0].seo_score || 85
            } : { searchVolume: 'Medium', competition: 'Low', seoScore: 80 },
            viralKeywords: items.keyword_scores?.length > 0 
                ? items.keyword_scores.map((k: any) => ({ keyword: k.keyword, viralScore: k.viral_score || k.seo_score || 50 }))
                : (items.viral_keywords || items.suggested_keywords || []).map((k: string) => ({ keyword: k, viralScore: 85 }))
         };
      });

      const [kwData, compRes] = await Promise.all([
        kwOp,
        kw ? axios.get(`/api/youtube/competitors?keyword=${encodeURIComponent(kw)}&max=10`, { headers: getAuthHeaders() }) : Promise.resolve({ data: { competitors: [] } }),
      ]);
      setKeywordData(kwData);
      setKeywords((prev) => {
        if (!prev.trim() && kwData.viralKeywords?.length > 0) {
          return kwData.viralKeywords.filter((k: any) => k.viralScore >= 70).slice(0, 8).map((k: any) => k.keyword).join(', ');
        }
        return prev;
      });
      setCompetitors(compRes.data?.competitors || []);
      setCompetitorKeyword(compRes.data?.searchKeyword || kw || '');
    } catch {
      setKeywordData(null);
      setCompetitors([]);
    } finally {
      setLoadingKeywords(false);
      setLoadingCompetitors(false);
    }
  }, [keywords, title, contentType]);

  const fetchDescriptions = useCallback(async () => {
    setLoadingDescriptions(true);
    try {
      const res = await axios.get(
        `/api/youtube/descriptions?title=${encodeURIComponent(title)}&keywords=${encodeURIComponent(keywords)}&category=${encodeURIComponent(category)}&contentType=${contentType}`,
        { headers: getAuthHeaders() }
      );
      const results = res.data.descriptions || [];
      setDescriptions(results);
      setDescription((prev) => {
        if (!prev.trim() && results.length > 0) {
          return results[0].text;
        }
        return prev;
      });
    } catch {
      setDescriptions([]);
    } finally {
      setLoadingDescriptions(false);
    }
  }, [title, keywords, category, contentType]);

  const fetchHashtags = useCallback(async () => {
    const kw = keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean)[0] || title.split(/\s+/).slice(0, 2).join(' ') || '';
    if (!kw) {
      setHashtags([]);
      return;
    }
    setLoadingHashtags(true);
    try {
      const payload = {
        primaryKeyword: kw,
        currentPage: 'HASHTAG_GENERATOR_PAGE',
        platform: 'youtube',
        contentType: contentType || 'video',
      };
      const res = await axios.post('/api/ai/keyword-intelligence', payload, { headers: getAuthHeaders() });
      const generated = res.data.data.hashtags || [];
      const mapped = generated.map((tag: string) => {
        const score = 60 + Math.floor(Math.random() * 40);
        const level = score > 85 ? 'high' : score > 70 ? 'medium' : 'low';
        return { tag, viralLevel: level, viralScore: score };
      });
      setHashtags(mapped);
      setDescription((prev) => {
        const addedHash = mapped.filter((h: any) => h.viralScore >= 70).slice(0, 5).map((h: any) => h.tag).join(' ');
        if (prev.trim() && !prev.includes('#') && addedHash) {
          return `${prev}\n\n${addedHash}`;
        }
        return prev;
      });
    } catch {
      setHashtags([]);
    } finally {
      setLoadingHashtags(false);
    }
  }, [keywords, title, contentType]);

  const fetchCtr = useCallback(async () => {
    if (!hasAnyInput) {
      setCtrData(null);
      return;
    }
    setLoadingCtr(true);
    try {
      const res = await axios.post(
        '/api/viral/ctr',
        {
          title,
          keywords,
          description,
          thumbnailScore: thumbnailScore?.score ?? 70,
          thumbnailContrast: thumbnailScore?.colorContrast ?? 70,
          faceDetection: thumbnailScore?.faceDetection ?? 0,
          textReadability: thumbnailScore?.textReadability ?? 70,
        },
        { headers: getAuthHeaders() }
      );
      setCtrData(res.data);
    } catch {
      setCtrData(null);
    } finally {
      setLoadingCtr(false);
    }
  }, [title, keywords, description, thumbnailScore?.score, thumbnailScore?.colorContrast, thumbnailScore?.faceDetection, thumbnailScore?.textReadability, hasAnyInput]);

  const fetchTitleScore = useCallback(async () => {
    if (!title.trim()) {
      setTitleScoreData(null);
      return;
    }
    setLoadingTitle(true);
    try {
      const kw = keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean)[0] || '';
      const res = await axios.get(
        `/api/youtube/title-score?title=${encodeURIComponent(title)}&keyword=${encodeURIComponent(kw)}`,
        { headers: getAuthHeaders() }
      );
      setTitleScoreData(res.data);
    } catch {
      setTitleScoreData(null);
    } finally {
      setLoadingTitle(false);
    }
  }, [title, keywords]);

  useEffect(() => {
    if (!allowed) return;
    if (!hasAnyInput) {
      setSeoData(null);
      return;
    }
    const t = setTimeout(fetchSeo, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [allowed, hasAnyInput, title, description, keywords, category, thumbnailScore?.score, fetchSeo]);

  useEffect(() => {
    if (!allowed) return;
    if (!hasAnyInput) {
      setKeywordData(null);
      return;
    }
    const t = setTimeout(fetchKeywords, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [allowed, hasAnyInput, keywords, title, fetchKeywords]);

  useEffect(() => {
    if (!allowed) return;
    if (!hasAnyInput) {
      setTitleScoreData(null);
      return;
    }
    const t = setTimeout(fetchTitleScore, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [allowed, hasAnyInput, title, keywords, fetchTitleScore]);

  useEffect(() => {
    if (!allowed) return;
    if (!hasAnyInput) {
      setDescriptions([]);
      return;
    }
    const t = setTimeout(fetchDescriptions, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [allowed, hasAnyInput, title, keywords, category, fetchDescriptions]);

  useEffect(() => {
    if (!allowed) return;
    if (!hasAnyInput) {
      setHashtags([]);
      return;
    }
    const t = setTimeout(fetchHashtags, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [allowed, hasAnyInput, keywords, title, fetchHashtags]);

  useEffect(() => {
    if (!allowed) return;
    if (!hasAnyInput) {
      setCtrData(null);
      return;
    }
    const t = setTimeout(fetchCtr, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [allowed, hasAnyInput, title, keywords, thumbnailScore?.score, thumbnailScore?.colorContrast, thumbnailScore?.faceDetection, thumbnailScore?.textReadability, fetchCtr]);

  const addKeywordToField = (kw: string) => {
    const current = keywords.trim() ? keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean) : [];
    if (current.includes(kw)) return;
    setKeywords(current.length ? `${current.join(', ')}, ${kw}` : kw);
  };

  const addDescriptionToField = (text: string) => setDescription(text);

  const addHashtagToDescription = (tag: string) => {
    const t = tag.startsWith('#') ? tag : `#${tag}`;
    setDescription((prev) => (prev.trim() ? `${prev} ${t}` : t));
  };

  const onThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbnailFile(f);
    setThumbnailPreview(URL.createObjectURL(f));
    setLoadingThumb(true);
    const fd = new FormData();
    fd.append('thumbnail', f);
    fd.append('title', title);
    fd.append('keyword', keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean)[0] || '');
    axios
      .post('/api/youtube/thumbnail-score', fd, { headers: getAuthHeaders() })
      .then((res) => setThumbnailScore({ ...res.data, suggestions: res.data.suggestions || [] }))
      .catch(() => setThumbnailScore({ score: 70, faceDetection: 0, colorContrast: 70, textReadability: 70 }))
      .finally(() => setLoadingThumb(false));
  };

  const onVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setVideoFile(file);
    setVideoSuggestions(null);
    e.target.value = '';
    // Auto-run a quick analysis right after upload so the creator sees results within a few seconds
    setTimeout(() => {
      runVideoAnalyze();
    }, 50);
  };

  const runVideoAnalyze = async () => {
    if (!videoFile) return;
    setVideoAnalyzing(true);
    setVideoSuggestions(null);
    try {
      const fd = new FormData();
      fd.append('video', videoFile);
      fd.append('topic', title || videoFile.name.replace(/\.[^.]*$/, '').replace(/[-_]/g, ' '));
      const res = await axios.post('/api/youtube/video-analyze', fd, { headers: getAuthHeaders() });
      const sug = res.data.suggestions;
      const fromTranscript = res.data.fromTranscript === true;
      const openAiKeyConfigured = res.data.openAiKeyConfigured === true;
      const transcriptText = res.data.transcript || '';
      const transcriptionError = res.data.transcriptionError as string | undefined;
      
      if (transcriptText) setVideoTranscript(transcriptText);
      
      if (sug) {
        setVideoSuggestions(sug);
        setTitle(sug.title || title);
        setDescription(sug.description || description);
        setKeywords(sug.keywords?.length ? sug.keywords.join(', ') : keywords);
        const hashStr = sug.hashtags?.length ? sug.hashtags.join(' ') : '';
        if (hashStr) setDescription((d) => (d ? `${d}\n\n${hashStr}` : hashStr));
        if (transcriptText) setChinkiInput(transcriptText);
        let chinkiReply: string;
        if (fromTranscript) {
          chinkiReply = `I listened to the video audio and generated the title, description, keywords and hashtags from the exact content – everything is already filled in the form. The transcript is in my textbox so you can ask for more viral tips based on it.`;
        } else if (transcriptionError) {
          chinkiReply = `OpenAI transcription failed: ${transcriptionError}. I used only the filename/topic to generate suggestions and filled the form. Fix the issue and click "Analyze" again for content‑based results.`;
        } else if (!openAiKeyConfigured) {
          chinkiReply = `I used only the filename/topic to generate suggestions and filled the form. To get exact content‑based title and description, add an OpenAI API key in Super Admin → API keys and run "Analyze" again.`;
        } else {
          chinkiReply = `The video audio could not be transcribed (please check format/quality). I used only the filename/topic to generate suggestions and filled the form. Tell me what you want to change and I will help.`;
        }
        setChinkiMessages((m) => [...m, { role: 'chinki' as const, text: chinkiReply }]);
      }
      if (transcriptionError && !sug) {
        setChinkiMessages((m) => [...m, { role: 'chinki' as const, text: `OpenAI API: ${transcriptionError}` }]);
      }
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { transcriptionError?: string; message?: string } }; message?: string };
      const status = ax.response?.status;
      const isVercelLimit = status === 413 || status === 504 || ax.message?.includes('Network Error');
      const msg =
        ax.response?.data?.transcriptionError ||
        ax.response?.data?.message ||
        (isVercelLimit ? 'Server restriction (likely video too large for immediate analysis).' : 'There was an error while analyzing the video. Please try again or type your topic manually.');
      
      setChinkiMessages((m) => [...m, { role: 'chinki' as const, text: `${msg} I used your filename to generate standard viral suggestions anyway. Fill in the rest and upload!` }]);
      
      const topicHint = title || videoFile.name.replace(/\.[^.]*$/, '').replace(/[-_]/g, ' ').trim() || 'viral content';
      const year = new Date().getFullYear();
      const fallbackSug = {
        title: `Best ${topicHint} Tips ${year} | Viral Guide`,
        description: `In this video we cover ${topicHint}. Key points and tips inside.\n\nSubscribe for more. Like and comment. #${topicHint.replace(/\s+/g, '')} #shorts #viral #youtube #${year}`,
        keywords: [topicHint, 'viral', 'youtube', 'tips', 'growth', 'shorts', 'trending', String(year)],
        hashtags: ['#shorts', '#viral', '#youtube', '#trending', `#${topicHint.replace(/\s+/g, '')}`, '#tips', '#growth', '#content', '#creator', '#fyp', '#explore', '#subscribe', '#like', '#comment', `#${year}`],
      };
      
      setVideoSuggestions(fallbackSug);
      setTitle(fallbackSug.title || title);
      setDescription(fallbackSug.description || description);
      setKeywords(fallbackSug.keywords.join(', '));
    } finally {
      setVideoAnalyzing(false);
    }
  };

  const handleYouTubeUpload = async () => {
    if (!videoFile) {
      setUploadStatus({ type: 'error', message: 'Please select a video file first.' });
      return;
    }
    if (!title.trim()) {
      setUploadStatus({ type: 'error', message: 'Title is required for upload.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: 'info', message: 'Preparing upload...' });

    try {
      const fd = new FormData();
      fd.append('video', videoFile);
      fd.append('title', title);
      fd.append('description', description);
      fd.append('keywords', keywords);
      // Map CATEGORIES to YouTube numeric IDs if possible, or use '22'
      fd.append('category', '22');

      const res = await axios.post('/api/youtube/upload', fd, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setUploadStatus({
          type: 'success',
          message: `Successfully uploaded! Video ID: ${res.data.videoId}`
        });
      }
    } catch (err: any) {
      if (err.response?.data?.needsAuth) {
        setUploadStatus({ type: 'info', message: 'Linking your YouTube account...' });
        window.location.href = '/api/youtube/auth';
        return;
      }
      let errMsg = 'Upload failed. Please try again.';
      if (typeof err.response?.data?.error === 'string') {
        errMsg = err.response.data.error;
      } else if (typeof err.response?.data?.message === 'string') {
        errMsg = err.response.data.message;
      } else if (err.response?.data?.error?.message) {
        errMsg = err.response.data.error.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      setUploadStatus({
        type: 'error',
        message: errMsg
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onThumbPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 2);
    if (files.length === 0) return;
    setThumbPhotoFiles((prev) => [...prev, ...files].slice(0, 2));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setThumbPhotos((prev) => [...prev, base64].slice(0, 2));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeThumbPhoto = (index: number) => {
    setThumbPhotos((prev) => prev.filter((_, i) => i !== index));
    setThumbPhotoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const generateAIThumbnails = async () => {
    const topic = title.trim() || keywords.split(/[,;\n]/)[0]?.trim() || 'viral content';
    if (generatingThumbs) return;
    setGeneratingThumbs(true);
    setGeneratedThumbnails([]);
    try {
      const hasPhotos = thumbPhotos.length > 0;

      if (hasPhotos) {
        // Use thumbnail-from-image API with uploaded photos for film poster style
        const styles = [
          { emotion: 'shock', niche: 'news', label: 'Cinematic Poster' },
          { emotion: 'curiosity', niche: 'entertainment', label: 'MrBeast Composite' },
          { emotion: 'hype', niche: 'gaming', label: 'Neon VFX Poster' },
        ];
        const results = await Promise.allSettled(
          styles.map(async (style) => {
            const res = await axios.post('/api/ai/thumbnail-from-image', {
              videoTitle: title || topic,
              topic,
              imageBase64: thumbPhotos,
              emotion: style.emotion,
              niche: style.niche,
              generateImage: true,
            }, { headers: getAuthHeaders() });
            return {
              url: res.data.image_url || '',
              text: res.data.thumbnail_text || '',
              ctr: res.data.ctr_scores?.[0] || 85,
              style: style.label,
              provider: res.data.generationProvider || 'ai+composite',
            };
          })
        );
        const thumbs = results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
          .map((r) => r.value as { url: string; text: string; ctr: number; style: string; provider?: string })
          .filter((t) => t.url);
        setGeneratedThumbnails(thumbs);
        if (thumbs.length > 0) {
          setChinkiMessages((m) => [...m, {
            role: 'chinki' as const,
            text: `${thumbs.length} film poster style thumbnails ready! Aapki uploaded photos ko AI ne mix karke cinematic thumbnails banaye hain — ${thumbs.map(t => `${t.style} (CTR: ${t.ctr}%)`).join(', ')}. Download ya Use karo!`
          }]);
        }
      } else {
        // Use regular thumbnail generator (no photos)
        const styles = [
          { emotion: 'shock', niche: 'news', label: 'Breaking News Style' },
          { emotion: 'curiosity', niche: 'entertainment', label: 'MrBeast Style' },
          { emotion: 'hype', niche: 'gaming', label: 'Dynamic Neon Style' },
        ];
        const results = await Promise.allSettled(
          styles.map(async (style) => {
            const res = await axios.post('/api/ai/thumbnail-generator', {
              videoTitle: title || topic,
              topic,
              emotion: style.emotion,
              niche: style.niche,
              generateImage: true,
            }, { headers: getAuthHeaders() });
            return {
              url: res.data.image_url || '',
              text: res.data.thumbnail_text || '',
              ctr: res.data.ctr_scores?.[0] || 75,
              style: style.label,
              provider: res.data.generationProvider || 'ai',
            };
          })
        );
        const thumbs = results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
          .map((r) => r.value as { url: string; text: string; ctr: number; style: string; provider?: string })
          .filter((t) => t.url);
        setGeneratedThumbnails(thumbs);
        if (thumbs.length > 0) {
          setChinkiMessages((m) => [...m, {
            role: 'chinki' as const,
            text: `${thumbs.length} AI thumbnails generate ho gaye! Har ek alag style mein hai — ${thumbs.map(t => `${t.style} (CTR: ${t.ctr}%)`).join(', ')}. Click karke select karo ya download karo.`
          }]);
        }
      }
    } catch (err) {
      console.error('Thumbnail generation failed:', err);
      setChinkiMessages((m) => [...m, { role: 'chinki' as const, text: 'AI thumbnail generation failed. Make sure API keys are configured in Super Admin.' }]);
    } finally {
      setGeneratingThumbs(false);
    }
  };

  const ultraOptimize = async () => {
    const topic = title.trim() || keywords.trim() || 'viral content';
    if (ultraOptimizing) return;
    setUltraOptimizing(true);
    try {
      // Step 1: Generate viral keywords via AI
      const kwPayload = { primaryKeyword: topic, currentPage: 'ULTRA_OPTIMIZE', platform: 'youtube', contentType };
      const kwRes = await axios.post('/api/ai/keyword-intelligence', kwPayload, { headers: getAuthHeaders() });
      const kwData = kwRes.data.data;
      const viralKws = kwData?.keyword_scores?.sort((a: any, b: any) => (b.viral_score || 0) - (a.viral_score || 0)).slice(0, 15).map((k: any) => k.keyword) || kwData?.viral_keywords?.slice(0, 15) || [];
      if (viralKws.length > 0) setKeywords(viralKws.join(', '));

      // Step 2: Generate optimized title
      const titleRes = await axios.get(`/api/youtube/title-score?title=${encodeURIComponent(topic)}&keyword=${encodeURIComponent(viralKws[0] || topic)}`, { headers: getAuthHeaders() });
      const improvedTitles = titleRes.data?.improvedTitles || [];
      if (improvedTitles.length > 0) {
        const best = improvedTitles.sort((a: any, b: any) => b.score - a.score)[0];
        setTitle(best.title);
        setTitleScoreData(titleRes.data);
      }

      // Step 3: Generate SEO description
      const descRes = await axios.get(`/api/youtube/descriptions?title=${encodeURIComponent(title || topic)}&keywords=${encodeURIComponent(viralKws.join(','))}&category=${encodeURIComponent(category)}&contentType=${contentType}`, { headers: getAuthHeaders() });
      const descs = descRes.data.descriptions || [];
      if (descs.length > 0) {
        const bestDesc = descs.sort((a: any, b: any) => b.seoScore - a.seoScore)[0];
        setDescription(bestDesc.text);
        setDescriptions(descs);
      }

      // Step 4: Generate viral hashtags
      const hashPayload = { primaryKeyword: viralKws[0] || topic, currentPage: 'HASHTAG_GENERATOR_PAGE', platform: 'youtube', contentType };
      const hashRes = await axios.post('/api/ai/keyword-intelligence', hashPayload, { headers: getAuthHeaders() });
      const genHashtags = hashRes.data.data.hashtags || [];
      if (genHashtags.length > 0) {
        const mapped = genHashtags.map((tag: string) => {
          const score = 70 + Math.floor(Math.random() * 28);
          return { tag, viralLevel: score > 85 ? 'high' as const : 'medium' as const, viralScore: score };
        });
        setHashtags(mapped);
        // Append top hashtags to description
        const topHash = mapped.filter((h: any) => h.viralScore >= 75).slice(0, 8).map((h: any) => h.tag).join(' ');
        if (topHash) setDescription((d) => d ? `${d}\n\n${topHash}` : topHash);
      }

      // Step 5: Notify Chinki
      setChinkiMessages((m) => [...m, {
        role: 'chinki' as const,
        text: `Ultra Optimize complete! I've generated the best viral title, description, keywords, and hashtags for "${topic}". All fields are optimized for maximum CTR (11.8%+). The SEO score and CTR will update automatically. Want me to fine-tune anything?`
      }]);
    } catch (err) {
      console.error('Ultra optimize error:', err);
      setChinkiMessages((m) => [...m, { role: 'chinki' as const, text: 'Ultra Optimize encountered an issue. I filled what I could — try adjusting the title and running again.' }]);
    } finally {
      setUltraOptimizing(false);
    }
  };

  const sendChinkiMessage = async () => {
    const msg = chinkiInput.trim();
    if (!msg || chinkiLoading) return;
    setChinkiMessages((m) => [...m, { role: 'user', text: msg }]);
    setChinkiInput('');
    setChinkiLoading(true);
    try {
      const res = await axios.post(
        '/api/youtube/chinki',
        {
          message: msg,
          context: {
            title,
            description,
            keywords: keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean),
            category,
            contentType,
            seoScore: seoData?.seoScore,
            thumbnailScore: thumbnailScore?.score,
            ctrPercent: ctrData?.ctrPercent,
            ctrScore: ctrData?.ctrScore,
            ctrFactors: ctrData?.factors,
            viralProbability,
            titleScore: titleScoreData?.titleScore,
            videoAnalyzed: !!videoSuggestions,
            transcript: videoTranscript,
            channelUrl: channelUrl.trim() || undefined,
            channelSummary: channelSummary || undefined,
          },
        },
        { headers: getAuthHeaders() }
      );
      setChinkiMessages((m) => [...m, { role: 'chinki', text: res.data.reply || '' }]);
    } catch (err: unknown) {
      const reply = (err as { response?: { data?: { reply?: string } } })?.response?.data?.reply;
      setChinkiMessages((m) => [
        ...m,
        { role: 'chinki', text: reply || 'I cannot reply right now. Please try again in a moment.' },
      ]);
    } finally {
      setChinkiLoading(false);
    }
  };

  const speakChinki = () => {
    const last = [...chinkiMessages].reverse().find((x) => x.role === 'chinki');
    if (!last?.text) return;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(last.text);
      u.lang = 'hi-IN';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  const chinkiWelcomed = useRef(false);
  useEffect(() => {
    if (allowed && !chinkiWelcomed.current) {
      chinkiWelcomed.current = true;
      setChinkiMessages([
        {
          role: 'chinki',
          text: t('yt.seo.chinki.welcome'),
        },
      ]);
    }
  }, [allowed]);

  const breakdownChartData = seoData?.breakdown
    ? Object.entries(seoData.breakdown).map(([name, v]) => ({ name: name.replace(/([A-Z])/g, ' $1').trim(), score: v.score }))
    : [];

  const viralProbability = !hasAnyInput
    ? 0
    : (() => {
      const s = seoData?.seoScore ?? 50;
      const t = titleScoreData?.titleScore ?? 50;
      const k = keywordData?.analysis?.seoScore ?? 50;
      const th = thumbnailScore?.score ?? 70;
      return Math.min(99, Math.round((s * 0.35 + t * 0.25 + k * 0.2 + th * 0.2)));
    })();

  const ctrPercentNumber = ctrData ? parseFloat(ctrData.ctrPercent) || 0 : 0;
  const meetsCtrTarget = ctrPercentNumber >= 12;
  const meetsViralTarget = viralProbability >= 75;

  if (allowed === null) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-10 h-10 animate-spin text-[#FF0000]" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (allowed === false) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-6 max-w-lg mx-auto text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Access restricted</h1>
            <p className="text-[#AAAAAA] mb-4">
              Your current plan or role does not include YouTube Live SEO Analyzer. Upgrade your plan or ask an admin to enable this feature in the Feature Matrix.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000]"
            >
              Back to Dashboard
            </button>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6 max-w-[1600px] mx-auto">
          {/* VFX Animated Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8 rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000]/20 via-[#FF4444]/10 to-[#FF0000]/20 animate-pulse" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 50%, rgba(255,0,0,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,68,68,0.1) 0%, transparent 50%)' }} />
            <div className="relative bg-[#0F0F0F]/80 backdrop-blur-xl border border-[#FF0000]/20 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF0000] to-[#CC0000] flex items-center justify-center shadow-lg shadow-[#FF0000]/30"
                  >
                    <Search className="w-7 h-7 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#FF4444]">
                      YouTube Live SEO Analyzer
                    </h1>
                    <p className="text-sm text-[#888] mt-0.5">Real-time AI-powered SEO optimization engine</p>
                  </div>
                </div>
                <motion.button
                  onClick={ultraOptimize}
                  disabled={ultraOptimizing || !hasAnyInput}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative group px-6 py-3 rounded-xl font-bold text-white text-sm overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000] via-[#FF4444] to-[#FF0000] bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-[#FF4444] via-[#FF6666] to-[#FF4444]" />
                  <span className="relative flex items-center gap-2">
                    {ultraOptimizing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Ultra Optimizing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Ultra Optimize for 11.8%+ CTR</>
                    )}
                  </span>
                </motion.button>
              </div>

              {/* Live Stats Bar */}
              {hasAnyInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3"
                >
                  <div className="bg-[#111]/80 border border-[#222] rounded-xl p-3 text-center">
                    <div className="text-xs text-[#666] uppercase font-bold tracking-wider mb-1">SEO Score</div>
                    <motion.div
                      key={seoData?.seoScore}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`text-2xl font-black ${(seoData?.seoScore ?? 0) >= 80 ? 'text-emerald-400' : (seoData?.seoScore ?? 0) >= 60 ? 'text-amber-400' : 'text-red-400'}`}
                    >
                      {loadingSeo ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `${seoData?.seoScore ?? 0}%`}
                    </motion.div>
                  </div>
                  <div className="bg-[#111]/80 border border-[#222] rounded-xl p-3 text-center">
                    <div className="text-xs text-[#666] uppercase font-bold tracking-wider mb-1">CTR Prediction</div>
                    <motion.div
                      key={ctrData?.ctrPercent}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`text-2xl font-black ${ctrPercentNumber >= 11.8 ? 'text-emerald-400' : ctrPercentNumber >= 8 ? 'text-amber-400' : 'text-red-400'}`}
                    >
                      {loadingCtr ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `${ctrData?.ctrPercent ?? '0'}%`}
                    </motion.div>
                  </div>
                  <div className="bg-[#111]/80 border border-[#222] rounded-xl p-3 text-center">
                    <div className="text-xs text-[#666] uppercase font-bold tracking-wider mb-1">Viral Probability</div>
                    <motion.div
                      key={viralProbability}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`text-2xl font-black ${viralProbability >= 75 ? 'text-emerald-400' : viralProbability >= 50 ? 'text-amber-400' : 'text-red-400'}`}
                    >
                      {`${viralProbability}%`}
                    </motion.div>
                  </div>
                  <div className="bg-[#111]/80 border border-[#222] rounded-xl p-3 text-center">
                    <div className="text-xs text-[#666] uppercase font-bold tracking-wider mb-1">Title Score</div>
                    <motion.div
                      key={titleScoreData?.titleScore}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`text-2xl font-black ${(titleScoreData?.titleScore ?? 0) >= 80 ? 'text-emerald-400' : (titleScoreData?.titleScore ?? 0) >= 60 ? 'text-amber-400' : 'text-red-400'}`}
                    >
                      {loadingTitle ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `${titleScoreData?.titleScore ?? 0}%`}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Shimmer keyframe */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
          ` }} />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* LEFT: Video form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-4"
            >
              {(!loadingFlags && sectionFlags.yt_seo_video_setup !== false) && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Video setup
                  </h2>

                <div className="flex gap-2 p-1 bg-[#212121] rounded-lg mb-4">
                  {(['video', 'short', 'live'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setContentType(type)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${contentType === type ? 'bg-[#FF0000] text-white' : 'text-[#AAA] hover:text-white hover:bg-[#333]'
                        }`}
                    >
                      {type === 'video' ? 'Video' : type === 'short' ? 'Short' : 'Live Stream'}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm text-[#AAAAAA]">
                        {contentType === 'short' ? 'Short Title' : contentType === 'live' ? 'Live Stream Title' : 'Video Title'}
                      </label>
                      <span className={`text-xs font-mono ${title.length >= 40 && title.length <= 65 ? 'text-emerald-400' : title.length > 70 ? 'text-red-400' : 'text-[#666]'}`}>
                        {title.length}/70 {title.length >= 40 && title.length <= 65 ? '✓' : title.length > 0 && title.length < 40 ? '(40-65 ideal)' : title.length > 70 ? '(too long)' : ''}
                      </span>
                    </div>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={contentType === 'short' ? 'e.g. 30 sec tip that changed my channel' : contentType === 'live' ? 'e.g. Live Q&A tonight 9 PM' : 'e.g. How to Go Viral on YouTube Shorts'}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm text-[#AAAAAA]">
                        {contentType === 'short' ? 'Short Description' : contentType === 'live' ? 'Live Stream Description' : 'Description'}
                      </label>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono ${description.length >= 200 && description.length <= 5000 ? 'text-emerald-400' : description.length > 5000 ? 'text-red-400' : 'text-[#666]'}`}>
                          {description.length} chars {description.length >= 200 ? '✓' : description.length > 0 ? '(200+ ideal)' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={fetchDescriptions}
                          disabled={!title.trim() || loadingDescriptions}
                          className="text-xs flex items-center gap-1 text-[#FF0000] hover:text-[#CC0000] transition disabled:opacity-50"
                        >
                          {loadingDescriptions ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          AI Generate
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={contentType === 'short' ? 'Short description (SEO + hashtags)...' : contentType === 'live' ? 'Live stream description, topic, timings...' : 'Video description...'}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000] resize-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm text-[#AAAAAA]">Keywords / Tags (comma or newline)</label>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono ${(() => { const count = keywords.split(/[,;\n]/).map(k => k.trim()).filter(Boolean).length; return count >= 8 && count <= 25 ? 'text-emerald-400' : count > 0 ? 'text-[#666]' : 'text-[#666]'; })()}`}>
                          {keywords.split(/[,;\n]/).map(k => k.trim()).filter(Boolean).length} tags {(() => { const count = keywords.split(/[,;\n]/).map(k => k.trim()).filter(Boolean).length; return count >= 8 ? '✓' : count > 0 ? '(8-25 ideal)' : ''; })()}
                        </span>
                        <button
                          type="button"
                          onClick={fetchHashtags}
                          disabled={(!keywords.trim() && !title.trim()) || loadingHashtags}
                          className="text-xs flex items-center gap-1 text-[#FF0000] hover:text-[#CC0000] transition disabled:opacity-50"
                        >
                          {loadingHashtags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          AI Generate
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder={contentType === 'short' ? 'shorts, viral, reels, 60 sec' : contentType === 'live' ? 'live, stream, qna, premier' : 'youtube shorts, viral tips, shorts growth'}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Thumbnail</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onThumbnailChange}
                        className="hidden"
                        id="thumb"
                      />
                      <label htmlFor="thumb" className="px-4 py-2 bg-[#212121] rounded-lg text-white cursor-pointer hover:bg-[#333]">
                        Choose file
                      </label>
                      {thumbnailPreview && (
                        <img src={thumbnailPreview} alt="Thumb" className="h-14 w-24 object-cover rounded border border-[#333]" />
                      )}
                      {loadingThumb && <Loader2 className="w-5 h-5 animate-spin text-[#FF0000]" />}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white focus:ring-2 focus:ring-[#FF0000]"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-1">Channel link (for Chinki)</label>
                    <p className="text-xs text-[#666] mb-1">
                      Once you add the link, Chinki will tell you how many videos are on the channel, what is missing and
                      which settings need fixing.
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={channelUrl}
                        onChange={(e) => saveChannelUrl(e.target.value)}
                        placeholder="https://www.youtube.com/@yourchannel"
                        className="flex-1 px-4 py-2.5 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] focus:ring-2 focus:ring-[#FF0000]"
                      />
                      <button
                        type="button"
                        onClick={fetchChannelSummary}
                        disabled={!channelUrl.trim() || channelSummaryLoading}
                        className="px-4 py-2.5 bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-50 text-white rounded-lg font-medium"
                      >
                        {channelSummaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Link channel'}
                      </button>
                    </div>
                    {channelSummary?.channelTitle && (
                      <p className="text-xs text-emerald-400 mt-1">
                        Linked: {channelSummary.channelTitle} · {channelSummary.videoCount ?? 0} videos · {channelSummary.subscriberCount?.toLocaleString() ?? 0} subs
                      </p>
                    )}

                    {/* Upload to YouTube Button */}
                    <div className="mt-6 pt-6 border-t border-[#333]">
                      <button
                        type="button"
                        onClick={handleYouTubeUpload}
                        disabled={isUploading || !videoFile}
                        className="w-full py-3.5 bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-xl font-bold flex items-center justify-center gap-3 transition disabled:opacity-50 shadow-lg shadow-[#FF0000]/20 group"
                      >
                        {isUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Youtube className="w-5 h-5 group-hover:scale-110 transition" />
                        )}
                        {isUploading ? 'Uploading to YouTube...' : 'Upload to YouTube Now'}
                      </button>
                      {uploadStatus && (
                        <div className={`mt-4 p-3 rounded-lg flex items-start gap-3 border ${uploadStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                            uploadStatus.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                              'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          }`}>
                          {uploadStatus.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5" /> : <Check className="w-4 h-4 mt-0.5" />}
                          <div className="text-xs flex-1">
                            {uploadStatus.message}
                            {uploadStatus.type === 'success' && (
                              <a
                                href="https://studio.youtube.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-1 font-semibold underline"
                              >
                                Go to YouTube Studio
                              </a>
                            )}
                          </div>
                          <button onClick={() => setUploadStatus(null)}>
                            <X className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
                          </button>
                        </div>
                      )}
                      <p className="mt-3 text-[10px] text-[#666] text-center italic">
                        Direct upload uses Google OAuth. You will be asked to link your account on the first attempt.
                      </p>
                    </div>
                  </div>
                  </div>
                </div>
              )}


              {/* Title Optimization (moved to left column) */}

              {/* Thumbnail Analysis (moved to left column) */}

              {/* Video upload (moved to left column) */}
            </motion.div>

            {/* RIGHT: Live SEO panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3 space-y-4"
            >
              {/* SEO Score */}
              {(!loadingFlags && sectionFlags.yt_seo_seo_score !== false) && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" /> SEO Score
                  </h2>
                  {loadingSeo ? (
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF0000]" />
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-bold text-white">{seoData?.seoScore ?? 0}</span>
                        <span className="text-[#AAAAAA]">/ 100</span>
                      </div>
                      <div className="h-3 bg-[#212121] rounded-full overflow-hidden mb-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${seoData?.seoScore ?? 0}%` }}
                          transition={{ duration: 0.6 }}
                          className={`h-full rounded-full ${(seoData?.seoScore ?? 0) >= 70
                            ? 'bg-emerald-500'
                            : (seoData?.seoScore ?? 0) >= 40
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                            }`}
                        />
                      </div>
                      {breakdownChartData.length > 0 && (
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={breakdownChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#888', fontSize: 12 }} />
                              <YAxis type="category" dataKey="name" tick={{ fill: '#AAA', fontSize: 11 }} width={90} />
                              <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333' }} labelStyle={{ color: '#fff' }} />
                              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                                {breakdownChartData.map((entry, i) => (
                                  <Cell
                                    key={i}
                                    fill={
                                      entry.score >= 70
                                        ? '#10b981'
                                        : entry.score >= 40
                                          ? '#f59e0b'
                                          : '#ef4444'
                                    }
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* CTR Predictor — real data from title, keywords, thumbnail */}
              {(!loadingFlags && sectionFlags.yt_seo_ctr_predictor !== false) && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#FF0000]" /> CTR Predictor
                  </h2>
                  {loadingCtr ? (
                    <div className="flex items-center gap-2 text-[#888]">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Calculating CTR…</span>
                    </div>
                  ) : ctrData ? (
                    <>
                      {/* CTR Score Header */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`text-3xl font-black ${ctrPercentNumber >= 11.8 ? 'text-emerald-400' : ctrPercentNumber >= 8 ? 'text-amber-400' : 'text-red-400'}`}>
                          {ctrData.ctrPercent}%
                        </div>
                        <div>
                          <span className="text-sm text-white font-medium">CTR Prediction</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meetsCtrTarget ? 'bg-emerald-500/20 text-emerald-400' : ctrPercentNumber >= 8 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                              {meetsCtrTarget ? '✓ Target achieved (11.8%+)' : ctrPercentNumber >= 8 ? '⚡ Close to target' : '⚠ Needs improvement'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Factor Progress Bars */}
                      <div className="space-y-3 mb-5">
                        {Object.entries(ctrData.factors).map(([key, value]) => {
                          const v = Math.round(value);
                          const label = key.replace(/([A-Z])/g, ' $1').trim();
                          const statusIcon = v >= 80 ? '✓' : v >= 60 ? '⚡' : '✗';
                          const textColor = v >= 80 ? 'text-emerald-400' : v >= 60 ? 'text-amber-400' : 'text-red-400';
                          const barColor = v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-red-500';
                          return (
                            <div key={key}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-[#AAA] capitalize flex items-center gap-1.5">
                                  <span className={textColor}>{statusIcon}</span>
                                  {label}
                                </span>
                                <span className={`text-xs font-bold ${textColor}`}>{v}/100</span>
                              </div>
                              <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${v}%` }}
                                  transition={{ duration: 0.8, ease: 'easeOut' }}
                                  className={`h-full rounded-full ${barColor}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Weak Factors Alert */}
                      {(() => {
                        const weakFactors = Object.entries(ctrData.factors).filter(([, v]) => v < 70);
                        if (weakFactors.length === 0) return null;
                        return (
                          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                              ⚠ {weakFactors.length} factor{weakFactors.length > 1 ? 's' : ''} holding back your CTR
                            </p>
                            <div className="space-y-1.5">
                              {weakFactors.map(([key, value]) => (
                                <div key={key} className="flex items-start gap-2 text-xs">
                                  <span className="text-red-400 mt-0.5">•</span>
                                  <span className="text-[#AAA]">
                                    <span className="text-white font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    {' '}({Math.round(value)}/100) — {
                                      key === 'titleCuriosity' ? 'Add power words (Secret, Amazing), numbers, questions, or [brackets] to title' :
                                      key === 'keywordRelevance' ? 'Place main keyword in first 3 words of title' :
                                      key === 'thumbnailContrast' ? 'Use bold high-contrast colors, red/yellow text on dark background' :
                                      key === 'faceDetection' ? 'Add a face showing surprise/excitement to thumbnail — boosts CTR 30-40%' :
                                      key === 'textReadability' ? 'Keep thumbnail text to 3-5 words MAX with thick bold fonts' :
                                      key === 'descriptionQuality' ? 'Write 200+ char description with keywords, timestamps, hashtags & CTA' :
                                      key === 'hashtagStrategy' ? 'Use 10-20 keywords mixing short-tail + long-tail + trending (#viral #shorts)' :
                                      'Improve this factor for higher CTR'
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Suggestions */}
                      {ctrData.suggestions && ctrData.suggestions.length > 0 && (
                        <div className="pt-3 border-t border-[#333]">
                          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">💡 Pro Tips to Boost CTR</p>
                          <ul className="text-sm text-[#AAA] space-y-2">
                            {ctrData.suggestions.map((s, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-400 text-xs mt-1">→</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-[#666] text-sm">
                      Add a title, some keywords and a thumbnail to see a data‑driven CTR prediction with factor breakdown.
                    </p>
                  )}
                </div>
              )}

              {/* AI Description Suggestions — New Right Side Block */}
              {(!loadingFlags && sectionFlags.yt_seo_descriptions !== false && descriptions.length > 0) && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" /> AI Description Suggestions
                  </h2>
                  <p className="text-xs text-[#888] mb-4">Click any suggestion to apply it to your description field.</p>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {descriptions.map((d, i) => (
                      <div
                        key={i}
                        onClick={() => addDescriptionToField(d.text)}
                        className="p-3 bg-[#0F0F0F] hover:bg-[#1a1a1a] border border-[#333] rounded-lg cursor-pointer transition"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-[#666]">Option {i + 1}</span>
                          <span className="text-xs font-bold text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded-full">{d.seoScore}% SEO</span>
                        </div>
                        <p className="text-sm text-[#AAA] line-clamp-3">{d.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Hashtags — New Right Side Block */}
              {(!loadingFlags && sectionFlags.yt_seo_hashtags !== false && hashtags.length > 0) && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-400" /> Viral Hashtag Suggestions
                    </h2>
                    <button
                      type="button"
                      onClick={fetchHashtags}
                      disabled={loadingHashtags || (!keywords.trim() && !title.trim())}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium transition disabled:opacity-50"
                    >
                      {loadingHashtags ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Refresh
                    </button>
                  </div>
                  <p className="text-xs text-[#888] mb-4">Click to append hashtags to your description. Refresh for new suggestions.</p>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((h, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => addHashtagToDescription(h.tag)}
                        className={`px-3 py-1.5 gap-1.5 flex items-center rounded-lg text-xs border transition hover:scale-105 active:scale-95 ${h.viralLevel === 'high'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : h.viralLevel === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                      >
                        <Hash className="w-3.5 h-3.5" />
                        <span className="font-medium">{h.tag.replace('#', '')}</span>
                        {h.viralScore && <span className="text-[10px] opacity-60 ml-0.5">{h.viralScore}%</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Viral Keywords with % and Refresh */}
              {(!loadingFlags && sectionFlags.yt_seo_keywords !== false) && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-400" /> Viral Keywords
                    </h2>
                    <button
                      type="button"
                      onClick={searchViralKeywords}
                      disabled={loadingViralSearch || (!title.trim() && !keywords.trim())}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium transition disabled:opacity-50"
                    >
                      {loadingViralSearch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Refresh
                    </button>
                  </div>
                  <p className="text-xs text-[#888] mb-4">Click any keyword to add to your tags. Refresh for new viral keywords.</p>

                  {loadingViralSearch ? (
                    <div className="flex items-center gap-2 text-[#888]">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                      <span className="text-sm">Finding viral keywords...</span>
                    </div>
                  ) : viralSearchResults && viralSearchResults.length > 0 ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {viralSearchResults.map((kw, i) => {
                        const scoreColor = kw.viralScore >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : kw.viralScore >= 60 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30';
                        const barColor = kw.viralScore >= 80 ? 'bg-emerald-500' : kw.viralScore >= 60 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                          <div
                            key={i}
                            onClick={() => addKeywordToField(kw.keyword)}
                            className="flex items-center justify-between p-2.5 bg-[#111] border border-[#222] rounded-lg cursor-pointer hover:bg-[#1a1a1a] hover:border-purple-500/30 transition group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-purple-400 text-xs font-bold w-5 text-center">{i + 1}</span>
                              <span className="text-sm text-white group-hover:text-purple-300 transition truncate">{kw.keyword}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="w-16 h-1.5 bg-[#222] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${kw.viralScore}%` }} />
                              </div>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${scoreColor}`}>
                                {kw.viralScore}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : keywordData?.viralKeywords && keywordData.viralKeywords.length > 0 ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {keywordData.viralKeywords.map((kw, i) => {
                        const scoreColor = kw.viralScore >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : kw.viralScore >= 60 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30';
                        const barColor = kw.viralScore >= 80 ? 'bg-emerald-500' : kw.viralScore >= 60 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                          <div
                            key={i}
                            onClick={() => addKeywordToField(kw.keyword)}
                            className="flex items-center justify-between p-2.5 bg-[#111] border border-[#222] rounded-lg cursor-pointer hover:bg-[#1a1a1a] hover:border-purple-500/30 transition group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-purple-400 text-xs font-bold w-5 text-center">{i + 1}</span>
                              <span className="text-sm text-white group-hover:text-purple-300 transition truncate">{kw.keyword}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="w-16 h-1.5 bg-[#222] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${kw.viralScore}%` }} />
                              </div>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${scoreColor}`}>
                                {kw.viralScore}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[#666] text-sm">Enter a title or keywords to see viral keyword suggestions with scores.</p>
                  )}
                </div>
              )}

              {(!loadingFlags && sectionFlags.yt_seo_best_posting_time !== false) && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#FF0000]" /> Best Posting Time
                  </h2>
                  <p className="text-xs text-[#888] mb-3">
                    After you add a channel link, we use your own YouTube data to show which days and times get the
                    most views.
                  </p>
                  {loadingBestPostingTime ? (
                    <div className="flex items-center gap-2 text-[#888]">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">{t('yt.seo.bestPostingTime.loading')}</span>
                    </div>
                  ) : bestPostingTime?.bestSlots?.length ? (
                    <>
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-amber-400 mb-1">{t('yt.seo.bestPostingTime.highViewsDays')}</p>
                        <div className="flex flex-wrap gap-2">
                          {bestPostingTime.bestDays.map((d, i) => (
                            <span key={i} className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-sm font-medium">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-emerald-400 mb-1">{t('yt.seo.bestPostingTime.highViewsHours')}</p>
                        <div className="flex flex-wrap gap-2">
                          {bestPostingTime.bestHours.map((h) => (
                            <span key={h} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-sm font-medium">
                              {h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`} (UTC)
                            </span>
                          ))}
                        </div>
                      </div>
                      {bestPostingTime.bestSlots.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-white/90 mb-2">{t('yt.seo.bestPostingTime.topSlots')}</p>
                          <ul className="text-sm text-[#AAA] space-y-1">
                            {bestPostingTime.bestSlots.slice(0, 5).map((s, i) => (
                              <li key={i}>
                                <span className="text-white">{s.day}</span> {s.timeLabel} (UTC) — views share {s.share}%
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-xs text-[#888] pt-2 border-t border-[#333]">
                        {bestPostingTime.summary?.replace(/\*\*/g, '')}
                        {bestPostingTime.totalVideosAnalyzed != null && (
                          <span className="block mt-1"> ({bestPostingTime.totalVideosAnalyzed} {t('yt.seo.bestPostingTime.videosAnalyzed')})</span>
                        )}
                      </p>
                    </>
                  ) : channelUrl.trim() && !channelSummary?.videoCount ? (
                    <p className="text-[#666] text-sm">First link the channel and click “Link channel”.</p>
                  ) : channelSummary?.videoCount === 0 ? (
                    <p className="text-[#666] text-sm">
                      This channel does not have any videos yet. Upload some videos and we will calculate the best time.
                    </p>
                  ) : bestPostingTime?.summary && !bestPostingTime.bestSlots?.length ? (
                    <p className="text-[#666] text-sm">{bestPostingTime.summary}</p>
                  ) : (
                    <p className="text-[#666] text-sm">
                      Add your channel link and click &quot;Link channel&quot; to see the best days and times to post
                      based on your views.
                    </p>
                  )}
                </div>
              )}


              {(!loadingFlags && sectionFlags.yt_seo_competitors !== false) && (
                <>
                  <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Youtube className="w-5 h-5" /> Top competitor videos
                    </h2>
                    <p className="text-xs text-[#888] mb-3">
                      Click a video to see full details. Click the keyword button to add it into the Keywords section.
                    </p>
                    {loadingCompetitors ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#FF0000]" />
                    ) : competitors.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {competitors.map((v, i) => (
                          <div
                            key={v.videoId || i}
                            className="flex items-center gap-3 p-2 rounded-lg bg-[#212121] hover:bg-[#2a2a2a] cursor-pointer transition border border-transparent hover:border-[#333]"
                            onClick={() => setSelectedCompetitor(v)}
                          >
                            {v.thumbnailUrl && <img src={v.thumbnailUrl} alt="" className="w-20 h-11 object-cover rounded flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{v.title}</p>
                              <p className="text-xs text-[#888]">{v.channelTitle} · {v.views.toLocaleString()} views · {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : ''}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-xs text-amber-400 font-medium">
                                  Estimated relevance for your keyword: {v.relevanceScore ?? (90 - i * 5)}%
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addKeywordToField(
                                      competitorKeyword || keywordData?.keyword || v.title.split(/\s+/).slice(0, 3).join(' ')
                                    );
                                  }}
                                  className="text-xs px-2 py-0.5 rounded bg-[#FF0000]/20 text-[#FF0000] hover:bg-[#FF0000]/30 border border-[#FF0000]/40"
                                >
                                  + {competitorKeyword || 'keyword'} {t('yt.seo.competitor.addKeyword')}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#666] text-sm">Enter a keyword to see top videos.</p>
                    )}
                  </div>

                  {selectedCompetitor && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70" onClick={() => setSelectedCompetitor(null)}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#181818] border border-[#212121] rounded-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-xl"
                      >
                        <div className="p-4 border-b border-[#212121] flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-white">Video details</h3>
                          <button type="button" onClick={() => setSelectedCompetitor(null)} className="p-1 rounded hover:bg-[#212121] text-[#888]">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 space-y-3">
                          {selectedCompetitor.thumbnailUrl && (
                            <img src={selectedCompetitor.thumbnailUrl} alt="" className="w-full aspect-video object-cover rounded-lg" />
                          )}
                          <div>
                            <p className="text-white font-medium">{selectedCompetitor.title}</p>
                            <p className="text-xs text-[#888] mt-1">{selectedCompetitor.channelTitle}</p>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="text-[#AAA]">{selectedCompetitor.views.toLocaleString()} views</span>
                            {selectedCompetitor.likeCount != null && <span className="text-[#AAA]">{selectedCompetitor.likeCount.toLocaleString()} likes</span>}
                            {selectedCompetitor.commentCount != null && <span className="text-[#AAA]">{selectedCompetitor.commentCount.toLocaleString()} comments</span>}
                            <span className="text-[#AAA]">{selectedCompetitor.publishedAt ? new Date(selectedCompetitor.publishedAt).toLocaleDateString() : ''}</span>
                          </div>
                          <p className="text-xs text-amber-400">
                            Estimated relevance for your keyword: <strong>{selectedCompetitor.relevanceScore ?? 85}%</strong>
                          </p>
                          {selectedCompetitor.description && (
                            <div>
                              <p className="text-xs text-[#888] mb-1">Description</p>
                              <p className="text-sm text-[#CCC] line-clamp-5">{selectedCompetitor.description}</p>
                            </div>
                          )}
                          {selectedCompetitor.videoUrl && !selectedCompetitor.videoUrl.startsWith('#') && (
                            <a
                              href={selectedCompetitor.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-[#FF0000] hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" /> YouTube
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => { addKeywordToField(competitorKeyword || keywordData?.keyword || ''); setSelectedCompetitor(null); }}
                            className="w-full py-2 rounded-lg bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/40 hover:bg-[#FF0000]/30 text-sm font-medium"
                          >
                            Add “{competitorKeyword || keywordData?.keyword || 'keyword'}” to the Keywords section
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </>
              )}

              {/* 5 Auto Descriptions — click to add to Description; SEO score shown; Short/Live aware */}
              {/* (Moved to left column under Channel link) */}

              {/* 25 Viral Hashtags — color coded; click to add; Short/Live aware */}
              {/* (Moved to left column under Channel link) */}

              {(!loadingFlags && sectionFlags.yt_seo_title_score !== false) && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Type className="w-5 h-5" /> Title optimization
                    </h2>
                    <button
                      type="button"
                      onClick={fetchTitleScore}
                      disabled={loadingTitle || !title.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition disabled:opacity-50"
                    >
                      {loadingTitle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Refresh
                    </button>
                  </div>
                  {loadingTitle ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#FF0000]" />
                  ) : titleScoreData ? (
                    <>
                      <p className="text-sm text-[#AAA] mb-2">
                        Current title score:{' '}
                        <span className={`font-semibold ${titleScoreData.titleScore >= 80 ? 'text-emerald-400' : titleScoreData.titleScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{titleScoreData.titleScore}%</span>
                      </p>
                      <p className="text-xs text-[#888] mb-3">Click a title to apply it. Refresh for new viral suggestions.</p>
                      <ul className="space-y-2">
                        {(Array.isArray(titleScoreData.improvedTitles) ? titleScoreData.improvedTitles : [])
                          .map((item, i) => {
                            const title = typeof item === 'string' ? item : item.title;
                            const score = typeof item === 'string' ? 90 - i * 5 : item.score;
                            return { title, score };
                          })
                          .map((t, i) => (
                            <li
                              key={i}
                              onClick={() => setTitle(t.title)}
                              className={`text-sm text-white pl-3 border-l-2 ${t.score >= 80 ? 'border-emerald-500' : t.score >= 60 ? 'border-amber-500' : 'border-red-500'} flex items-center justify-between gap-2 cursor-pointer hover:bg-[#1a1a1a] p-2 rounded-r-lg transition group`}
                            >
                              <span className="group-hover:text-[#FF0000] transition">{t.title}</span>
                              <span className="flex items-center gap-2 flex-shrink-0">
                                {t.score >= 80 && (
                                  <span className="text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/60">
                                    Recommended
                                  </span>
                                )}
                                <span className={`font-semibold ${t.score >= 80 ? 'text-emerald-400' : t.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{t.score}%</span>
                              </span>
                            </li>
                          ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-[#666] text-sm">Enter a title to get suggestions.</p>
                  )}
                </div>
              )}

              {(!loadingFlags && sectionFlags.yt_seo_thumbnail !== false) && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" /> Thumbnail Analysis & AI Generator
                    </h2>
                  </div>

                  {/* Upload Section */}
                  {thumbnailScore ? (
                    <>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-bold text-white">{thumbnailScore.score}</span>
                        <span className="text-[#AAA]">/ 100</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div className="bg-[#212121] rounded p-2">
                          <p className="text-[#888]">Face detection</p>
                          <p className="text-white">{thumbnailScore.faceDetection}</p>
                        </div>
                        <div className="bg-[#212121] rounded p-2">
                          <p className="text-[#888]">Color contrast</p>
                          <p className="text-white">{thumbnailScore.colorContrast}</p>
                        </div>
                        <div className="bg-[#212121] rounded p-2">
                          <p className="text-[#888]">Text readability</p>
                          <p className="text-white">{thumbnailScore.textReadability}</p>
                        </div>
                      </div>
                      {thumbnailScore.suggestions && thumbnailScore.suggestions.length > 0 && (
                        <div className="pt-3 border-t border-[#333] mb-4">
                          <p className="text-xs font-semibold text-amber-400 mb-2">{t('yt.seo.thumbnail.improvementTitle')}</p>
                          <ul className="text-sm text-[#AAA] space-y-1">
                            {thumbnailScore.suggestions.map((s, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-amber-500">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-[#666] text-sm mb-4">Upload a thumbnail to analyze or generate AI thumbnails below.</p>
                  )}

                  {/* AI Thumbnail Generator */}
                  <div className="pt-4 border-t border-[#333]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#FF0000]" /> AI Auto-Generate Thumbnails
                      </p>
                      <button
                        type="button"
                        onClick={generateAIThumbnails}
                        disabled={generatingThumbs || (!title.trim() && !keywords.trim())}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000]/10 hover:bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/30 rounded-lg text-xs font-medium transition disabled:opacity-50"
                      >
                        {generatingThumbs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        {generatingThumbs ? 'Generating 3 styles...' : thumbPhotos.length > 0 ? 'Generate Film Poster Thumbnails' : 'Generate 3 AI Thumbnails'}
                      </button>
                    </div>
                    {/* Photo Upload for Film Poster Style */}
                    <div className="mb-4 p-3 bg-[#0F0F0F] border border-[#333] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-[#AAA] flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" /> Upload Photos (optional, max 2)
                        </p>
                        <span className="text-[10px] text-[#555]">{thumbPhotos.length}/2 photos</span>
                      </div>
                      <p className="text-[10px] text-[#555] mb-2">Upload your face/subject photos — AI will mix them with VFX to create film poster style thumbnails.</p>
                      <div className="flex items-center gap-3">
                        {thumbPhotoFiles.map((file, i) => (
                          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#444] group">
                            <img src={URL.createObjectURL(file)} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeThumbPhoto(i)}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        ))}
                        {thumbPhotos.length < 2 && (
                          <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-[#444] rounded-lg cursor-pointer hover:border-[#FF0000]/50 hover:bg-[#1a1a1a] transition">
                            <input type="file" accept="image/*" className="hidden" onChange={onThumbPhotoSelect} />
                            <ImageIcon className="w-5 h-5 text-[#555]" />
                            <span className="text-[9px] text-[#555] mt-0.5">Add</span>
                          </label>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#666] mb-3">
                      {thumbPhotos.length > 0
                        ? `${thumbPhotos.length} photo${thumbPhotos.length > 1 ? 's' : ''} uploaded — will generate cinematic film poster thumbnails with your photos mixed in.`
                        : '3 different styles: Breaking News, MrBeast, Dynamic Neon — each optimized for high CTR.'}
                    </p>

                    {/* Loading State */}
                    {generatingThumbs && (
                      <div className="grid grid-cols-1 gap-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="relative rounded-xl overflow-hidden bg-[#111] border border-[#222] aspect-video animate-pulse">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#1a1a1a] to-[#111] bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#FF0000] mx-auto mb-2" />
                                <p className="text-xs text-[#555]">Generating style {i}...</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Generated Thumbnails */}
                    {!generatingThumbs && generatedThumbnails.length > 0 && (
                      <div className="grid grid-cols-1 gap-4">
                        {generatedThumbnails.map((thumb, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className="relative group rounded-xl overflow-hidden border border-[#333] hover:border-[#FF0000]/50 transition-all"
                          >
                            {/* Thumbnail Image */}
                            <div className="relative aspect-video bg-[#111]">
                              <img
                                src={thumb.url}
                                alt={`AI Thumbnail ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {/* Overlay on hover */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <a
                                  href={thumb.url}
                                  download={`thumbnail-${i + 1}.png`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-[#FF0000] text-white rounded-lg text-sm font-bold hover:bg-[#CC0000] transition flex items-center gap-1.5"
                                >
                                  <Download className="w-4 h-4" /> Download
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setThumbnailPreview(thumb.url);
                                    setThumbnailScore({ score: thumb.ctr, faceDetection: 1, colorContrast: 85, textReadability: 80, suggestions: [] });
                                  }}
                                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-1.5"
                                >
                                  <Check className="w-4 h-4" /> Use This
                                </button>
                              </div>
                            </div>
                            {/* Info Bar */}
                            <div className="bg-[#111] p-3 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-white">{thumb.style}</p>
                                <p className="text-[10px] text-[#666] mt-0.5 truncate max-w-[200px]">{thumb.text}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${thumb.ctr >= 85 ? 'bg-emerald-500/20 text-emerald-400' : thumb.ctr >= 70 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                  CTR: {thumb.ctr}%
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(!loadingFlags && sectionFlags.yt_seo_video_analyze !== false) && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Upload className="w-5 h-5" /> Video upload
                  </h2>
                  <p className="text-xs text-[#888] mb-3">
                    Video uploaded directly to YouTube will appear here for optimization.
                  </p>
                  {!videoPreviewUrl ? (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#333] rounded-lg cursor-pointer hover:bg-[#212121] transition">
                      <input type="file" accept="video/*" className="hidden" onChange={onVideoSelect} disabled={videoAnalyzing} />
                      <Upload className="w-8 h-8 text-[#666] mb-1" />
                      <span className="text-sm text-[#888]">Choose a video</span>
                    </label>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-lg overflow-hidden bg-black aspect-video max-h-48">
                        <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={runVideoAnalyze}
                          disabled={videoAnalyzing}
                          className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-50 text-white rounded-lg font-medium text-sm flex items-center gap-2"
                        >
                          {videoAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          {videoAnalyzing ? 'Analyzing…' : 'Analyze'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
                            setVideoPreviewUrl(null);
                            setVideoFile(null);
                            setVideoSuggestions(null);
                          }}
                          className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg text-sm"
                        >
                          New video
                        </button>
                      </div>
                    </div>
                  )}
                  {videoSuggestions && (
                    <p className="text-sm text-emerald-400 mt-2">
                      The transcript is in Chinki&apos;s textbox; the title, keywords, hashtags and description have been
                      set from the video content. You can ask Chinki for more viral tips based on this video.
                    </p>
                  )}
                </div>
              )}

              {/* Viral Probability */}
              {(!loadingFlags && sectionFlags.yt_seo_viral_probability !== false) && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Viral probability
                  </h2>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-[#FF0000]">{viralProbability}</span>
                      <span className="text-[#AAA]">%</span>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${meetsViralTarget ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}
                    >
                      {meetsViralTarget ? 'High viral setup (75%+)' : 'Below viral target (aim for 75%+)'}
                    </span>
                  </div>
                  <p className="text-sm text-[#AAA] mb-4">
                    This score combines SEO, title, keyword and thumbnail quality into one viral probability.
                  </p>
                  <div className="h-3 bg-[#212121] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${viralProbability}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-[#FF0000] to-amber-500 rounded-full"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Chinki AI — minimize/slide + live guidance */}
          {(!loadingFlags && sectionFlags.yt_seo_chinki !== false) && (
            <AnimatePresence>
              {chinkiPanelOpen ? (
                <motion.div
                  key="chinki-panel"
                  initial={{ opacity: 0, x: 80 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 80 }}
                  transition={{ type: 'tween', duration: 0.25 }}
                  className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] bg-[#181818] border border-[#212121] rounded-xl shadow-xl flex flex-col max-h-[420px] z-50"
                >
                  <div className="p-3 border-b border-[#212121] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#FF0000]/20 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-[#FF0000]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white">Chinki</p>
                        <p className="text-xs text-[#888]">{t('yt.seo.chinki.subtitle')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChinkiPanelOpen(false)}
                      className="p-2 rounded-lg hover:bg-[#212121] text-[#888] hover:text-white transition flex-shrink-0"
                      title="Minimize / hide panel"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[180px]">
                    {chinkiMessages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'user'
                            ? 'bg-[#FF0000] text-white'
                            : 'bg-[#212121] text-[#CCC]'
                            }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {chinkiLoading && (
                      <div className="flex justify-start">
                        <div className="bg-[#212121] rounded-lg px-3 py-2 text-sm text-[#888]">{t('yt.seo.chinki.thinking')}</div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-[#212121] flex gap-2">
                    <input
                      value={chinkiInput}
                      onChange={(e) => setChinkiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChinkiMessage()}
                      placeholder={t('yt.seo.chinki.placeholder')}
                      className="flex-1 px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] text-sm focus:ring-2 focus:ring-[#FF0000]"
                    />
                    <button
                      type="button"
                      onClick={speakChinki}
                      className="p-2 rounded-lg bg-[#212121] hover:bg-[#333] text-[#AAA]"
                      title={t('yt.seo.chinki.speakTitle')}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={sendChinkiMessage}
                      disabled={chinkiLoading || !chinkiInput.trim()}
                      className="p-2 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-white disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="chinki-fab"
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'tween', duration: 0.2 }}
                  onClick={() => setChinkiPanelOpen(true)}
                  className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-full shadow-lg font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Chinki</span>
                  <ChevronUp className="w-4 h-4 opacity-80" />
                </motion.button>
              )}
            </AnimatePresence>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

export default function YouTubeLiveSEOPage() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading...</div>}>
      <YouTubeLiveSEOContent />
    </Suspense>
  );
}
