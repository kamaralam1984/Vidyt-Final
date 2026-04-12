import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface VideoMetadata {
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  hashtags: string[];
  author: string;
  platform: string;
  raw?: any;
}

/**
 * Fetch video metadata using yt-dlp for production-grade reliability
 */
export async function getHardcoreMetadata(url: string): Promise<VideoMetadata> {
  try {
    console.log(`[MetadataService] Fetching hardcore metadata for: ${url}`);
    
    // --dump-json gives us most of what we need in a single call
    const { stdout } = await execAsync(`yt-dlp --dump-json --no-playlist --quiet "${url}"`, {
      timeout: 30000, // 30 seconds timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    const data = JSON.parse(stdout);

    return {
      title: data.title || data.fulltitle || 'Social Video',
      description: data.description || '',
      thumbnailUrl: data.thumbnail || data.thumbnails?.[0]?.url || '',
      duration: data.duration || 0,
      views: data.view_count || 0,
      likes: data.like_count || 0,
      comments: data.comment_count || 0,
      shares: data.repost_count || data.share_count || 0,
      hashtags: data.tags || [],
      author: data.uploader || data.uploader_id || 'Unknown',
      platform: data.extractor || 'unknown',
      raw: process.env.NODE_ENV === 'development' ? data : undefined
    };
  } catch (error: any) {
    console.error(`[MetadataService] yt-dlp failed for ${url}:`, error.message);
    throw new Error(`Failed to extract hardcore metadata: ${error.message}`);
  }
}
