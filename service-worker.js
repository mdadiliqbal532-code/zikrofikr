/**
 * ZIKR-O-FIKR LIFE OS — PRO SERVICE WORKER & SECURITY FIREWALL (BATCH 1)
 * Version: 4.0.0-PRO-WIN11
 * - Network-First for App Modules (Zero stale GitHub cache locks when updating code)
 * - Cache-First for Heavy Libraries (PDF.js Visual Engine & Chart.js Progress Engine)
 * - Strict API Firewall (Never caches AI API requests or Authorization headers to disk)
 * - Background Notification Dispatcher for Pomodoro Protocol & Local Masjid Salah Guard
 */

'use strict';

const CACHE_VERSION = 'zof-life-os-v4.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const LIB_CACHE = `${CACHE_VERSION}-libs`;

// Core 12-File Modular Architecture Shell
const CORE_APP_FILES = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './core-db.js',
  './module-library.js',
  './module-ai-hub.js',
  './module-timer.js',
  './module-deen.js',
  './module-tasks.js',
  './module-kb-cards.js',
  './module-telegram.js'
];

// External Zero-Cost Engines (Visual PDF Renderer + Chart.js Analytics)
const EXTERNAL_LIBRARIES = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

// Sensitive AI & Local Endpoints that MUST NEVER be written to browser disk cache
const SENSITIVE_API_PATTERNS = [
  'generativelanguage.googleapis.com',
  'api.groq.com',
  'openrouter.ai',
  'api.deepseek.com',
  'api-inference.huggingface.co',
  'api.stability.ai',
  'api.mistral.ai',
  'api.cohere.ai',
  'api.together.xyz',
  'api.telegram.org',
  'localhost:11434',
  '127.0.0.1:11434'
];

// ============================================================================
// 1. INSTALL: Pre-cache external engines & activate immediately
// ============================================================================
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      try {
        const libCache = await caches.open(LIB_CACHE);
        await Promise.allSettled(
          EXTERNAL_LIBRARIES.map((url) =>
            fetch(url, { mode: 'cors' }).then((res) => {
              if (res.ok) return libCache.put(url, res);
            })
          )
        );
        const staticCache = await caches.open(STATIC_CACHE);
        await Promise.allSettled(
          CORE_APP_FILES.map((url) =>
            fetch(url, { cache: 'reload' }).then((res) => {
              if (res.ok) return staticCache.put(url, res);
            })
          )
        );
      } catch (err) {
        console.warn('[ZOF-SW] Install pre-cache warning:', err);
      }
    })()
  );
});

// ============================================================================
// 2. ACTIVATE: Purge ALL legacy caches (Fixes the old PAGE 204 cache lock)
// ============================================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== LIB_CACHE) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
      const allClients = await self.clients.matchAll({ includeUncontrolled: true });
      for (const client of allClients) {
        client.postMessage({
          type: 'ZOF_SW_ACTIVE',
          version: CACHE_VERSION,
          status: 'Shield Active & Legacy Cache Purged'
        });
      }
    })()
  );
});

// ============================================================================
// 3. FETCH FIREWALL & SMART ROUTER
// ============================================================================
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Rule 1: Ignore non-GET requests or browser extensions
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Rule 2: SECURITY SHIELD — Never cache AI API calls or requests with Authorization headers
  const isSensitiveApi =
    req.headers.has('Authorization') ||
    req.headers.has('x-goog-api-key') ||
    SENSITIVE_API_PATTERNS.some((pattern) => url.href.includes(pattern));

  if (isSensitiveApi) {
    event.respondWith(fetch(req));
    return;
  }

  // Rule 3: CACHE-FIRST for immutable CDN libraries (PDF.js & Chart.js) for instant load
  const isExternalLib = EXTERNAL_LIBRARIES.some((libUrl) => url.href.startsWith(libUrl));
  if (isExternalLib) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.ok) {
            const cache = await caches.open(LIB_CACHE);
            cache.put(req, fresh.clone());
          }
          return fresh;
        } catch (err) {
          return new Response('Offline Library Fallback', { status: 503 });
        }
      })()
    );
    return;
  }

  // Rule 4: NETWORK-FIRST for your 12 App Files (Always grabs newest GitHub commit when online!)
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(req, { cache: 'no-store' });
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(req, networkResponse.clone());
        }
        return networkResponse;
      } catch (offlineError) {
        const cachedResponse = await caches.match(req);
        if (cachedResponse) return cachedResponse;
        if (req.mode === 'navigate') {
          const fallbackIndex = await caches.match('./index.html');
          if (fallbackIndex) return fallbackIndex;
        }
        return new Response('Zikr-O-Fikr Offline Vault Mode', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })()
  );
});

// ============================================================================
// 4. MESSAGE & FORCE-NOTIFICATION HANDLER (POMODORO, SALAH GUARD, CACHE PURGE)
// ============================================================================
self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data.type === 'PURGE_ALL_CACHES') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }

  // Trigger native Windows 11 / Android system notification even if window is minimized
  if (data.type === 'ZOF_FORCE_NOTIFY') {
    const title = data.title || 'Zikr-O-Fikr Life OS';
    const options = {
      body: data.body || '',
      tag: data.tag || 'zof-alert-' + Date.now(),
      requireInteraction: data.requireInteraction !== false,
      silent: false,
      data: {
        actionUrl: data.actionUrl || './',
        module: data.module || 'timer'
      }
    };
    self.registration.showNotification(title, options).catch(() => {});
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (allClients.length > 0) {
        const client = allClients[0];
        await client.focus();
        client.postMessage({
          type: 'ZOF_NOTIFICATION_CLICKED',
          module: event.notification.data?.module || 'timer'
        });
      } else {
        await self.clients.openWindow('./');
      }
    })()
  );
});
