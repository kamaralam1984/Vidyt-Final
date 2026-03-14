import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeMetadata } from '@/services/youtube';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { youtubeUrl } = body;
    
    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }
    
    console.log('Testing YouTube URL:', youtubeUrl);
    
    try {
      const metadata = await extractYouTubeMetadata(youtubeUrl);
      return NextResponse.json({
        success: true,
        metadata,
      });
    } catch (error: any) {
      console.error('YouTube extraction error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        stack: error.stack,
        name: error.name,
      }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack,
    }, { status: 500 });
  }
}
