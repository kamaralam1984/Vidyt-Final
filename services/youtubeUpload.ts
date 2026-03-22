import { google } from 'googleapis';
import { Stream } from 'stream';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

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
        process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/youtube/callback`
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
