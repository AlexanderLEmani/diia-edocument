(function () {
  'use strict';

  var BASE = (function () {
    var path = window.location.pathname;
    if (path.indexOf('/rezerv') !== -1) return '/rezerv/';
    return './';
  })();

  function setAppHeight() {
    var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', h + 'px');
  }

  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setAppHeight);
    window.visualViewport.addEventListener('scroll', setAppHeight);
  }

  var isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  if ('serviceWorker' in navigator) {
    var swUrl = BASE + 'sw.js?v=' + encodeURIComponent('36');
    navigator.serviceWorker.register(swUrl).then(function (registration) {
      registration.update();
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      registration.addEventListener('updatefound', function () {
        var worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', function () {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    }).catch(function () { /* ignore */ });

    var reloaded = false;
    function reloadForSwUpdate() {
      if (reloaded) return;
      if (!window.__authReady) {
        window.addEventListener('auth-ready', reloadForSwUpdate, { once: true });
        return;
      }
      reloaded = true;
      window.location.reload();
    }

    navigator.serviceWorker.addEventListener('controllerchange', reloadForSwUpdate);
  }

  if (isStandalone) {
    document.documentElement.classList.add('standalone-mode');
    return;
  }

  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  var isAndroid = /Android/.test(navigator.userAgent);
  if (!isIOS && !isAndroid) return;

  var banner = document.createElement('div');
  banner.className = 'pwa-install-banner';
  banner.innerHTML =
    '<p><strong>На весь екран:</strong> ' +
    (isIOS
      ? 'натисніть «Поділитися» ↗ і «На екран «Додому»»'
      : 'в меню Chrome оберіть «Встановити застосунок» або «Додати на головний екран»') +
    '</p>' +
    '<button type="button" class="pwa-install-dismiss" aria-label="Закрити">×</button>';

  document.body.appendChild(banner);

  banner.querySelector('.pwa-install-dismiss').addEventListener('click', function () {
    banner.classList.add('is-hidden');
    try { sessionStorage.setItem('rezerv-pwa-banner-dismissed', '1'); } catch (e) { /* ignore */ }
  });

  try {
    if (sessionStorage.getItem('rezerv-pwa-banner-dismissed') === '1') {
      banner.classList.add('is-hidden');
    }
  } catch (e) { /* ignore */ }
})();
