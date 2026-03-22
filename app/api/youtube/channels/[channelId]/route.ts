import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Channel from '@/models/Channel';

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ channelId: string }> | { channelId: string } }
) {
    try {
        await connectDB();
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Resolving params correctly as per Next.js 15+ constraints seen in project
        const resolvedParams = await Promise.resolve(context.params);
        const { channelId } = resolvedParams;

        if (!channelId) {
            return NextResponse.json({ error: 'Channel ID required' }, { status: 400 });
        }

        const deleted = await Channel.findOneAndDelete({
            userId: user.id,
            channelId: channelId
        });

        if (!deleted) {
            return NextResponse.json({ error: 'Channel not found or not owned by user' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Channel disconnected successfully' });
    } catch (error: any) {
        console.error('Delete channel error:', error);
        return NextResponse.json({ error: 'Failed to disconnect channel' }, { status: 500 });
    }
}
