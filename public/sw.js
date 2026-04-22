/* Minimal service worker — enables PWA install; passes all requests to network (no stale Next.js cache). */
/* v2 — 2026-04-20 */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clear ALL caches on every activate so stale CSP/pages are never served from cache
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only intercept same-origin requests — let browser handle external domains directly
  if (url.origin !== self.location.origin) return;
  // Skip non-GET requests (POST to /api/auth/login etc.)
  if (event.request.method !== 'GET') return;
  // Always fetch from network — never serve stale cached pages
  event.respondWith(
    fetch(event.request).catch(() => Response.error())
  );
});
