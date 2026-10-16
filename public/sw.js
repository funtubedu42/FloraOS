// FloraOS Service Worker v0.3.2
const CACHE_NAME = 'floraos-cache-v0.3.2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './apps/os_icon.png',
  './apps/folder.png',
  './apps/settings.png',
  './apps/terminal.png',
  './apps/web.png',
  './apps/notes.png',
  './apps/paint_app.png',
  './apps/postit_app.png',
  './apps/snake_app.png',
  './apps/user.png',
  './wallpapers/floraos_default.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('FloraOS SW precache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests or external APIs (e.g. GitHub Releases API)
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin.includes('api.github.com') || url.pathname.includes('/version.json')) {
    // Network first for version checks
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
