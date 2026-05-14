export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

// The email-finder feature has been removed for compliance with
// platform Terms of Service and anti-spam regulation. Bulk export of
// harvested third-party emails is no longer permitted.

export async function GET() {
  return NextResponse.json(
    {
      error: 'Feature removed',
      reason: 'Exporting scraped third-party emails is no longer permitted for compliance reasons.',
    },
    { status: 410 }
  );
}
