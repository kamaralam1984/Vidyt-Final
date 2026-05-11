export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { google } from 'googleapis';
import { getMainYoutubeOAuthRedirectUri } from '@/services/youtubeUpload';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId, title, description, tags } = await request.json();

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
    }

    await connectDB();
    const dbUser = await User.findById(user.id);

    if (!dbUser?.youtube?.access_token || !dbUser?.youtube?.refresh_token) {
      return NextResponse.json(
        { error: 'YouTube account not connected. Please connect your YouTube account.', needsAuth: true },
        { status: 401 }
      );
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

    // Auto-save refreshed tokens back to DB
    oauth2Client.on('tokens', async (tokens) => {
      const update: Record<string, unknown> = {};
      if (tokens.access_token) update['youtube.access_token'] = tokens.access_token;
      if (tokens.refresh_token) update['youtube.refresh_token'] = tokens.refresh_token;
      if (tokens.expiry_date) update['youtube.expiry_date'] = new Date(tokens.expiry_date);
      if (Object.keys(update).length > 0) {
        await User.findByIdAndUpdate(dbUser._id, { $set: update });
      }
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Fetch existing categoryId (required by YouTube API)
    const existing = await youtube.videos.list({ part: ['snippet'], id: [videoId] });
    if (!existing.data.items?.length) {
      return NextResponse.json({ error: 'Video not found on your YouTube channel.' }, { status: 404 });
    }
    const categoryId = existing.data.items[0].snippet?.categoryId || '22';

    const updated = await youtube.videos.update({
      part: ['snippet'],
      requestBody: {
        id: videoId,
        snippet: {
          title: title || existing.data.items[0].snippet?.title || '',
          description: description ?? existing.data.items[0].snippet?.description ?? '',
          tags: tags ? String(tags).split(',').map((t: string) => t.trim()).filter(Boolean) : (existing.data.items[0].snippet?.tags || []),
          categoryId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Video updated successfully on YouTube',
      videoId,
      updated: {
        title: updated.data.snippet?.title,
        description: updated.data.snippet?.description,
        tags: updated.data.snippet?.tags,
      },
    });
  } catch (e: any) {
    console.error('Error updating video metadata:', e);

    const msg = String(e?.message || JSON.stringify(e) || '').toLowerCase();
    const isAuth =
      e?.code === 401 ||
      e?.response?.status === 401 ||
      msg.includes('invalid authentication') ||
      msg.includes('invalid_grant') ||
      msg.includes('credentials') ||
      msg.includes('unauthorized');

    if (isAuth) {
      return NextResponse.json(
        { error: 'YouTube authentication expired. Please reconnect your YouTube account.', needsAuth: true },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: e.message || 'Failed to update video' }, { status: 500 });
  }
}
