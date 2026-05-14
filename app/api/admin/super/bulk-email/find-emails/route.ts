export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

// Email-finder feature has been removed. Scraping public profiles for emails
// violates the YouTube Terms of Service ("Don't collect any data"), Meta
// Platform Terms, and most regional anti-spam laws (GDPR, CAN-SPAM).
// Use opt-in mailing lists collected via your own signup forms instead.

const DEPRECATION_NOTICE = {
  error: 'Feature removed',
  reason: 'Email harvesting from third-party platforms violates YouTube ToS, Meta Platform Terms, GDPR, and CAN-SPAM. Use opt-in lists from your own signup form instead.',
  alternative: 'Send marketing emails only to users who registered on vidyt.com.',
};

export async function POST() {
  return NextResponse.json(DEPRECATION_NOTICE, { status: 410 });
}

export async function GET() {
  return NextResponse.json(DEPRECATION_NOTICE, { status: 410 });
}
