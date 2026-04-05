export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getMainYoutubeOAuthRedirectUri } from '@/services/youtubeUpload';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        await connectDB();
        const authUser = await getUserFromRequest(request);
        
        console.log('YouTube Callback: authUser found:', !!authUser);

        if (!authUser) {
            console.warn('YouTube Callback: No authUser found in request. Redirecting to login?');
            return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
        }

        // Use a fresh client to avoid any state issues
        const { google } = await import('googleapis');
        
        const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = getMainYoutubeOAuthRedirectUri();

        const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        console.log('YouTube Callback: Exchanging code for tokens...');
        const { tokens } = await client.getToken(code);
        console.log('YouTube Callback: Tokens received successfully');
        console.log(tokens);

        // 1. Store tokens in user document
        const updatedUser = await User.findByIdAndUpdate(authUser.id, {
            youtube: {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
            }
        }, { new: true });

        console.log('YouTube Callback: User updated with tokens:', !!updatedUser);

        // 2. Discover and Sync Channels
        client.setCredentials(tokens);
        const youtube = google.youtube({ version: 'v3', auth: client });

        const channelRes = await youtube.channels.list({
            mine: true,
            part: ['snippet', 'statistics']
        });

        if (channelRes.data.items && channelRes.data.items.length > 0) {
            const Channel = (await import('@/models/Channel')).default;
            for (const item of channelRes.data.items) {
                await Channel.findOneAndUpdate(
                    { channelId: item.id },
                    {
                        userId: authUser.id,
                        channelTitle: item.snippet?.title || 'Unknown Channel',
                        channelThumbnail: item.snippet?.thumbnails?.default?.url || '',
                        accessToken: tokens.access_token!,
                        refreshToken: tokens.refresh_token!,
                        subscribers: parseInt(item.statistics?.subscriberCount || '0'),
                        totalViews: parseInt(item.statistics?.viewCount || '0'),
                        videoCount: parseInt(item.statistics?.videoCount || '0'),
                        lastSyncedAt: new Date()
                    },
                    { upsert: true, new: true }
                );
                console.log(`YouTube Callback: Synced channel ${item.snippet?.title}`);
                
                // 3. Trigger deep sync (Stats + Videos) in background
                const { syncChannelStats, importRecentVideos } = await import('@/lib/youtubeSync');
                syncChannelStats(item.id!).catch(e => console.error('Initial stat sync failed', e));
                importRecentVideos(item.id!).catch(e => console.error('Initial video import failed', e));
            }
        }

        // Redirect to dashboard with specific query param as requested
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/dashboard?youtube=connected`);
    } catch (error: any) {
        console.error('YouTube OAuth callback error:', error);
        // Log more details about the error if available
        if (error.response && error.response.data) {
            console.error('Error detail:', error.response.data);
        }
        return NextResponse.json({ error: 'Failed to complete YouTube authentication: ' + error.message }, { status: 500 });
    }
}
