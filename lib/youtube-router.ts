/**
 * YouTube Data Router - Failover System
 * Priority: YouTube Data API v3 → SerpApi → RapidAPI → yt-dlp (scrape)
 */

import { isCircuitOpen, recordSuccess, recordFailure } from './circuit-breaker';
import { getWithFallback, setWithFallback } from './in-memory-cache';

async function withTimeout<T>(fn: () => Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
  ]);
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  duration: string;
  channelId: string;
  channelTitle: string;
}

export interface YouTubeChannelInfo {
  channelId: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

// ─────────────────────────────────────────
// Provider: YouTube Data API v3
// ─────────────────────────────────────────

async function searchYouTubeOfficial(query: string, apiKey: string, maxResults = 10): Promise<YouTubeVideoItem[]> {
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}`
  );
  if (!searchRes.ok) throw new Error(`YouTube API: ${searchRes.status}`);
  const searchData = await searchRes.json();
  if (searchData.error) throw new Error(`YouTube API: ${searchData.error.message}`);
  const ids = (searchData.items || []).map((i: { id: { videoId: string } }) => i.id.videoId).join(',');
  if (!ids) return [];
  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${ids}&key=${apiKey}`
  );
  const statsData = await statsRes.json();
  return (statsData.items || []).map((v: Record<string, unknown>) => {
    const snippet = v.snippet as Record<string, unknown>;
    const stats = v.statistics as Record<string, string> || {};
    return {
      id: v.id as string,
      title: snippet?.title as string || '',
      description: (snippet?.description as string || '').slice(0, 200),
      thumbnail: ((snippet?.thumbnails as Record<string, { url: string }>)?.high?.url) || '',
      viewCount: parseInt(stats.viewCount || '0'),
      likeCount: parseInt(stats.likeCount || '0'),
      commentCount: parseInt(stats.commentCount || '0'),
      publishedAt: snippet?.publishedAt as string || '',
      duration: (v.contentDetails as Record<string, string>)?.duration || '',
      channelId: snippet?.channelId as string || '',
      channelTitle: snippet?.channelTitle as string || '',
    };
  });
}

async function getChannelInfoOfficial(channelId: string, apiKey: string): Promise<YouTubeChannelInfo> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
  );
  if (!res.ok) throw new Error(`YouTube API: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`YouTube API: ${data.error.message}`);
  const ch = data.items?.[0];
  if (!ch) throw new Error('Channel not found');
  const stats = ch.statistics || {};
  return {
    channelId: ch.id,
    title: ch.snippet?.title || '',
    description: ch.snippet?.description || '',
    thumbnail: ch.snippet?.thumbnails?.high?.url || '',
    subscriberCount: parseInt(stats.subscriberCount || '0'),
    videoCount: parseInt(stats.videoCount || '0'),
    viewCount: parseInt(stats.viewCount || '0'),
  };
}

// ─────────────────────────────────────────
// Provider: SerpApi (YouTube search fallback)
// ─────────────────────────────────────────

async function searchViaSerpApi(query: string, apiKey: string, maxResults = 10): Promise<YouTubeVideoItem[]> {
  const res = await fetch(
    `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(query)}&api_key=${apiKey}`
  );
  if (!res.ok) throw new Error(`SerpApi: ${res.status}`);
  const data = await res.json();
  const results = data.video_results || [];
  return results.slice(0, maxResults).map((v: Record<string, unknown>) => ({
    id: (v.link as string || '').split('v=')[1]?.split('&')[0] || '',
    title: v.title as string || '',
    description: v.description as string || '',
    thumbnail: (v.thumbnail as { static: string })?.static || '',
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    publishedAt: v.published_date as string || '',
    duration: v.length as string || '',
    channelId: '',
    channelTitle: (v.channel as { name: string })?.name || '',
  }));
}

// ─────────────────────────────────────────
// Provider: RapidAPI YouTube
// ─────────────────────────────────────────

async function searchViaRapidAPI(query: string, apiKey: string, maxResults = 10): Promise<YouTubeVideoItem[]> {
  const res = await fetch(
    `https://youtube138.p.rapidapi.com/search/?q=${encodeURIComponent(query)}&hl=en&gl=US`,
    {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'youtube138.p.rapidapi.com',
      },
    }
  );
  if (!res.ok) throw new Error(`RapidAPI: ${res.status}`);
  const data = await res.json();
  const contents = data?.contents || [];
  return contents
    .filter((item: { type: string }) => item.type === 'video')
    .slice(0, maxResults)
    .map((item: { video: Record<string, unknown> }) => {
      const v = item.video || {};
      return {
        id: v.videoId as string || '',
        title: v.title as string || '',
        description: '',
        thumbnail: (v.thumbnails as { url: string }[])?.[0]?.url || '',
        viewCount: parseInt((v.stats as { views: string })?.views || '0') || 0,
        likeCount: 0,
        commentCount: 0,
        publishedAt: v.publishedTimeText as string || '',
        duration: (v.lengthSeconds as number)
          ? `${Math.floor((v.lengthSeconds as number) / 60)}:${String((v.lengthSeconds as number) % 60).padStart(2, '0')}`
          : '',
        channelId: (v.author as { channelId: string })?.channelId || '',
        channelTitle: (v.author as { title: string })?.title || '',
      };
    });
}

