import { google } from 'googleapis';
import { Stream } from 'stream';

/**
 * Single source of truth for the main YouTube OAuth redirect.
 * Must match Google Cloud Console "Authorized redirect URIs" and `/api/youtube/callback`.
 */
export function getMainYoutubeOAuthRedirectUri(): string {
  const fromEnv = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  return `${base}/api/youtube/callback`;
}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET;
const REDIRECT_URI = getMainYoutubeOAuthRedirectUri();

export const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export interface YouTubeUploadParams {
    title: string;
    description: string;
    tags: string[];
    category: string;
    videoStream: Stream;
    privacyStatus?: 'public' | 'private' | 'unlisted';
}

/**
 * Uploads a video to YouTube using the provided access token.
 */
export async function uploadVideo(accessToken: string, params: YouTubeUploadParams) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({ version: 'v3', auth });

    const res = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: params.title,
                description: params.description,
                tags: params.tags,
                categoryId: params.category, // Note: This should be a numeric ID (e.g., '22' for People & Blogs)
            },
            status: {
                privacyStatus: params.privacyStatus || 'public',
            },
        },
        media: {
            body: params.videoStream,
        },
    });

    return res.data;
}

/**
 * Refreshes the Google OAuth access token using the refresh token.
 */
export async function refreshAccessToken(refreshToken: string) {
    oauth2Client.setCredentials({ 
        refresh_token: refreshToken,
        token_type: 'Bearer' // Ensure token type is set
    });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
}

/**
 * Returns a configured YouTube instance with optional token refresh listener.
 */
export async function getYouTubeClient(credentials: { access_token?: string | null, refresh_token?: string | null }, onTokens?: (tokens: any) => void) {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET,
        getMainYoutubeOAuthRedirectUri()
    );

    auth.setCredentials(credentials);

    if (onTokens) {
        auth.on('tokens', (tokens) => {
            console.log('YouTube Service: New tokens received', !!tokens.access_token);
            onTokens(tokens);
        });
    }

    return google.youtube({ version: 'v3', auth });
}
/**
 * High-level function for background worker to upload a scheduled post.
 */
export async function uploadScheduledPost(userId: string, post: any) {
    const user = await (await import('@/models/User')).default.findById(userId);
    if (!user || !user.youtube || !user.youtube.refresh_token) {
        throw new Error('User YouTube account not linked or refresh token missing');
    }

    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET,
        getMainYoutubeOAuthRedirectUri()
    );

    auth.setCredentials({
        access_token: user.youtube.access_token,
        refresh_token: user.youtube.refresh_token,
        expiry_date: user.youtube.expiry_date ? new Date(user.youtube.expiry_date).getTime() : undefined,
    });

    // Auto-save refreshed tokens
    auth.on('tokens', async (tokens) => {
        const update: any = {};
        if (tokens.access_token) update['youtube.access_token'] = tokens.access_token;
        if (tokens.refresh_token) update['youtube.refresh_token'] = tokens.refresh_token;
        if (tokens.expiry_date) update['youtube.expiry_date'] = new Date(tokens.expiry_date);
        
        await (await import('@/models/User')).default.findByIdAndUpdate(userId, { $set: update });
    });

    const youtube = google.youtube({ version: 'v3', auth });

    // Handle local file vs remote URL
    const fs = await import('fs');
    const path = await import('path');
    let videoFilePath = post.videoUrl || '';
    if (videoFilePath.startsWith('/')) {
        videoFilePath = path.join(process.cwd(), 'public', videoFilePath);
    }

    if (!fs.existsSync(videoFilePath)) {
        throw new Error(`Video file not found: ${videoFilePath}`);
    }

    const res = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: post.title,
                description: post.description || '',
                tags: post.hashtags || [],
                categoryId: '22',
            },
            status: {
                privacyStatus: 'public',
                selfDeclaredMadeForKids: false,
            },
        },
        media: {
            body: fs.createReadStream(videoFilePath),
        },
    });

    return {
        youtubeId: res.data.id,
        link: `https://www.youtube.com/watch?v=${res.data.id}`,
        status: res.data.status?.privacyStatus,
    };
}
