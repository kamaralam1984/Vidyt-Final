export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';

// Automated discovery of videos from a Facebook page has been disabled.
// Meta Platform Terms (Section 3.2.2) prohibit automated collection of
// data from Facebook without prior written permission. To list a page's
// videos, use the Graph API endpoint /{page-id}/videos with a Page Access
// Token granted by the page owner.

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      videoUrls: [],
      count: 0,
      error: 'Automated Facebook page discovery is disabled.',
      message:
        'Meta Platform Terms prohibit page scraping. Please paste individual public video URLs (facebook.com/watch?v=...) one at a time, or connect the page via the official Graph API.',
    },
    { status: 503 }
  );
}
