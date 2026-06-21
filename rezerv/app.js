(function () {
  'use strict';

  var frame = document.getElementById('app');
  var navItems = document.querySelectorAll('.nav-item[data-tab]');
  var tabPanels = document.querySelectorAll('.tab-panel');
  var openSheetBtn = document.getElementById('openSheet');
  var sheetOverlay = document.getElementById('sheetOverlay');
  var sheetBackdrop = document.getElementById('sheetBackdrop');
  var secretFinesLink = document.getElementById('secretFinesLink');
  var secretTaps = 0;
  var secretTapTimer = null;

  function isPreviewMode() {
    return new URLSearchParams(window.location.search).get('preview') === '1'
      || window.parent !== window;
  }

  function secretPageUrl() {
    return isPreviewMode() ? 'secret.html?preview=1' : 'secret.html';
  }

  function tabFromHash() {
    var hash = (window.location.hash || '').replace('#', '');
    if (hash === 'services' || hash === 'vacancies' || hash === 'menu') return hash;
    return 'id';
  }

  function switchTab(tab) {
    if (!frame) return;
    frame.dataset.tab = tab;
    navItems.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    tabPanels.forEach(function (panel) {
      panel.classList.toggle('active', panel.dataset.tab === tab);
    });

    if (!isPreviewMode()) {
      var newHash = tab === 'id' ? '' : '#' + tab;
      if (window.location.hash !== newHash) {
        history.replaceState(null, '', window.location.pathname + window.location.search + newHash);
      }
    }

    if (isPreviewMode() && window.parent !== window) {
      var pageMap = {
        id: 'rezerv-id',
        services: 'rezerv-services',
        vacancies: 'rezerv-vacancies',
        menu: 'rezerv-menu'
      };
      window.parent.postMessage({ type: 'admin-set-page', page: pageMap[tab] }, '*');
    }
  }

  window.switchTab = switchTab;

  navItems.forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(btn.dataset.tab);
    });
  });

  var cardFlip = document.getElementById('idCardFlip');
  var cardBack = document.getElementById('idCardBack');
  var cardFlipped = false;

  function flipCard(toBack) {
    cardFlipped = toBack;
    if (cardFlip) cardFlip.classList.toggle('is-flipped', toBack);
  }

  if (cardFlip) {
    cardFlip.addEventListener('click', function (e) {
      if (e.target.closest('#openSheet') || e.target.closest('.id-fab')) return;
      if (cardFlipped) return;
      flipCard(true);
    });
  }

  if (cardBack) {
    cardBack.addEventListener('click', function () {
      flipCard(false);
    });
  }

  function closeSheet() {
    document.body.classList.remove('sheet-open');
    if (sheetOverlay) sheetOverlay.hidden = true;
  }

  function openSheet() {
    document.body.classList.add('sheet-open');
    if (sheetOverlay) sheetOverlay.hidden = false;
  }

  closeSheet();

  if (openSheetBtn) {
    openSheetBtn.addEventListener('click', openSheet);
  }
  if (sheetBackdrop) {
    sheetBackdrop.addEventListener('click', closeSheet);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sheetOverlay && !sheetOverlay.hidden) closeSheet();
  });

  window.addEventListener('pageshow', function () {
    if (sheetOverlay && sheetOverlay.hidden) document.body.classList.remove('sheet-open');
  });

  function bindSecretTap(el) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      if (isPreviewMode()) return;
      e.preventDefault();
      secretTaps += 1;
      clearTimeout(secretTapTimer);
      secretTapTimer = setTimeout(function () { secretTaps = 0; }, 900);
      if (secretTaps >= 5) {
        secretTaps = 0;
        window.location.href = secretPageUrl();
      }
    });
  }

  bindSecretTap(secretFinesLink);

  switchTab(tabFromHash());
  window.addEventListener('hashchange', function () {
    switchTab(tabFromHash());
  });
})();
