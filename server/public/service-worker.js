/**
 * IMAM V6.1 - Service Worker with Offline Support
 */

const CACHE_NAME = 'imam-v6-static-v1';
const API_PROXY_PREFIX = '/api-proxy';
const GEMINI_TARGET_PREFIX = 'https://generativelanguage.googleapis.com';

// Aset kritis yang wajib dicache saat instalasi (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing & Caching Shell...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;

  // 1. Logika Interupsi API Gemini (Existing functionality)
  if (requestUrl.startsWith(GEMINI_TARGET_PREFIX)) {
    const remainingPathAndQuery = requestUrl.substring(GEMINI_TARGET_PREFIX.length);
    const proxyUrl = `${self.location.origin}${API_PROXY_PREFIX}${remainingPathAndQuery}`;
    
    event.respondWith(
      fetch(new Request(proxyUrl, {
        method: event.request.method,
        headers: event.request.headers,
        body: event.request.method !== 'GET' ? event.request.body : undefined,
        duplex: event.request.method !== 'GET' ? 'half' : undefined
      })).catch(() => {
        return new Response(JSON.stringify({ error: 'OFFLINE: Tidak dapat terhubung ke AI.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // 2. Strategi Cache untuk Aset Statis & Library (ESM.sh / CDN)
  // Gunakan 'Stale-While-Revalidate' untuk kecepatan maksimal
  if (
    requestUrl.includes('esm.sh') || 
    requestUrl.includes('aistudiocdn.com') ||
    requestUrl.includes('fonts.gstatic.com') ||
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Fallback jika benar-benar offline dan tidak ada di cache
          return cachedResponse;
        });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Default: Network first, fallback to cache for index.html (Navigation)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }
});