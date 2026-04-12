export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageUrl } = body;
    
    if (!pageUrl) {
      return NextResponse.json({ error: 'Page URL is required' }, { status: 400 });
    }

    // Extract page identifier
    const pageId = extractPageId(pageUrl);
    
    if (!pageId) {
      return NextResponse.json(
        { error: 'Invalid Facebook page URL format' },
        { status: 400 }
      );
    }

    console.log('Facebook page video fetching requested for:', pageId);
    
    // Try to scrape Facebook page videos
    const videoUrls = await scrapeFacebookPageVideos(pageId);
    
    if (videoUrls.length > 0) {
      return NextResponse.json({
        success: true,
        videoUrls: videoUrls,
        count: videoUrls.length,
        message: `Found ${videoUrls.length} videos from Facebook page.`,
      });
    }
    
    // If scraping fails, return empty array with helpful message
    return NextResponse.json({
      success: false,
      videoUrls: [],
      count: 0,
      message: 'Facebook page videos could not be fetched automatically. Please use manual video URLs option.',
    });
  } catch (error: any) {
    console.error('Error fetching Facebook page videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Facebook page videos', details: error.message },
      { status: 500 }
    );
  }
}

// Scrape Facebook page to extract video links
async function scrapeFacebookPageVideos(pageId: string): Promise<string[]> {
  try {
    console.log('🔍 Scraping Facebook page for videos:', pageId);
    
    // Try different Facebook page URL formats
    const pageUrls = [
      `https://www.facebook.com/${pageId}/videos`,
      `https://www.facebook.com/${pageId}`,
      `https://m.facebook.com/${pageId}/videos`,
    ];
    
    const videoUrls: Set<string> = new Set();
    
    for (const pageUrl of pageUrls) {
      try {
        console.log(`Trying to scrape: ${pageUrl}`);
        
        const response = await axios.get(pageUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.facebook.com/',
          },
          validateStatus: (status) => status < 500,
          maxRedirects: 5,
        });
        
        if (response.status !== 200) {
          console.log(`❌ Page returned status ${response.status}`);
          continue;
        }
        
        const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        
        if (!html || html.length < 1000) {
          console.log('❌ Page response too short');
          continue;
        }
        
        console.log(`📄 Page HTML length: ${html.length} characters`);
        
        // Extract video URLs from HTML
        // Pattern 1: facebook.com/watch?v=VIDEO_ID
        const watchPattern = /facebook\.com\/watch\?v=(\d+)/g;
        let match;
        while ((match = watchPattern.exec(html)) !== null) {
          videoUrls.add(`https://www.facebook.com/watch?v=${match[1]}`);
        }
        
        // Pattern 2: fb.watch/VIDEO_ID
        const fbWatchPattern = /fb\.watch\/([A-Za-z0-9_-]+)/g;
        while ((match = fbWatchPattern.exec(html)) !== null) {
          videoUrls.add(`https://fb.watch/${match[1]}`);
        }
        
        // Pattern 3: facebook.com/VIDEO_ID
        const videoIdPattern = /facebook\.com\/(\d{15,})/g;
        while ((match = videoIdPattern.exec(html)) !== null) {
          videoUrls.add(`https://www.facebook.com/watch?v=${match[1]}`);
        }
        
        // Pattern 4: Look for video IDs in data attributes
        const dataVideoPattern = /data-video-id="(\d+)"/g;
        while ((match = dataVideoPattern.exec(html)) !== null) {
          videoUrls.add(`https://www.facebook.com/watch?v=${match[1]}`);
        }
        
        if (videoUrls.size > 0) {
          console.log(`✅ Found ${videoUrls.size} videos from ${pageUrl}`);
          break; // Stop if we found videos
        }
      } catch (scrapeError: any) {
        console.log(`❌ Error scraping ${pageUrl}:`, scrapeError.message);
        continue;
      }
    }
    
    const uniqueUrls = Array.from(videoUrls).slice(0, 20); // Limit to 20 videos
    console.log(`✅ Total unique videos found: ${uniqueUrls.length}`);
    
    return uniqueUrls;
  } catch (error: any) {
    console.error('❌ Error scraping Facebook page:', error);
    return [];
  }
}

function extractPageId(url: string): string | null {
  // Normalize URL - remove protocol and www
  let normalizedUrl = url.trim();
  normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');
  normalizedUrl = normalizedUrl.replace(/^www\./, '');
  
  // Extract page identifier from various formats
  const patterns = [
    /facebook\.com\/([^\/\?\s&]+)/,  // facebook.com/pagename
    /facebook\.com\/pages\/([^\/\?\s&]+)/,  // facebook.com/pages/pagename
    /facebook\.com\/([^\/\?\s&]+)\/videos/,  // facebook.com/pagename/videos
  ];

  for (const pattern of patterns) {
    const match = normalizedUrl.match(pattern);
    if (match && match[1]) {
      const pageId = match[1];
      console.log('Extracted page ID:', pageId);
      return pageId;
    }
  }

  console.log('Could not extract page ID from:', url);
  return null;
}
