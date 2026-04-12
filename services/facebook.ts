import axios from 'axios';

export interface FacebookMetadata {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl?: string;
  duration: number;
  views: number;
  hashtags: string[];
  platform: 'facebook';
}

/**
 * Extract video ID from Facebook URL
 * Supports formats:
 * - facebook.com/watch?v=VIDEO_ID
 * - facebook.com/username/videos/VIDEO_ID
 * - fb.watch/VIDEO_ID
 * - facebook.com/share/v/VIDEO_ID (share URL)
 * - facebook.com/share/r/VIDEO_ID (share URL)
 */
function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let cleanUrl = url.trim();
  cleanUrl = cleanUrl.replace(/\s+$/, '');

  const patterns = [
    // facebook.com/watch?v=VIDEO_ID
    /facebook\.com\/watch\?v=([0-9]+)/,
    // facebook.com/username/videos/VIDEO_ID
    /facebook\.com\/[^\/]+\/videos\/([0-9]+)/,
    // fb.watch/VIDEO_ID
    /fb\.watch\/([0-9]+)/,
    // m.facebook.com/watch?v=VIDEO_ID
    /m\.facebook\.com\/watch\?v=([0-9]+)/,
    // facebook.com/reel/VIDEO_ID (Reel URL)
    /facebook\.com\/reel\/([0-9]+)/,
    // facebook.com/share/v/VIDEO_ID (share URL)
    /facebook\.com\/share\/v\/([A-Za-z0-9_-]+)/,
    // facebook.com/share/r/VIDEO_ID (share URL)
    /facebook\.com\/share\/r\/([A-Za-z0-9_-]+)/,
    // Just video ID (if someone pastes just the ID)
    /^([0-9]{15,20})$/,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      console.log('Extracted Facebook video ID/code:', videoId, 'from URL:', cleanUrl);
      return videoId;
    }
  }

  console.log('Could not extract Facebook video ID from URL:', cleanUrl);
  return null;
}

/**
 * Resolve Facebook share URL to watch URL by following redirects
 * Share URLs redirect to actual watch URLs
 */
