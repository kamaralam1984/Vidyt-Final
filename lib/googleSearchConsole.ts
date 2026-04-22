/**
 * Google Search Console API wrapper.
 *
 * Auth: service account JSON stored in env (GSC_SERVICE_ACCOUNT_JSON,
 * base64 or raw JSON). The service account email must be added as an
 * owner/user of the Search Console property at
 * https://search.google.com/search-console/users.
 *
 * Graceful fallback: if creds are missing or API fails, every exported
 * function returns an empty result + `connected: false` so the admin UI
 * can render "GSC not connected" instead of crashing.
 */

import { google, searchconsole_v1 } from 'googleapis';

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:vidyt.com';

interface GSCQueryRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPageStats {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;          // 0-1 (multiply by 100 for %)
  position: number;
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topCountries: { country: string; clicks: number; impressions: number }[];
}

export interface GSCSiteStats {
  connected: boolean;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  topQueries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
  topPages: { url: string; clicks: number; impressions: number; ctr: number; position: number }[];
  indexedCount?: number;
  nonIndexedCount?: number;
  error?: string;
}

let clientPromise: Promise<searchconsole_v1.Searchconsole | null> | null = null;

function getClient(): Promise<searchconsole_v1.Searchconsole | null> {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
    if (!raw) return null;
    try {
      // Accept base64-encoded or raw JSON
      let jsonStr = raw.trim();
      if (!jsonStr.startsWith('{')) {
        jsonStr = Buffer.from(jsonStr, 'base64').toString('utf8');
      }
      const creds = JSON.parse(jsonStr);
      const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      });
      return google.searchconsole({ version: 'v1', auth });
    } catch (e) {
      console.error('[GSC] Failed to init service account:', e);
      return null;
    }
  })();
  return clientPromise;
}

