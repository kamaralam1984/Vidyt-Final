// Empty service worker to prevent 404 errors
// This file exists to satisfy browser requests for service workers
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});
