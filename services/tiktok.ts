import { getHardcoreMetadata } from './multiplatform/metadata';

export interface TikTokMetadata {
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
}

/**
 * Extract TikTok video metadata
 * Note: TikTok doesn't have a public API, so we use oEmbed, scraping, or yt-dlp
 */
export async function extractTikTokMetadata(url: string): Promise<TikTokMetadata> {
  try {
    const data = await getHardcoreMetadata(url);
    
    return {
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration,
      views: data.views,
      likes: data.likes,
      comments: data.comments,
      shares: data.shares,
      hashtags: data.hashtags,
      author: data.author
    };
  } catch (error: any) {
    console.error('TikTok hardcore metadata extraction failed, falling back to basic:', error.message);
    
    // Fallback: This is kept for safety but we expect yt-dlp to work
    return {
      title: 'TikTok Video',
      description: '',
      thumbnailUrl: '',
      duration: 0,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      hashtags: [],
      author: 'Unknown'
    };
  }
}

/**
 * Extract TikTok video ID from URL
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    // Standard format: tiktok.com/@username/video/VIDEO_ID
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    // Short format: vm.tiktok.com/SHORT_CODE
    /vm\.tiktok\.com\/(\w+)/,
    // Alternative: tiktok.com/t/ZTdVIDEO_ID
    /tiktok\.com\/t\/(ZTd\w+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract hashtags from text
 */
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}
