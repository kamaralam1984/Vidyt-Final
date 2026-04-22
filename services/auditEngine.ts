/**
 * Website Audit Engine
 * Runs Performance, SEO, and Security audits on any URL.
 * Uses Google PageSpeed Insights API for Core Web Vitals.
 */

import os from 'os';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface AuditIssue {
  category: 'performance' | 'seo' | 'security' | 'server';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  fix: string;
}

export interface PerformanceResult {
  score: number;
  responseTime: number;
  ttfb: number;
  fcp: number;
  lcp: number;
  cls: number;
  tbt: number;
  pageSize: number;
  requestCount: number;
  pagespeedData?: any;
}

export interface SeoResult {
  score: number;
  hasTitle: boolean;
  titleLength: number;
  titleText: string;
  hasMetaDescription: boolean;
  metaDescriptionLength: number;
  h1Count: number;
  hasCanonical: boolean;
  hasOgTags: boolean;
  hasTwitterCard: boolean;
  robotsTxt: boolean;
  sitemapXml: boolean;
  isHttps: boolean;
  hasStructuredData: boolean;
  internalLinksCount: number;
  imagesWithoutAlt: number;
}

export interface SecurityResult {
  score: number;
  isHttps: boolean;
  hasHSTS: boolean;
  hasCSP: boolean;
  hasXFrame: boolean;
  hasXContentType: boolean;
  hasXXssProtection: boolean;
  hasReferrerPolicy: boolean;
  hasPermissionsPolicy: boolean;
  serverHeader: string;
  poweredByHeader: string;
  cookieFlags: boolean;
}

export interface ServerMetrics {
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  memoryPercent: number;
  diskUsed: number;
  diskTotal: number;
  diskPercent: number;
  uptime: number;
  loadAvg: number[];
  nodeVersion: string;
  platform: string;
}

export interface AuditResult {
  performance: PerformanceResult;   // desktop
  mobile: PerformanceResult;        // mobile
  seo: SeoResult;
  security: SecurityResult;
  server: ServerMetrics;
  issues: AuditIssue[];
  overallScore: number;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url.replace(/\/$/, '');
}

