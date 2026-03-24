export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import { google } from 'googleapis';
import { Readable } from 'stream';
import connectDB from '@/lib/mongodb';



export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch the user to get the latest tokens
        const dbUser = await User.findById(user.id);
        if (!dbUser || !dbUser.youtube || !dbUser.youtube.access_token) {
            return NextResponse.json({
                error: 'YouTube not connected',
                needsAuth: true
            }, { status: 400 });
        }

        const formData = await request.formData();
        const videoFile = formData.get('video') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tags = formData.get('tags') as string || '';
        const privacyStatus = formData.get('privacyStatus') as 'public' | 'private' | 'unlisted' || 'public';
        const categoryId = formData.get('category') as string || '22';

        if (!videoFile) {
            return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
        }

        console.log("USER TOKENS:", dbUser.youtube);
        console.log("Uploading video...");

        // Setup YouTube client with token refresh listener
        const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback';
        
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        oauth2Client.setCredentials({
            access_token: dbUser.youtube.access_token,
            refresh_token: dbUser.youtube.refresh_token
        });

        oauth2Client.on('tokens', async (tokens) => {
            const updateData: any = {};
            if (tokens.access_token) updateData['youtube.access_token'] = tokens.access_token;
            if (tokens.refresh_token) updateData['youtube.refresh_token'] = tokens.refresh_token;
            if (tokens.expiry_date) updateData['youtube.expiry_date'] = new Date(tokens.expiry_date);
            
            if (Object.keys(updateData).length > 0) {
                await User.findByIdAndUpdate(dbUser._id, { $set: updateData });
                console.log('YouTube API: Automatic token refresh saved to MongoDB');
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

        console.log(`YouTube API: Starting upload for video: ${title}`);

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

        console.log(`YouTube API: Upload complete. Video ID: ${res.data.id}`);

        return NextResponse.json({
            success: true,
            videoId: res.data.id,
            videoUrl: `https://youtube.com/watch?v=${res.data.id}`
        });

    } catch (error: any) {
        console.error('YouTube upload API error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to upload video'
        }, { status: 500 });
    }
}
