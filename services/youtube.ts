import ytdl from 'ytdl-core';
import axios from 'axios';
import { getApiConfig } from '@/lib/apiConfig';

// YouTube Data API v3 (when key set in Super Admin API Config or env)
async function fetchViaYouTubeDataAPI(videoId: string, apiKey: string): Promise<YouTubeMetadata> {
  const res = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: { part: 'snippet,contentDetails,statistics', id: videoId, key: apiKey },
    timeout: 10000,
  });
  const items = res.data?.items;
  if (!items?.length) throw new Error('Video not found');
  const v = items[0];
  const sn = v.snippet || {};
  const stat = v.statistics || {};
  const content = v.contentDetails || {};
  const duration = parseDuration(content.duration || '');
  return {
    title: sn.title || 'Untitled Video',
    description: sn.description || '',
    thumbnailUrl: sn.thumbnails?.maxres?.url || sn.thumbnails?.high?.url || sn.thumbnails?.default?.url || '',
    duration,
    views: parseInt(stat.viewCount, 10) || 0,
    hashtags: extractHashtags(sn.description || ''),
  };
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0', 10) * 3600) + (parseInt(match[2] || '0', 10) * 60) + parseInt(match[3] || '0', 10);
}

// Fallback: Use YouTube oEmbed API when ytdl-core fails
async function fetchViaOEmbed(videoId: string): Promise<Partial<YouTubeMetadata>> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await axios.get(oembedUrl, { timeout: 10000 });
    const data = response.data;
    
    return {
      title: data.title || 'Untitled Video',
      thumbnailUrl: data.thumbnail_url || '',
      description: '', // oEmbed doesn't provide description
      duration: 0, // oEmbed doesn't provide duration
      views: 0, // oEmbed doesn't provide views
      hashtags: [],
    };
  } catch (error) {
    console.error('oEmbed fallback failed:', error);
    throw new Error('Both ytdl-core and oEmbed API failed. Please try a different video or use manual upload.');
  }
}

export interface YouTubeMetadata {
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  hashtags: string[];
}

