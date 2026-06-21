var AUTH_CACHE = 'diia-auth-token-v1';
var AUTH_CACHE_KEY = '/__diia-auth-token';

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
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

self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request));
});
