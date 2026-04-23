export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

async function assertSuperAdmin(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) throw new Error('Unauthorized');
  const role = String(user.role || '').toLowerCase().replace(/_/g, '-');
  if (role !== 'super-admin' && role !== 'superadmin') throw new Error('Forbidden');
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

function extractEmails(text: string): string[] {
  if (!text) return [];
  const found = text.match(EMAIL_REGEX) || [];
  // Filter out placeholder/example emails and image filenames
  return [...new Set(found.filter(e =>
    !e.includes('example.') &&
    !e.endsWith('.png') &&
    !e.endsWith('.jpg') &&
    !e.endsWith('.jpeg') &&
    !e.endsWith('.gif') &&
    !e.includes('sentry') &&
    !e.includes('noreply') &&
    e.length < 100
  ))];
}

// ── YouTube ────────────────────────────────────────────────────────────────────
async function findYouTubeEmails(keyword: string, maxResults = 100) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { results: [], error: 'YOUTUBE_API_KEY not configured' };

  const results: any[] = [];
  let pageToken: string | undefined;
  const seenEmails = new Set<string>();

  try {
    while (results.length < maxResults) {
      // Search for channels
      const searchParams = new URLSearchParams({
        part: 'snippet',
        type: 'channel',
        q: keyword,
        maxResults: '50',
        key: apiKey,
        ...(pageToken ? { pageToken } : {}),
      });
      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams}`);
      const searchData = await searchRes.json();

      if (searchData.error) return { results, error: searchData.error.message };
      if (!searchData.items?.length) break;

      const channelIds = searchData.items
        .map((item: any) => item.id?.channelId || item.snippet?.channelId)
        .filter(Boolean);

      if (!channelIds.length) break;

      // Fetch channel details (description + brandingSettings)
      const chParams = new URLSearchParams({
        part: 'snippet,statistics,brandingSettings',
        id: channelIds.join(','),
        key: apiKey,
      });
      const chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?${chParams}`);
      const chData = await chRes.json();

      for (const ch of chData.items || []) {
        const description = ch.snippet?.description || '';
        const keywords = ch.brandingSettings?.channel?.keywords || '';
        const unsubscribedTrailer = ch.brandingSettings?.channel?.unsubscribedTrailer || '';
        const combined = `${description} ${keywords} ${unsubscribedTrailer}`;

        const emails = extractEmails(combined);
        const subs = ch.statistics?.subscriberCount;

        for (const email of emails) {
          if (seenEmails.has(email)) continue;
          seenEmails.add(email);
          results.push({
            email,
            name: ch.snippet?.title || '',
            platform: 'youtube',
            followers: subs ? Number(subs) : null,
            profileUrl: `https://www.youtube.com/channel/${ch.id}`,
            country: ch.snippet?.country || null,
          });
          if (results.length >= maxResults) break;
        }
        if (results.length >= maxResults) break;
      }

      pageToken = searchData.nextPageToken;
      if (!pageToken || results.length >= maxResults) break;
    }

    return { results, error: null };
  } catch (err: any) {
    return { results, error: err.message };
  }
}

// ── Google Business / Places ───────────────────────────────────────────────────
async function findGoogleBusinessEmails(keyword: string, location: string, maxResults = 100) {
  const apiKey = process.env.YOUTUBE_API_KEY; // same GCP key; user may need to enable Places API
  if (!apiKey) return { results: [], error: 'Google API key not configured' };

  const results: any[] = [];
  const seenEmails = new Set<string>();

  try {
    const query = location ? `${keyword} in ${location}` : keyword;
    let pagetoken: string | undefined;

    while (results.length < maxResults) {
      const params = new URLSearchParams({
        query,
        key: apiKey,
        ...(pagetoken ? { pagetoken } : {}),
      });
      const searchRes = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`);
      const searchData = await searchRes.json();

      if (searchData.status === 'REQUEST_DENIED' || searchData.status === 'INVALID_REQUEST') {
        return { results, error: `Google Places API: ${searchData.error_message || searchData.status}. Enable Places API in Google Cloud Console.` };
      }

      if (!searchData.results?.length) break;

      for (const place of searchData.results) {
        // Get Place Details for more contact info
        const detailsParams = new URLSearchParams({
          place_id: place.place_id,
          fields: 'name,formatted_phone_number,website,editorial_summary,url,formatted_address,rating,user_ratings_total',
          key: apiKey,
        });
        const detailRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${detailsParams}`);
        const detailData = await detailRes.json();
        const detail = detailData.result || {};

        // Try extracting email from editorial_summary (rare but possible)
        const summary = detail.editorial_summary?.overview || '';
        const possibleEmails = extractEmails(summary);

        if (possibleEmails.length > 0) {
          for (const email of possibleEmails) {
            if (seenEmails.has(email)) continue;
            seenEmails.add(email);
            results.push({
              email,
              name: detail.name || place.name,
              platform: 'google_business',
              profileUrl: detail.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
              website: detail.website || null,
              address: detail.formatted_address || null,
              phone: detail.formatted_phone_number || null,
              rating: detail.rating || null,
            });
            if (results.length >= maxResults) break;
          }
        } else {
          // No email found but still include the business (email: null) so user sees it
          results.push({
            email: null,
            name: detail.name || place.name,
            platform: 'google_business',
            profileUrl: detail.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            website: detail.website || null,
            address: detail.formatted_address || null,
            phone: detail.formatted_phone_number || null,
            rating: detail.rating || null,
          });
        }
        if (results.length >= maxResults) break;
      }

      pagetoken = searchData.next_page_token;
      if (!pagetoken || results.length >= maxResults) break;
      // Places API requires a short delay before using next_page_token
      await new Promise(r => setTimeout(r, 2000));
    }

    return { results, error: null };
  } catch (err: any) {
    return { results, error: err.message };
  }
}

