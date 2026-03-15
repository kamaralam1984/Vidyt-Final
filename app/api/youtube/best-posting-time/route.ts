import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getApiConfig } from '@/lib/apiConfig';
import axios from 'axios';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function extractChannelIdentifier(url: string): string | null {
  const u = url.trim();
  const m =
    u.match(/youtube\.com\/channel\/([^/?]+)/) ||
    u.match(/youtube\.com\/@([^/?]+)/) ||
    u.match(/youtube\.com\/c\/([^/?]+)/);
  return m ? m[1] : null;
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
      params: { part: 'snippet', key: apiKey, q: `@${handle}`, type: 'channel', maxResults: 1 },
      timeout: 10000,
    });
    const ch = searchRes.data?.items?.[0];
    if (ch?.id?.channelId) return ch.id.channelId;
    const userRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet', key: apiKey, forUsername: handle },
      timeout: 10000,
    });
    if (userRes.data?.items?.length) return userRes.data.items[0].id;
  } catch (_) {}
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
    return NextResponse.json({ error: 'channelUrl required' }, { status: 400 });
  }

  const identifier = extractChannelIdentifier(channelUrl);
  if (!identifier) {
    return NextResponse.json(
      { error: 'Invalid channel URL', suggestion: 'Use format: https://www.youtube.com/@username or https://www.youtube.com/channel/UC...' },
      { status: 400 }
    );
  }

  const config = await getApiConfig();
  const apiKey = config.youtubeDataApiKey?.trim();
  if (!apiKey) {
    return NextResponse.json({
      error: 'YouTube API key not set',
      bestSlots: [],
      bestDays: [],
      bestHours: [],
      summary: 'Super Admin → API Config me YouTube Data API key add karein. Tabhi channel ke hisaab se best posting time bata payenge.',
    });
  }

  try {
    const channelId = await resolveChannelId(identifier, apiKey);
    if (!channelId) {
      return NextResponse.json({ error: 'Channel not found', bestSlots: [], bestDays: [], bestHours: [], summary: '' }, { status: 404 });
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
        summary: 'Is channel ke liye upload list nahi mili. Channel link sahi hai?',
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
        summary: 'Channel par abhi koi video nahi hai. Pehle kuch videos upload karein, phir best time bata payenge.',
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
        ? `Aapke channel ke top videos ke hisaab se: **${bestDays.join(', ')}** ko post karein. Views zyada aate waqt: **${bestHours.map(formatHour).join(', ')}** (UTC). Apne timezone ke hisaab se adjust karein.`
        : 'Kaafi data nahi mila. Aur videos upload karein, phir exact time bata payenge.';

    return NextResponse.json({
      bestSlots: topSlots.map((s) => ({
        day: s.day,
        hour: s.hour,
        timeLabel: formatHour(s.hour),
        views: s.views,
        share: totalViews > 0 ? Math.round((s.views / totalViews) * 100) : 0,
      })),
      bestDays,
      bestHours,
      summary,
      totalVideosAnalyzed: videos.length,
    });
  } catch (e) {
    console.error('Best posting time error:', e);
    return NextResponse.json(
      {
        error: 'Channel data read nahi ho paya',
        bestSlots: [],
        bestDays: [],
        bestHours: [],
        summary: 'YouTube API error. Channel link sahi hai? API key check karein.',
      },
      { status: 200 }
    );
  }
}
