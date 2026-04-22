export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP violation reporting endpoint.
 * Point `report-uri` and `report-to` CSP directives at /api/csp-report.
 * Accepts both `application/csp-report` and `application/reports+json`.
 * Logs to stderr — a downstream aggregator (Sentry, Datadog) can pick it up.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const body = await request.text();
    let report: unknown;
    try {
      report = JSON.parse(body);
    } catch {
      report = body;
    }

    console.warn('[csp-report]', {
      contentType,
      ua: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      report,
    });
  } catch (e) {
    console.error('[csp-report] parse error', e);
  }
  return new NextResponse(null, { status: 204 });
}
