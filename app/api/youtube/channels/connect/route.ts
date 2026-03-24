export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
        
        // Use a new callback URI specifically for multiple channels 
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectUri = `${baseUrl}/api/youtube/channels/callback`;

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
            prompt: 'consent' // Force consent to get refresh token
        });

        return NextResponse.redirect(url);
    } catch (error) {
        console.error('Multi-channel OAuth initiation error:', error);
        return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 });
    }
}
