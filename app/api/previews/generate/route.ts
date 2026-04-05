import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Preview from '@/models/Preview';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      workspaceId, 
      title, 
      description, 
      thumbnailUrl, 
      videoUrl, 
      platform,
      expiresInDays = 7 
    } = await request.json();

    if (!workspaceId || !title || !platform) {
      return NextResponse.json({ error: 'WorkspaceId, Title, and Platform are required.' }, { status: 400 });
    }

    // Check if user is a member of the workspace (simplified for now)
    // In production, verify WorkspaceMember role
    
    const shareToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const preview = new Preview({
      workspaceId,
      creatorId: user.id,
      title,
      description,
      thumbnailUrl,
      videoUrl,
      platform,
      shareToken,
      status: 'pending_approval',
      expiresAt
    });

    await preview.save();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vidyt.com';
    const previewUrl = `${baseUrl}/preview/${shareToken}`;

    return NextResponse.json({
      success: true,
      previewId: preview._id,
      previewUrl,
      shareToken,
      expiresAt
    });

  } catch (error: any) {
    console.error('Preview Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate preview' }, { status: 500 });
  }
}
