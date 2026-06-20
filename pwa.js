(function () {
  'use strict';

  function setAppHeight() {
    var h = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;
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
    navigator.serviceWorker.register('/sw.js').catch(function () { /* ignore */ });
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
    try { sessionStorage.setItem('pwa-banner-dismissed', '1'); } catch (e) { /* ignore */ }
  });

  try {
    if (sessionStorage.getItem('pwa-banner-dismissed') === '1') {
      banner.classList.add('is-hidden');
    }
  } catch (e) { /* ignore */ }
})();
