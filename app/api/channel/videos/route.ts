export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getApiConfig } from '@/lib/apiConfig';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelUrl } = body;
    
    if (!channelUrl) {
      return NextResponse.json({ error: 'Channel URL is required' }, { status: 400 });
    }

    // Extract channel identifier
    const channelId = extractChannelId(channelUrl);
    
    if (!channelId) {
      return NextResponse.json(
        { error: 'Invalid channel URL format' },
        { status: 400 }
      );
    }

    // Try YouTube RSS Feed (Free, no API key needed)
    const videoUrls = await fetchVideosFromRSS(channelId);
    
    console.log(`Channel video fetch result: ${videoUrls.length} videos found for channel: ${channelId}`);
    
    return NextResponse.json({
      success: true,
      videoUrls,
      count: videoUrls.length,
      channelId,
      message: videoUrls.length === 0 
        ? 'No videos found. This channel may not have public videos, or RSS feeds may not be available. Please use manual video URLs.'
        : `Found ${videoUrls.length} videos`,
    });
  } catch (error: any) {
    console.error('Error fetching channel videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel videos', details: error.message },
      { status: 500 }
    );
  }
}

function extractChannelId(url: string): string | null {
  // Normalize URL - remove protocol and www
  let normalizedUrl = url.trim();
  normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');
  normalizedUrl = normalizedUrl.replace(/^www\./, '');
  normalizedUrl = normalizedUrl.replace(/\/$/, ''); // Remove trailing slash
  
  console.log('Normalized URL:', normalizedUrl);
  
  // Extract channel identifier from various formats
  const patterns = [
    /youtube\.com\/@([^\/\?\s&]+)/,  // @username format (most common)
    /youtube\.com\/c\/([^\/\?\s&]+)/,  // /c/ format
    /youtube\.com\/channel\/([^\/\?\s&]+)/,  // channel ID format
    /youtube\.com\/user\/([^\/\?\s&]+)/,  // user format
    /^@([^\/\?\s&]+)$/,  // Just @username
    /^([^\/\?\s&]+)$/,  // Just username without @
  ];

  for (const pattern of patterns) {
    const match = normalizedUrl.match(pattern);
    if (match && match[1]) {
      const channelId = match[1];
      console.log('✅ Extracted channel ID:', channelId);
      return channelId;
    }
  }

  console.log('❌ Could not extract channel ID from:', url);
  return null;
}