// ── Facebook Pages ─────────────────────────────────────────────────────────────
async function findFacebookEmails(keyword: string, maxResults = 100) {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    return {
      results: [],
      error: 'FACEBOOK_APP_ID and FACEBOOK_APP_SECRET not configured. Add them to .env.local.',
    };
  }

  const results: any[] = [];
  try {
    // Get app access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return { results: [], error: `Facebook token error: ${tokenData.error?.message || 'Unknown'}` };
    }
    const token = tokenData.access_token;
    const seenEmails = new Set<string>();

    const searchParams = new URLSearchParams({
      type: 'page',
      q: keyword,
      fields: 'name,emails,website,fan_count,about,category',
      limit: '100',
      access_token: token,
    });

    const searchRes = await fetch(`https://graph.facebook.com/v21.0/search?${searchParams}`);
    const searchData = await searchRes.json();

    if (searchData.error) return { results, error: searchData.error.message };

    for (const page of searchData.data || []) {
      const emails: string[] = page.emails || [];
      const aboutEmails = extractEmails(page.about || '');
      const allEmails = [...new Set([...emails, ...aboutEmails])];

      if (allEmails.length > 0) {
        for (const email of allEmails) {
          if (seenEmails.has(email) || results.length >= maxResults) continue;
          seenEmails.add(email);
          results.push({
            email,
            name: page.name,
            platform: 'facebook',
            profileUrl: `https://www.facebook.com/${page.id}`,
            followers: page.fan_count || null,
            category: page.category || null,
          });
        }
      }
      if (results.length >= maxResults) break;
    }

    return { results, error: null };
  } catch (err: any) {
    return { results, error: err.message };
  }
}

// ── Instagram (Meta Business Discovery) ───────────────────────────────────────
async function findInstagramEmails(keyword: string, maxResults = 100) {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const igPageId = process.env.INSTAGRAM_PAGE_ID; // FB Page ID linked to your IG Business account

  if (!appId || !appSecret) {
    return {
      results: [],
      error: 'FACEBOOK_APP_ID and FACEBOOK_APP_SECRET not configured. Add them to .env.local.',
    };
  }
  if (!igPageId) {
    return {
      results: [],
      error: 'INSTAGRAM_PAGE_ID not configured. Add your Facebook Page ID linked to Instagram Business account.',
    };
  }

  try {
    // Get user access token via app token (for Business Discovery you need a user token)
    // Business Discovery requires a Page Access Token — scaffold only, show instructions
    return {
      results: [],
      error: 'Instagram Business Discovery requires a Page Access Token with instagram_manage_insights permission. Configure INSTAGRAM_USER_TOKEN in .env.local after Meta App review.',
    };
  } catch (err: any) {
    return { results: [], error: err.message };
  }
}

// ── Main Handler ───────────────────────────────────────────────────────────────
// POST /api/admin/super/bulk-email/find-emails
// body: { platform: 'youtube'|'google'|'facebook'|'instagram', keyword, location?, maxResults? }
export async function POST(req: NextRequest) {
  try {
    await assertSuperAdmin(req);
    const { platform, keyword, location, maxResults = 100 } = await req.json();

    if (!keyword?.trim()) return NextResponse.json({ error: 'keyword required' }, { status: 400 });
    const limit = Math.min(Math.max(Number(maxResults) || 100, 1), 100);

    let data: { results: any[]; error: string | null };

    switch (platform) {
      case 'youtube':
        data = await findYouTubeEmails(keyword.trim(), limit);
        break;
      case 'google':
        data = await findGoogleBusinessEmails(keyword.trim(), location?.trim() || '', limit);
        break;
      case 'facebook':
        data = await findFacebookEmails(keyword.trim(), limit);
        break;
      case 'instagram':
        data = await findInstagramEmails(keyword.trim(), limit);
        break;
      default:
        return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    const status = err.message === 'Unauthorized' ? 401 : err.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
