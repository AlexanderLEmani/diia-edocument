(function () {
  'use strict';

  var PIN_CODE = '142536';
  var STORAGE_KEY = 'rezerv-unlocked-' + PIN_CODE;
  var LEGACY_STORAGE_KEYS = ['rezerv-unlocked'];
  var THEME_DEFAULT = '#E5E2D3';
  var THEME_SPLASH = '#262422';

  var gate = document.getElementById('authGate');
  var splash = document.getElementById('authSplash');
  var pinScreen = document.getElementById('authPin');
  var keypad = document.getElementById('authKeypad');
  var dotsEl = document.getElementById('authDots');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var entered = '';
  var splashTimer = null;
  var keypadBound = false;

  function isPreviewMode() {
    return new URLSearchParams(window.location.search).get('preview') === '1'
      || window.parent !== window;
  }

  function setTheme(color) {
    if (themeMeta) themeMeta.setAttribute('content', color);
  }

  function isUnlocked() {
    try {
      LEGACY_STORAGE_KEYS.forEach(function (key) {
        sessionStorage.removeItem(key);
      });
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (err) {
      return false;
    }
  }

  function unlock() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (err) {
      /* ignore */
    }
    finishAuth();
  }

  function finishAuth() {
    clearTimeout(splashTimer);
    document.body.classList.remove('auth-locked');
    setTheme(THEME_DEFAULT);
    if (gate) gate.hidden = true;
    if (splash) splash.hidden = true;
    if (pinScreen) pinScreen.hidden = true;
  }

  function showSplash() {
    document.body.classList.add('auth-locked');
    if (gate) gate.hidden = false;
    if (splash) splash.hidden = false;
    if (pinScreen) pinScreen.hidden = true;
    setTheme(THEME_SPLASH);
  }

  function showPin() {
    if (splash) splash.hidden = true;
    if (pinScreen) pinScreen.hidden = false;
    setTheme(THEME_DEFAULT);
    resetPin();
  }

  function resetPin() {
    entered = '';
    updateDots();
    if (dotsEl) dotsEl.classList.remove('is-error');
  }

  function updateDots() {
    if (!dotsEl) return;
    var dots = dotsEl.querySelectorAll('.auth-dot');
    dots.forEach(function (dot, index) {
      dot.classList.toggle('is-on', index < entered.length);
    });
  }

  function pinError() {
    if (!dotsEl) return;
    dotsEl.classList.add('is-error');
    setTimeout(function () {
      resetPin();
    }, 450);
  }

  function handleKey(value) {
    if (value === 'back') {
      popDigit();
      return;
    }
    if (value === 'face') return;
    pushDigit(value);
  }

  function pushDigit(digit) {
    if (entered.length >= PIN_CODE.length) return;
    entered += digit;
    updateDots();
    if (entered.length === PIN_CODE.length) {
      if (entered === PIN_CODE) unlock();
      else pinError();
    }
  }

  function popDigit() {
    if (!entered.length) return;
    entered = entered.slice(0, -1);
    updateDots();
    if (dotsEl) dotsEl.classList.remove('is-error');
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

  function startFlow() {
    if (isPreviewMode()) {
      finishAuth();
      return;
    }

    bindKeypad();
    showSplash();

    var delay = 1000 + Math.floor(Math.random() * 2001);
    splashTimer = setTimeout(function () {
      if (isUnlocked()) finishAuth();
      else showPin();
    }, delay);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startFlow);
  } else {
    startFlow();
  }
})();
