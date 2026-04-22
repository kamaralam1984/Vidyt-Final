export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Video from '@/models/Video';
import Analysis from '@/models/Analysis';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const video = await Video.findById(params.id);
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    // Delete associated analysis if it exists
    if (video.analysisId) {
      await Analysis.findByIdAndDelete(video.analysisId);
    }
    
    // Delete the video
    await Video.findByIdAndDelete(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const video = await Video.findById(params.id).populate('analysisId');
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    const analysis = await Analysis.findOne({ videoId: video._id });
    
    return NextResponse.json({
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        views: video.views,
        hashtags: video.hashtags,
        uploadedAt: video.uploadedAt,
      },
      analysis: analysis ? {
        id: analysis._id,
        viralProbability: analysis.viralProbability,
        hookScore: analysis.hookScore,
        thumbnailScore: analysis.thumbnailScore,
        titleScore: analysis.titleScore,
        confidenceLevel: analysis.confidenceLevel,
        hookAnalysis: analysis.hookAnalysis,
        thumbnailAnalysis: analysis.thumbnailAnalysis,
        titleAnalysis: analysis.titleAnalysis,
        hashtags: analysis.hashtags,
        trendingTopics: analysis.trendingTopics,
        bestPostingTime: analysis.bestPostingTime,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
}
