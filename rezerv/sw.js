const CACHE = 'rezerv-v35';
const SW_VERSION = '33';

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
  './assets/qr.svg',
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

const NETWORK_FIRST = [
  '/index.html',
  '/auth.js',
  '/sw.js',
  '/app.js',
  '/pwa.js',
];

function isAdminRequest(url) {
  return url.pathname.indexOf('/admin/') !== -1;
}

function isNetworkFirst(url) {
  if (isAdminRequest(url)) return true;
  var path = url.pathname;
  if (path.endsWith('/rezerv') || path.endsWith('/rezerv/')) return true;
  return NETWORK_FIRST.some(function (suffix) {
    return path.endsWith(suffix);
  });
}

function networkFirst(request) {
  return fetch(request).then(function (response) {
    if (response && response.status === 200 && response.type === 'basic') {
      var clone = response.clone();
      caches.open(CACHE).then(function (cache) {
        cache.put(request, clone);
      });
    }
    return response;
  }).catch(function () {
    return caches.match(request);
  });
}

function cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      if (!response || response.status !== 200 || response.type !== 'basic') return response;
      var clone = response.clone();
      caches.open(CACHE).then(function (cache) {
        cache.put(request, clone);
      });
      return response;
    }).catch(function () {
      return cached;
    });
  });
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

  if (isNetworkFirst(url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
