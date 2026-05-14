export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeMetadata } from '@/services/youtube';
import { getUserFromRequest } from '@/lib/auth';
import { isUnofficialScrapingAllowed, scrapingDisabledResponse } from '@/lib/policyGate';

/**
 * Diagnostic endpoint for YouTube metadata extraction.
 *
 * Restricted to super-admin to avoid leaking internal diagnostics (error
 * stacks, extractor state) to unauthenticated visitors, and additionally
 * gated by the policy-compliance kill switch.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = (authUser as any)?.role;
    if (role !== 'super-admin' && role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isUnofficialScrapingAllowed()) {
      return scrapingDisabledResponse('youtube');
    }

    const body = await request.json();
    const { youtubeUrl } = body;

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    try {
      const metadata = await extractYouTubeMetadata(youtubeUrl);
      return NextResponse.json({ success: true, metadata });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message, name: error.name },
        { status: 400 },
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
