export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

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

    if (!dbUser?.youtubeAccessToken) {
      return NextResponse.json(
        { error: 'YouTube access not connected' },
        { status: 401 }
      );
    }

    // Call YouTube API to update video
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/videos?part=snippet',
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${dbUser.youtubeAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: videoId,
          snippet: {
            title: title || undefined,
            description: description || undefined,
            tags: tags ? tags.split(',').map((t: string) => t.trim()) : undefined,
            categoryId: '22', // People & Blogs
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        {
          error: error.error?.message || 'Failed to update video',
          details: error,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Video updated successfully on YouTube',
      videoId,
      updated: {
        title: data.snippet?.title,
        description: data.snippet?.description,
        tags: data.snippet?.tags,
      },
    });
  } catch (e: any) {
    console.error('Error updating video:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to update video' },
      { status: 500 }
    );
  }
}
