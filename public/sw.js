/* Minimal service worker — enables PWA install. Zero network interception. */
/* v4 — 2026-04-24 */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// No-op fetch listener — required for PWA install eligibility, but never
// intercepts. Without event.respondWith(), the browser handles every request
// normally, so failed requests surface as regular TypeErrors at the call site
// instead of "FetchEvent resulted in network error" console warnings.
self.addEventListener('fetch', () => {});
