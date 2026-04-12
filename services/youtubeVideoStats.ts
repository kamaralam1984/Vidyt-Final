import axios from 'axios';
import { getApiConfig } from '@/lib/apiConfig';

export type VideoStats = { views: number; likes: number; comments: number };

/**
 * YouTube Data API v3 — public statistics for a single video id.
 */
export async function fetchYouTubeVideoStats(videoId: string): Promise<VideoStats | null> {
  const { youtubeDataApiKey: key } = await getApiConfig();
  if (!key || !videoId) return null;
  try {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'statistics', id: videoId, key },
      timeout: 12000,
    });
    const item = res.data?.items?.[0];
    const s = item?.statistics;
    if (!s) return null;
    return {
      views: parseInt(String(s.viewCount || '0'), 10) || 0,
      likes: parseInt(String(s.likeCount || '0'), 10) || 0,
      comments: parseInt(String(s.commentCount || '0'), 10) || 0,
    };
  } catch {
    return null;
  }
}