export async function extractYouTubeMetadata(url: string): Promise<YouTubeMetadata> {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    throw new Error('Please provide a valid YouTube URL.\n\nSupported formats:\n' +
      '- youtube.com/watch?v=VIDEO_ID\n' +
      '- youtu.be/VIDEO_ID\n' +
      '- youtube.com/shorts/VIDEO_ID\n' +
      '- youtube.com/embed/VIDEO_ID\n' +
      '- m.youtube.com/watch?v=VIDEO_ID');
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL format.\n\nPlease use one of these formats:\n' +
      '- youtube.com/watch?v=VIDEO_ID\n' +
      '- youtu.be/VIDEO_ID\n' +
      '- youtube.com/shorts/VIDEO_ID\n' +
      '- youtube.com/embed/VIDEO_ID\n' +
      '- m.youtube.com/watch?v=VIDEO_ID\n\n' +
      `You entered: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
  }

  console.log(`Extracting metadata for video ID: ${videoId}`);

  // Try YouTube Data API v3 first if key is set (Super Admin API Config or env)
  try {
    const config = await getApiConfig();
    const apiKey = config.youtubeDataApiKey?.trim();
    if (apiKey) {
      const metadata = await fetchViaYouTubeDataAPI(videoId, apiKey);
      console.log('Successfully extracted metadata via YouTube Data API v3:', metadata.title);
      return metadata;
    }
  } catch (apiErr: any) {
    console.warn('YouTube Data API v3 failed, falling back to ytdl/oEmbed:', apiErr?.message);
  }
  
  let lastError: any = null;
  const maxRetries = 1; // Reduced retries since ytdl-core issues are usually consistent
  
  // Retry logic for fetching video info
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for video ID: ${videoId}`);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log(`Attempting to fetch info for video ID: ${videoId} (attempt ${attempt + 1})`);
      
      // Add timeout and better error handling
      // Note: ytdl-core may fail if YouTube changes their API
      // In production, consider using YouTube Data API v3 as a fallback
      const info = await Promise.race([
        ytdl.getInfo(videoId, {
          requestOptions: {
            timeout: 20000, // 20 second timeout
          },
        }).catch((error: any) => {
          console.error(`ytdl.getInfo error for ${videoId}:`, error.message);
          console.error('Full error:', error);
          // Don't wrap the error - let it propagate so we can catch it and use oEmbed fallback
          throw error;
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000)
        )
      ]) as any;
      
      console.log('Successfully fetched video info');
      
      const videoDetails = info?.videoDetails;

      if (!videoDetails) {
        throw new Error('Video details not found in response');
      }

      // Extract hashtags from description
      const hashtags = extractHashtags(videoDetails.description || '');

      // Get the best quality thumbnail
      const thumbnails = videoDetails.thumbnails || [];
      let thumbnailUrl = '';
      if (thumbnails.length > 0) {
        // Try to get the highest quality thumbnail
        thumbnailUrl = thumbnails[thumbnails.length - 1]?.url || thumbnails[0]?.url || '';
      }

      const metadata = {
        title: videoDetails.title || 'Untitled Video',
        description: videoDetails.description || '',
        thumbnailUrl,
        duration: parseInt(videoDetails.lengthSeconds) || 0,
        views: parseInt(videoDetails.viewCount) || 0,
        hashtags,
      };

      console.log(`Successfully extracted metadata for: ${metadata.title}`);
      return metadata;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || 'Unknown error';
      const errorCode = error?.code || '';
      
      console.error(`Attempt ${attempt + 1} failed:`, errorMsg);
      
      // If ytdl-core fails with extraction error, try oEmbed fallback immediately
      if (errorMsg.includes('Could not extract functions') || 
          errorMsg.includes('extract functions') ||
          errorMsg.includes('compatibility issue') ||
          errorMsg.includes('Sign in to confirm') ||
          errorCode === 'ERR_INVALID_RESPONSE') {
        console.log('ytdl-core failed, trying oEmbed fallback immediately...');
        try {
          const fallbackMetadata = await fetchViaOEmbed(videoId);
          console.log('✅ oEmbed fallback succeeded! Using partial metadata.');
          // Return partial metadata - we'll handle missing fields gracefully
          return {
            title: fallbackMetadata.title || 'YouTube Video',
            description: fallbackMetadata.description || '',
            thumbnailUrl: fallbackMetadata.thumbnailUrl || '',
            duration: fallbackMetadata.duration || 0,
            views: fallbackMetadata.views || 0,
            hashtags: fallbackMetadata.hashtags || [],
          };
        } catch (fallbackError: any) {
          console.error('❌ oEmbed fallback also failed:', fallbackError);
          // Continue with error handling
        }
      }
      
      // Don't retry for certain errors
      if (
        errorMsg.includes('Private video') || 
        errorMsg.includes('private') ||
        errorMsg.includes('Unavailable') ||
        errorMsg.includes('unavailable') ||
        errorMsg.includes('Invalid') ||
        errorMsg.includes('not found')
      ) {
        break;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }
    }
  }
  
  // Handle final error
  const errorMsg = lastError?.message || 'Unknown error';
  const errorCode = lastError?.code || '';
  
  console.error('Final error details:', {
    message: errorMsg,
    code: errorCode,
    name: lastError?.name,
    stack: lastError?.stack,
  });
  
  // Try oEmbed as final fallback if we haven't already tried it
  if ((errorMsg.includes('Could not extract functions') || 
       errorMsg.includes('extract functions') ||
       errorMsg.includes('compatibility issue') ||
       errorCode === 'ERR_INVALID_RESPONSE') &&
      !errorMsg.includes('oEmbed')) {
    console.log('🔄 Attempting oEmbed fallback as last resort...');
    try {
      const fallbackMetadata = await fetchViaOEmbed(videoId);
      console.log('✅ oEmbed fallback succeeded as last resort!');
      return {
        title: fallbackMetadata.title || 'YouTube Video',
        description: fallbackMetadata.description || '',
        thumbnailUrl: fallbackMetadata.thumbnailUrl || '',
        duration: fallbackMetadata.duration || 0,
        views: fallbackMetadata.views || 0,
        hashtags: fallbackMetadata.hashtags || [],
      };
    } catch (fallbackError) {
      console.error('❌ oEmbed fallback failed:', fallbackError);
    }
  }
  
  // Provide more specific error messages
  if (errorMsg.includes('Could not extract functions') || 
      errorMsg.includes('extract functions') ||
      errorMsg.includes('Sign in to confirm') ||
      errorCode === 'ERR_INVALID_RESPONSE') {
    throw new Error('YouTube API Compatibility Issue\n\n' +
      'ytdl-core cannot extract video information. This happens when YouTube updates their system.\n\n' +
      'Solutions:\n' +
      '1. Try a different YouTube video\n' +
      '2. Wait a few minutes and try again\n' +
      '3. Check if ytdl-core has an update: npm install ytdl-core@latest\n' +
      '4. Use video upload instead of YouTube link\n\n' +
      `Technical details: ${errorMsg}`);
  } else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
    throw new Error('Request Timeout\n\nThe YouTube API request timed out. Please:\n1. Check your internet connection\n2. Try again in a few moments\n3. Try a different video');
  } else if (errorMsg.includes('Private video') || errorMsg.includes('private')) {
    throw new Error('Private Video\n\nThis video is private and cannot be analyzed. Please use a public video.');
  } else if (errorMsg.includes('Unavailable') || errorMsg.includes('unavailable')) {
    throw new Error('Video Unavailable\n\nThis video is unavailable. It may have been:\n- Deleted\n- Made private\n- Restricted in your region');
  } else if (errorMsg.includes('Invalid') || errorMsg.includes('not found')) {
    throw new Error('Invalid URL\n\nPlease check that the YouTube URL is correct and the video exists.');
  } else if (errorMsg.includes('Sign in to confirm your age')) {
    throw new Error('Age Verification Required\n\nThis video requires age verification and cannot be analyzed.');
  } else if (errorMsg.includes('Video unavailable')) {
    throw new Error('Video Unavailable\n\nThis video may be private, deleted, or restricted.');
  }
  
  throw new Error(`Failed to extract YouTube metadata\n\nError: ${errorMsg}\n\nPlease try:\n1. A different video\n2. Checking the URL is correct\n3. Waiting a few minutes`);
}

