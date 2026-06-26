(function () {
  'use strict';

  var form = document.getElementById('profileForm');
  var lastName = document.getElementById('lastName');
  var firstName = document.getElementById('firstName');
  var patronymic = document.getElementById('patronymic');
  var birthDate = document.getElementById('birthDate');
  var rnokpp = document.getElementById('rnokpp');
  var deferralDate = document.getElementById('deferralDate');
  var vlkDecision = document.getElementById('vlkDecision');
  var vlkDate = document.getElementById('vlkDate');
  var docUpdatedDate = document.getElementById('docUpdatedDate');
  var docUpdatedTime = document.getElementById('docUpdatedTime');
  var statusLabelInput = document.getElementById('statusLabel');
  var tccInput = document.getElementById('tcc');
  var rankInput = document.getElementById('rank');
  var vosInput = document.getElementById('vos');
  var noteInput = document.getElementById('note');
  var registryInput = document.getElementById('registry');
  var phoneInput = document.getElementById('phone');
  var emailInput = document.getElementById('email');
  var addressInput = document.getElementById('address');
  var dataUpdatedInput = document.getElementById('dataUpdated');
  var photoInput = document.getElementById('photoInput');
  var photoPreview = document.getElementById('photoPreview');
  var qrInput = document.getElementById('qrInput');
  var qrPreview = document.getElementById('qrPreview');
  var statusMsg = document.getElementById('statusMsg');
  var btnClear = document.getElementById('btnClear');

  var pendingPhoto = null;
  var pendingQr = null;

  function setStatus(text) {
    statusMsg.textContent = text || '';
  }

  function digitsOnly(str) {
    return String(str || '').replace(/\D/g, '');
  }

  function formatDateDigits(digits) {
    digits = digits.slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return digits.slice(0, 2) + '.' + digits.slice(2);
    return digits.slice(0, 2) + '.' + digits.slice(2, 4) + '.' + digits.slice(4);
  }

  function formatTimeDigits(digits) {
    digits = digits.slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + ':' + digits.slice(2);
  }

  function bindDateInput(input) {
    if (!input) return;
    input.addEventListener('input', function () {
      var formatted = formatDateDigits(digitsOnly(input.value));
      if (input.value !== formatted) input.value = formatted;
    });
    input.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text');
      input.value = formatDateDigits(digitsOnly(text));
    });
  }

  function bindTimeInput(input) {
    if (!input) return;
    input.addEventListener('input', function () {
      var formatted = formatTimeDigits(digitsOnly(input.value));
      if (input.value !== formatted) input.value = formatted;
    });
    input.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text');
      input.value = formatTimeDigits(digitsOnly(text));
    });
  }

  bindDateInput(birthDate);
  bindDateInput(deferralDate);
  bindDateInput(vlkDate);
  bindDateInput(docUpdatedDate);
  bindDateInput(dataUpdatedInput);
  bindTimeInput(docUpdatedTime);

  function showPhoto(dataUrl) {
    if (!dataUrl) {
      photoPreview.classList.add('is-empty');
      photoPreview.style.backgroundImage = '';
      return;
    }
    photoPreview.classList.remove('is-empty');
    photoPreview.style.backgroundImage = 'url("' + dataUrl + '")';
  }

  function showQr(dataUrl) {
    if (!dataUrl) {
      qrPreview.classList.add('is-empty');
      qrPreview.style.backgroundImage = '';
      return;
    }
    qrPreview.classList.remove('is-empty');
    qrPreview.style.backgroundImage = 'url("' + dataUrl + '")';
  }

  function loadForm() {
    var profile = ProfileCore.loadProfile();
    if (!profile) return;
    lastName.value = profile.lastName || '';
    firstName.value = profile.firstName || '';
    patronymic.value = profile.patronymic || '';
    birthDate.value = profile.birthDate || '';
    rnokpp.value = profile.rnokpp || '';
    deferralDate.value = profile.deferralDate || '';
    vlkDecision.value = profile.vlkDecision || '';
    vlkDate.value = profile.vlkDate || '';
    docUpdatedDate.value = profile.docUpdatedDate || '';
    docUpdatedTime.value = profile.docUpdatedTime || '';
    if (statusLabelInput) statusLabelInput.value = profile.statusLabel || '';
    if (tccInput) tccInput.value = profile.tcc || '';
    if (rankInput) rankInput.value = profile.rank || '';
    if (vosInput) vosInput.value = profile.vos || '';
    if (noteInput) noteInput.value = profile.note || '';
    if (registryInput) registryInput.value = profile.registry || '';
    if (phoneInput) phoneInput.value = profile.phone || '';
    if (emailInput) emailInput.value = profile.email || '';
    if (addressInput) addressInput.value = profile.address || '';
    if (dataUpdatedInput) dataUpdatedInput.value = profile.dataUpdated || '';
    pendingPhoto = profile.photoDataUrl || null;
    pendingQr = profile.qrDataUrl || null;
    showPhoto(pendingPhoto);
    showQr(pendingQr);
  }

  photoInput.addEventListener('change', function () {
    var file = photoInput.files && photoInput.files[0];
    if (!file) return;
    ProfileCore.resizeImage(file).then(function (dataUrl) {
      pendingPhoto = dataUrl;
      showPhoto(dataUrl);
      setStatus('');
    }).catch(function () {
      setStatus('Не вдалося обробити фото');
    });
  });

  qrInput.addEventListener('change', function () {
    var file = qrInput.files && qrInput.files[0];
    if (!file) return;
    ProfileCore.resizeImage(file, 900, 0.92).then(function (dataUrl) {
      pendingQr = dataUrl;
      showQr(dataUrl);
      setStatus('');
    }).catch(function () {
      setStatus('Не вдалося обробити QR');
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var profile = {
      lastName: lastName.value.trim(),
      firstName: firstName.value.trim(),
      patronymic: patronymic.value.trim(),
      birthDate: birthDate.value.trim(),
      rnokpp: rnokpp.value.trim(),
      deferralDate: deferralDate.value.trim(),
      vlkDecision: vlkDecision.value.trim(),
      vlkDate: vlkDate.value.trim(),
      docUpdatedDate: docUpdatedDate.value.trim(),
      docUpdatedTime: docUpdatedTime.value.trim(),
      statusLabel: statusLabelInput ? statusLabelInput.value.trim() : '',
      tcc: tccInput ? tccInput.value.trim() : '',
      rank: rankInput ? rankInput.value.trim() : '',
      vos: vosInput ? vosInput.value.trim() : '',
      note: noteInput ? noteInput.value.trim() : '',
      registry: registryInput ? registryInput.value.trim() : '',
      phone: phoneInput ? phoneInput.value.trim() : '',
      email: emailInput ? emailInput.value.trim() : '',
      address: addressInput ? addressInput.value.trim() : '',
      dataUpdated: dataUpdatedInput ? dataUpdatedInput.value.trim() : '',
      photoDataUrl: pendingPhoto || '',
      qrDataUrl: pendingQr || '',
    };

    if (!profile.lastName || !profile.firstName || !profile.patronymic) {
      setStatus('Заповніть прізвище, ім\'я та по батькові');
      return;
    }

    if (profile.birthDate && !/^\d{2}\.\d{2}\.\d{4}$/.test(profile.birthDate)) {
      setStatus('Дата народження: введіть 8 цифр (наприклад 30012001)');
      return;
    }

    if (profile.deferralDate && !/^\d{2}\.\d{2}\.\d{4}$/.test(profile.deferralDate)) {
      setStatus('Відсрочка до: введіть 8 цифр (наприклад 03082026)');
      return;
    }

    if (profile.vlkDate && !/^\d{2}\.\d{2}\.\d{4}$/.test(profile.vlkDate)) {
      setStatus('Дата ВЛК: введіть 8 цифр (наприклад 10022024)');
      return;
    }

    if (profile.docUpdatedDate && !/^\d{2}\.\d{2}\.\d{4}$/.test(profile.docUpdatedDate)) {
      setStatus('Дата оновлення: формат ДД.ММ.РРРР');
      return;
    }

    if (profile.docUpdatedTime && !/^\d{2}:\d{2}$/.test(profile.docUpdatedTime)) {
      setStatus('Час оновлення: формат ГГ:ХХ');
      return;
    }

    ProfileCore.saveProfile(profile);
    setStatus('Збережено. Повертаємось…');
    setTimeout(function () {
      window.location.href = './';
    }, 600);
  });

  btnClear.addEventListener('click', function () {
    if (!confirm('Скинути збережений профіль?')) return;
    ProfileCore.clearProfile();
    form.reset();
    pendingPhoto = null;
    pendingQr = null;
    showPhoto(null);
    showQr(null);
    photoInput.value = '';
    qrInput.value = '';
    if (statusLabelInput) statusLabelInput.value = '';
    if (tccInput) tccInput.value = '';
    if (rankInput) rankInput.value = '';
    if (vosInput) vosInput.value = '';
    if (noteInput) noteInput.value = '';
    if (registryInput) registryInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (emailInput) emailInput.value = '';
    if (addressInput) addressInput.value = '';
    if (dataUpdatedInput) dataUpdatedInput.value = '';
    setStatus('Профіль скинуто');
  });

  loadForm();
})();
