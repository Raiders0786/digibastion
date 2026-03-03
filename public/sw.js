// Digibastion Service Worker for resilient caching without stale app shells
const CACHE_VERSION = 'v2';
const CACHE_NAME = `digibastion-static-${CACHE_VERSION}`;

// Keep this list intentionally small to reduce stale-shell regressions
const PRECACHE_ASSETS = [
  '/index.html',
  '/favicon.png',
  '/site.webmanifest',
];

const ASSET_REGEX = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webmanifest)$/i;
const CRITICAL_RUNTIME_REGEX = /\.(js|css)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch(() => {
        // Ignore install cache failures and let network handle requests.
      })
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('digibastion-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Don't intercept third-party requests or API/data traffic.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navigation: always network-first, never runtime-cache HTML routes.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request, { cache: 'no-store' });
        } catch {
          return (await caches.match('/index.html')) || Response.error();
        }
      })()
    );
    return;
  }

  if (!ASSET_REGEX.test(url.pathname)) return;

  // JS/CSS are critical runtime files: prefer fresh network, fallback cache.
  if (CRITICAL_RUNTIME_REGEX.test(url.pathname)) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request, { cache: 'no-store' });
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          return (await caches.match(request)) || Response.error();
        }
      })()
    );
    return;
  }

  // Non-critical static assets: cache-first + background refresh.
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) {
        event.waitUntil(
          fetch(request)
            .then(async (response) => {
              if (response.ok) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, response);
              }
            })
            .catch(() => {
              // Ignore background refresh failures.
            })
        );

        return cached;
      }

      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        return Response.error();
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
