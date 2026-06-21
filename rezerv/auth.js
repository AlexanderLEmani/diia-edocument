(function () {
  'use strict';

  var STORAGE_KEY = 'rezerv-access-token';
  var COOKIE_KEY = 'rezerv-access-token';
  var TOKEN_PARAM = 't';
  var LEGACY_STORAGE_KEYS = [
    'rezerv-unlocked',
    'rezerv-unlocked-142536',
    'rezerv-unlocked-1245',
    'rezerv-license-session'
  ];
  var THEME_DEFAULT = '#E5E2D3';
  var THEME_AUTH = '#262422';

  var gate = document.getElementById('authGate');
  var loadingScreen = document.getElementById('authLoading');
  var themeMeta = document.querySelector('meta[name="theme-color"]');

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

    return {
      userId: userId,
      expireDate: expireDate
    };
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
    var saved = false;

    try {
      localStorage.setItem(STORAGE_KEY, value);
      saved = true;
    } catch (err) {
      /* ignore */
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, value);
      saved = true;
    } catch (err) {
      /* ignore */
    }

    try {
      writeCookieToken(value);
      saved = true;
    } catch (err) {
      /* ignore */
    }

    saveServiceWorkerToken(value);
    return saved;
  }

  function clearStoredToken() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }

    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }

    clearCookieToken();
  }

  function saveServiceWorkerToken(token) {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    navigator.serviceWorker.controller.postMessage({
      type: 'SAVE_TOKEN',
      token: token
    });
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

    var hash = url.hash || '';
    if (hash.indexOf('#' + TOKEN_PARAM + '=') === 0) {
      url.hash = '';
      changed = true;
    }

    if (!changed) return;

    var next = url.pathname + url.search + url.hash;
    window.history.replaceState(null, '', next);
  }

  function markAuthReady() {
    window.__authReady = true;
    window.dispatchEvent(new Event('auth-ready'));
  }

  function finishAuth() {
    document.body.classList.remove('auth-locked');
    setTheme(THEME_DEFAULT);
    if (gate) gate.hidden = true;
    if (loadingScreen) loadingScreen.hidden = true;
  }

  function showLoading() {
    document.body.classList.add('auth-locked');
    if (gate) gate.hidden = false;
    if (loadingScreen) loadingScreen.hidden = false;
    setTheme(THEME_AUTH);
  }

  function grantAccess(token) {
    writeStoredToken(token);
    if (shouldStripTokenFromUrl()) stripTokenFromUrl();
    finishAuth();
    markAuthReady();
  }

  function resolveAccess() {
    clearLegacyStorage();

    var storedToken = readStoredToken();
    if (storedToken && validateToken(storedToken)) {
      finishAuth();
      markAuthReady();
      return;
    }

    if (storedToken) clearStoredToken();

    var urlToken = getUrlToken();
    if (urlToken) {
      if (validateToken(urlToken)) {
        grantAccess(urlToken);
        return;
      }
      if (shouldStripTokenFromUrl()) stripTokenFromUrl();
    }

    readServiceWorkerToken(function (swToken) {
      if (swToken && validateToken(swToken)) {
        grantAccess(swToken);
        return;
      }

      showLoading();
      markAuthReady();
    });
  }

  function startFlow() {
    if (isPreviewMode()) {
      finishAuth();
      markAuthReady();
      return;
    }

    resolveAccess();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startFlow);
  } else {
    startFlow();
  }
})();
