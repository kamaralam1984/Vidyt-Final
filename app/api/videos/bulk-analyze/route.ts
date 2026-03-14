import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const MAX_BULK = 10;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const user = await User.findById(authUser.id).select('subscription').lean();
    if (user?.subscription !== 'enterprise' && user?.subscription !== 'pro') {
      return NextResponse.json({ error: 'Bulk analysis is available for Pro and Enterprise plans' }, { status: 403 });
    }
    const body = await request.json();
    const { urls, platform } = body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'urls array required' }, { status: 400 });
    }
    if (urls.length > MAX_BULK) {
      return NextResponse.json({ error: `Maximum ${MAX_BULK} URLs per request` }, { status: 400 });
    }
    const baseUrl = request.nextUrl.origin;
    const results: { url: string; success: boolean; videoId?: string; error?: string }[] = [];
    const apiRoute = platform === 'youtube' ? '/api/videos/youtube' : platform === 'facebook' ? '/api/videos/facebook' : platform === 'instagram' ? '/api/videos/instagram' : platform === 'tiktok' ? '/api/videos/tiktok' : '/api/videos/youtube';
    const token = request.headers.get('authorization') || '';

    for (const url of urls) {
      try {
        const res = await fetch(`${baseUrl}${apiRoute}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: token },
          body: JSON.stringify({
            youtubeUrl: platform === 'youtube' ? url : undefined,
            facebookUrl: platform === 'facebook' ? url : undefined,
            instagramUrl: platform === 'instagram' ? url : undefined,
            tiktokUrl: platform === 'tiktok' ? url : undefined,
            userId: authUser.id,
          }),
        });
        const data = await res.json();
        if (res.ok && data.video?.id) {
          results.push({ url, success: true, videoId: data.video.id });
        } else {
          results.push({ url, success: false, error: data.error || 'Analysis failed' });
        }
      } catch (e: any) {
        results.push({ url, success: false, error: e.message || 'Request failed' });
      }
    }

    return NextResponse.json({ success: true, results, processed: results.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bulk analyze failed' }, { status: 500 });
  }
}
