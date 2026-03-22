import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const channels = await Channel.find({ userId: user.id }).sort({ createdAt: -1 });
        
        // Return without sensitive tokens
        const safeChannels = channels.map(c => ({
            _id: c._id,
            channelId: c.channelId,
            channelTitle: c.channelTitle,
            channelThumbnail: c.channelThumbnail,
            createdAt: c.createdAt
        }));

        return NextResponse.json({ channels: safeChannels });
    } catch (error: any) {
        console.error('Fetch channels error:', error);
        return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }
}