async function resolveShareUrlToWatchUrl(url: string): Promise<string> {
  // If it's already a watch URL, return as is
  if (url.includes('/watch?v=') || url.includes('fb.watch/')) {
    return url;
  }

  // Check if it's a share URL
  if (!url.includes('/share/')) {
    return url;
  }

  try {
    console.log('Following redirect for share URL:', url);
    
    // Method 1: Try to follow redirect with HEAD request (lighter)
    try {
      const headResponse = await axios.head(url, {
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      // Get final URL after redirects
      const finalUrl = headResponse.request?.responseURL || headResponse.request?.res?.responseUrl || url;
      
      if (finalUrl.includes('/watch?v=') && finalUrl !== url) {
        console.log('Resolved share URL to watch URL via HEAD:', finalUrl);
        return finalUrl;
      }
    } catch (headError: any) {
      console.log('HEAD request failed, trying GET:', headError.message);
    }
    
    // Method 2: Try GET request to follow redirect
    try {
      const getResponse = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      // Get final URL after redirects
      const finalUrl = getResponse.request?.responseURL || getResponse.request?.res?.responseUrl || url;
      
      if (finalUrl.includes('/watch?v=') && finalUrl !== url) {
        console.log('Resolved share URL to watch URL via GET:', finalUrl);
        return finalUrl;
      }
    } catch (getError: any) {
      console.log('GET request failed:', getError.message);
    }
    
    // Method 3: Try extracting share code and converting (fallback)
    const sharePatterns = [
      /facebook\.com\/share\/v\/([A-Za-z0-9_-]+)/,
      /facebook\.com\/share\/r\/([A-Za-z0-9_-]+)/,
    ];

    for (const pattern of sharePatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const shareCode = match[1];
        // Try different watch URL formats
        const watchUrl = `https://www.facebook.com/watch?v=${shareCode}`;
        console.log('Trying converted watch URL:', watchUrl);
        return watchUrl;
      }
    }

    console.log('Could not resolve share URL, returning original');
    return url;
  } catch (error: any) {
    console.log('Could not resolve share URL, using original:', error.message);
    return url;
  }
}

/**
 * Try to scrape Facebook page for basic metadata (fallback method)
 */
async function scrapeFacebookPage(url: string): Promise<Partial<FacebookMetadata>> {
  try {
    console.log('Trying to scrape Facebook page for metadata...');
    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    // Try to extract title from og:title meta tag
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    const title = ogTitleMatch ? ogTitleMatch[1] : 'Facebook Video';

    // Try to extract description from og:description
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    const description = ogDescMatch ? ogDescMatch[1] : '';

    // Try to extract thumbnail from og:image
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    const thumbnailUrl = ogImageMatch ? ogImageMatch[1] : '';

    console.log('Successfully scraped metadata:', { title, thumbnailUrl: thumbnailUrl ? 'Found' : 'Not found' });

    return {
      title,
      description,
      thumbnailUrl,
      duration: 0,
      views: 0,
      hashtags: extractHashtags(description),
    };
  } catch (error: any) {
    console.log('Scraping failed:', error.message);
    throw error;
  }
}

/**
 * Extract metadata from Facebook video using oEmbed API
 * Note: Facebook's oEmbed API requires authentication for private videos
 * Supports both watch URLs and share URLs
 */
async function fetchViaOEmbed(videoId: string, url: string): Promise<Partial<FacebookMetadata>> {
  try {
    // If it's a share URL or reel URL, try to resolve it to a watch URL first
    let resolvedUrl = url;
    if (url.includes('/share/')) {
      console.log('Resolving share URL to watch URL...');
      resolvedUrl = await resolveShareUrlToWatchUrl(url);
      console.log('Resolved URL:', resolvedUrl);
    } else if (url.includes('/reel/')) {
      // Try to convert reel URL to watch URL format
      const reelMatch = url.match(/facebook\.com\/reel\/([0-9]+)/);
      if (reelMatch && reelMatch[1]) {
        resolvedUrl = `https://www.facebook.com/watch?v=${reelMatch[1]}`;
        console.log('Converted reel URL to watch URL:', resolvedUrl);
      }
    }

    // Try oEmbed with resolved URL
    let oembedUrl = `https://www.facebook.com/plugins/video/oembed.json?url=${encodeURIComponent(resolvedUrl)}`;
    
    try {
      const response = await axios.get(oembedUrl, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      const data = response.data;

      return {
        title: data.title || 'Facebook Video',
        thumbnailUrl: data.thumbnail_url || '',
        description: data.description || '',
        duration: 0, // oEmbed doesn't provide duration
        views: 0, // oEmbed doesn't provide views
        hashtags: extractHashtags(data.description || ''),
      };
    } catch (firstError: any) {
      // If resolved URL failed and original was share/reel URL, try original URL directly
      if ((url.includes('/share/') || url.includes('/reel/')) && resolvedUrl !== url) {
        console.log('Trying original share URL with oEmbed...');
        oembedUrl = `https://www.facebook.com/plugins/video/oembed.json?url=${encodeURIComponent(url)}`;
        try {
          const response = await axios.get(oembedUrl, { 
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });
          
          const data = response.data;

          return {
            title: data.title || 'Facebook Video',
            thumbnailUrl: data.thumbnail_url || '',
            description: data.description || '',
            duration: 0,
            views: 0,
            hashtags: extractHashtags(data.description || ''),
          };
        } catch (secondError: any) {
          // Both oEmbed attempts failed, try scraping as fallback
          console.log('oEmbed failed, trying page scraping fallback...');
          try {
            return await scrapeFacebookPage(resolvedUrl);
          } catch (scrapeError: any) {
            // If scraping also fails, throw original error
            throw firstError;
          }
        }
      }
      
      // For watch URLs, try scraping as fallback
      if (resolvedUrl.includes('/watch?v=')) {
        console.log('oEmbed failed for watch URL, trying page scraping fallback...');
        try {
          return await scrapeFacebookPage(resolvedUrl);
        } catch (scrapeError: any) {
          // If scraping fails, throw original error
          throw firstError;
        }
      }
      
      throw firstError;
    }
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    const statusCode = error?.response?.status;
    console.error('Facebook oEmbed failed:', errorMsg, 'Status:', statusCode);
    
    // Provide more specific error messages
    if (statusCode === 401 || statusCode === 403 || errorMsg.includes('private') || errorMsg.includes('access denied')) {
      throw new Error('Private Video - This video is private or restricted. Please use a public video.');
    } else if (statusCode === 400) {
      // For share URLs, provide specific guidance
      if (url.includes('/share/')) {
        throw new Error('Share URL Not Supported\n\nFacebook share URLs may not work with our analysis system.\n\n' +
          'Please try:\n' +
          '1. Open the video in Facebook\n' +
          '2. Click on the video to open it\n' +
          '3. Copy the URL from the address bar (should be facebook.com/watch?v=...)\n' +
          '4. Use that URL instead of the share URL\n\n' +
          'Or ensure the video is PUBLIC and try again.');
      }
      throw new Error('Invalid URL - Facebook could not process this URL. Please check if the video exists and is public.');
    }
    
    throw new Error('Failed to fetch Facebook video metadata. The video may be private or unavailable.');
  }
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

/**
 * Extract metadata from Facebook video
 */
export async function extractFacebookMetadata(url: string): Promise<FacebookMetadata> {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    throw new Error('Please provide a valid Facebook video URL.\n\nSupported formats:\n' +
      '- facebook.com/watch?v=VIDEO_ID\n' +
      '- facebook.com/reel/VIDEO_ID (Reels)\n' +
      '- facebook.com/username/videos/VIDEO_ID\n' +
      '- fb.watch/VIDEO_ID\n' +
      '- facebook.com/share/v/VIDEO_ID (share URL)\n' +
      '- facebook.com/share/r/VIDEO_ID (share URL)\n' +
      '- m.facebook.com/watch?v=VIDEO_ID');
  }

  // Check if it's a share URL or reel URL - these need special handling
  const isShareUrl = url.includes('/share/v/') || url.includes('/share/r/');
  const isReelUrl = url.includes('/reel/');
  
  // For share URLs and reel URLs, we'll try to use oEmbed directly with the original URL
  // oEmbed API can handle these URLs
  const videoId = (isShareUrl || isReelUrl) ? url : extractVideoId(url);
  
  if (!videoId && !isShareUrl && !isReelUrl) {
    throw new Error('Invalid Facebook URL format.\n\nPlease use one of these formats:\n' +
      '- facebook.com/watch?v=VIDEO_ID\n' +
      '- facebook.com/reel/VIDEO_ID (Reels)\n' +
      '- facebook.com/username/videos/VIDEO_ID\n' +
      '- fb.watch/VIDEO_ID\n' +
      '- facebook.com/share/v/VIDEO_ID (share URL)\n' +
      '- facebook.com/share/r/VIDEO_ID (share URL)\n' +
      '- m.facebook.com/watch?v=VIDEO_ID\n\n' +
      `You entered: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
  }

  console.log(`Extracting metadata for Facebook video${isShareUrl ? ' (share URL)' : isReelUrl ? ' (reel URL)' : ''}: ${(isShareUrl || isReelUrl) ? url : videoId}`);

  try {
    // Use oEmbed API (free, no authentication needed for public videos)
    // oEmbed can handle both watch URLs and share URLs
    const metadata = await fetchViaOEmbed(isShareUrl || isReelUrl ? url : (videoId || url), url);
    
    return {
      title: metadata.title || 'Facebook Video',
      description: metadata.description || '',
      thumbnailUrl: metadata.thumbnailUrl || '',
      duration: metadata.duration || 0,
      views: metadata.views || 0,
      hashtags: metadata.hashtags || [],
      platform: 'facebook',
    };
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    const errorResponse = error?.response?.data || {};
    const statusCode = error?.response?.status;
    
    console.error('Facebook metadata extraction error:', errorMsg, 'Status:', statusCode);

    // Check for private/unavailable video
    if (errorMsg.includes('private') || errorMsg.includes('unavailable') || 
        errorMsg.includes('access denied') || errorMsg.includes('Private Video') ||
        statusCode === 401 || statusCode === 403) {
      throw new Error('Private Video\n\nThis Facebook video is private or restricted and cannot be analyzed.\n\n' +
        'Please use a PUBLIC video URL:\n' +
        '1. Go to your Facebook page\n' +
        '2. Find a PUBLIC video (not private/friends only)\n' +
        '3. Click on the video\n' +
        '4. Copy the URL from browser address bar\n' +
        '5. Make sure the video privacy is set to "Public"\n\n' +
        'Supported URL formats:\n' +
        '- facebook.com/watch?v=VIDEO_ID\n' +
        '- fb.watch/VIDEO_ID\n' +
        '- facebook.com/share/v/VIDEO_CODE');
    } else if (errorMsg.includes('timeout') || statusCode === 408) {
      throw new Error('Request Timeout\n\nThe Facebook API request timed out. Please:\n1. Check your internet connection\n2. Try again in a few moments\n3. Try a different video');
    } else if (statusCode === 400) {
      // Bad request - might be invalid URL format or Facebook API issue
      throw new Error(`Invalid URL or Facebook API Error\n\nFacebook returned an error for this URL.\n\n` +
        `Please try:\n` +
        `1. Make sure the video is PUBLIC (not private)\n` +
        `2. Use a different video URL format\n` +
        `3. Check if the video exists and is accessible\n\n` +
        `Supported formats:\n` +
        `- facebook.com/watch?v=VIDEO_ID\n` +
        `- fb.watch/VIDEO_ID\n` +
        `- facebook.com/share/v/VIDEO_CODE`);
    }

    throw new Error(`Failed to extract Facebook metadata\n\nError: ${errorMsg}\n\nPlease try:\n1. A different video\n2. Checking the URL is correct\n3. Ensuring the video is public`);
  }
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
