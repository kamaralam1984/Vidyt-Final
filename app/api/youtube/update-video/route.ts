export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { google } from 'googleapis';
import connectDB from '@/lib/mongodb';
import { getMainYoutubeOAuthRedirectUri } from '@/services/youtubeUpload';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await User.findById(user.id);
        if (!dbUser || !dbUser.youtube?.access_token || !dbUser.youtube?.refresh_token) {
            return NextResponse.json(
                { error: 'YouTube not connected', needsAuth: true }, 
                { status: 400 }
            );
        }

        const body = await request.json();
        const { videoId, title, description, keywords } = body;

        if (!videoId || !title) {
            return NextResponse.json({ error: 'Video ID and title are required' }, { status: 400 });
        }

        const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            getMainYoutubeOAuthRedirectUri()
        );

        oauth2Client.setCredentials({
            access_token: dbUser.youtube.access_token,
            refresh_token: dbUser.youtube.refresh_token,
        });

        // Ensure token refresh hooks are registered to update mongo if needed
        oauth2Client.on('tokens', async (tokens) => {
            const updateData: Record<string, unknown> = {};
            if (tokens.access_token) updateData['youtube.access_token'] = tokens.access_token;
            if (tokens.refresh_token) updateData['youtube.refresh_token'] = tokens.refresh_token;
            if (tokens.expiry_date) updateData['youtube.expiry_date'] = new Date(tokens.expiry_date);

            if (Object.keys(updateData).length > 0) {
                await User.findByIdAndUpdate(dbUser._id, { $set: updateData });
            }
        });

        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        // Step 1: Get existing categoryId to satisfy YouTube's API requirement for snippets
        const existing = await youtube.videos.list({ part: ['snippet'], id: [videoId] });
        if (!existing.data.items || existing.data.items.length === 0) {
            return NextResponse.json({ error: 'Video not found on your linked YouTube channel.' }, { status: 404 });
        }
        
        const snippet = existing.data.items[0].snippet;
        const categoryId = snippet?.categoryId || '22';

        // Step 2: Update the snippet
        await youtube.videos.update({
            part: ['snippet'],
            requestBody: {
                id: videoId,
                snippet: {
                    title,
                    description,
                    tags: keywords ? String(keywords).split(',').map(s => s.trim()).filter(Boolean) : [],
                    categoryId
                }
            }
        });

        return NextResponse.json({ success: true, message: 'Video updated successfully' });

    } catch (error: any) {
        console.error('YouTube update API error:', error);
        
        const errorString = String(error?.message || '').toLowerCase();
        const fullErrorString = JSON.stringify(error || {}).toLowerCase();
        
        const isAuthError = 
            error?.code === 401 || 
            error?.code === '401' ||
            error?.status === 401 ||
            error?.response?.status === 401 ||
            errorString.includes('invalid authentication') || 
            errorString.includes('invalid_grant') || 
            errorString.includes('credentials') ||
            fullErrorString.includes('invalid authentication') ||
            fullErrorString.includes('credentials');

        if (isAuthError) {
             return NextResponse.json({
                error: 'Authentication failed or expired. Please reconnect your YouTube account.',
                needsAuth: true
             }, { status: 401 });
        }

        return NextResponse.json({ error: error.message || 'Failed to update video' }, { status: 500 });
    }
}
