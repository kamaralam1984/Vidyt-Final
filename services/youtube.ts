// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - ytdl-core typings declare file is not a module
import ytdl from 'ytdl-core';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getApiConfig } from '@/lib/apiConfig';

const execFileAsync = promisify(execFile);

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

/**
 * Resolves a channel handle or ID to its most recent video ID.
 */
async function fetchLatestVideoIdFromChannel(channelIdentifier: string, apiKey: string): Promise<string> {
  try {
    let channelId = channelIdentifier;

    // 1. Resolve handle to channel ID if needed
    if (channelIdentifier.startsWith('@')) {
      console.log(`Resolving handle ${channelIdentifier} to channel ID...`);
      const searchRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: channelIdentifier,
          type: 'channel',
          key: apiKey,
          maxResults: 1
        }
      });
      const channelItem = searchRes.data?.items?.[0];
      if (!channelItem) throw new Error(`Could not find channel for handle: ${channelIdentifier}`);
      channelId = channelItem.id.channelId;
      console.log(`Resolved ${channelIdentifier} to channel ID: ${channelId}`);
    }

    // 2. Fetch latest video from channel
    console.log(`Fetching latest video for channel ID: ${channelId}...`);
    const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        channelId: channelId,
        order: 'date',
        type: 'video',
        key: apiKey,
        maxResults: 1
      }
    });

    const videoItem = videoRes.data?.items?.[0];
    if (!videoItem) throw new Error('No videos found for this channel');
    
    const videoId = videoItem.id.videoId;
    console.log(`Found latest video ID: ${videoId}`);
    return videoId;
  } catch (error: any) {
    const apiError = error.response?.data?.error?.message || error.message;
    console.error('Error fetching latest video from channel:', apiError);
    throw new Error(`Failed to resolve channel to latest video: ${apiError}`);
  }
}

export async function extractYouTubeMetadata(url: string): Promise<YouTubeMetadata> {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    throw new Error('Please provide a valid YouTube URL.\n\nSupported formats:\n' +
      '- youtube.com/watch?v=VIDEO_ID\n' +
      '- youtu.be/VIDEO_ID\n' +
      '- youtube.com/shorts/VIDEO_ID\n' +
      '- youtube.com/embed/VIDEO_ID\n' +
      '- m.youtube.com/watch?v=VIDEO_ID\n' +
      '- youtube.com/@handle (latest video)');
  }

  // Get API Config early to handle channel resolution if needed
  const config = await getApiConfig();
  const apiKey = config.youtubeDataApiKey?.trim();

  let videoId = extractVideoId(url);
  
  // Check if it looks like a channel URL/handle
  if (!videoId) {
    const handleMatch = url.match(/youtube\.com\/(@[a-zA-Z0-9._-]+)/);
    const channelMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
    const channelId = handleMatch ? handleMatch[1] : (channelMatch ? channelMatch[1] : null);

    if (channelId) {
      if (!apiKey) {
        throw new Error('Channel URL detected. Please configure a YouTube Data API Key in Super Admin settings to analyze the latest video from a channel.');
      }
      console.log(`Channel URL detected: ${channelId}. Resolving to latest video...`);
      videoId = await fetchLatestVideoIdFromChannel(channelId, apiKey);
    }
  }

  if (!videoId) {
    throw new Error('Invalid YouTube URL format.\n\nPlease use one of these formats:\n' +
      '- youtube.com/watch?v=VIDEO_ID\n' +
      '- youtu.be/VIDEO_ID\n' +
      '- youtube.com/shorts/VIDEO_ID\n' +
      '- youtube.com/embed/VIDEO_ID\n' +
      '- m.youtube.com/watch?v=VIDEO_ID\n' +
      '- youtube.com/@handle (latest video)\n\n' +
      `You entered: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
  }

  console.log(`Extracting metadata for video ID: ${videoId}`);

  // Try YouTube Data API v3 first if key is set
  try {
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

export function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Trim whitespace
  let cleanUrl = url.trim();
  
  // Remove any trailing spaces or newlines
  cleanUrl = cleanUrl.replace(/\s+$/, '');
  
  // Regular expressions to extract video ID from various YouTube URL formats
  const patterns = [
    // Standard watch URLs or mobile: youtube.com/watch?v=VIDEO_ID
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    // Shortened URLs: youtu.be/VIDEO_ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Embed URLs: youtube.com/embed/VIDEO_ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Shorts URLs: youtube.com/shorts/VIDEO_ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // Just video ID (if someone pastes just the ID)
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      console.log('Extracted video ID:', videoId, 'from URL:', cleanUrl);
      return videoId;
    }
  }

  console.log('Could not extract direct video ID from URL:', cleanUrl);
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

/**
 * Try download via yt-dlp (CLI). Works when ytdl-core fails (decipher/player changes).
 * Requires yt-dlp installed: https://github.com/yt-dlp/yt-dlp
 */
async function downloadWithYtDlp(url: string, outputPath: string): Promise<boolean> {
  try {
    await execFileAsync(
      'yt-dlp',
      [
        '-f', 'worst[ext=mp4]/worst[ext=webm]/worst',
        '-o', outputPath,
        '--no-warnings',
        '--no-check-certificate',
        url,
      ],
      { timeout: 120000, maxBuffer: 1024 * 1024 }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Download YouTube video to a local file (for Shorts Creator etc.).
 * Tries yt-dlp first (reliable), then @distube/ytdl-core. If both fail, suggests file upload.
 */
export async function downloadYouTubeToFile(youtubeUrl: string, outputPath: string): Promise<void> {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) throw new Error('Invalid YouTube URL');
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  const ok = await downloadWithYtDlp(url, outputPath);
  if (ok) return;

  const requestOptions = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  };
  const playerClients = ['WEB', 'ANDROID', 'IOS', 'WEB_EMBEDDED', 'TV'];

  const tryDownload = (opts: Record<string, unknown>): Promise<void> =>
    new Promise((resolve, reject) => {
      const stream = ytdl(url, { requestOptions, playerClients, ...opts });
      const writeStream = createWriteStream(outputPath);
      stream.pipe(writeStream);
      stream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', () => resolve());
    });

  for (const opts of [{ quality: 'lowest' }, { quality: 'highest' }, {}]) {
    try {
      await tryDownload(opts);
      return;
    } catch {
      // try next
    }
  }
  throw new Error(
    'Is video ko download nahi kar sakte. Option 1: Server pe yt-dlp install karein (sudo apt install yt-dlp). Option 2: Video file upload karke try karein.'
  );
}
