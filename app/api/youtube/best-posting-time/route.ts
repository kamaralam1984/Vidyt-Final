export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getApiConfig } from '@/lib/apiConfig';
import axios from 'axios';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function extractChannelIdentifier(url: string): string | null {
  const u = url.trim();
  const m =
    u.match(/youtube\.com\/channel\/([^/?]+)/) ||
    u.match(/youtube\.com\/@([^/?]+)/) ||
    u.match(/youtube\.com\/c\/([^/?]+)/) ||
    u.match(/youtube\.com\/user\/([^/?]+)/);
  return m ? m[1] : null;
}

function extractVideoId(url: string): string | null {
  const u = url.trim();
  const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

async function resolveChannelIdFromVideo(videoId: string, apiKey: string): Promise<string | null> {
  try {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'snippet', id: videoId, key: apiKey },
      timeout: 10000,
    });
    const channelId = res.data?.items?.[0]?.snippet?.channelId;
    return channelId || null;
  } catch {
    return null;
  }
}

/** Fallback: fetch channel page HTML and parse channel ID when API handle lookup fails */
async function resolveChannelIdFromPage(handleOrUrl: string): Promise<string | null> {
  try {
    const url = handleOrUrl.startsWith('http')
      ? handleOrUrl
      : `https://www.youtube.com/@${handleOrUrl.replace(/^@/, '')}`;
    const res = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 3,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0' },
      responseType: 'text',
    });
    const html = typeof res.data === 'string' ? res.data : '';
    // YouTube embeds channel ID in canonical link or in ytInitialData / meta
    const canonicalMatch = html.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
    if (canonicalMatch) return canonicalMatch[1];
    const metaMatch = html.match(/"channelId"\s*:\s*"(UC[\w-]{22})"/);
    if (metaMatch) return metaMatch[1];
    const externalMatch = html.match(/"externalId"\s*:\s*"(UC[\w-]{22})"/);
    if (externalMatch) return externalMatch[1];
  } catch (_) {
    // ignore
  }
  return null;
}

