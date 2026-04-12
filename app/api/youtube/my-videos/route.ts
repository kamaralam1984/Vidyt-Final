export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const dbUser = await User.findById(user.id);

    if (!dbUser?.youtubeChannelId) {
      return NextResponse.json({ videos: [] });
    }

    // Fetch videos from YouTube API
    const accessToken = dbUser.youtubeAccessToken;
    if (!accessToken) {
      return NextResponse.json({ videos: [] });
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=50&order=date&key=${process.env.YOUTUBE_API_KEY}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ videos: [] });
    }

    const data = await response.json();

    const videos = data.items?.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.default.url,
      publishedAt: item.snippet.publishedAt,
    })) || [];

    return NextResponse.json({ videos });
  } catch (e: any) {
    console.error('Error fetching videos:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
