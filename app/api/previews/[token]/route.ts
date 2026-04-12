import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Preview from '@/models/Preview';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    await connectDB();
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const preview = await Preview.findOne({ shareToken: token }).lean() as any;

    if (!preview) {
      return NextResponse.json({ error: 'Preview not found or invalid link.' }, { status: 404 });
    }

    // Check expiration
    if (preview.expiresAt && new Date() > new Date(preview.expiresAt)) {
      return NextResponse.json({ error: 'This preview link has expired.' }, { status: 410 });
    }

    return NextResponse.json({
      success: true,
      preview: {
        title: preview.title,
        description: preview.description,
        thumbnailUrl: preview.thumbnailUrl,
        videoUrl: preview.videoUrl,
        platform: preview.platform,
        status: preview.status,
        createdAt: preview.createdAt
      }
    });

  } catch (error: any) {
    console.error('Preview Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    await connectDB();
    const { token } = params;
    const { status, feedback } = await request.json();

    if (!['approved', 'rejected', 'commented'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const preview = await Preview.findOneAndUpdate(
      { shareToken: token },
      { 
        $set: { 
          status, 
          clientFeedback: feedback,
          updatedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!preview) {
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: preview.status
    });

  } catch (error: any) {
    console.error('Preview Update Error:', error);
    return NextResponse.json({ error: 'Failed to update preview status' }, { status: 500 });
  }
}
