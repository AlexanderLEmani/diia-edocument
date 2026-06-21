(function () {
  'use strict';

  var PIN_CODE = '1245';
  var STORAGE_KEY = 'diia-unlocked-' + PIN_CODE;
  var LEGACY_STORAGE_KEYS = ['diia-unlocked', 'diia-unlocked-0606'];
  var THEME_DEFAULT = '#000000';
  var THEME_AUTH = '#A9D2EA';

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

  function randomSplashDelay() {
    var r = Math.random();
    if (r < 0.45) return 550 + Math.floor(Math.random() * 650);
    if (r < 0.85) return 1200 + Math.floor(Math.random() * 1400);
    return 2800 + Math.floor(Math.random() * 1900);
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
    setTheme(THEME_AUTH);
  }

  function showPin() {
    if (splash) splash.hidden = true;
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

  function startFlow() {
    if (isPreviewMode()) {
      finishAuth();
      return;
    }

    bindKeypad();
    showSplash();

    splashTimer = setTimeout(function () {
      if (isUnlocked()) finishAuth();
      else showPin();
    }, randomSplashDelay());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startFlow);
  } else {
    startFlow();
  }
})();
