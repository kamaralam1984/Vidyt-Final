export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { oauth2Client } from '@/services/youtubeUpload';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tokens } = await oauth2Client.getToken(code);

        // Store tokens in user document
        await User.findByIdAndUpdate(user.id, {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined
        });

        // Redirect back to the dashboard with a success message
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/dashboard/youtube-seo?auth=success`);
    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.json({ error: 'Failed to complete OAuth' }, { status: 500 });
    }
}
