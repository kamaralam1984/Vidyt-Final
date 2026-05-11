export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

async function resolveChannelId(input: string, apiKey: string): Promise<string | null> {
  // Extract from URL patterns
  let handle: string | null = null;
  let channelId: string | null = null;

  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    const pathname = url.pathname;

    if (pathname.startsWith('/channel/')) {
      channelId = pathname.split('/channel/')[1].split('/')[0];
    } else if (pathname.startsWith('/@')) {
      handle = pathname.slice(2).split('/')[0];
    } else if (pathname.startsWith('/c/')) {
      handle = pathname.split('/c/')[1].split('/')[0];
    } else if (pathname.startsWith('/user/')) {
      handle = pathname.split('/user/')[1].split('/')[0];
    } else {
      // bare handle like @username
      handle = pathname.replace(/^\//, '').replace(/^@/, '');
    }
  } catch {
    // treat as raw handle
    handle = input.replace(/^@/, '');
  }

  if (channelId) return channelId;

  if (handle) {
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent('@' + handle)}&key=${apiKey}`
    );
    const d = await r.json();
    if (d.items?.[0]?.id) return d.items[0].id;

    // fallback: search
    const r2 = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&maxResults=1&key=${apiKey}`
    );
    const d2 = await r2.json();
    if (d2.items?.[0]?.snippet?.channelId) return d2.items[0].snippet.channelId;
  }

  return null;
}

function mapVideo(v: any) {
  const duration = parseDuration(v.contentDetails?.duration || 'PT0S');
  const isLive = v.snippet?.liveBroadcastContent === 'live' || v.snippet?.liveBroadcastContent === 'upcoming' || !!v.liveStreamingDetails;
  const isShort = !isLive && duration > 0 && duration <= 60;
  const type: 'short' | 'live' | 'long' = isLive ? 'live' : isShort ? 'short' : 'long';
  const tags: string[] = v.snippet?.tags || [];
  const description: string = v.snippet?.description || '';
  const hashtags = tags.filter((t: string) => t.startsWith('#')).join(' ') ||
    (description.match(/#\w+/g) || []).join(' ');
  return {
    videoId: v.id,
    title: v.snippet?.title || '',
    description,
    tags: tags.filter((t: string) => !t.startsWith('#')),
    hashtags,
    thumbnail: v.snippet?.thumbnails?.maxres?.url || v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.default?.url || '',
    publishedAt: v.snippet?.publishedAt || '',
    duration,
    type,
    viewCount: v.statistics?.viewCount,
    likeCount: v.statistics?.likeCount,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const channelUrl = searchParams.get('channelUrl')?.trim();
    const pageToken = searchParams.get('pageToken') || '';
    const uploadsPlaylistIdParam = searchParams.get('uploadsPlaylistId') || '';

    const apiKey = process.env.YOUTUBE_API_KEY!;

    let uploadsPlaylistId = uploadsPlaylistIdParam;
    let channelName = '';
    let channelThumbnail = '';

    // Only resolve channel on first page (no uploadsPlaylistId yet)
    if (!uploadsPlaylistId) {
      if (!channelUrl) return NextResponse.json({ error: 'channelUrl required' }, { status: 400 });
      const channelId = await resolveChannelId(channelUrl, apiKey);
      if (!channelId) return NextResponse.json({ error: 'Could not resolve channel. Check the URL.' }, { status: 400 });

      const chanRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${channelId}&key=${apiKey}`
      );
      const chanData = await chanRes.json();
      const channelInfo = chanData.items?.[0];
      if (!channelInfo) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

      uploadsPlaylistId = channelInfo.contentDetails?.relatedPlaylists?.uploads || '';
      if (!uploadsPlaylistId) return NextResponse.json({ error: 'No uploads found' }, { status: 404 });
      channelName = channelInfo.snippet?.title || '';
      channelThumbnail = channelInfo.snippet?.thumbnails?.default?.url || '';
    }

    // Build playlist URL with optional pageToken
    let plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`;
    if (pageToken) plUrl += `&pageToken=${encodeURIComponent(pageToken)}`;

    const plRes = await fetch(plUrl);
    const plData = await plRes.json();
    const items = plData.items || [];
    const nextPageToken: string = plData.nextPageToken || '';

    const videoIds = items.map((i: any) => i.contentDetails.videoId).join(',');
    if (!videoIds) {
      return NextResponse.json({ videos: [], channel: channelName, channelThumbnail, uploadsPlaylistId, nextPageToken: '' });
    }

    const detailRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,liveStreamingDetails,statistics&id=${videoIds}&key=${apiKey}`
    );
    const detailData = await detailRes.json();
    const videos = (detailData.items || []).map(mapVideo);

    return NextResponse.json({
      channel: channelName,
      channelThumbnail,
      uploadsPlaylistId,
      nextPageToken,
      videos,
    });
  } catch (e: any) {
    console.error('channel-videos error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
