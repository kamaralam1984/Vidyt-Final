export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Video from '@/models/Video';
import ViralPrediction from '@/models/ViralPrediction';
import EngagementMetrics from '@/models/EngagementMetrics';
import Channel from '@/models/Channel';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get user data
    const user = await User.findById(authUser.id).select('-password -deletionRequestCode').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get videos
    const videos = await Video.find({ userId: authUser.id }).lean();

    // Get viral predictions
    const predictions = await ViralPrediction.find({ userId: authUser.id }).lean();

    // Get engagement metrics
    const metrics = await EngagementMetrics.find({ userId: authUser.id }).lean();

    // Get channels
    const channels = await Channel.find({ userId: authUser.id }).lean();

    // Compile all user data
    const userData = {
      exportDate: new Date().toISOString(),
      userProfile: {
        ...user,
        password: '[REDACTED]',
      },
      videos: videos || [],
      viralPredictions: predictions || [],
      engagementMetrics: metrics || [],
      connectedChannels: channels || [],
      summary: {
        totalVideos: videos?.length || 0,
        totalPredictions: predictions?.length || 0,
        totalMetricsRecords: metrics?.length || 0,
        totalChannels: channels?.length || 0,
      },
    };

    // Create JSON file
    const jsonString = JSON.stringify(userData, null, 2);
    
    // Return as downloadable file
    const response = new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="viralboost-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

    console.log(`✅ Data export generated for user: ${authUser.id}`);

    return response;
  } catch (error: any) {
    console.error('Data export error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to export data',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { format = 'json' } = body;

    await connectDB();

    const user = await User.findById(authUser.id).select('-password -deletionRequestCode').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const videos = await Video.find({ userId: authUser.id }).lean();
    const predictions = await ViralPrediction.find({ userId: authUser.id }).lean();
    const metrics = await EngagementMetrics.find({ userId: authUser.id }).lean();
    const channels = await Channel.find({ userId: authUser.id }).lean();

    const userData = {
      exportDate: new Date().toISOString(),
      userProfile: user,
      videos,
      viralPredictions: predictions,
      engagementMetrics: metrics,
      connectedChannels: channels,
    };

    if (format === 'csv') {
      // Convert to CSV format for videos
      let csvContent = 'Title,Description,Duration,Views,Engagement,ViralScore\n';
      videos?.forEach(video => {
        csvContent += `"${video.title || ''}","${video.description || ''}",${video.duration || 0},${video.views || 0},${video.engagement || 0},${video.viralScore || 0}\n`;
      });

      const response = new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="vidyt-videos-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

      console.log(`✅ CSV data export generated for user: ${authUser.id}`);
      return response;
    }

    // Default JSON format
    const jsonString = JSON.stringify(userData, null, 2);
    const response = new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="viralboost-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

    console.log(`✅ Data export generated for user: ${authUser.id}`);
    return response;
  } catch (error: any) {
    console.error('Data export error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to export data',
      },
      { status: 500 }
    );
  }
}
