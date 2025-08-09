/*
  Service Worker for Yodha Arc PWA

  This service worker implements a simple offline‑first strategy by caching
  essential application assets (HTML, CSS, JS, images and the manifest) on
  installation. It then serves cached responses when the network is
  unavailable or slow. For a production application you could extend this
  strategy to cache API responses or implement more granular cache
  invalidation. See https://developers.google.com/web/fundamentals/primers/service-workers
  for more information.
*/

const CACHE_NAME = 'yodha-arc-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event – pre-cache our core assets.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// Activate event – clean up old caches if they exist.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event – try the network first, fall back to cache.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});