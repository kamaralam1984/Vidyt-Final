export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getUserFromRequest } from '@/lib/auth';
import { getMainYoutubeOAuthRedirectUri } from '@/services/youtubeUpload';
import { generateToken } from '@/lib/auth-jwt';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

        const redirectUri = getMainYoutubeOAuthRedirectUri();

        if (!clientId || !clientSecret) {
             return NextResponse.json({ error: 'OAuth credentials not configured' }, { status: 500 });
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        const scopes = [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube.readonly'
        ];

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent', // Force consent to get refresh token
        });

        // Extend cookie lifetime to 30 minutes so the callback succeeds even if
        // the user takes time on the Google consent screen (default cookie is 15 min).
        const freshToken = await generateToken(user);
        const redirect = NextResponse.redirect(url);
        redirect.cookies.set('token', freshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 30, // 30 minutes — enough to cover consent screen wait
            path: '/',
        });

        return redirect;
    } catch (error) {
        console.error('Multi-channel OAuth initiation error:', error);
        return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 });
    }
}
