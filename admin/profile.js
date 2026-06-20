(function (global) {
  'use strict';

  var STORAGE_KEY = 'diia-edocument-profile';

  var TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie',
    'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'i', 'й': 'i', 'к': 'k', 'л': 'l',
    'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'iu',
    'я': 'ia', "'": '', '’': '', '`': ''
  };

  function loadProfile() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || (
        !data.lastName && !data.firstName && !data.patronymic &&
        !data.birthDate && !data.photoDataUrl &&
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

  function transliterate(text) {
    if (!text) return '';
    var out = '';
    var src = String(text);
    for (var i = 0; i < src.length; i++) {
      var ch = src.charAt(i);
      var lower = ch.toLowerCase();
      var mapped = TRANSLIT[lower];
      if (mapped == null) {
        out += ch;
        continue;
      }
      if (ch === lower) out += mapped;
      else out += mapped.charAt(0).toUpperCase() + mapped.slice(1);
    }
    return out;
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

  function buildTaxTickerText(date, time) {
    var chunk = 'Документ оновлено о ' + time + ' | ' + date + ' • Перевірено';
    return chunk + ' &nbsp;&nbsp;&nbsp; ' + chunk;
  }

  function applyDocUpdate() {
    var meta = getDocUpdateMeta();
    setField('tax-ticker', buildTaxTickerText(meta.date, meta.time), true);
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
    ['edoc-photo', 'info-photo'].forEach(function (id) {
      var el = document.querySelector('[data-ed="' + id + '"]');
      if (!el) return;
      if (!dataUrl) {
        el.classList.remove('has-photo');
        el.style.removeProperty('background-image');
        return;
      }
      el.classList.add('has-photo');
      el.style.backgroundImage = 'url("' + dataUrl + '")';
    });
  }

  function applyProfile() {
    applyDocUpdate();

    var profile = loadProfile();
    if (!profile) return false;

    var last = profile.lastName || '';
    var first = profile.firstName || '';
    var pat = profile.patronymic || '';

    if (first) {
      setField('feed-greeting', 'Привіт, ' + titleCase(first) + ' 👋');
    }

    if (last || first || pat) {
      if (last) {
        setField('edoc-name-1', upperCase(last));
        setField('tax-name-1', titleCase(last));
      }
      if (first) {
        setField('edoc-name-2', upperCase(first));
        setField('tax-name-2', titleCase(first));
      }
      if (pat) {
        setField('edoc-name-3', upperCase(pat));
        setField('tax-name-3', titleCase(pat));
      }

      if (last || first) {
        var infoLine1 = [upperCase(last), upperCase(first)].filter(Boolean).join(' ');
        var infoHtml = pat ? infoLine1 + '<br>' + upperCase(pat) : infoLine1;
        setField('info-name', infoHtml, true);
      }

      var latin = [transliterate(last), transliterate(first)].filter(Boolean).join(' ');
      if (latin) setField('info-name-latin', latin);
    }

    if (profile.birthDate) {
      setField('edoc-birth-value', profile.birthDate);
      setField('tax-birth-value', profile.birthDate);
      setField('info-birth-value', profile.birthDate);
    }

    if (profile.photoDataUrl) applyPhoto(profile.photoDataUrl);
    else applyPhoto('');

    return true;
  }

  function patchConfig(config) {
    if (!config || !config.elements) return config;

    function setText(id, text) {
      if (!text) return;
      if (!config.elements[id]) config.elements[id] = { text: '', styles: {} };
      config.elements[id].text = text;
    }

    var meta = getDocUpdateMeta();
    setText('tax-ticker', buildTaxTickerText(meta.date, meta.time));

    var profile = loadProfile();
    if (!profile) return config;

    var last = profile.lastName || '';
    var first = profile.firstName || '';
    var pat = profile.patronymic || '';

    if (first) {
      setText('feed-greeting', 'Привіт, ' + titleCase(first) + ' 👋');
    }
    if (last) {
      setText('edoc-name-1', upperCase(last));
      setText('tax-name-1', titleCase(last));
    }
    if (first) {
      setText('edoc-name-2', upperCase(first));
      setText('tax-name-2', titleCase(first));
    }
    if (pat) {
      setText('edoc-name-3', upperCase(pat));
      setText('tax-name-3', titleCase(pat));
    }
    if (last || first) {
      var infoLine1 = [upperCase(last), upperCase(first)].filter(Boolean).join(' ');
      var infoHtml = pat ? infoLine1 + '<br>' + upperCase(pat) : infoLine1;
      setText('info-name', infoHtml);
    }
    var latin = [transliterate(last), transliterate(first)].filter(Boolean).join(' ');
    if (latin) setText('info-name-latin', latin);
    if (profile.birthDate) {
      setText('edoc-birth-value', profile.birthDate);
      setText('tax-birth-value', profile.birthDate);
      setText('info-birth-value', profile.birthDate);
    }

    return config;
  }

  function applyAll(config) {
    if (!config) {
      applyDocUpdate();
      applyProfile();
      return;
    }
    if (window.AdminCore) AdminCore.applyConfig(patchConfig(JSON.parse(JSON.stringify(config))));
    applyProfile();
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
    transliterate: transliterate,
    titleCase: titleCase,
    getDocUpdateMeta: getDocUpdateMeta,
    buildTaxTickerText: buildTaxTickerText,
    applyDocUpdate: applyDocUpdate,
    applyProfile: applyProfile,
    patchConfig: patchConfig,
    applyAll: applyAll,
    resizeImage: resizeImage
  };
})(typeof window !== 'undefined' ? window : this);
