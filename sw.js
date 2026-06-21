const CACHE = 'lbh-v6';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  // Wipe every old cache so stale JS cannot be served
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

// DEBUG MODE: pure network pass-through — no caching at all
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() =>
    caches.match(e.request).then(r => r || new Response('offline', { status: 503 }))
  ));
});
