import { test, expect } from '@playwright/test';

test.describe('Public pages smoke', () => {
  const routes: Array<{ path: string; heading: RegExp }> = [
    { path: '/', heading: /VidYT|Vid YT/i },
    { path: '/pricing', heading: /pricing|plans|choose/i },
    { path: '/blog', heading: /blog|articles/i },
    { path: '/faq', heading: /frequently asked|faq/i },
    { path: '/help', heading: /help center|help/i },
    { path: '/security', heading: /security/i },
    { path: '/privacy-policy', heading: /privacy policy/i },
    { path: '/terms', heading: /terms/i },
    { path: '/refund-policy', heading: /refund/i },
    { path: '/cookie-policy', heading: /cookie/i },
    { path: '/data-requests', heading: /data|requests|gdpr/i },
    { path: '/contact', heading: /contact/i },
  ];

  for (const r of routes) {
    test(`renders ${r.path}`, async ({ page }) => {
      const response = await page.goto(r.path);
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator('h1').first()).toContainText(r.heading);
    });
  }
});

test('sitemap.xml is served', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toContain('<urlset');
});

test('robots.txt is served', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBeTruthy();
});

test('security.txt is served', async ({ request }) => {
  const res = await request.get('/.well-known/security.txt');
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).toMatch(/Contact:/);
});

test('404 page renders for unknown route', async ({ page }) => {
  const res = await page.goto('/this-route-does-not-exist-xyz');
  expect(res?.status()).toBe(404);
});