async function fetchWithTimeout(url: string, timeoutMs = 15000, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function extractBetween(html: string, open: string, close: string): string {
  const start = html.indexOf(open);
  if (start === -1) return '';
  const end = html.indexOf(close, start + open.length);
  if (end === -1) return '';
  return html.slice(start + open.length, end);
}

function getAttr(tag: string, attr: string): string {
  const re = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i');
  const m = re.exec(tag);
  return m ? m[1] : '';
}

// ─────────────────────────────────────────────
// PERFORMANCE AUDIT (PageSpeed Insights API)
// ─────────────────────────────────────────────

async function runPerformanceAudit(url: string, preset: 'desktop' | 'mobile' = 'desktop'): Promise<PerformanceResult> {
  const result: PerformanceResult = {
    score: 0, responseTime: 0, ttfb: 0, fcp: 0, lcp: 0, cls: 0, tbt: 0, pageSize: 0, requestCount: 0,
  };

  // Measure direct response time (only on desktop to avoid double fetch)
  if (preset === 'desktop') {
    const t0 = Date.now();
    try {
      const resp = await fetchWithTimeout(url, 15000, { headers: { 'User-Agent': 'Mozilla/5.0 VidYT-Audit/1.0' } });
      result.responseTime = Date.now() - t0;
      const body = await resp.text();
      result.pageSize = Buffer.byteLength(body, 'utf8');
    } catch {
      result.responseTime = 15000;
    }
  }

  // Run Lighthouse CLI for real Core Web Vitals
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const lighthouseBin = `${process.cwd()}/node_modules/.bin/lighthouse`;
    const chromeFlags = '--headless --no-sandbox --disable-dev-shm-usage --disable-gpu';
    const presetFlag = preset === 'desktop' ? '--preset=desktop' : '';
    const cmd = `${lighthouseBin} "${url}" --output=json --quiet --chrome-flags="${chromeFlags}" --only-categories=performance ${presetFlag} 2>/dev/null`;
    const { stdout: output } = await execAsync(cmd, { timeout: 90000, maxBuffer: 10 * 1024 * 1024 });
    const lhr = JSON.parse(output);
    const cats = lhr.categories;
    const audits = lhr.audits;

    result.score = Math.round((cats?.performance?.score ?? 0) * 100);
    result.fcp = Math.round(audits?.['first-contentful-paint']?.numericValue ?? 0);
    result.lcp = Math.round(audits?.['largest-contentful-paint']?.numericValue ?? 0);
    result.cls = parseFloat((audits?.['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3));
    result.tbt = Math.round(audits?.['total-blocking-time']?.numericValue ?? 0);
    result.ttfb = Math.round(audits?.['server-response-time']?.numericValue ?? 0);
    result.requestCount = audits?.['network-requests']?.details?.items?.length ?? 0;
    const pageBytes = audits?.['total-byte-weight']?.numericValue;
    if (pageBytes) result.pageSize = Math.round(pageBytes);
    result.pagespeedData = {
      categories: cats,
      lhr: { fetchTime: lhr.fetchTime, finalUrl: lhr.finalUrl },
    };
  } catch {
    // Lighthouse failed — derive score from response time only
    if (result.responseTime < 200) result.score = 100;
    else if (result.responseTime < 500) result.score = 92;
    else if (result.responseTime < 1000) result.score = 78;
    else if (result.responseTime < 2000) result.score = 55;
    else if (result.responseTime < 4000) result.score = 35;
    else result.score = 15;
  }

  return result;
}

// ─────────────────────────────────────────────
// SEO AUDIT
// ─────────────────────────────────────────────

async function runSeoAudit(url: string): Promise<SeoResult> {
  const result: SeoResult = {
    score: 0, hasTitle: false, titleLength: 0, titleText: '', hasMetaDescription: false,
    metaDescriptionLength: 0, h1Count: 0, hasCanonical: false, hasOgTags: false,
    hasTwitterCard: false, robotsTxt: false, sitemapXml: false, isHttps: false,
    hasStructuredData: false, internalLinksCount: 0, imagesWithoutAlt: 0,
  };

  result.isHttps = url.startsWith('https://');

  // Fetch main page
  let html = '';
  try {
    const resp = await fetchWithTimeout(url, 15000, { headers: { 'User-Agent': 'Mozilla/5.0 VidYT-Audit/1.0' } });
    html = await resp.text();
  } catch {
    return result;
  }

  const htmlLower = html.toLowerCase();

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    result.hasTitle = true;
    result.titleText = titleMatch[1].trim().replace(/\s+/g, ' ');
    result.titleLength = result.titleText.length;
  }

  // Meta description
  const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["'][^"']*["'][^>]+name=["']description["'][^>]*>/i);
  if (metaDescMatch) {
    result.hasMetaDescription = true;
    const content = getAttr(metaDescMatch[0], 'content');
    result.metaDescriptionLength = content.length;
  }

  // H1 count
  result.h1Count = (html.match(/<h1[^>]*>/gi) || []).length;

  // Canonical
  result.hasCanonical = /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html);

  // OG tags
  result.hasOgTags = /<meta[^>]+property=["']og:/i.test(html);

  // Twitter card
  result.hasTwitterCard = /<meta[^>]+name=["']twitter:/i.test(html);

  // Structured data (JSON-LD)
  result.hasStructuredData = /<script[^>]+type=["']application\/ld\+json["'][^>]*>/i.test(html);

  // Images without alt
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  result.imagesWithoutAlt = imgTags.filter(tag => !/\balt=["'][^"']+["']/i.test(tag)).length;

  // Internal links (approximate)
  const domain = new URL(url).hostname;
  const linkMatches = html.match(/href=["']([^"']+)["']/gi) || [];
  result.internalLinksCount = linkMatches.filter(l => {
    const href = l.replace(/href=["']|["']/gi, '');
    return href.startsWith('/') || href.includes(domain);
  }).length;

  // Check robots.txt
  const origin = new URL(url).origin;
  try {
    const robotsResp = await fetchWithTimeout(`${origin}/robots.txt`, 5000);
    result.robotsTxt = robotsResp.ok;
  } catch { /* noop */ }

  // Check sitemap.xml
  try {
    const sitemapResp = await fetchWithTimeout(`${origin}/sitemap.xml`, 5000);
    result.sitemapXml = sitemapResp.ok;
  } catch { /* noop */ }

  // Compute SEO score
  let seoPoints = 0;
  const maxPoints = 100;
  if (result.isHttps) seoPoints += 10;
  if (result.hasTitle && result.titleLength >= 30 && result.titleLength <= 60) seoPoints += 15;
  else if (result.hasTitle) seoPoints += 8;
  if (result.hasMetaDescription && result.metaDescriptionLength >= 120 && result.metaDescriptionLength <= 160) seoPoints += 12;
  else if (result.hasMetaDescription) seoPoints += 6;
  if (result.h1Count === 1) seoPoints += 10;
  else if (result.h1Count > 1) seoPoints += 4;
  if (result.hasCanonical) seoPoints += 8;
  if (result.hasOgTags) seoPoints += 8;
  if (result.hasTwitterCard) seoPoints += 5;
  if (result.robotsTxt) seoPoints += 8;
  if (result.sitemapXml) seoPoints += 10;
  if (result.hasStructuredData) seoPoints += 8;
  if (result.imagesWithoutAlt === 0) seoPoints += 6;

  result.score = Math.min(100, Math.round((seoPoints / maxPoints) * 100));
  return result;
}

// ─────────────────────────────────────────────
// SECURITY AUDIT
// ─────────────────────────────────────────────

async function runSecurityAudit(url: string): Promise<SecurityResult> {
  const result: SecurityResult = {
    score: 0, isHttps: false, hasHSTS: false, hasCSP: false, hasXFrame: false,
    hasXContentType: false, hasXXssProtection: false, hasReferrerPolicy: false,
    hasPermissionsPolicy: false, serverHeader: '', poweredByHeader: '', cookieFlags: false,
  };

  result.isHttps = url.startsWith('https://');

  try {
    const resp = await fetchWithTimeout(url, 15000, {
      headers: { 'User-Agent': 'Mozilla/5.0 VidYT-Audit/1.0' },
      redirect: 'follow',
    });

    const headers = resp.headers;

    result.hasHSTS = !!headers.get('strict-transport-security');
    result.hasCSP = !!headers.get('content-security-policy');
    result.hasXFrame = !!headers.get('x-frame-options');
    result.hasXContentType = !!headers.get('x-content-type-options');
    result.hasXXssProtection = !!headers.get('x-xss-protection');
    result.hasReferrerPolicy = !!headers.get('referrer-policy');
    result.hasPermissionsPolicy = !!headers.get('permissions-policy');
    result.serverHeader = headers.get('server') || '';
    result.poweredByHeader = headers.get('x-powered-by') || '';

    // Check Set-Cookie for Secure + HttpOnly flags
    const setCookie = headers.get('set-cookie') || '';
    if (setCookie) {
      result.cookieFlags = /secure/i.test(setCookie) && /httponly/i.test(setCookie);
    } else {
      result.cookieFlags = true; // no cookies = not a concern
    }
  } catch {
    return result;
  }

  // Score calculation
  let pts = 0;
  if (result.isHttps) pts += 20;
  if (result.hasHSTS) pts += 15;
  if (result.hasCSP) pts += 20;
  if (result.hasXFrame) pts += 10;
  if (result.hasXContentType) pts += 10;
  if (result.hasReferrerPolicy) pts += 8;
  if (result.hasPermissionsPolicy) pts += 7;
  if (!result.poweredByHeader) pts += 5; // hiding server tech = good
  if (result.cookieFlags) pts += 5;

  result.score = Math.min(100, pts);
  return result;
}

// ─────────────────────────────────────────────
// SERVER METRICS (local server only)
// ─────────────────────────────────────────────

export async function getServerMetrics(): Promise<ServerMetrics> {
  const memTotal = Math.round(os.totalmem() / 1024 / 1024);
  const memFree = Math.round(os.freemem() / 1024 / 1024);
  const memUsed = memTotal - memFree;
  const memPercent = Math.round((memUsed / memTotal) * 100);

  // CPU usage (average over 100ms)
  const cpuUsage = await new Promise<number>((resolve) => {
    const start = os.cpus().map(c => ({ ...c.times }));
    setTimeout(() => {
      const end = os.cpus();
      let totalIdle = 0, totalTick = 0;
      end.forEach((cpu, i) => {
        const startTimes = start[i];
        const diff = {
          idle: cpu.times.idle - startTimes.idle,
          user: cpu.times.user - startTimes.user,
          sys: cpu.times.sys - startTimes.sys,
          irq: cpu.times.irq - startTimes.irq,
          nice: cpu.times.nice - startTimes.nice,
        };
        const total = Object.values(diff).reduce((a, b) => a + b, 0);
        totalIdle += diff.idle;
        totalTick += total;
      });
      resolve(Math.round((1 - totalIdle / totalTick) * 100));
    }, 100);
  });

  // Disk usage via df
  let diskUsed = 0, diskTotal = 0, diskPercent = 0;
  try {
    const { execSync } = await import('child_process');
    const dfOut = execSync("df -BG / 2>/dev/null | tail -1").toString().trim();
    const parts = dfOut.split(/\s+/);
    diskTotal = parseInt(parts[1]) || 0;
    diskUsed = parseInt(parts[2]) || 0;
    diskPercent = parseInt(parts[4]) || 0;
  } catch { /* noop */ }

  return {
    cpuUsage,
    memoryUsed: memUsed,
    memoryTotal: memTotal,
    memoryPercent: memPercent,
    diskUsed,
    diskTotal,
    diskPercent,
    uptime: Math.floor(os.uptime()),
    loadAvg: os.loadavg(),
    nodeVersion: process.version,
    platform: os.platform(),
  };
}

// ─────────────────────────────────────────────
// ISSUE GENERATOR
// ─────────────────────────────────────────────

function generateIssues(
  perf: PerformanceResult,
  seo: SeoResult,
  sec: SecurityResult,
  server: ServerMetrics,
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // ── Performance issues ──
  if (perf.responseTime > 3000) {
    issues.push({
      category: 'performance', severity: 'critical',
      title: 'Server response time is critically slow',
      description: `Page took ${(perf.responseTime / 1000).toFixed(1)}s to respond. Users will bounce.`,
      fix: 'Enable Redis caching, use a CDN, optimize database queries, and add HTTP cache headers (Cache-Control: public, max-age=3600).',
    });
  } else if (perf.responseTime > 1500) {
    issues.push({
      category: 'performance', severity: 'warning',
      title: 'Slow server response time',
      description: `Response time is ${(perf.responseTime / 1000).toFixed(1)}s. Target: under 1s.`,
      fix: 'Implement server-side caching with Redis. Add `Cache-Control` headers. Consider upgrading server tier.',
    });
  }

  if (perf.lcp > 4000) {
    issues.push({
      category: 'performance', severity: 'critical',
      title: 'Largest Contentful Paint (LCP) is poor',
      description: `LCP is ${(perf.lcp / 1000).toFixed(1)}s. Google threshold: < 2.5s is good.`,
      fix: 'Preload the LCP image with `<link rel="preload" as="image">`. Serve images via CDN. Use `next/image` with priority prop.',
    });
  } else if (perf.lcp > 2500) {
    issues.push({
      category: 'performance', severity: 'warning',
      title: 'LCP needs improvement',
      description: `LCP is ${(perf.lcp / 1000).toFixed(1)}s. Ideal: < 2.5s.`,
      fix: 'Optimize and compress hero images. Use WebP format. Add `fetchpriority="high"` to the LCP element.',
    });
  }

  if (perf.cls > 0.25) {
    issues.push({
      category: 'performance', severity: 'critical',
      title: 'Cumulative Layout Shift (CLS) is very high',
      description: `CLS score is ${perf.cls}. This causes jarring visual shifts. Google threshold: < 0.1.`,
      fix: 'Set explicit width/height on all images and embeds. Reserve space for ads. Avoid inserting content above existing DOM elements.',
    });
  } else if (perf.cls > 0.1) {
    issues.push({
      category: 'performance', severity: 'warning',
      title: 'CLS score needs improvement',
      description: `CLS is ${perf.cls}. Ideal: < 0.1.`,
      fix: 'Add `aspect-ratio` CSS to image containers. Use `min-height` for dynamic content areas.',
    });
  }

  if (perf.tbt > 600) {
    issues.push({
      category: 'performance', severity: 'critical',
      title: 'Total Blocking Time (TBT) is critical',
      description: `TBT is ${perf.tbt}ms. This means JS is blocking the main thread severely.`,
      fix: 'Split large JS bundles with dynamic imports. Move non-critical scripts to `defer` or `async`. Remove unused dependencies.',
    });
  }

  if (perf.score < 50) {
    issues.push({
      category: 'performance', severity: 'critical',
      title: 'Overall performance score is failing',
      description: `Performance score: ${perf.score}/100. This affects SEO ranking and user experience.`,
      fix: 'Run a full Lighthouse audit. Enable compression (gzip/brotli). Minify JS/CSS. Use next/font for fonts. Add a CDN.',
    });
  }

  // ── SEO issues ──
  if (!seo.isHttps) {
    issues.push({
      category: 'seo', severity: 'critical',
      title: 'Website is not using HTTPS',
      description: 'Non-HTTPS sites are penalised by Google and browsers show "Not Secure" warnings.',
      fix: 'Install an SSL certificate (Let\'s Encrypt is free). Redirect all HTTP traffic to HTTPS. Add HSTS header.',
    });
  }

  if (!seo.hasTitle) {
    issues.push({
      category: 'seo', severity: 'critical',
      title: 'Page is missing a <title> tag',
      description: 'Title tag is required for SEO. Google uses it as the search result headline.',
      fix: 'Add a unique, descriptive title between 50-60 characters: `<title>Your Page Title | Brand</title>`',
    });
  } else if (seo.titleLength < 30) {
    issues.push({
      category: 'seo', severity: 'warning',
      title: 'Title tag is too short',
      description: `Title is only ${seo.titleLength} characters. Ideal: 50-60 characters.`,
      fix: `Expand the title to include relevant keywords: "${seo.titleText}" → add more descriptive keywords.`,
    });
  } else if (seo.titleLength > 60) {
    issues.push({
      category: 'seo', severity: 'warning',
      title: 'Title tag is too long',
      description: `Title is ${seo.titleLength} characters. Google truncates after 60 characters.`,
      fix: 'Shorten the title to 50-60 characters while keeping the primary keyword near the start.',
    });
  }

  if (!seo.hasMetaDescription) {
    issues.push({
      category: 'seo', severity: 'warning',
      title: 'Missing meta description',
      description: 'Without a meta description, Google auto-generates one — often poorly.',
      fix: 'Add: `<meta name="description" content="Your 120-160 character description here." />`',
    });
  } else if (seo.metaDescriptionLength > 160) {
    issues.push({
      category: 'seo', severity: 'info',
      title: 'Meta description too long',
      description: `At ${seo.metaDescriptionLength} chars, Google will truncate it.`,
      fix: 'Keep meta description between 120-160 characters for best display.',
    });
  }

  if (seo.h1Count === 0) {
    issues.push({
      category: 'seo', severity: 'critical',
      title: 'No H1 heading found on page',
      description: 'H1 is the most important on-page SEO signal for content relevance.',
      fix: 'Add exactly one H1 tag with your primary keyword: `<h1>Your Primary Keyword Here</h1>`',
    });
  } else if (seo.h1Count > 1) {
    issues.push({
      category: 'seo', severity: 'warning',
      title: 'Multiple H1 tags detected',
      description: `Found ${seo.h1Count} H1 tags. Each page should have exactly one.`,
      fix: 'Keep only one H1. Convert other H1s to H2 or H3 based on hierarchy.',
    });
  }

  if (!seo.hasOgTags) {
    issues.push({
      category: 'seo', severity: 'warning',
      title: 'Missing Open Graph meta tags',
      description: 'Without OG tags, social media previews (Facebook, LinkedIn) look broken.',
      fix: 'Add: `<meta property="og:title" content="..." /><meta property="og:description" content="..." /><meta property="og:image" content="..." />`',
    });
  }

  if (!seo.robotsTxt) {
    issues.push({
      category: 'seo', severity: 'warning',
      title: 'robots.txt not found',
      description: 'Search engine crawlers look for robots.txt to understand crawling rules.',
      fix: 'Create /public/robots.txt with: `User-agent: *\\nAllow: /\\nSitemap: https://yourdomain.com/sitemap.xml`',
    });
  }

  if (!seo.sitemapXml) {
    issues.push({
      category: 'seo', severity: 'warning',
      title: 'sitemap.xml not found',
      description: 'Sitemaps help Google discover and index all your pages faster.',
      fix: 'Generate a sitemap using next-sitemap package. Add to next.config.js and submit to Google Search Console.',
    });
  }

  if (seo.imagesWithoutAlt > 0) {
    issues.push({
      category: 'seo', severity: 'info',
      title: `${seo.imagesWithoutAlt} image(s) missing alt text`,
      description: 'Alt text helps Google understand image content and improves accessibility.',
      fix: 'Add descriptive alt attributes: `<img src="..." alt="descriptive text here" />`',
    });
  }

  // ── Security issues ──
  if (!sec.isHttps) {
    issues.push({
      category: 'security', severity: 'critical',
      title: 'No HTTPS — traffic is unencrypted',
      description: 'All data between user and server is transmitted in plaintext.',
      fix: 'Install SSL via Let\'s Encrypt: `certbot --nginx -d yourdomain.com`. Enforce HTTPS redirect in Next.js config.',
    });
  }

  if (!sec.hasHSTS) {
    issues.push({
      category: 'security', severity: 'warning',
      title: 'Missing HSTS header',
      description: 'HTTP Strict Transport Security prevents protocol downgrade attacks.',
      fix: 'Add to Next.js headers config: `{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }`',
    });
  }

  if (!sec.hasCSP) {
    issues.push({
      category: 'security', severity: 'critical',
      title: 'Missing Content Security Policy (CSP)',
      description: 'Without CSP, the site is vulnerable to Cross-Site Scripting (XSS) attacks.',
      fix: 'Add CSP header in next.config.js headers(). Start with: `Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\';`',
    });
  }

  if (!sec.hasXFrame) {
    issues.push({
      category: 'security', severity: 'warning',
      title: 'Missing X-Frame-Options header',
      description: 'Without this, the site can be embedded in iframes — enabling clickjacking attacks.',
      fix: 'Add: `{ key: "X-Frame-Options", value: "SAMEORIGIN" }` to Next.js headers config.',
    });
  }

  if (!sec.hasXContentType) {
    issues.push({
      category: 'security', severity: 'warning',
      title: 'Missing X-Content-Type-Options header',
      description: 'Allows MIME-sniffing attacks where browsers execute files with wrong content types.',
      fix: 'Add: `{ key: "X-Content-Type-Options", value: "nosniff" }` to Next.js headers config.',
    });
  }

  if (sec.poweredByHeader) {
    issues.push({
      category: 'security', severity: 'info',
      title: 'Server technology exposed via X-Powered-By header',
      description: `Header reveals: "${sec.poweredByHeader}". Attackers can target known vulnerabilities.`,
      fix: 'Remove in next.config.js: `poweredByHeader: false` in the next config object.',
    });
  }

  if (!sec.hasReferrerPolicy) {
    issues.push({
      category: 'security', severity: 'info',
      title: 'Missing Referrer-Policy header',
      description: 'Without this, sensitive URL parameters can leak via the Referer header.',
      fix: 'Add: `{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }`',
    });
  }

  // ── Server health issues (only for owned/local servers) ──
  if (server.cpuUsage > 90) {
    issues.push({
      category: 'server', severity: 'critical',
      title: 'CPU usage is critically high',
      description: `CPU at ${server.cpuUsage}%. Server may crash or become unresponsive soon.`,
      fix: 'Identify high-CPU processes with `top` or `htop`. Scale horizontally. Move background jobs to separate workers.',
    });
  } else if (server.cpuUsage > 75) {
    issues.push({
      category: 'server', severity: 'warning',
      title: 'High CPU usage detected',
      description: `CPU usage is ${server.cpuUsage}%. Monitor for spikes.`,
      fix: 'Profile Node.js with `clinic.js` or `0x`. Enable cluster mode. Optimize heavy API endpoints.',
    });
  }

  if (server.memoryPercent > 90) {
    issues.push({
      category: 'server', severity: 'critical',
      title: 'Memory usage is critically high',
      description: `RAM usage: ${server.memoryUsed}/${server.memoryTotal} MB (${server.memoryPercent}%).`,
      fix: 'Check for memory leaks with `node --inspect`. Increase swap space. Restart services. Scale server RAM.',
    });
  } else if (server.memoryPercent > 75) {
    issues.push({
      category: 'server', severity: 'warning',
      title: 'Memory usage is high',
      description: `RAM usage: ${server.memoryPercent}%.`,
      fix: 'Monitor with `pm2 monit`. Set `max_memory_restart` in PM2 config to auto-restart on OOM.',
    });
  }

  if (server.diskPercent > 90) {
    issues.push({
      category: 'server', severity: 'critical',
      title: 'Disk space critically low',
      description: `Disk usage: ${server.diskPercent}%. Server may fail to write logs or new files.`,
      fix: 'Run `du -sh /var/log/*` to find large logs. Archive old logs. Remove unused Docker images: `docker system prune`.',
    });
  }

  return issues;
}

// ─────────────────────────────────────────────
// MAIN AUDIT FUNCTION
// ─────────────────────────────────────────────

export async function runAudit(rawUrl: string, includeServer = false): Promise<AuditResult> {
  const url = normalizeUrl(rawUrl);

  // Desktop and mobile Lighthouse run in parallel alongside SEO/security checks
  const [performance, mobile, seo, security, server] = await Promise.all([
    runPerformanceAudit(url, 'desktop'),
    runPerformanceAudit(url, 'mobile'),
    runSeoAudit(url),
    runSecurityAudit(url),
    includeServer ? getServerMetrics() : Promise.resolve({
      cpuUsage: 0, memoryUsed: 0, memoryTotal: 0, memoryPercent: 0,
      diskUsed: 0, diskTotal: 0, diskPercent: 0, uptime: 0,
      loadAvg: [0, 0, 0], nodeVersion: process.version, platform: os.platform(),
    }),
  ]);

  const issues = generateIssues(performance, seo, security, server);
  // Overall score uses desktop perf (primary), seo, security
  const overallScore = Math.round((performance.score + seo.score + security.score) / 3);

  return { performance, mobile, seo, security, server, issues, overallScore };
}
