(function () {
  'use strict';

  var form = document.getElementById('profileForm');
  var lastName = document.getElementById('lastName');
  var firstName = document.getElementById('firstName');
  var patronymic = document.getElementById('patronymic');
  var birthDate = document.getElementById('birthDate');
  var docUpdatedDate = document.getElementById('docUpdatedDate');
  var docUpdatedTime = document.getElementById('docUpdatedTime');
  var photoInput = document.getElementById('photoInput');
  var photoPreview = document.getElementById('photoPreview');
  var statusMsg = document.getElementById('statusMsg');
  var btnClear = document.getElementById('btnClear');

  var pendingPhoto = null;

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
  bindDateInput(docUpdatedDate);
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

  function loadForm() {
    var profile = ProfileCore.loadProfile();
    if (!profile) return;
    lastName.value = profile.lastName || '';
    firstName.value = profile.firstName || '';
    patronymic.value = profile.patronymic || '';
    birthDate.value = profile.birthDate || '';
    docUpdatedDate.value = profile.docUpdatedDate || '';
    docUpdatedTime.value = profile.docUpdatedTime || '';
    pendingPhoto = profile.photoDataUrl || null;
    showPhoto(pendingPhoto);
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

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var profile = {
      lastName: lastName.value.trim(),
      firstName: firstName.value.trim(),
      patronymic: patronymic.value.trim(),
      birthDate: birthDate.value.trim(),
      docUpdatedDate: docUpdatedDate.value.trim(),
      docUpdatedTime: docUpdatedTime.value.trim(),
      photoDataUrl: pendingPhoto || ''
    };

    if (!profile.lastName || !profile.firstName || !profile.patronymic) {
      setStatus('Заповніть прізвище, ім\'я та по батькові');
      return;
    }

    if (profile.birthDate && !/^\d{2}\.\d{2}\.\d{4}$/.test(profile.birthDate)) {
      setStatus('Дата народження: введіть 8 цифр (наприклад 30012001)');
      return;
    }

    if (profile.docUpdatedDate && !/^\d{2}\.\d{2}\.\d{4}$/.test(profile.docUpdatedDate)) {
      setStatus('Дата оновлення: формат ДД.ММ.РРРР (наприклад 19.06.2026)');
      return;
    }

    if (profile.docUpdatedTime && !/^\d{2}:\d{2}$/.test(profile.docUpdatedTime)) {
      setStatus('Час оновлення: формат ГГ:ХХ (наприклад 13:37)');
      return;
    }

    ProfileCore.saveProfile(profile);
    setStatus('Збережено. Повертаємось…');
    setTimeout(function () {
      window.location.href = '/';
    }, 600);
  });

  btnClear.addEventListener('click', function () {
    if (!confirm('Скинути збережений профіль?')) return;
    ProfileCore.clearProfile();
    form.reset();
    pendingPhoto = null;
    showPhoto(null);
    photoInput.value = '';
    setStatus('Профіль скинуто');
  });

  loadForm();
})();
