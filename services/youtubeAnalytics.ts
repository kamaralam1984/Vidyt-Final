import { google } from 'googleapis';
import { oauth2Client, refreshAccessToken } from './youtubeUpload';

/**
 * Fetches real YouTube statistics and growth data for a connected user.
 */
export async function getRealYouTubeData(credentials: {
  access_token: string;
  refresh_token: string;
  expiry_date?: Date | number;
}, range: 'today' | 'week' | 'month' | 'year' = 'month') {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const formattedCredentials = {
    ...credentials,
    expiry_date: credentials.expiry_date instanceof Date 
      ? credentials.expiry_date.getTime() 
      : credentials.expiry_date
  };

  auth.setCredentials(formattedCredentials);

  // Check if token is expired and refresh if necessary
  const isExpired = formattedCredentials.expiry_date && Date.now() > formattedCredentials.expiry_date;
  if (isExpired) {
    const newCreds = await refreshAccessToken(credentials.refresh_token);
    auth.setCredentials(newCreds);
  }

  const youtube = google.youtube({ version: 'v3', auth });
  const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

  // 1. Get Channel ID and Statistics
  const channelRes = await youtube.channels.list({
    part: ['snippet', 'statistics', 'contentDetails'],
    mine: true,
  });

  const channel = channelRes.data.items?.[0];
  if (!channel) throw new Error('No YouTube channel found for this account.');

  const channelId = channel.id!;
  const channelTitle = channel.snippet?.title || 'My Channel';
  const subscriberCount = parseInt(channel.statistics?.subscriberCount || '0', 10);
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

  // 2. Get Last 50 Videos
  let videos: any[] = [];
  if (uploadsPlaylistId) {
    const playlistRes = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
    });

    const videoIds = (playlistRes.data.items || [])
      .map((item) => item.contentDetails?.videoId)
      .filter(Boolean) as string[];

    if (videoIds.length > 0) {
      const videosRes = await youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: videoIds,
      });

      videos = (videosRes.data.items || []).map((v) => ({
        videoId: v.id,
        title: v.snippet?.title || 'Video',
        views: parseInt(v.statistics?.viewCount || '0', 10),
        likes: parseInt(v.statistics?.likeCount || '0', 10),
        publishedAt: v.snippet?.publishedAt ? new Date(v.snippet.publishedAt) : new Date(),
        duration: parseDuration(v.contentDetails?.duration || ''),
        viralScore: Math.min(100, Math.round((parseInt(v.statistics?.viewCount || '0', 10) / 1000) * 0.5)),
      }));
    }
  }

  // 3. Get Real Growth Data from Analytics API based on range
  const today = new Date();
  let startDateStr: string;
  let endDateStr = today.toISOString().split('T')[0];
  let dimensions = 'day';

  if (range === 'today') {
    startDateStr = endDateStr;
    dimensions = 'hour';
  } else if (range === 'week') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    startDateStr = d.toISOString().split('T')[0];
  } else if (range === 'year') {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    startDateStr = d.toISOString().split('T')[0];
    dimensions = 'month';
  } else {
    // Default: month
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    startDateStr = d.toISOString().split('T')[0];
  }

  const analyticsRes = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate: startDateStr,
    endDate: endDateStr,
    metrics: 'views,subscribersGained,subscribersLost,estimatedMinutesWatched,likes',
    dimensions,
    sort: dimensions === 'hour' ? 'hour' : dimensions === 'month' ? 'month' : 'day',
  });

  const rows = analyticsRes.data.rows || [];
  console.log('Analytics Rows:', rows);
  let totalWatchTime = 0;
  let totalLikes = 0;

  const metricOffset = dimensions === 'hour' ? 1 : 0; // Hourly has [date, hour, ...]

  const viewsGrowthData = rows.map((row) => {
    const views = (row[1 + metricOffset] as number) || 0;
    const watchTime = (row[4 + metricOffset] as number) || 0;
    const likes = (row[5 + metricOffset] as number) || 0;

    totalWatchTime += watchTime;
    totalLikes += likes;
    
    let ts: Date;
    if (dimensions === 'hour') {
      const dateStr = row[0] as string;
      const hourStr = row[1] as string;
      ts = new Date(
        parseInt(dateStr.slice(0, 4)),
        parseInt(dateStr.slice(4, 6)) - 1,
        parseInt(dateStr.slice(6, 8)),
        parseInt(hourStr)
      );
    } else {
      ts = new Date(row[0] as string);
    }

    return {
      timestamp: ts,
      views,
    };
  });

  let currentSubs = subscriberCount;
  const subRows = [...rows].reverse();
  const subscriberGrowthData = subRows.map((row) => {
    const subsGained = (row[2 + metricOffset] as number) || 0;
    const subsLost = (row[3 + metricOffset] as number) || 0;
    const netSubs = subsGained - subsLost;
    
    let ts: Date;
    if (dimensions === 'hour') {
      const dateStr = row[0] as string;
      const hourStr = row[1] as string;
      ts = new Date(
        parseInt(dateStr.slice(0, 4)),
        parseInt(dateStr.slice(4, 6)) - 1,
        parseInt(dateStr.slice(6, 8)),
        parseInt(hourStr)
      );
    } else {
      ts = new Date(row[0] as string);
    }

    const snapshot = {
      timestamp: ts,
      count: currentSubs,
    };
    currentSubs -= netSubs;
    return snapshot;
  }).reverse();

  return {
    channelId,
    channelTitle,
    subscriberCount,
    totalWatchTime,
    totalLikes,
    videos,
    subscriberGrowthData,
    viewsGrowthData,
  };
}

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0', 10) * 3600) + (parseInt(m[2] || '0', 10) * 60) + parseInt(m[3] || '0', 10);
}