async function fetchVideosFromRSS(channelId: string): Promise<string[]> {
  const videoUrls: string[] = [];
  
  try {
    console.log('Fetching videos for channel ID:', channelId);
    
    // Method 1: Try YouTube Data API v3 (API Config DB or env)
    const config = await getApiConfig();
    const apiKey = config.youtubeDataApiKey?.trim();
    if (apiKey) {
      console.log('Trying YouTube Data API v3...');
      try {
        // First, get channel ID from username if needed
        let actualChannelId = channelId;
        
        if (!channelId.startsWith('UC')) {
          // Use channels.list with forUsername for @username format
          try {
            const username = channelId.replace('@', '').trim();
            const channelUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&forUsername=${username}&part=id`;
            const channelResponse = await axios.get(channelUrl);
            
            if (channelResponse.data.items && channelResponse.data.items.length > 0) {
              actualChannelId = channelResponse.data.items[0].id;
              console.log('Found channel ID via forUsername:', actualChannelId);
            } else {
              // Fallback: Search for channel
              const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(channelId)}&type=channel&part=snippet&maxResults=1`;
              const searchResponse = await axios.get(searchUrl);
              
              if (searchResponse.data.items && searchResponse.data.items.length > 0) {
                actualChannelId = searchResponse.data.items[0].id.channelId;
                console.log('Found channel ID via search:', actualChannelId);
              }
            }
          } catch (err: any) {
            console.log('Channel ID lookup failed:', err.message);
          }
        }
        
        // Get videos from channel using channels.list and then search
        if (actualChannelId.startsWith('UC')) {
          const videosUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${actualChannelId}&part=snippet&order=date&type=video&maxResults=50`;
          const videosResponse = await axios.get(videosUrl);
          
          if (videosResponse.data.items && videosResponse.data.items.length > 0) {
            const videos = videosResponse.data.items.map((item: any) => 
              `https://www.youtube.com/watch?v=${item.id.videoId}`
            );
            console.log(`✅ Found ${videos.length} videos via YouTube Data API`);
            return videos;
          }
        }
      } catch (apiError: any) {
        console.log('YouTube Data API failed:', apiError.response?.data || apiError.message);
      }
    } else {
      console.log('YouTube API key not configured, skipping API method');
    }
    
    // Method 2: Try scraping channel page for video links (works for @username format)
    const username = channelId.replace('@', '').trim();
    if (!channelId.startsWith('UC')) {
      console.log('Trying channel page scraping for:', username);
      const scrapedVideos = await scrapeChannelPage(username);
      if (scrapedVideos.length > 0) {
        console.log(`✅ Found ${scrapedVideos.length} videos via page scraping`);
        return scrapedVideos;
      }
    }
    
    // Method 3: Try RSS feed with channel ID (if it's a UC... format)
    if (channelId.startsWith('UC') && channelId.length > 20) {
      console.log('Trying channel ID RSS feed...');
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const videos = await fetchFromRSSFeed(rssUrl);
      if (videos.length > 0) {
        console.log(`✅ Found ${videos.length} videos via channel ID RSS`);
        return videos;
      }
    }
    
    // Method 4: Try RSS feed with @username format (new YouTube format)
    console.log('Trying @username RSS feed for:', username);
    const atUsernameRssUrl = `https://www.youtube.com/@${username}/videos.rss`;
    const atUsernameVideos = await fetchFromRSSFeed(atUsernameRssUrl);
    if (atUsernameVideos.length > 0) {
      console.log(`✅ Found ${atUsernameVideos.length} videos via @username RSS`);
      return atUsernameVideos;
    }
    
    // Method 5: Try old user RSS feed format (legacy)
    console.log('Trying legacy user RSS feed format...');
    const userRssUrl = `https://www.youtube.com/feeds/videos.xml?user=${username}`;
    const userVideos = await fetchFromRSSFeed(userRssUrl);
    if (userVideos.length > 0) {
      console.log(`✅ Found ${userVideos.length} videos via legacy user RSS`);
      return userVideos;
    }
    
    console.log('❌ All methods failed - no videos found');
    return [];
  } catch (error) {
    console.error('Error in fetchVideosFromRSS:', error);
    return [];
  }
}

