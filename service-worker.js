/* ============================================================================
   ZikrOFikr OS — Offline-First PWA Service Worker (service-worker.js)
   Caches all 10 Core Files so the app boots 100% Offline in < 1 second
   ============================================================================ */

const CACHE_NAME = 'zikrofikr-os-v2.0';
const CORE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './core-db.js',
    './module-library.js',
    './module-ai-hub.js',
    './module-kb-cards.js',
    './module-timer.js',
    './module-deen.js',
    './module-tasks.js',
    './module-telegram.js',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
