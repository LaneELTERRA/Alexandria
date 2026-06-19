// ============================================
// ALEXANDRIA — Service Worker
// Caches all assets for offline use
// ============================================

const CACHE_NAME = 'alexandria-v2';
const ASSETS = [
  '/Alexandria/',
  '/Alexandria/index.html',
  '/Alexandria/app.js',
  '/Alexandria/styles.css',
  '/Alexandria/data/reads.json',
  '/Alexandria/data/challenges.json',
  '/Alexandria/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400&display=swap'
];

// Install — cache everything
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Alexandria: caching assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache new successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for HTML
        if (event.request.destination === 'document') {
          return caches.match('/Alexandria/index.html');
        }
      });
    })
  );
});
