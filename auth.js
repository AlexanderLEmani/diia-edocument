(function () {
  'use strict';

  var PIN_CODE = '1245';
  var PIN_STORAGE_KEY = 'diia-unlocked-' + PIN_CODE;
  var STORAGE_KEY = 'diia-access-token';
  var COOKIE_KEY = 'diia-access-token';
  var TOKEN_PARAM = 't';
  var LEGACY_STORAGE_KEYS = [
    'diia-unlocked',
    'diia-unlocked-0606',
    'diia-license-session'
  ];
  var THEME_DEFAULT = '#000000';
  var THEME_AUTH = '#A9D2EA';

  var gate = document.getElementById('authGate');
  var loadingScreen = document.getElementById('authLoading');
  var splash = document.getElementById('authSplash');
  var pinScreen = document.getElementById('authPin');
  var keypad = document.getElementById('authKeypad');
  var dotsEl = document.getElementById('authDots');
  var loadingText = loadingScreen && loadingScreen.querySelector('.auth-loading-text');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var entered = '';
  var splashTimer = null;
  var keypadBound = false;
  var accessGranted = false;

  function lockAuthTridentIcon() {
    var img = document.getElementById('authTridentImg')
      || document.querySelector('.auth-brand-icon--trident img');
    if (!img || !window.AUTH_TRIDENT_DATA_URI) return;
    img.src = window.AUTH_TRIDENT_DATA_URI;
    img.style.removeProperty('width');
    img.style.removeProperty('height');
    img.style.removeProperty('background');
    img.style.removeProperty('background-color');
    var box = img.closest('.auth-brand-icon--trident');
    if (box) {
      box.style.removeProperty('width');
      box.style.removeProperty('height');
      box.style.removeProperty('background');
      box.style.removeProperty('background-color');
    }
  }

  window.lockAuthTridentIcon = lockAuthTridentIcon;

  function isDebugMode() {
    return new URLSearchParams(window.location.search).get('debug') === '1';
  }

  function isPreviewMode() {
    return new URLSearchParams(window.location.search).get('preview') === '1'
      || window.parent !== window;
  }

  function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }

  function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  function shouldStripTokenFromUrl() {
    return !isStandaloneMode() && !isIOSDevice();
  }

  function setTheme(color) {
    if (themeMeta) themeMeta.setAttribute('content', color);
  }

  function randomSplashDelay() {
    var r = Math.random();
    if (r < 0.45) return 550 + Math.floor(Math.random() * 650);
    if (r < 0.85) return 1200 + Math.floor(Math.random() * 1400);
    return 2800 + Math.floor(Math.random() * 1900);
  }

  function currentMonthKey() {
    var now = new Date();
    var month = now.getMonth() + 1;
    return now.getFullYear() + '-' + (month < 10 ? '0' : '') + month;
  }

  function parseExpireDate(value) {
    if (!/^\d{4}-\d{2}$/.test(value)) return null;
    var parts = value.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    if (!year || month < 1 || month > 12) return null;
    return value;
  }

  function isMonthActive(expireDate) {
    return parseExpireDate(expireDate) && expireDate >= currentMonthKey();
  }

  function decodeBase64(value) {
    try {
      var base64 = value.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      return atob(base64);
    } catch (err) {
      return null;
    }
  }

  function decodeHex(value) {
    if (!/^[0-9a-fA-F]+$/.test(value) || value.length % 2) return null;
    var out = '';
    for (var i = 0; i < value.length; i += 2) {
      out += String.fromCharCode(parseInt(value.slice(i, i + 2), 16));
    }
    return out;
  }

  function parsePayload(text) {
    var trimmed = (text || '').trim();
    var colon = trimmed.indexOf(':');
    if (colon <= 0) return null;

    var userId = trimmed.slice(0, colon).trim();
    var expireDate = trimmed.slice(colon + 1).trim();
    if (!userId || !parseExpireDate(expireDate)) return null;

    return { userId: userId, expireDate: expireDate };
  }

  function decodeToken(token) {
    if (!token) return null;
    var trimmed = token.trim();
    var payload = parsePayload(decodeBase64(trimmed));
    if (payload) return payload;
    return parsePayload(decodeHex(trimmed));
  }

  function validateToken(token) {
    var payload = decodeToken(token);
    if (!payload) return null;
    if (!isMonthActive(payload.expireDate)) return null;
    return payload;
  }

  function clearLegacyStorage() {
    LEGACY_STORAGE_KEYS.forEach(function (key) {
      try {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      } catch (err) {
        /* ignore */
      }
    });
  }

  function readCookieToken() {
    var prefix = COOKIE_KEY + '=';
    var parts = document.cookie.split(';');
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      if (part.indexOf(prefix) === 0) {
        return decodeURIComponent(part.slice(prefix.length));
      }
    }
    return null;
  }

  function writeCookieToken(token) {
    var maxAge = 60 * 60 * 24 * 400;
    document.cookie = COOKIE_KEY + '=' + encodeURIComponent(token.trim())
      + '; path=/; max-age=' + maxAge + '; SameSite=Lax; Secure';
  }

  function clearCookieToken() {
    document.cookie = COOKIE_KEY + '=; path=/; max-age=0; SameSite=Lax; Secure';
  }

  function readStoredToken() {
    try {
      var localToken = localStorage.getItem(STORAGE_KEY);
      if (localToken) return localToken;
    } catch (err) {
      /* ignore */
    }

    try {
      var sessionToken = sessionStorage.getItem(STORAGE_KEY);
      if (sessionToken) return sessionToken;
    } catch (err) {
      /* ignore */
    }

    return readCookieToken();
  }

  function writeStoredToken(token) {
    var value = token.trim();
    try { localStorage.setItem(STORAGE_KEY, value); } catch (err) { /* ignore */ }
    try { sessionStorage.setItem(STORAGE_KEY, value); } catch (err) { /* ignore */ }
    try { writeCookieToken(value); } catch (err) { /* ignore */ }
    saveServiceWorkerToken(value);
  }

  function clearStoredToken() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
    clearCookieToken();
  }

  function saveServiceWorkerToken(token) {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    navigator.serviceWorker.controller.postMessage({ type: 'SAVE_TOKEN', token: token });
  }

  function readServiceWorkerToken(callback) {
    if (!('serviceWorker' in navigator)) {
      callback(null);
      return;
    }

    navigator.serviceWorker.ready.then(function (registration) {
      if (!registration.active) {
        callback(null);
        return;
      }

      var channel = new MessageChannel();
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        callback(null);
      }, 700);

      channel.port1.onmessage = function (event) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        callback(event.data && event.data.token || null);
      };

      registration.active.postMessage({ type: 'GET_TOKEN' }, [channel.port2]);
    }).catch(function () {
      callback(null);
    });
  }

  function getUrlToken() {
    var token = new URLSearchParams(window.location.search).get(TOKEN_PARAM);
    if (token) return token;

    var hash = window.location.hash || '';
    if (hash.charAt(0) === '#') hash = hash.slice(1);
    if (!hash) return null;
    if (hash.indexOf(TOKEN_PARAM + '=') === 0) {
      return hash.slice(TOKEN_PARAM.length + 1);
    }

    return new URLSearchParams(hash).get(TOKEN_PARAM);
  }

  function stripTokenFromUrl() {
    if (!window.history.replaceState) return;

    var url = new URL(window.location.href);
    var changed = false;

    if (url.searchParams.has(TOKEN_PARAM)) {
      url.searchParams.delete(TOKEN_PARAM);
      changed = true;
    }

    if (url.hash.indexOf('#' + TOKEN_PARAM + '=') === 0) {
      url.hash = '';
      changed = true;
    }

    if (!changed) return;
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }

  function markAuthReady() {
    window.__authReady = true;
    window.dispatchEvent(new Event('auth-ready'));
  }

  function hideAllScreens() {
    if (loadingScreen) loadingScreen.hidden = true;
    if (splash) splash.hidden = true;
    if (pinScreen) pinScreen.hidden = true;
  }

  function finishAuth() {
    clearTimeout(splashTimer);
    document.body.classList.remove('auth-locked');
    setTheme(THEME_DEFAULT);
    if (gate) gate.hidden = true;
    hideAllScreens();
  }

  function showLoading(reason) {
    document.body.classList.add('auth-locked');
    if (gate) gate.hidden = false;
    if (loadingScreen) loadingScreen.hidden = false;
    if (splash) splash.hidden = true;
    if (pinScreen) pinScreen.hidden = true;
    if (loadingText) {
      loadingText.textContent = isDebugMode()
        ? ('Завантаження даних... (' + (reason || 'blocked') + ')')
        : 'Завантаження даних...';
    }
    setTheme(THEME_AUTH);
  }

  function showSplash() {
    lockAuthTridentIcon();
    document.body.classList.add('auth-locked');
    if (gate) gate.hidden = false;
    if (loadingScreen) loadingScreen.hidden = true;
    if (splash) splash.hidden = false;
    if (pinScreen) pinScreen.hidden = true;
    setTheme(THEME_AUTH);
  }

  function showPin() {
    if (splash) splash.hidden = true;
    if (loadingScreen) loadingScreen.hidden = true;
    if (pinScreen) pinScreen.hidden = false;
    setTheme(THEME_AUTH);
    resetPin();
  }

  function resetPin() {
    entered = '';
    updateDots();
    if (dotsEl) dotsEl.classList.remove('is-error');
  }

  function updateDots() {
    if (!dotsEl) return;
    dotsEl.querySelectorAll('.auth-dot').forEach(function (dot, index) {
      dot.classList.toggle('is-on', index < entered.length);
    });
  }

  function pinError() {
    if (!dotsEl) return;
    dotsEl.classList.add('is-error');
    setTimeout(resetPin, 450);
  }

  function isPinUnlocked() {
    try {
      return sessionStorage.getItem(PIN_STORAGE_KEY) === '1';
    } catch (err) {
      return false;
    }
  }

  function unlockPin() {
    try {
      sessionStorage.setItem(PIN_STORAGE_KEY, '1');
    } catch (err) {
      /* ignore */
    }
    finishAuth();
  }

  function pushDigit(digit) {
    if (entered.length >= PIN_CODE.length) return;
    entered += digit;
    updateDots();
    if (entered.length === PIN_CODE.length) {
      if (entered === PIN_CODE) unlockPin();
      else pinError();
    }
  }

  function popDigit() {
    if (!entered.length) return;
    entered = entered.slice(0, -1);
    updateDots();
    if (dotsEl) dotsEl.classList.remove('is-error');
  }

  function handleKey(value) {
    if (value === 'back') {
      popDigit();
      return;
    }
    if (value === 'face') return;
    pushDigit(value);
  }

  function bindKeypad() {
    if (!keypad || keypadBound) return;
    keypadBound = true;

    keypad.querySelectorAll('[data-key]').forEach(function (key) {
      function pressOn() {
        key.classList.add('is-pressed');
      }

      function pressOff() {
        key.classList.remove('is-pressed');
      }

      function onPress(event) {
        event.preventDefault();
        event.stopPropagation();
        pressOn();
        handleKey(key.getAttribute('data-key'));
      }

      key.addEventListener('pointerdown', onPress, { passive: false });
      key.addEventListener('pointerup', pressOff);
      key.addEventListener('pointercancel', pressOff);
      key.addEventListener('pointerleave', pressOff);
      key.addEventListener('click', function (event) {
        event.preventDefault();
      });
    });
  }

  function beginPinFlow() {
    accessGranted = true;
    bindKeypad();
    showSplash();

    splashTimer = setTimeout(function () {
      if (isPinUnlocked()) finishAuth();
      else showPin();
    }, randomSplashDelay());

    markAuthReady();
  }

  function persistAccessToken(token) {
    writeStoredToken(token);
    if (shouldStripTokenFromUrl()) stripTokenFromUrl();
  }

  function resolveAccess() {
    clearLegacyStorage();

    var storedToken = readStoredToken();
    if (storedToken && validateToken(storedToken)) {
      beginPinFlow();
      return;
    }

    if (storedToken) clearStoredToken();

    var urlToken = getUrlToken();
    if (urlToken) {
      if (validateToken(urlToken)) {
        persistAccessToken(urlToken);
        beginPinFlow();
        return;
      }
      if (shouldStripTokenFromUrl()) stripTokenFromUrl();
    }

    readServiceWorkerToken(function (swToken) {
      if (swToken && validateToken(swToken)) {
        persistAccessToken(swToken);
        beginPinFlow();
        return;
      }

      showLoading('no-token');
      markAuthReady();
    });
  }

  function startFlow() {
    if (isPreviewMode()) {
      if (new URLSearchParams(window.location.search).get('auth') === 'splash') {
        showSplash();
        markAuthReady();
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'admin-set-page', page: 'auth-splash' }, '*');
        }
        return;
      }
      finishAuth();
      markAuthReady();
      return;
    }

    resolveAccess();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      lockAuthTridentIcon();
      startFlow();
    });
  } else {
    lockAuthTridentIcon();
    startFlow();
  }
})();
