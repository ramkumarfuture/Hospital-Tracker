const CACHE = 'hospital-tracker-v1';
const ASSETS = [
  '/Hospital-Tracker/',
  '/Hospital-Tracker/index.html',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install — cache all assets
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', evt => {
  // Don't intercept JSONBin API calls — always go to network for those
  if (evt.request.url.includes('jsonbin.io')) {
    evt.respondWith(
      fetch(evt.request).catch(() => {
        return new Response(JSON.stringify({error: 'offline'}), {
          headers: {'Content-Type': 'application/json'}
        });
      })
    );
    return;
  }

  // For everything else — cache first, network fallback
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request).then(response => {
        // Cache successful GET responses
        if (evt.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(evt.request, clone));
        }
        return response;
      }).catch(() => {
        // If both cache and network fail, return the main app page
        return caches.match('/Hospital-Tracker/index.html');
      });
    })
  );
});
