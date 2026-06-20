const CACHE = 'rezerv-v32';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './auth.css',
  './auth.js',
  './app.js',
  './ticker.js',
  './pwa.js',
  './pwa.css',
  './manifest.webmanifest',
  './assets/emblem.svg',
  './assets/icon-180.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/splash-screen.png',
  './assets/pin-screen.png',
  './admin/admin.html',
  './admin/admin.css',
  './admin/admin.js',
  './admin/core.js',
  './admin/profile.js',
  './admin/apply-config.js',
  './admin/preview-drag.js',
  './admin/screenshot-diff.js',
  './admin/screenshot-diff.css',
  './admin/capture-preview.js',
  './admin/config.json',
];

function isAdminRequest(url) {
  return url.pathname.indexOf('/admin/') !== -1;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (isAdminRequest(url)) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => cached);
    })
  );
});
