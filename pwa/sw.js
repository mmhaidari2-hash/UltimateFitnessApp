const CACHE_NAME = 'ufa-cache-v1';
const ASSETS = [
  '/pwa/',
  '/pwa/index.html',
  '/pwa/styles.css',
  '/pwa/app.js',
  '/pwa/icon-192.svg',
  '/pwa/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
