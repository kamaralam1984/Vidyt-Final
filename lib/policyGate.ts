/**
 * Policy compliance gate for video-metadata endpoints.
 *
 * Why: YouTube ToS §III-E, Meta Platform Terms, Instagram ToS, and TikTok ToS
 * all prohibit scraping / unauthorized automated extraction. Our older code
 * paths use ytdl-core, yt-dlp, and HTML scraping of facebook.com / instagram.com,
 * which puts AdSense, Google Ads, Meta Business, and YouTube API access at risk
 * of revocation.
 *
 * This gate is OFF in production by default. Set
 *   ALLOW_UNOFFICIAL_VIDEO_SCRAPING=true
 * to re-enable (dev only, or once an alternative official-API flow is wired).
 */

import { NextResponse } from 'next/server';

export function isUnofficialScrapingAllowed(): boolean {
  if (process.env.ALLOW_UNOFFICIAL_VIDEO_SCRAPING === 'true') return true;
  if (process.env.NODE_ENV !== 'production') {
    return process.env.ALLOW_UNOFFICIAL_VIDEO_SCRAPING !== 'false';
  }
  return false;
}

export function scrapingDisabledResponse(platform: 'youtube' | 'facebook' | 'instagram' | 'tiktok') {
  const guidance: Record<string, string> = {
    youtube:
      'YouTube URL analysis via unofficial extraction is disabled to comply with the YouTube Terms of Service. Please connect your channel via Google OAuth so we can fetch metadata through the official YouTube Data API.',
    facebook:
      'Facebook video URL analysis is disabled to comply with Meta Platform Terms. Connect your Facebook Page via the official Meta Graph API to analyze videos you own.',
    instagram:
      'Instagram URL analysis is disabled to comply with Instagram Platform Policy. Connect a Business / Creator Instagram account via the official Instagram Graph API to analyze your own content.',
    tiktok:
      'TikTok URL analysis is disabled to comply with TikTok Terms of Service. Use the official TikTok for Developers API or upload the video file directly.',
  };
  return NextResponse.json(
    {
      success: false,
      error: 'feature_disabled_for_compliance',
      message: guidance[platform],
      docs: '/dmca',
    },
    { status: 503 },
  );
}
