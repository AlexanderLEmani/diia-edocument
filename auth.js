(function () {
  'use strict';

  var STORAGE_KEY = 'diia-access-token';
  var TOKEN_PARAM = 't';
  var LEGACY_STORAGE_KEYS = [
    'diia-unlocked',
    'diia-unlocked-0606',
    'diia-unlocked-1245',
    'diia-license-session'
  ];
  var THEME_DEFAULT = '#000000';
  var THEME_AUTH = '#A9D2EA';

  var gate = document.getElementById('authGate');
  var loadingScreen = document.getElementById('authLoading');
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function isPreviewMode() {
    return new URLSearchParams(window.location.search).get('preview') === '1'
      || window.parent !== window;
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

  function readStoredToken() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function writeStoredToken(token) {
    try {
      localStorage.setItem(STORAGE_KEY, token.trim());
    } catch (err) {
      /* ignore */
    }
  }

  function clearStoredToken() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  function getUrlToken() {
    return new URLSearchParams(window.location.search).get(TOKEN_PARAM);
  }

  function stripTokenFromUrl() {
    if (!window.history.replaceState) return;

    var url = new URL(window.location.href);
    if (!url.searchParams.has(TOKEN_PARAM)) return;

    url.searchParams.delete(TOKEN_PARAM);
    var next = url.pathname + url.search + url.hash;
    window.history.replaceState(null, '', next);
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

  function resolveAccess() {
    clearLegacyStorage();

    var storedToken = readStoredToken();
    if (storedToken && validateToken(storedToken)) {
      finishAuth();
      return;
    }

    if (storedToken) clearStoredToken();

    var urlToken = getUrlToken();
    if (urlToken) {
      if (validateToken(urlToken)) {
        writeStoredToken(urlToken);
        stripTokenFromUrl();
        finishAuth();
        return;
      }
      stripTokenFromUrl();
    }

    showLoading();
  }

  function startFlow() {
    if (isPreviewMode()) {
      finishAuth();
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
