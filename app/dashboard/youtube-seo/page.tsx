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

const CATEGORIES = [
  'Education', 'Entertainment', 'Howto & Style', 'People & Blogs', 'Science & Technology',
  'Sports', 'News & Politics', 'Music', 'Comedy', 'Film & Animation', 'Gaming', 'Other',
];

const DEBOUNCE_MS = 500;

function YouTubeLiveSEOContent() {
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
  const [channelPageSuggestedKeywords, setChannelPageSuggestedKeywords] = useState<{ keyword: string; score: number }[]>([]);
  const [channelPageKeywordInput, setChannelPageKeywordInput] = useState('');
  const [channelKeywordNotification, setChannelKeywordNotification] = useState<string | null>(null);
  const [copiedAllKeywords, setCopiedAllKeywords] = useState(false);
  const [copiedKeywordValue, setCopiedKeywordValue] = useState<string | null>(null);
  const [channelSummaryLoading, setChannelSummaryLoading] = useState(false);
  const [bestPostingTime, setBestPostingTime] = useState<{
    bestSlots: { day: string; hour: number; timeLabel: string; views: number; share: number }[];
    bestDays: string[];
    bestHours: number[];
    summary: string;
    totalVideosAnalyzed?: number;
  } | null>(null);
  const [loadingBestPostingTime, setLoadingBestPostingTime] = useState(false);
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

  useEffect(() => {
    if (typeof window === 'undefined' || !channelUrl.trim()) return;
    try {
      const key = `youtube-seo-channel-keywords-${channelUrl.trim().replace(/[/?:]/g, '_')}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr = JSON.parse(raw) as { keyword: string; score: number }[];
        if (Array.isArray(arr)) setChannelPageSuggestedKeywords(arr);
      }
    } catch (_) { }
  }, [channelUrl]);

  const saveChannelPageSuggestedKeywords = useCallback((list: { keyword: string; score: number }[]) => {
    setChannelPageSuggestedKeywords(list);
    if (typeof window !== 'undefined' && channelUrl.trim()) {
      try {
        const key = `youtube-seo-channel-keywords-${channelUrl.trim().replace(/[/?:]/g, '_')}`;
        localStorage.setItem(key, JSON.stringify(list));
      } catch (_) { }
    }
  }, [channelUrl]);

  const addChannelPageKeyword = () => {
    const kw = channelPageKeywordInput.trim();
    if (!kw) return;
    const score = 70 + Math.min(25, kw.length * 2);
    saveChannelPageSuggestedKeywords([...channelPageSuggestedKeywords, { keyword: kw, score }]);
    setChannelPageKeywordInput('');
    setChannelKeywordNotification(`"${kw}" add ho gaya. Channel About section me ye keyword daal dein.`);
    setTimeout(() => setChannelKeywordNotification(null), 4000);
  };

  const removeChannelPageSuggestedKeyword = (index: number) => {
    const next = channelPageSuggestedKeywords.filter((_, i) => i !== index);
    saveChannelPageSuggestedKeywords(next);
  };

  const allKeywordsForChannelPage = [
    ...channelPageSuggestedKeywords.map((x) => x.keyword),
    ...(channelSummary?.recommendedKeywords?.map((r) => r.keyword) || []),
  ].filter(Boolean);
  const uniqueKeywordsForCopy = Array.from(new Set(allKeywordsForChannelPage));

  const copyAllSuggestedToChannelPage = async () => {
    if (uniqueKeywordsForCopy.length === 0) return;
    const text = uniqueKeywordsForCopy.join(', ');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAllKeywords(true);
      setChannelKeywordNotification('Keywords copied! Paste them in YouTube Studio → Channel → About.');
      setTimeout(() => setCopiedAllKeywords(false), 2000);
      setTimeout(() => setChannelKeywordNotification(null), 5000);
    } catch (_) {
      setChannelKeywordNotification('Copy failed. Please check browser clipboard permissions.');
    }
  };

  const copyOneKeywordToChannel = async (keyword: string) => {
    try {
      await navigator.clipboard.writeText(keyword);
      setCopiedKeywordValue(keyword);
      setTimeout(() => setCopiedKeywordValue(null), 2000);
    } catch (_) { }
  };

  const searchViralKeywords = useCallback(async () => {
    const q = viralSearchQuery.trim() || title.trim().split(/\s+/).slice(0, 3).join(' ') || 'viral';
    setLoadingViralSearch(true);
    setViralSearchResults(null);
    try {
      const res = await axios.get(
        `/api/youtube/keywords?keyword=${encodeURIComponent(q)}&title=${encodeURIComponent(q)}`,
        { headers: getAuthHeaders() }
      );
      setViralSearchResults(res.data?.viralKeywords || []);
    } catch {
      setViralSearchResults([]);
    } finally {
      setLoadingViralSearch(false);
    }
  }, [viralSearchQuery, title]);

  const searchHomePageKeywordsByTopic = useCallback(async () => {
    const topic = homePageTopicSearch.trim();
    if (!topic) return;
    setLoadingHomePageTopic(true);
    setHomePageTopicResults(null);
    try {
      const res = await axios.get(
        `/api/youtube/keywords?keyword=${encodeURIComponent(topic)}&title=${encodeURIComponent(topic)}`,
        { headers: getAuthHeaders() }
      );
      const list = (res.data?.viralKeywords || []).slice(0, 30);
      setHomePageTopicResults(list);
    } catch {
      setHomePageTopicResults([]);
    } finally {
      setLoadingHomePageTopic(false);
    }
  }, [homePageTopicSearch]);

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
    const kw = keywords.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean)[0] || '';
    setLoadingKeywords(true);
    if (kw) setLoadingCompetitors(true);
    try {
      const [kwRes, compRes] = await Promise.all([
        axios.get(`/api/youtube/keywords?keyword=${encodeURIComponent(kw)}&title=${encodeURIComponent(title)}`, { headers: getAuthHeaders() }),
        kw ? axios.get(`/api/youtube/competitors?keyword=${encodeURIComponent(kw)}&max=10`, { headers: getAuthHeaders() }) : Promise.resolve({ data: { competitors: [] } }),
      ]);
      setKeywordData(kwRes.data);
      setCompetitors(compRes.data?.competitors || []);
      setCompetitorKeyword(compRes.data?.searchKeyword || kw || '');
    } catch {
      setKeywordData(null);
      setCompetitors([]);
    } finally {
      setLoadingKeywords(false);
      setLoadingCompetitors(false);
    }
  }, [keywords, title]);

  const fetchDescriptions = useCallback(async () => {
    setLoadingDescriptions(true);
    try {
      const res = await axios.get(
        `/api/youtube/descriptions?title=${encodeURIComponent(title)}&keywords=${encodeURIComponent(keywords)}&category=${encodeURIComponent(category)}&contentType=${contentType}`,
        { headers: getAuthHeaders() }
      );
      setDescriptions(res.data.descriptions || []);
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
      const res = await axios.get(`/api/youtube/hashtags?keyword=${encodeURIComponent(kw)}&contentType=${contentType}`, { headers: getAuthHeaders() });
      setHashtags(res.data.hashtags || []);
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
  }, [title, keywords, thumbnailScore?.score, thumbnailScore?.colorContrast, thumbnailScore?.faceDetection, thumbnailScore?.textReadability, hasAnyInput]);

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
      setUploadStatus({
        type: 'error',
        message: err.response?.data?.error || 'Upload failed. Please try again.'
      });
    } finally {
      setIsUploading(false);
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
          text:
            'Hi! I am Chinki, your AI assistant for YouTube SEO. I can guide you live on titles, descriptions, thumbnails and keywords. Ask me anything you want to improve.',
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <Search className="w-8 h-8 text-[#FF0000]" />
            <div>
              <h1 className="text-2xl font-bold text-white">YouTube Live SEO Analyzer</h1>
              <p className="text-sm text-[#AAAAAA]">Real-time SEO feedback while you prepare your upload (vidIQ / TubeBuddy style)</p>
            </div>
          </motion.div>

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
                    <label className="block text-sm text-[#AAAAAA] mb-1">
                      {contentType === 'short' ? 'Short Title' : contentType === 'live' ? 'Live Stream Title' : 'Video Title'}
                    </label>
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
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl font-bold text-white">CTR Prediction: {ctrData.ctrPercent}%</span>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${meetsCtrTarget ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}
                        >
                          {meetsCtrTarget ? 'Meets 12%+ target' : 'Below 12% target'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                        {Object.entries(ctrData.factors).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-[#AAAAAA] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span
                              className={`font-semibold ${value >= 70 ? 'text-emerald-400' : value >= 40 ? 'text-amber-400' : 'text-red-400'
                                }`}
                            >
                              {Math.round(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {ctrData.suggestions && ctrData.suggestions.length > 0 && (
                        <div className="pt-3 border-t border-[#333]">
                          <p className="text-xs font-semibold text-amber-400 mb-2">Suggestions</p>
                          <ul className="text-sm text-[#AAA] space-y-1 list-disc list-inside">
                            {ctrData.suggestions.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-[#666] text-sm">
                      Add a title, some keywords and a thumbnail to see a data‑driven CTR prediction.
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
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" /> Viral Hashtag Suggestions
                  </h2>
                  <p className="text-xs text-[#888] mb-4">Click to append hashtags to your description for better visibility.</p>
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
                      <span className="text-sm">Channel analyze karke best time nikal rahe hain…</span>
                    </div>
                  ) : bestPostingTime?.bestSlots?.length ? (
                    <>
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-amber-400 mb-1">Zyada views wale din</p>
                        <div className="flex flex-wrap gap-2">
                          {bestPostingTime.bestDays.map((d, i) => (
                            <span key={i} className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-sm font-medium">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-emerald-400 mb-1">Zyada views wale time (baje)</p>
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
                          <p className="text-sm font-semibold text-white/90 mb-2">Top slots (din + time)</p>
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
                          <span className="block mt-1"> ({bestPostingTime.totalVideosAnalyzed} videos analyze kiye.)</span>
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

              {/* Channel Audit — homepage keywords + % + replace suggestions + add keyword system */}
              {(!loadingFlags && sectionFlags.yt_seo_channel_summary !== false && channelSummary?.linked) && (
                <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#FF0000]" /> Channel Audit — Growth &amp; Home
                  </h2>
                  <p className="text-xs text-[#888] mb-4">
                    Based on your channel link: which keywords appear on the home page (%), which ones to replace and
                    which ones to keep.
                  </p>

                  {channelKeywordNotification && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm flex items-center justify-between gap-2">
                      <span>{channelKeywordNotification}</span>
                      <button type="button" onClick={() => setChannelKeywordNotification(null)} className="text-[#888] hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {(channelSummary?.homepageKeywords?.length ?? 0) > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-emerald-400 mb-2">
                        Which keywords are on your channel home / About (score %)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {channelSummary.homepageKeywords!.map((item, i) => (
                          <span
                            key={i}
                            className={`px-2 py-1 rounded text-sm font-medium border ${item.score >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : item.score >= 40 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'
                              }`}
                          >
                            {item.keyword} <span className="opacity-90">{item.score}%</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(channelSummary?.keywordReplaceSuggestions?.length ?? 0) > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="text-sm font-semibold text-amber-400 mb-2">
                        Suggestions — which keyword to replace and which one to keep
                      </p>
                      <ul className="text-sm text-[#CCC] space-y-2">
                        {channelSummary.keywordReplaceSuggestions!.map((s, i) => (
                          <li key={i} className="flex flex-wrap items-center gap-2">
                            <span className="text-red-400 line-through">{s.replace}</span>
                            <span className="text-[#888]">→</span>
                            <span className="text-emerald-400 font-medium">{s.withKeyword}</span>
                            <span className="text-[#888] text-xs">({s.reason})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(channelSummary?.recommendedKeywords?.length ?? 0) > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-white mb-2">
                        These keywords are recommended for your channel page (%) — click Copy to paste into the About
                        section
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {channelSummary.recommendedKeywords!.map((item, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[#212121] text-emerald-400 rounded text-sm border border-emerald-500/30">
                            {item.keyword} <span className="opacity-90">{item.score}%</span>
                            <button type="button" onClick={() => copyOneKeywordToChannel(item.keyword)} className="text-[#666] hover:text-white p-0.5" title="Copy keyword">
                              {copiedKeywordValue === item.keyword ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4 p-3 rounded-lg bg-[#212121]/80 border border-[#333]">
                    <p className="text-sm font-semibold text-white mb-2">Channel home / About keywords system</p>
                    <p className="text-xs text-[#888] mb-2">
                      Add any keyword you want to keep on the channel page here, then copy everything below and paste it
                      into YouTube Studio → Channel → About.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <input
                        type="text"
                        value={channelPageKeywordInput}
                        onChange={(e) => setChannelPageKeywordInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addChannelPageKeyword()}
                        placeholder="Type a keyword, then click Add"
                        className="flex-1 min-w-[140px] px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] text-sm focus:ring-2 focus:ring-[#FF0000]"
                      />
                      <button
                        type="button"
                        onClick={addChannelPageKeyword}
                        className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-lg text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>

                    {/* Suggested keywords ko channel page me dalne ka system: copy all + copy one */}
                    {uniqueKeywordsForCopy.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#333]">
                        <p className="text-sm font-semibold text-emerald-400 mb-2">
                          System for adding suggested keywords to your channel page
                        </p>
                        <p className="text-xs text-[#888] mb-2">
                          In YouTube Studio → Channel → About → Description, paste these keywords.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <button
                            type="button"
                            onClick={copyAllSuggestedToChannelPage}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
                          >
                            {copiedAllKeywords ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copiedAllKeywords ? 'Copied!' : 'Copy all keywords'}
                          </button>
                          <span className="text-xs text-[#888]">({uniqueKeywordsForCopy.length} keywords)</span>
                        </div>
                      </div>
                    )}

                    {channelPageSuggestedKeywords.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-[#888] mb-1">
                          Your suggested keywords — click Copy to copy one keyword, then paste it into the channel About
                          section:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {channelPageSuggestedKeywords.map((item, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[#333] text-[#CCC] rounded text-sm">
                              {item.keyword} <span className="text-amber-400">{item.score}%</span>
                              <button type="button" onClick={() => copyOneKeywordToChannel(item.keyword)} className="text-[#888] hover:text-emerald-400 p-0.5" title="Copy keyword">
                                {copiedKeywordValue === item.keyword ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button type="button" onClick={() => removeChannelPageSuggestedKeyword(i)} className="text-[#666] hover:text-red-400" aria-label="Remove">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {(channelSummary?.growthActions?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-amber-400 mb-2">
                        What needs to change to grow subscribers &amp; views
                      </p>
                      <p className="text-xs text-[#888] mb-3">Exactly where to change what, with reasons:</p>
                      <div className="space-y-3">
                        {channelSummary.growthActions!.map((g, i) => (
                          <div key={i} className="p-3 rounded-lg bg-[#212121]/80 border border-[#333]">
                            <p className="text-white font-medium text-sm mb-1">
                              <span className="text-amber-400">Where:</span> {g.where}
                            </p>
                            <p className="text-[#CCC] text-sm mb-1">
                              <span className="text-emerald-400">What to do:</span> {g.action}
                            </p>
                            <p className="text-[#888] text-xs">
                              <span className="text-[#666]">Why:</span> {g.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {((channelSummary?.channelKami?.length ?? 0) > 0 || (channelSummary?.settingKami?.length ?? 0) > 0) && (
                    <div className="mt-4 pt-4 border-t border-[#333]">
                      <p className="text-xs font-semibold text-[#AAA] mb-2">
                        Channel gaps / Settings gaps (summary)
                      </p>
                      <ul className="text-xs text-[#888] space-y-1 list-disc list-inside">
                        {(channelSummary.channelKami || []).map((k, i) => (
                          <li key={`c-${i}`}>{k}</li>
                        ))}
                        {(channelSummary.settingKami || []).map((k, i) => (
                          <li key={`s-${i}`}>{k}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {(!loadingFlags && sectionFlags.yt_seo_keywords !== false) && (
                <>
                  <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Search className="w-5 h-5 text-emerald-500" /> Home Page Keywords Search
                    </h2>
                    <p className="text-xs text-[#888] mb-3">
                      Search or filter the keywords on your channel home page or let us suggest them from a topic — every
                      keyword shows a percentage score.
                    </p>

                    {channelSummary?.linked && (channelSummary?.homepageKeywords?.length ?? 0) + (channelSummary?.recommendedKeywords?.length ?? 0) > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-white mb-2">Channel home page keywords (search/filter)</p>
                        <input
                          type="text"
                          value={homePageKeywordFilter}
                          onChange={(e) => setHomePageKeywordFilter(e.target.value)}
                          placeholder="Type to filter keywords…"
                          className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] text-sm focus:ring-2 focus:ring-emerald-500 mb-2"
                        />
                        {(() => {
                          const home = (channelSummary?.homepageKeywords || []).map((h) => ({ keyword: h.keyword, score: h.score }));
                          const rec = (channelSummary?.recommendedKeywords || []).map((r) => ({ keyword: r.keyword, score: r.score }));
                          const combined = [...home, ...rec];
                          const uniq = combined.filter((x, i, a) => a.findIndex((y) => y.keyword.toLowerCase() === x.keyword.toLowerCase()) === i);
                          const filterLower = homePageKeywordFilter.trim().toLowerCase();
                          const filtered = filterLower ? uniq.filter((x) => x.keyword.toLowerCase().includes(filterLower)) : uniq;
                          return filtered.length > 0 ? (
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                              {filtered.map((item, i) => (
                                <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm border ${item.score >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : item.score >= 40 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-[#212121] text-[#AAA] border-[#333]'}`}>
                                  {item.keyword} <span className="font-semibold opacity-90">{item.score}%</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[#666] text-sm">No keyword matched your filter. Try changing the filter.</p>
                          );
                        })()}
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-white mb-2">
                        Suggest home page keywords from a topic
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <input
                          type="text"
                          value={homePageTopicSearch}
                          onChange={(e) => setHomePageTopicSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchHomePageKeywordsByTopic()}
                          placeholder="e.g. news, tech, entertainment"
                          className="flex-1 min-w-[140px] px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] text-sm focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={searchHomePageKeywordsByTopic}
                          disabled={loadingHomePageTopic || !homePageTopicSearch.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                          {loadingHomePageTopic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          Suggest
                        </button>
                      </div>
                      {loadingHomePageTopic ? (
                        <p className="text-[#888] text-sm">Loading…</p>
                      ) : Array.isArray(homePageTopicResults) && homePageTopicResults.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                          {homePageTopicResults.map((v, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => addKeywordToField(v.keyword)}
                              className={`px-2 py-1.5 rounded text-sm border transition hover:opacity-90 flex items-center gap-1.5 ${v.viralScore >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-[#212121] text-[#AAA] border-[#333]'}`}
                            >
                              <span className="truncate max-w-[140px]">{v.keyword}</span>
                              <span className="flex-shrink-0 font-semibold opacity-90">{v.viralScore}%</span>
                            </button>
                          ))}
                        </div>
                      ) : homePageTopicResults !== null ? (
                        <p className="text-[#666] text-sm">Enter a topic and click Suggest.</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Search className="w-5 h-5 text-[#FF0000]" /> Viral Keywords Search
                    </h2>
                    <p className="text-xs text-[#888] mb-3">
                      Search by keyword or topic to get viral keyword ideas, each with a score percentage.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <input
                        type="text"
                        value={viralSearchQuery}
                        onChange={(e) => setViralSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchViralKeywords()}
                        placeholder="e.g. news, tech, gaming, viral tips"
                        className="flex-1 min-w-[160px] px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] text-sm focus:ring-2 focus:ring-[#FF0000]"
                      />
                      <button
                        type="button"
                        onClick={searchViralKeywords}
                        disabled={loadingViralSearch}
                        className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-60 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        {loadingViralSearch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Search
                      </button>
                    </div>
                    {loadingViralSearch ? (
                      <div className="flex items-center gap-2 text-[#888] text-sm py-4">
                        <Loader2 className="w-5 h-5 animate-spin" /> Viral keywords load ho rahe hain…
                      </div>
                    ) : Array.isArray(viralSearchResults) && viralSearchResults.length > 0 ? (
                      <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
                        {viralSearchResults
                          .filter((v) => v.viralScore >= 70)
                          .map((v, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => addKeywordToField(v.keyword)}
                              className="px-2 py-1.5 rounded text-sm border transition hover:opacity-90 flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            >
                              <span className="truncate max-w-[160px]">{v.keyword}</span>
                              <span className="flex-shrink-0 font-semibold opacity-90">{v.viralScore}%</span>
                            </button>
                          ))}
                      </div>
                    ) : viralSearchResults !== null ? (
                      <p className="text-[#666] text-sm">Koi result nahi. Koi keyword ya topic type karke Search dabayein.</p>
                    ) : null}
                  </div>

                  <div className="bg-[#181818] border border-[#212121] rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Hash className="w-5 h-5" /> 100 Viral Keywords
                    </h2>
                    <p className="text-xs text-[#888] mb-3">
                      Viral keywords based on your title, keyword or description. Each keyword shows a score %. Click to add
                      them to the Keywords section.
                    </p>

                    {(keywordData?.viralKeywords?.length || 0) > 0 && (
                      <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <p className="text-xs font-semibold text-amber-400 mb-2">Hints for going viral</p>
                        <ul className="text-xs text-[#CCC] space-y-1">
                          <li>
                            • <span className="text-emerald-400">70%+ (green)</span> keywords have the highest viral
                            potential – prioritise these.
                          </li>
                          <li>
                            • Select at least <strong className="text-white">5–8 high‑score</strong> (green) keywords.
                          </li>
                          <li>• Use 1–2 of the top‑scoring keywords in your title.</li>
                          <li>• Mention green keywords naturally 2–3 times in the description as well.</li>
                          <li>• Clicking a keyword adds it into the Keywords/Tags box.</li>
                        </ul>
                      </div>
                    )}

                    {loadingKeywords ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#FF0000]" />
                    ) : (keywordData?.viralKeywords?.length || 0) > 0 ? (
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                        {(keywordData?.viralKeywords || [])
                          .filter((v) => v.viralScore >= 70)
                          .map((v, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => addKeywordToField(v.keyword)}
                              className="px-2 py-1.5 rounded text-sm border transition hover:opacity-90 flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            >
                              <span className="truncate max-w-[140px]">{v.keyword}</span>
                              <span className="flex-shrink-0 font-semibold opacity-90">{v.viralScore}%</span>
                            </button>
                          ))}
                      </div>
                    ) : (
                      <p className="text-[#666] text-sm">Title, keyword ya description bharein — 100 viral keywords isi ke hisaab se dikhenge.</p>
                    )}
                    {keywordData?.analysis && (
                      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-[#333] text-sm">
                        <span>Search volume: <span className="text-white">{keywordData.analysis.searchVolume}</span></span>
                        <span>Competition: <span className="text-white">{keywordData.analysis.competition}</span></span>
                        <span>SEO score: <span className="text-[#FF0000] font-semibold">{keywordData.analysis.seoScore}%</span></span>
                      </div>
                    )}
                  </div>
                </>
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
                                  + {competitorKeyword || 'keyword'} add karein
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
                              <ExternalLink className="w-4 h-4" /> YouTube par dekhein
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
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Type className="w-5 h-5" /> Title optimization
                  </h2>
                  {loadingTitle ? (
                    <Loader2 className="w-6 h-6 animate-spin text-[#FF0000]" />
                  ) : titleScoreData ? (
                    <>
                      <p className="text-sm text-[#AAA] mb-2">
                        Current title score:{' '}
                        <span className="text-white font-semibold">{titleScoreData.titleScore}%</span>
                      </p>
                      <p className="text-xs text-[#888] mb-3">Recommended titles above the target score.</p>
                      <ul className="space-y-2">
                        {(Array.isArray(titleScoreData.improvedTitles) ? titleScoreData.improvedTitles : [])
                          .map((item, i) => {
                            const title = typeof item === 'string' ? item : item.title;
                            const score = typeof item === 'string' ? 90 - i * 5 : item.score;
                            return { title, score };
                          })
                          .filter((t) => t.score >= 80)
                          .map((t, i) => (
                            <li
                              key={i}
                              className="text-sm text-white pl-2 border-l-2 border-emerald-500 flex items-center justify-between gap-2"
                            >
                              <span>{t.title}</span>
                              <span className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/60">
                                  Recommended
                                </span>
                                <span className="text-[#FF0000] font-semibold">{t.score}%</span>
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
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> Thumbnail analysis
                  </h2>
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
                        <div className="pt-3 border-t border-[#333]">
                          <p className="text-xs font-semibold text-amber-400 mb-2">Kya kami hai / Improvements</p>
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
                    <p className="text-[#666] text-sm">Upload a thumbnail to see analysis and improvement tips.</p>
                  )}
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
                        <p className="text-xs text-[#888]">24 • Multilingual AI assistant for YouTube SEO</p>
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
                        <div className="bg-[#212121] rounded-lg px-3 py-2 text-sm text-[#888]">Chinki is thinking...</div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-[#212121] flex gap-2">
                    <input
                      value={chinkiInput}
                      onChange={(e) => setChinkiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChinkiMessage()}
                      placeholder="What should I improve? Ask me..."
                      className="flex-1 px-3 py-2 bg-[#0F0F0F] border border-[#333] rounded-lg text-white placeholder-[#666] text-sm focus:ring-2 focus:ring-[#FF0000]"
                    />
                    <button
                      type="button"
                      onClick={speakChinki}
                      className="p-2 rounded-lg bg-[#212121] hover:bg-[#333] text-[#AAA]"
                      title="Listen to Chinki"
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