// Scrape channel page to extract video links
async function scrapeChannelPage(username: string): Promise<string[]> {
  try {
    console.log('🔍 Scraping channel page for:', username);
    const channelUrl = `https://www.youtube.com/@${username}/videos`;
    
    const response = await axios.get(channelUrl, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.youtube.com/',
      },
      validateStatus: (status) => status < 500,
      maxRedirects: 5,
    });
    
    if (response.status !== 200) {
      console.log(`❌ Channel page returned status ${response.status}`);
      return [];
    }
    
    const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    if (!html || html.length < 1000) {
      console.log('❌ Channel page response too short');
      return [];
    }
    
    console.log(`📄 Channel page HTML length: ${html.length} characters`);
    
    // Extract video IDs from YouTube's JSON data embedded in the page
    const videoIds: Set<string> = new Set();
    
    // Pattern 1: Extract from ytInitialData JSON (most reliable)
    const ytInitialDataPatterns = [
      /var ytInitialData = ({.+?});/,
      /window\["ytInitialData"\] = ({.+?});/,
      /"ytInitialData":({.+?})/,
    ];
    
    for (const pattern of ytInitialDataPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        try {
          const ytData = JSON.parse(match[1]);
          // Navigate through the JSON structure to find video IDs
          const extractVideoIds = (obj: any, depth = 0): void => {
            if (depth > 10) return; // Prevent infinite recursion
            
            if (typeof obj === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(obj)) {
              videoIds.add(obj);
            } else if (typeof obj === 'object' && obj !== null) {
              if (obj.videoId && typeof obj.videoId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(obj.videoId)) {
                videoIds.add(obj.videoId);
              }
              if (obj.navigationEndpoint?.watchEndpoint?.videoId) {
                videoIds.add(obj.navigationEndpoint.watchEndpoint.videoId);
              }
              if (Array.isArray(obj)) {
                obj.forEach(item => extractVideoIds(item, depth + 1));
              } else {
                Object.values(obj).forEach(value => extractVideoIds(value, depth + 1));
              }
            }
          };
          extractVideoIds(ytData);
          console.log(`✅ Parsed ytInitialData, found ${videoIds.size} video IDs`);
          break;
        } catch (e: any) {
          console.log('Failed to parse ytInitialData:', e.message);
        }
      }
    }
    
    // Pattern 2: Extract from watch URLs in HTML
    const watchUrlPattern = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
    let match;
    while ((match = watchUrlPattern.exec(html)) !== null) {
      videoIds.add(match[1]);
    }
    
    // Pattern 3: Extract from /shorts/ URLs
    const shortsPattern = /\/shorts\/([a-zA-Z0-9_-]{11})/g;
    while ((match = shortsPattern.exec(html)) !== null) {
      videoIds.add(match[1]);
    }
    
    // Pattern 4: Extract from videoId in JSON-like structures
    const videoIdPattern = /"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/g;
    while ((match = videoIdPattern.exec(html)) !== null) {
      videoIds.add(match[1]);
    }
    
    // Pattern 5: Extract from gridVideoRenderer and videoRenderer
    const rendererPattern = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    while ((match = rendererPattern.exec(html)) !== null) {
      videoIds.add(match[1]);
    }
    
    console.log(`✅ Found ${videoIds.size} unique video IDs from page scraping`);
    
    if (videoIds.size === 0) {
      console.log('❌ No video IDs found in channel page');
      // Log a sample of the HTML for debugging
      const sample = html.substring(0, 1000);
      console.log('HTML sample:', sample);
    }
    
    // Convert to full YouTube URLs (limit to 20 most recent)
    const videos = Array.from(videoIds).slice(0, 20).map(id => `https://www.youtube.com/watch?v=${id}`);
    console.log(`📹 Returning ${videos.length} video URLs`);
    return videos;
  } catch (error: any) {
    console.error('❌ Channel page scraping error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    return [];
  }
}

async function fetchFromRSSFeed(rssUrl: string): Promise<string[]> {
  try {
    console.log('Fetching RSS feed:', rssUrl);
    
    const response = await axios.get(rssUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      validateStatus: (status) => status < 500, // Accept 404, etc.
    });
    
    if (response.status !== 200) {
      console.log(`RSS feed returned status ${response.status}`);
      return [];
    }
    
    const xmlText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    
    if (!xmlText || xmlText.length < 100) {
      console.log('RSS feed response too short or empty');
      return [];
    }
    
    console.log(`RSS feed response length: ${xmlText.length} characters`);
    
    // Extract video IDs from RSS XML - try multiple patterns
    const videoIds: Set<string> = new Set();
    
    // Pattern 1: <yt:videoId>VIDEO_ID</yt:videoId>
    const pattern1 = /<yt:videoId>([^<]+)<\/yt:videoId>/gi;
    let match;
    while ((match = pattern1.exec(xmlText)) !== null) {
      videoIds.add(match[1]);
    }
    
    // Pattern 2: youtube.com/watch?v=VIDEO_ID
    const pattern2 = /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/gi;
    while ((match = pattern2.exec(xmlText)) !== null) {
      videoIds.add(match[1]);
    }
    
    // Pattern 3: <link>https://www.youtube.com/watch?v=VIDEO_ID</link>
    const pattern3 = /<link>https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})<\/link>/gi;
    while ((match = pattern3.exec(xmlText)) !== null) {
      videoIds.add(match[1]);
    }
    
    // Pattern 4: <guid>https://www.youtube.com/watch?v=VIDEO_ID</guid>
    const pattern4 = /<guid>https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})<\/guid>/gi;
    while ((match = pattern4.exec(xmlText)) !== null) {
      videoIds.add(match[1]);
    }
    
    console.log(`Found ${videoIds.size} unique video IDs`);
    
    if (videoIds.size === 0) {
      console.log('No video IDs found in RSS feed. Sample of XML:', xmlText.substring(0, 500));
    }
    
    // Convert to full YouTube URLs
    return Array.from(videoIds).map(id => `https://www.youtube.com/watch?v=${id}`);
  } catch (error: any) {
    console.error('RSS feed fetch error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data?.substring?.(0, 200));
    }
    return [];
  }
}
