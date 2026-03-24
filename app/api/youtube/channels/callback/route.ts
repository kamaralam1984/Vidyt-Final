export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(new URL('/dashboard/channels?error=no_code', request.url));
    }

    try {
        await connectDB();
        const authUser = await getUserFromRequest(request);
        
        if (!authUser) {
             return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
        }

        const { google } = await import('googleapis');
        
        const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectUri = `${baseUrl}/api/youtube/channels/callback`;

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        // 1. Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // 2. Fetch the connected channel's details using YouTube Data API
        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client
        });

        const channelResponse = await youtube.channels.list({
            part: ['snippet'],
            mine: true
        });

        const channelItem = channelResponse.data.items?.[0];

        if (!channelItem || !channelItem.id) {
            console.error('No channel found for the authenticated user');
            return NextResponse.redirect(new URL('/dashboard/channels?error=no_channel_found', request.url));
        }

        const channelId = channelItem.id;
        const channelTitle = channelItem.snippet?.title || 'Unknown Channel';
        const channelThumbnail = channelItem.snippet?.thumbnails?.default?.url || '';

        // 3. Upsert into database
        // We find by userId and channelId so if a user reconnects the same channel, we just update it.
        await Channel.findOneAndUpdate(
            { userId: authUser.id, channelId: channelId },
            {
                userId: authUser.id,
                channelId: channelId,
                channelTitle: channelTitle,
                channelThumbnail: channelThumbnail,
                accessToken: tokens.access_token,
                // Only update refresh token if a new one is provided (sometimes it's omitted if not prompted)
                ...(tokens.refresh_token && { refreshToken: tokens.refresh_token })
            },
            { upsert: true, new: true }
        );

        return NextResponse.redirect(new URL('/dashboard/channels?youtube=connected', request.url));
    } catch (error: any) {
        console.error('Multi-channel OAuth callback error:', error);
        return NextResponse.redirect(new URL('/dashboard/channels?error=auth_failed', request.url));
    }
}
