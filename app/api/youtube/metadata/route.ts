export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { extractYouTubeMetadata } from '@/services/youtube';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    console.log('Extracting metadata for YouTube URL:', url);

    try {
      const metadata = await extractYouTubeMetadata(url);
      return NextResponse.json({
        title: metadata.title,
        description: metadata.description,
        duration: metadata.duration,
        thumbnailUrl: metadata.thumbnailUrl,
        views: metadata.views,
        hashtags: metadata.hashtags,
      });
    } catch (error: any) {
      console.error('Metadata extraction error:', error.message);
      return NextResponse.json(
        { error: error.message || 'Failed to extract video metadata' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
