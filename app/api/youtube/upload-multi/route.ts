export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { google } from 'googleapis';
import { Readable } from 'stream';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';



export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Apply Feature Guard
        const { checkFeatureAccess } = await import('@/lib/feature-guard');
        const access = await checkFeatureAccess('youtube', 'upload', user.subscription || 'free');
        if (!access.allowed) {
            return NextResponse.json({ error: access.reason || 'Feature forbidden' }, { status: 403 });
        }

        const formData = await request.formData();
        const channelId = formData.get('channelId') as string;
        const videoFile = formData.get('video') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tags = formData.get('tags') as string || '';
        const privacyStatus = formData.get('privacyStatus') as 'public' | 'private' | 'unlisted' || 'public';
        const categoryId = formData.get('category') as string || '22';

        if (!channelId) {
             return NextResponse.json({ error: 'No channel selected' }, { status: 400 });
        }

        if (!videoFile) {
            return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
        }

        // Reject files exceeding 500 MB before buffering
        if (videoFile.size > 500 * 1024 * 1024) {
            return NextResponse.json(
                { error: `File too large (${(videoFile.size / 1024 / 1024).toFixed(0)} MB). Maximum allowed size is 500 MB.` },
                { status: 413 }
            );
        }

        // Fetch the specific channel connected by this user
        const dbChannel = await Channel.findOne({ userId: user.id, channelId: channelId });
        if (!dbChannel || !dbChannel.accessToken) {
            return NextResponse.json({
                error: 'Channel not connected or unauthorized',
                needsAuth: true
            }, { status: 403 });
        }

        console.log(`Starting upload to channel: ${dbChannel.channelTitle} (${channelId})`);

        // Setup YouTube client with token refresh listener
        const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectUri = `${baseUrl}/api/youtube/channels/callback`;
        
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        oauth2Client.setCredentials({
            access_token: dbChannel.accessToken,
            refresh_token: dbChannel.refreshToken
        });

        // Listen for new tokens and update DB
        oauth2Client.on('tokens', async (tokens) => {
            const updateData: any = {};
            if (tokens.access_token) updateData.accessToken = tokens.access_token;
            if (tokens.refresh_token) updateData.refreshToken = tokens.refresh_token;
            
            if (Object.keys(updateData).length > 0) {
                await Channel.findByIdAndUpdate(dbChannel._id, { $set: updateData });
                console.log(`Updated tokens for channel ${dbChannel.channelTitle}`);
            }
        });

        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client
        });

        // Convert File to Stream for insertion
        const arrayBuffer = await videoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const videoStream = Readable.from(buffer);

        console.log(`Uploading video: ${title}`);

        const res = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title,
                    description,
                    tags: tags.split(',').map(s => s.trim()).filter(Boolean),
                    categoryId,
                },
                status: {
                    privacyStatus,
                },
            },
            media: {
                body: videoStream,
            },
        });

        console.log(`Upload complete. Video ID: ${res.data.id}`);

        return NextResponse.json({
            success: true,
            videoId: res.data.id,
            videoUrl: `https://youtube.com/watch?v=${res.data.id}`
        });

    } catch (error: any) {
        console.error('Multi-channel upload error:', error);
        
        const isAuthError = error.code === 401 || 
            error.message?.includes('invalid authentication') || 
            error.message?.includes('invalid_grant') || 
            error.message?.toLowerCase().includes('credentials');

        if (isAuthError) {
             return NextResponse.json({
                error: 'Authentication failed or expired. Please reconnect your selected YouTube account.',
                needsAuth: true
             }, { status: 401 });
        }

        return NextResponse.json({
            error: error.message || 'Failed to upload video to selected channel'
        }, { status: 500 });
    }
}
