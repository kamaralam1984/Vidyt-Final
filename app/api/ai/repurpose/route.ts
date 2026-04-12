import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { repurposeVideoContent } from '@/services/ai/contentCopilot';
import Video from '@/models/Video';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId, title, description, transcript, targetPlatform, customInstructions } = await request.json();

    let finalTitle = title;
    let finalDescription = description;
    let finalTranscript = transcript;

    // If videoId is provided, fetch details from DB
    if (videoId) {
      const video = await Video.findById(videoId).lean() as any;
      if (video) {
        finalTitle = video.title || title;
        finalDescription = video.description || description;
      }
    }

    if (!finalTitle || !finalDescription) {
      return NextResponse.json({ error: 'Title and description are required for repurposing.' }, { status: 400 });
    }

    if (!targetPlatform) {
      return NextResponse.json({ error: 'Target platform is required.' }, { status: 400 });
    }

    console.log(`[RepurposeAPI] Repurposing content for ${targetPlatform}: ${finalTitle}`);

    const result = await repurposeVideoContent(
      finalTitle,
      finalDescription,
      finalTranscript,
      targetPlatform,
      customInstructions
    );

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('Repurpose API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to repurpose content' }, { status: 500 });
  }
}