async function resolveChannelId(identifier: string, apiKey: string): Promise<string | null> {
  const isChannelId = identifier.startsWith('UC') && identifier.length >= 20;
  if (isChannelId) return identifier;
  const handle = identifier.startsWith('@') ? identifier.slice(1) : identifier;
  try {
    const chRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet', key: apiKey, forHandle: handle },
      timeout: 10000,
    });
    if (chRes.data?.items?.length) return chRes.data.items[0].id;
    const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', key: apiKey, q: `@${handle}`, type: 'channel', maxResults: 5 },
      timeout: 10000,
    });
    const items = searchRes.data?.items || [];
    for (const ch of items) {
      if (ch?.id?.channelId) return ch.id.channelId;
    }
    const userRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet', key: apiKey, forUsername: handle },
      timeout: 10000,
    });
    if (userRes.data?.items?.length) return userRes.data.items[0].id;
  } catch (_) {
    // continue to page fallback
  }
  return null;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const allowedRoles = ['super-admin', 'admin', 'manager', 'user'];
  if (!allowedRoles.includes(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const channelUrl = (searchParams.get('channelUrl') || searchParams.get('url') || '').trim();
  if (!channelUrl) {
    return NextResponse.json({ error: 'channelUrl is required.' }, { status: 200 });
  }

  const identifier = extractChannelIdentifier(channelUrl);
  const videoId = extractVideoId(channelUrl);
  if (!identifier && !videoId) {
    return NextResponse.json(
      {
        error: 'Invalid channel or video URL.',
        suggestion:
          'Use a channel link (e.g. https://www.youtube.com/@username) or a video link (e.g. https://www.youtube.com/watch?v=...).',
      },
      { status: 200 }
    );
  }

  const config = await getApiConfig();
  const apiKey = config.youtubeDataApiKey?.trim();
  if (!apiKey) {
    return NextResponse.json({
      error: 'YouTube API key is not configured.',
      bestSlots: [],
      bestDays: [],
      bestHours: [],
      summary:
        'Ask your Super Admin to open API Config and add a valid YouTube Data API key. Only then we can calculate channel-specific best posting time.',
    });
  }

  try {
    let channelId: string | null = null;
    if (videoId) {
      channelId = await resolveChannelIdFromVideo(videoId, apiKey);
    }
    if (!channelId && identifier) {
      channelId = await resolveChannelId(identifier, apiKey);
    }
    // Fallback: when API handle lookup fails, parse channel ID from the channel page HTML
    if (!channelId && (identifier || channelUrl)) {
      channelId = await resolveChannelIdFromPage(identifier ? `https://www.youtube.com/@${identifier.replace(/^@/, '')}` : channelUrl);
    }
    if (!channelId) {
      return NextResponse.json(
        {
          error: 'Channel not found. Please check that the link is correct and the channel is public.',
          bestSlots: [],
          bestDays: [],
          bestHours: [],
          summary: '',
        },
        { status: 200 }
      );
    }

    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'contentDetails', key: apiKey, id: channelId },
      timeout: 10000,
    });
    const uploadsId = channelRes.data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) {
      return NextResponse.json({
        bestSlots: [],
        bestDays: [],
        bestHours: [],
        summary:
          'We could not find an uploads list for this channel. Please confirm the channel link and try again.',
        error: 'No uploads playlist found for this channel.',
      });
    }

    const playlistRes = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
      params: {
        part: 'contentDetails',
        key: apiKey,
        playlistId: uploadsId,
        maxResults: 50,
      },
      timeout: 10000,
    });
    const videoIds = (playlistRes.data?.items || []).map((i: { contentDetails?: { videoId?: string } }) => i.contentDetails?.videoId).filter(Boolean);
    if (videoIds.length === 0) {
      return NextResponse.json({
        bestSlots: [],
        bestDays: [],
        bestHours: [],
        summary:
          'This channel has no uploaded videos yet. Upload a few videos first, then we can calculate best posting time.',
        error: 'No videos found on this channel.',
      });
    }

    const videosRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics',
        key: apiKey,
        id: videoIds.slice(0, 50).join(','),
      },
      timeout: 10000,
    });
    const videos = videosRes.data?.items || [];
    const slotViews: Record<string, number> = {};
    let totalViews = 0;
    for (const v of videos) {
      const published = v.snippet?.publishedAt;
      const views = parseInt(v.statistics?.viewCount || '0', 10);
      if (!published || isNaN(views)) continue;
      const d = new Date(published);
      const day = DAYS[d.getUTCDay()];
      const hour = d.getUTCHours();
      const key = `${day}_${hour}`;
      slotViews[key] = (slotViews[key] || 0) + views;
      totalViews += views;
    }

    const slots = Object.entries(slotViews).map(([key, views]) => {
      const [day, hour] = key.split('_');
      return { day, hour: parseInt(hour, 10), views };
    });
    slots.sort((a, b) => b.views - a.views);
    const topSlots = slots.slice(0, 10);

    const dayTotals: Record<string, number> = {};
    const hourTotals: Record<number, number> = {};
    for (const s of slots) {
      dayTotals[s.day] = (dayTotals[s.day] || 0) + s.views;
      hourTotals[s.hour] = (hourTotals[s.hour] || 0) + s.views;
    }
    const bestDays = Object.entries(dayTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);
    const bestHours = Object.entries(hourTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([h]) => parseInt(h, 10))
      .sort((a, b) => a - b);

    const formatHour = (h: number) => {
      if (h === 0) return '12 AM';
      if (h < 12) return `${h} AM`;
      if (h === 12) return '12 PM';
      return `${h - 12} PM`;
    };
    const summary =
      bestDays.length && bestHours.length
        ? `Based on your top-performing videos: **${bestDays.join(
            ', '
          )}** perform best. Views are highest around: **${bestHours
            .map(formatHour)
            .join(', ')}** (UTC). Adjust these times to your local timezone.`
        : 'We did not find enough data. Upload more videos and try again for a more accurate schedule.';

    // Full heatmap: every (day, hour) that has views, for grid coloring
    const heatmapSlots = DAYS.flatMap((day) =>
      HOURS.map((hour) => {
        const key = `${day}_${hour}`;
        const views = slotViews[key] || 0;
        const share = totalViews > 0 ? Math.round((views / totalViews) * 100) : 0;
        return { day, hour, views, share };
      })
    ).filter((s) => s.views > 0);

    return NextResponse.json({
      bestSlots: topSlots.map((s) => ({
        day: s.day,
        hour: s.hour,
        timeLabel: formatHour(s.hour),
        views: s.views,
        share: totalViews > 0 ? Math.round((s.views / totalViews) * 100) : 0,
      })),
      heatmapSlots,
      bestDays,
      bestHours,
      summary,
      totalVideosAnalyzed: videos.length,
    });
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { error?: { message?: string }; message?: string } }; message?: string };
    console.error('Best posting time error:', err?.response?.data || err?.message || e);

    let errorMessage = 'We could not read channel data from YouTube.';
    let summary = 'Please check the channel link and that your YouTube Data API key is valid and has quota.';

    if (err?.response?.status === 403) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || '';
      if (/quota|exceeded|limit/i.test(msg)) {
        errorMessage = 'YouTube API quota exceeded. Try again later or check your Google Cloud quota.';
        summary = 'The daily quota for YouTube Data API has been used. It resets at midnight Pacific Time.';
      } else if (/forbidden|access|key/i.test(msg)) {
        errorMessage = 'YouTube API access denied. Check that the API key is correct and YouTube Data API v3 is enabled.';
        summary = 'In Super Admin → API Config, ensure the YouTube Data API key is valid and the API is enabled in Google Cloud Console.';
      }
    } else if (err?.response?.status === 400) {
      errorMessage = 'Invalid request to YouTube API. The channel link may be in an unsupported format.';
      summary = 'Try using the channel handle link: https://www.youtube.com/@channelname';
    } else if (err?.response?.status === 404) {
      errorMessage = 'Channel or resource not found.';
      summary = 'Confirm the channel exists, is public, and the link is correct.';
    } else if (err?.message && /network|timeout|ECONNREFUSED/i.test(err.message)) {
      errorMessage = 'Could not reach YouTube. Check your internet connection and try again.';
      summary = 'A network or timeout error occurred while calling YouTube.';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        bestSlots: [],
        bestDays: [],
        bestHours: [],
        summary,
      },
      { status: 200 }
    );
  }
}
