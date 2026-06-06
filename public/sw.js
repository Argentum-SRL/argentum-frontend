const CACHE_NAME = 'argentum-cache-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/argentum-app-icon.svg',
  '/argentum-app-icon.png',
  '/favicon.svg',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Exclude API calls and Vite HMR/dev files from being intercepted
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/api') ||
    /\/node_modules\//.test(url.pathname) ||
    /\/\@vite\//.test(url.pathname) ||
    /\/\@id\//.test(url.pathname) ||
    /\?v=[a-f0-9]+$/.test(url.href) ||
    url.pathname.includes('.vite')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request)
        .then((response) => {
          // Cache same-origin assets that are successful
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch((error) => {
          // If a page navigation fails (e.g. offline), serve index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html').then((fallback) => {
              if (fallback) return fallback;
              throw error; // If not in cache yet, propagate the error
            });
          }
          // Let standard network error propagate instead of throwing a Service Worker TypeError
          throw error;
        });
    })
  );
});
