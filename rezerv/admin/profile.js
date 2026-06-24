(function (global) {
  'use strict';

  var STORAGE_KEY = 'rezerv-profile';

  function loadProfile() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || (
        !data.lastName && !data.firstName && !data.patronymic &&
        !data.birthDate && !data.photoDataUrl && !data.qrDataUrl &&
        !data.docUpdatedDate && !data.docUpdatedTime
      )) {
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveProfile(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  function clearProfile() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function titleCase(text) {
    if (!text) return '';
    var lower = String(text).toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  function upperCase(text) {
    return text ? String(text).toUpperCase() : '';
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function formatDateDDMMYYYY(d) {
    return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function formatTimeHHMM(d) {
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function isValidDateStr(str) {
    return /^\d{2}\.\d{2}\.\d{4}$/.test(String(str || '').trim());
  }

  function isValidTimeStr(str) {
    return /^\d{2}:\d{2}$/.test(String(str || '').trim());
  }

  function getDocUpdateMeta() {
    var profile = loadProfile();
    var now = new Date();
    var date = (profile && isValidDateStr(profile.docUpdatedDate))
      ? profile.docUpdatedDate.trim()
      : formatDateDDMMYYYY(now);
    var time = (profile && isValidTimeStr(profile.docUpdatedTime))
      ? profile.docUpdatedTime.trim()
      : formatTimeHHMM(now);
    return { date: date, time: time };
  }

  function buildTickerText(date, time) {
    return '<span class="id-ticker-part">Документ оновлено о ' + time + ' | ' + date + ' • </span>';
  }

  function refreshTicker() {
    if (global.RezervTicker && typeof global.RezervTicker.init === 'function') {
      global.RezervTicker.init();
    }
  }

  function applyDocUpdate() {
    var meta = getDocUpdateMeta();
    var ticker = buildTickerText(meta.date, meta.time);
    setField('rezerv-ticker', ticker, true);
    setField('rezerv-doc-ticker', ticker, true);
  }

  function setField(id, text, html) {
    var nodes = document.querySelectorAll('[data-ed="' + id + '"]');
    if (!nodes.length || text == null || text === '') return;
    nodes.forEach(function (el) {
      if (html) el.innerHTML = text;
      else el.textContent = text;
    });
  }

  function applyPhoto(dataUrl) {
    var nodes = document.querySelectorAll('[data-ed="rezerv-photo"], [data-ed="rezerv-doc-photo"]');
    if (!nodes.length) return;
    nodes.forEach(function (el) {
      if (!dataUrl) {
        el.classList.remove('has-photo');
        el.style.removeProperty('background-image');
        return;
      }
      el.classList.add('has-photo');
      el.style.backgroundImage = 'url("' + dataUrl + '")';
    });
  }

  var DEFAULT_QR_SRC = 'assets/qr-card.png';

  function applyQr(dataUrl) {
    var nodes = document.querySelectorAll('[data-ed="rezerv-qr-image"]');
    if (!nodes.length) return;
    nodes.forEach(function (el) {
      if (el.tagName !== 'IMG') return;
      el.src = dataUrl || DEFAULT_QR_SRC;
    });
  }

  function applyProfile() {
    applyDocUpdate();

    var profile = loadProfile();
    if (!profile) {
      syncDocNameFromCard();
      return false;
    }

    var last = profile.lastName || '';
    var first = profile.firstName || '';
    var pat = profile.patronymic || '';

    if (last) setField('rezerv-name-1', titleCase(last));
    if (first) setField('rezerv-name-2', titleCase(first));
    if (pat) setField('rezerv-name-3', titleCase(pat));

    if (last) setField('rezerv-doc-name1', titleCase(last));
    if (first) setField('rezerv-doc-name2', titleCase(first));
    if (pat) setField('rezerv-doc-name3', titleCase(pat));

    if (profile.birthDate) {
      setField('rezerv-birth-value', profile.birthDate);
      setField('rezerv-doc-birth', profile.birthDate);
    }

    if (profile.rnokpp) setField('rezerv-doc-rnokpp', profile.rnokpp);
    if (profile.deferralDate) setField('rezerv-doc-deferral', profile.deferralDate);
    if (profile.vlkDecision) setField('rezerv-doc-vlk', profile.vlkDecision);
    if (profile.vlkDate) setField('rezerv-doc-vlk-date', profile.vlkDate);

    if (profile.photoDataUrl) applyPhoto(profile.photoDataUrl);
    else applyPhoto('');

    if (profile.qrDataUrl) applyQr(profile.qrDataUrl);
    else applyQr('');

    syncDocNameFromCard();
    return true;
  }

  function syncDocNameFromCard() {
    var ids = ['rezerv-name-1', 'rezerv-name-2', 'rezerv-name-3'];
    var docIds = ['rezerv-doc-name1', 'rezerv-doc-name2', 'rezerv-doc-name3'];
    ids.forEach(function (id, i) {
      var el = document.querySelector('[data-ed="' + id + '"]');
      var text = el ? el.textContent.trim() : '';
      if (text) setField(docIds[i], text);
    });
  }

  function patchConfig(config) {
    if (!config || !config.elements) return config;

    function setText(id, text) {
      if (!text) return;
      if (!config.elements[id]) config.elements[id] = { text: '', styles: {} };
      config.elements[id].text = text;
    }

    var meta = getDocUpdateMeta();
    setText('rezerv-ticker', buildTickerText(meta.date, meta.time));

    var profile = loadProfile();
    if (!profile) return config;

    if (profile.lastName) setText('rezerv-name-1', titleCase(profile.lastName));
    if (profile.firstName) setText('rezerv-name-2', titleCase(profile.firstName));
    if (profile.patronymic) setText('rezerv-name-3', titleCase(profile.patronymic));
    if (profile.birthDate) setText('rezerv-birth-value', profile.birthDate);

    return config;
  }

  function applyAll(config) {
    if (!config) {
      applyDocUpdate();
      applyProfile();
      refreshTicker();
      return;
    }
    if (window.AdminCore) AdminCore.applyConfig(patchConfig(JSON.parse(JSON.stringify(config))));
    applyProfile();
    refreshTicker();
  }

  function resizeImage(file, maxSize, quality) {
    maxSize = maxSize || 800;
    quality = quality || 0.82;
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var w = img.width;
          var h = img.height;
          var scale = Math.min(1, maxSize / Math.max(w, h));
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(w * scale);
          canvas.height = Math.round(h * scale);
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  global.ProfileCore = {
    STORAGE_KEY: STORAGE_KEY,
    loadProfile: loadProfile,
    saveProfile: saveProfile,
    clearProfile: clearProfile,
    titleCase: titleCase,
    getDocUpdateMeta: getDocUpdateMeta,
    applyDocUpdate: applyDocUpdate,
    applyProfile: applyProfile,
    patchConfig: patchConfig,
    applyAll: applyAll,
    resizeImage: resizeImage,
  };
})(typeof window !== 'undefined' ? window : this);
