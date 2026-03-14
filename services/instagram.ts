import axios from 'axios';

export interface InstagramMetadata {
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  hashtags: string[];
  platform: 'instagram';
}

/**
 * Extract video ID or shortcode from Instagram URL
 * Supports formats:
 * - instagram.com/p/SHORTCODE
 * - instagram.com/reel/SHORTCODE
 * - instagram.com/tv/SHORTCODE
 * - instagram.com/reels/SHORTCODE
 */
function extractShortcode(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let cleanUrl = url.trim();
  cleanUrl = cleanUrl.replace(/\s+$/, '');

  const patterns = [
    // instagram.com/p/SHORTCODE
    /instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
    // instagram.com/reel/SHORTCODE
    /instagram\.com\/reel\/([a-zA-Z0-9_-]+)/,
    // instagram.com/tv/SHORTCODE
    /instagram\.com\/tv\/([a-zA-Z0-9_-]+)/,
    // instagram.com/reels/SHORTCODE
    /instagram\.com\/reels\/([a-zA-Z0-9_-]+)/,
    // m.instagram.com formats
    /m\.instagram\.com\/(?:p|reel|tv|reels)\/([a-zA-Z0-9_-]+)/,
    // Just shortcode (if someone pastes just the shortcode)
    /^([a-zA-Z0-9_-]{8,15})$/,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      const shortcode = match[1];
      console.log('Extracted Instagram shortcode:', shortcode, 'from URL:', cleanUrl);
      return shortcode;
    }
  }

  console.log('Could not extract Instagram shortcode from URL:', cleanUrl);
  return null;
}

/**
 * Extract metadata from Instagram video using oEmbed API
 * Note: Instagram's oEmbed API has limitations and may require authentication
 */
async function fetchViaOEmbed(shortcode: string, url: string): Promise<Partial<InstagramMetadata>> {
  try {
    // Instagram oEmbed endpoint
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await axios.get(oembedUrl, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    const data = response.data;

    // Extract hashtags from caption
    const hashtags = extractHashtags(data.title || '');

    return {
      title: data.title || 'Instagram Video',
      thumbnailUrl: data.thumbnail_url || '',
      description: data.title || '', // Instagram oEmbed provides title as caption
      duration: 0, // oEmbed doesn't provide duration
      views: 0, // Instagram doesn't provide view count in oEmbed
      hashtags,
    };
  } catch (error: any) {
    console.error('Instagram oEmbed fallback failed:', error.message);
    throw new Error('Failed to fetch Instagram video metadata. The video may be private or unavailable.');
  }
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

/**
 * Extract metadata from Instagram video
 */
export async function extractInstagramMetadata(url: string): Promise<InstagramMetadata> {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    throw new Error('Please provide a valid Instagram video URL.\n\nSupported formats:\n' +
      '- instagram.com/p/SHORTCODE\n' +
      '- instagram.com/reel/SHORTCODE\n' +
      '- instagram.com/tv/SHORTCODE\n' +
      '- instagram.com/reels/SHORTCODE');
  }

  const shortcode = extractShortcode(url);
  if (!shortcode) {
    throw new Error('Invalid Instagram URL format.\n\nPlease use one of these formats:\n' +
      '- instagram.com/p/SHORTCODE\n' +
      '- instagram.com/reel/SHORTCODE\n' +
      '- instagram.com/tv/SHORTCODE\n' +
      '- instagram.com/reels/SHORTCODE\n\n' +
      `You entered: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
  }

  console.log(`Extracting metadata for Instagram shortcode: ${shortcode}`);

  try {
    // Use oEmbed API (free, but may have limitations)
    const metadata = await fetchViaOEmbed(shortcode, url);
    
    return {
      title: metadata.title || 'Instagram Video',
      description: metadata.description || '',
      thumbnailUrl: metadata.thumbnailUrl || '',
      duration: metadata.duration || 0,
      views: metadata.views || 0,
      hashtags: metadata.hashtags || [],
      platform: 'instagram',
    };
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    console.error('Instagram metadata extraction error:', errorMsg);

    if (errorMsg.includes('private') || errorMsg.includes('unavailable')) {
      throw new Error('Private Video\n\nThis Instagram video is private and cannot be analyzed. Please use a public video.');
    } else if (errorMsg.includes('timeout')) {
      throw new Error('Request Timeout\n\nThe Instagram API request timed out. Please:\n1. Check your internet connection\n2. Try again in a few moments\n3. Try a different video');
    }

    throw new Error(`Failed to extract Instagram metadata\n\nError: ${errorMsg}\n\nPlease try:\n1. A different video\n2. Checking the URL is correct\n3. Ensuring the video is public`);
  }
}

export async function downloadThumbnail(url: string, shortcode: string): Promise<string> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, return the URL
    return url;
  } catch (error) {
    console.error('Error downloading thumbnail:', error);
    return url;
  }
}