export function isGscConfigured(): boolean {
  return !!process.env.GSC_SERVICE_ACCOUNT_JSON;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Aggregate stats for the whole site over the last `days` days.
 * Used on the dashboard header.
 */
export async function getSiteStats(days: number = 28): Promise<GSCSiteStats> {
  const empty: GSCSiteStats = {
    connected: false,
    totalClicks: 0,
    totalImpressions: 0,
    avgCtr: 0,
    avgPosition: 0,
    topQueries: [],
    topPages: [],
  };

  const client = await getClient();
  if (!client) return { ...empty, error: 'GSC not configured (set GSC_SERVICE_ACCOUNT_JSON)' };

  const startDate = isoDaysAgo(days);
  const endDate = isoDaysAgo(0);

  try {
    const [totalsRes, queriesRes, pagesRes] = await Promise.all([
      client.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: { startDate, endDate, rowLimit: 1 },
      }),
      client.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 25 },
      }),
      client.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: { startDate, endDate, dimensions: ['page'], rowLimit: 25 },
      }),
    ]);

    const totals = (totalsRes.data.rows?.[0] as GSCQueryRow | undefined) || null;
    const queries = (queriesRes.data.rows as GSCQueryRow[] | undefined) || [];
    const pages = (pagesRes.data.rows as GSCQueryRow[] | undefined) || [];

    return {
      connected: true,
      totalClicks: totals?.clicks || 0,
      totalImpressions: totals?.impressions || 0,
      avgCtr: totals?.ctr || 0,
      avgPosition: totals?.position || 0,
      topQueries: queries.map(r => ({
        query: r.keys[0] || '',
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      topPages: pages.map(r => ({
        url: r.keys[0] || '',
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
    };
  } catch (e: any) {
    console.error('[GSC] getSiteStats failed:', e?.message);
    return { ...empty, error: e?.message || 'GSC API error' };
  }
}

/**
 * Batch fetch GSC metrics for many pages at once. Returns a map
 * keyed by pathname (e.g. "/k/my-keyword") → { clicks, impressions, ctr, position }.
 *
 * One API call covers all pages — we filter the result client-side.
 * Cheap enough to call on every table render.
 */
export async function getPageStatsBatch(
  pathnames: string[],
  days: number = 28
): Promise<Map<string, { clicks: number; impressions: number; ctr: number; position: number }>> {
  const out = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
  if (pathnames.length === 0) return out;

  const client = await getClient();
  if (!client) return out;

  const startDate = isoDaysAgo(days);
  const endDate = isoDaysAgo(0);

  try {
    const res = await client.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 25000,
      },
    });
    const rows = (res.data.rows as GSCQueryRow[] | undefined) || [];
    const want = new Set(pathnames);
    for (const r of rows) {
      const full = r.keys[0] || '';
      try {
        const pathname = new URL(full).pathname;
        if (want.has(pathname)) {
          out.set(pathname, {
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: r.ctr,
            position: r.position,
          });
        }
      } catch { /* skip malformed */ }
    }
  } catch (e: any) {
    console.error('[GSC] getPageStatsBatch failed:', e?.message);
  }
  return out;
}

/**
 * Detailed stats for one page — top queries ranking for it + country breakdown.
 */
export async function getPageDetail(pathname: string, days: number = 28): Promise<GSCPageStats | null> {
  const client = await getClient();
  if (!client) return null;

  const startDate = isoDaysAgo(days);
  const endDate = isoDaysAgo(0);
  const fullUrl = `https://www.vidyt.com${pathname}`;
  const pageFilter = {
    groupType: 'and' as const,
    filters: [
      { dimension: 'page' as const, operator: 'equals' as const, expression: fullUrl },
    ],
  };

  try {
    const [totalsRes, queriesRes, countriesRes] = await Promise.all([
      client.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: { startDate, endDate, rowLimit: 1, dimensionFilterGroups: [pageFilter] },
      }),
      client.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 20, dimensionFilterGroups: [pageFilter] },
      }),
      client.searchanalytics.query({
        siteUrl: SITE_URL,
        requestBody: { startDate, endDate, dimensions: ['country'], rowLimit: 10, dimensionFilterGroups: [pageFilter] },
      }),
    ]);

    const totals = (totalsRes.data.rows?.[0] as GSCQueryRow | undefined) || null;
    const queries = (queriesRes.data.rows as GSCQueryRow[] | undefined) || [];
    const countries = (countriesRes.data.rows as GSCQueryRow[] | undefined) || [];

    return {
      url: fullUrl,
      clicks: totals?.clicks || 0,
      impressions: totals?.impressions || 0,
      ctr: totals?.ctr || 0,
      position: totals?.position || 0,
      topQueries: queries.map(r => ({
        query: r.keys[0] || '',
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      })),
      topCountries: countries.map(r => ({
        country: r.keys[0] || '',
        clicks: r.clicks,
        impressions: r.impressions,
      })),
    };
  } catch (e: any) {
    console.error('[GSC] getPageDetail failed:', e?.message);
    return null;
  }
}

/**
 * URL inspection — tells us whether a specific URL is indexed by Google.
 * Used on the detail page to show "Indexed in Google: Yes/No" with reason.
 */
export async function inspectUrl(pathname: string): Promise<{ indexed: boolean; verdict: string; lastCrawl?: string; raw?: any } | null> {
  const client = await getClient();
  if (!client) return null;
  const fullUrl = `https://www.vidyt.com${pathname}`;
  try {
    const res = await client.urlInspection.index.inspect({
      requestBody: { inspectionUrl: fullUrl, siteUrl: SITE_URL },
    });
    const result = res.data.inspectionResult;
    const verdict = result?.indexStatusResult?.verdict || 'UNKNOWN';
    const lastCrawl = result?.indexStatusResult?.lastCrawlTime || undefined;
    return {
      indexed: verdict === 'PASS',
      verdict: String(verdict),
      lastCrawl,
      raw: result,
    };
  } catch (e: any) {
    console.error('[GSC] inspectUrl failed:', e?.message);
    return null;
  }
}