function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Trim whitespace
  let cleanUrl = url.trim();
  
  // Remove any trailing spaces or newlines
  cleanUrl = cleanUrl.replace(/\s+$/, '');
  
  // Support multiple YouTube URL formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtube.com/watch?v=VIDEO_ID
  // - www.youtube.com/watch?v=VIDEO_ID
  // - youtube.com/watch?v=VIDEO_ID
  // - youtu.be/VIDEO_ID
  // - youtube.com/embed/VIDEO_ID
  // - youtube.com/shorts/VIDEO_ID
  // - youtube.com/watch?feature=share&v=VIDEO_ID
  // - m.youtube.com/watch?v=VIDEO_ID (mobile)
  // - youtube.com/watch?v=VIDEO_ID&t=123s (with timestamp)
  
  // Video ID regex pattern (11 characters, alphanumeric, hyphens, underscores)
  const videoIdPattern = /[a-zA-Z0-9_-]{11}/;
  
  // Try multiple extraction patterns
  const patterns = [
    // Standard watch URLs: youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/watch\?.*[&?]v=)([a-zA-Z0-9_-]{11})/,
    // Embed URLs: youtube.com/embed/VIDEO_ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Shorts URLs: youtube.com/shorts/VIDEO_ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // Mobile URLs: m.youtube.com/watch?v=VIDEO_ID
    /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // Just video ID (if someone pastes just the ID)
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1] && videoIdPattern.test(match[1])) {
      const videoId = match[1];
      console.log('Extracted video ID:', videoId, 'from URL:', cleanUrl);
      return videoId;
    }
  }

  // If no pattern matched, try to find a valid video ID anywhere in the string
  const fallbackMatch = cleanUrl.match(/([a-zA-Z0-9_-]{11})/);
  if (fallbackMatch && fallbackMatch[1]) {
    const potentialId = fallbackMatch[1];
    // Validate it's likely a YouTube video ID (starts with common characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(potentialId)) {
      console.log('Extracted video ID (fallback):', potentialId, 'from URL:', cleanUrl);
      return potentialId;
    }
  }

  console.log('Could not extract video ID from URL:', cleanUrl);
  return null;
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

export async function downloadThumbnail(url: string, videoId: string): Promise<string> {
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