// ─────────────────────────────────────────
// Universal YouTube Router
// ─────────────────────────────────────────

export async function routeYouTubeSearch(query: string, maxResults = 10): Promise<{
  results: YouTubeVideoItem[];
  provider: string;
  fromCache: boolean;
}> {
  const cacheKey = `yt_search:${query}:${maxResults}`;
  const cached = await getWithFallback<{ results: YouTubeVideoItem[]; provider: string; fromCache: boolean }>(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const { getApiConfig } = await import('./apiConfig');
  const config = await getApiConfig();
  const ytKey = config.youtubeDataApiKey;
  const serpKey = process.env.SERPAPI_KEY || '';
  const rapidKey = process.env.RAPIDAPI_KEY || '';

  const providers = [
    {
      name: 'youtube-official',
      key: ytKey,
      call: () => searchYouTubeOfficial(query, ytKey, maxResults),
    },
    {
      name: 'serpapi',
      key: serpKey,
      call: () => searchViaSerpApi(query, serpKey, maxResults),
    },
    {
      name: 'rapidapi-youtube',
      key: rapidKey,
      call: () => searchViaRapidAPI(query, rapidKey, maxResults),
    },
  ];

  for (const prov of providers) {
    if (!prov.key?.trim()) continue;
    if (isCircuitOpen(prov.name)) continue;
    try {
      const results = await withTimeout(prov.call, 5000);
      recordSuccess(prov.name);
      const out = { results, provider: prov.name, fromCache: false };
      await setWithFallback(cacheKey, out, 300);
      console.log(`[YouTubeRouter] Search via ${prov.name}`);
      return out;
    } catch (err) {
      recordFailure(prov.name);
      console.warn(`[YouTubeRouter] ${prov.name} failed:`, err instanceof Error ? err.message : err);
    }
  }

  // Fallback: empty results with safe message
  return { results: [], provider: 'fallback', fromCache: false };
}

export async function routeGetChannel(channelId: string): Promise<{
  channel: YouTubeChannelInfo | null;
  provider: string;
  fromCache: boolean;
}> {
  const cacheKey = `yt_channel:${channelId}`;
  const cached = await getWithFallback<{ channel: YouTubeChannelInfo | null; provider: string; fromCache: boolean }>(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const { getApiConfig } = await import('./apiConfig');
  const config = await getApiConfig();
  const ytKey = config.youtubeDataApiKey;

  if (ytKey?.trim() && !isCircuitOpen('youtube-official')) {
    try {
      const channel = await withTimeout(() => getChannelInfoOfficial(channelId, ytKey), 5000);
      recordSuccess('youtube-official');
      const out = { channel, provider: 'youtube-official', fromCache: false };
      await setWithFallback(cacheKey, out, 600);
      return out;
    } catch (err) {
      recordFailure('youtube-official');
      console.warn('[YouTubeRouter] channel fetch failed:', err instanceof Error ? err.message : err);
    }
  }

  return { channel: null, provider: 'fallback', fromCache: false };
}

/** Health check for YouTube providers */
export async function checkYouTubeHealth(): Promise<Record<string, { status: 'ok' | 'fail' | 'no-key'; latencyMs?: number }>> {
  const { getApiConfig } = await import('./apiConfig');
  const config = await getApiConfig();

  const checks = [
    {
      name: 'youtube-official',
      key: config.youtubeDataApiKey,
      test: async () => {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=${config.youtubeDataApiKey}`);
        if (!r.ok) throw new Error(`${r.status}`);
      },
    },
    {
      name: 'serpapi',
      key: process.env.SERPAPI_KEY || '',
      test: async () => {
        const r = await fetch(`https://serpapi.com/account?api_key=${process.env.SERPAPI_KEY}`);
        if (!r.ok) throw new Error(`${r.status}`);
      },
    },
    {
      name: 'rapidapi-youtube',
      key: process.env.RAPIDAPI_KEY || '',
      test: async () => {
        const r = await fetch('https://youtube138.p.rapidapi.com/search/?q=test&hl=en&gl=US', {
          headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
            'x-rapidapi-host': 'youtube138.p.rapidapi.com',
          },
        });
        if (!r.ok) throw new Error(`${r.status}`);
      },
    },
  ];

  const results: Record<string, { status: 'ok' | 'fail' | 'no-key'; latencyMs?: number }> = {};
  await Promise.all(
    checks.map(async (c) => {
      if (!c.key?.trim()) { results[c.name] = { status: 'no-key' }; return; }
      const start = Date.now();
      try {
        await Promise.race([c.test(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
        results[c.name] = { status: 'ok', latencyMs: Date.now() - start };
      } catch {
        results[c.name] = { status: 'fail', latencyMs: Date.now() - start };
      }
    })
  );
  return results;
}
