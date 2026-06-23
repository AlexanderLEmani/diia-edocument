var CACHE = 'diia-v10';
var AUTH_CACHE = 'diia-auth-token-v1';
var AUTH_CACHE_KEY = '/__diia-auth-token';

var ASSETS = [
  '/',
  '/index.html',
  '/info',
  '/secret',
  '/styles.css',
  '/auth.css',
  '/info.css',
  '/pwa.css',
  '/secret.css',
  '/auth.js',
  '/app.js',
  '/info.js',
  '/pwa.js',
  '/secret.js',
  '/manifest.webmanifest',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/assets/card-qr.png',
  '/assets/info-qr.png',
  '/assets/info-photo.png',
  '/assets/photo.jpg',
  '/assets/icon-180.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/feed/drones-banner.png',
  '/assets/feed/whatsnew.png',
  '/assets/feed/nezl-icons.png',
  '/admin/core.js',
  '/admin/profile.js',
  '/admin/apply-config.js',
  '/admin/capture-preview.js',
  '/admin/preview-drag.js',
  '/admin/config.json',
];

var NETWORK_FIRST = [
  '/index.html',
  '/info',
  '/secret',
  '/auth.js',
  '/sw.js',
  '/app.js',
  '/pwa.js',
];

function htmlAliasPath(pathname) {
  if (pathname === '/secret' || pathname === '/secret.html') return '/secret';
  if (pathname === '/info' || pathname === '/info.html') return '/info';
  if (pathname === '/rezerv/secret' || pathname === '/rezerv/secret.html') return '/rezerv/secret';
  return null;
}

function isAdminRequest(url) {
  return url.pathname.indexOf('/admin/') !== -1;
}

function isNetworkFirst(url) {
  if (isAdminRequest(url)) return true;
  var path = url.pathname;
  if (path === '/' || path.endsWith('/index.html')) return true;
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

function serveHtmlAlias(pathname) {
  var aliased = htmlAliasPath(pathname);
  if (!aliased) return null;
  return caches.match(aliased).then(function (cached) {
    if (cached) return cached;
    return fetch(aliased, { credentials: 'same-origin' }).then(function (response) {
      if (!response || response.status !== 200 || response.type !== 'basic') return response;
      var clone = response.clone();
      caches.open(CACHE).then(function (cache) {
        cache.put(aliased, clone);
      });
      return response;
    });
  });
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE && k !== AUTH_CACHE;
      }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  var aliasedHtml = serveHtmlAlias(url.pathname);
  if (aliasedHtml) {
    event.respondWith(aliasedHtml);
    return;
  }

  if (isNetworkFirst(url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

self.addEventListener('message', function (event) {
  var data = event.data || {};

  if (data.type === 'SAVE_TOKEN' && data.token) {
    event.waitUntil(
      caches.open(AUTH_CACHE).then(function (cache) {
        return cache.put(AUTH_CACHE_KEY, new Response(String(data.token)));
      })
    );
    return;
  }

  if (data.type !== 'GET_TOKEN') return;

  var port = event.ports && event.ports[0];
  if (!port) return;

  caches.open(AUTH_CACHE).then(function (cache) {
    return cache.match(AUTH_CACHE_KEY);
  }).then(function (response) {
    if (!response) {
      port.postMessage({ token: null });
      return null;
    }
    return response.text();
  }).then(function (token) {
    if (token === null) return;
    port.postMessage({ token: token || null });
  }).catch(function () {
    port.postMessage({ token: null });
  });
});
