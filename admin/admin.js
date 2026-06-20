(function () {
  'use strict';

  var currentPage = 'index-docs';
  var config = null;
  var savedSnapshot = '';
  var previewReady = false;
  var fullscreenReady = false;
  var fullscreenOpen = false;
  var previewTimer = null;

  var pageNav = document.getElementById('pageNav');
  var pageTitle = document.getElementById('pageTitle');
  var saveStatus = document.getElementById('saveStatus');
  var itemsList = document.getElementById('itemsList');
  var jsonPreview = document.getElementById('jsonPreview');
  var toast = document.getElementById('toast');
  var previewFrame = document.getElementById('previewFrame');
  var previewLabel = document.getElementById('previewLabel');
  var dirtyStatus = document.getElementById('dirtyStatus');
  var btnSave = document.getElementById('btnSave');
  var fullscreenModal = document.getElementById('fullscreenModal');
  var fullscreenFrame = document.getElementById('fullscreenFrame');
  var fullscreenPhone = document.getElementById('fullscreenPhone');
  var fullscreenLabel = document.getElementById('fullscreenLabel');
  var fullscreenPageNav = document.getElementById('fullscreenPageNav');
  var fullscreenItemsList = document.getElementById('fullscreenItemsList');
  var fullscreenSidebarMeta = document.getElementById('fullscreenSidebarMeta');
  var fullscreenHint = document.getElementById('fullscreenHint');
  var fullscreenPreviewPanel = document.getElementById('fullscreenPreviewPanel');
  var fullscreenDiffPanel = document.getElementById('fullscreenDiffPanel');
  var btnFsModePreview = document.getElementById('btnFsModePreview');
  var btnFsModeDiff = document.getElementById('btnFsModeDiff');

  var fullscreenMode = 'preview';
  var screenshotDiff = null;

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.hidden = true; }, 2200);
  }

  function stylePropMeta(key) {
    return AdminCore.STYLE_PROPS.find(function (p) { return p.key === key; });
  }

  function parseStyleInput(key, raw) {
    if (raw == null || raw === '') return null;
    var meta = stylePropMeta(key);
    if (!meta || !meta.unit) return String(raw);
    var num = parseFloat(raw);
    if (Number.isNaN(num)) return null;
    return num + meta.unit;
  }

  function stripUnit(val) {
    if (val == null) return '';
    return String(val).replace(/(px|em|rem|%)$/, '');
  }

  function configSnapshot() {
    return JSON.stringify(config);
  }

  function isDirty() {
    return configSnapshot() !== savedSnapshot;
  }

  function updateDirtyUI() {
    var dirty = isDirty();
    btnSave.disabled = !dirty;
    btnSave.classList.toggle('is-dirty', dirty);
    dirtyStatus.classList.toggle('is-dirty', dirty);
    dirtyStatus.textContent = dirty
      ? 'Є незбережені зміни — перевірте превʼю і натисніть «Зберегти дані»'
      : 'Усі зміни збережено';
  }

  function updateJsonPreview() {
    jsonPreview.value = AdminCore.exportConfigJson(config);
  }

  function setStatus(text) {
    saveStatus.textContent = text;
  }

  function markSaved() {
    savedSnapshot = configSnapshot();
    updateDirtyUI();
    updateJsonPreview();
  }

  function persist() {
    AdminCore.saveToStorage(config);
    markSaved();
    setStatus('Збережено ' + new Date().toLocaleString('uk-UA'));
  }

  function onConfigChange() {
    updateDirtyUI();
    updateJsonPreview();
    schedulePreview();
  }

  function getPageMeta(pageId) {
    return AdminCore.PAGES.find(function (p) { return p.id === pageId; });
  }

  function pageIdFromLocation(pathname, hash) {
    if (pathname.indexOf('/info') !== -1) return 'info';
    if (hash === '#feed') return 'index-feed';
    return 'index-docs';
  }

  function syncPageFromFrame(frame) {
    if (!frame || !frame.contentWindow) return;
    try {
      var loc = frame.contentWindow.location;
      var pageId = pageIdFromLocation(loc.pathname, loc.hash);
      if (pageId && pageId !== currentPage) {
        setCurrentPage(pageId, { loadFrame: false });
      }
    } catch (e) { /* ignore */ }
  }

  function renderFullscreenPageNav() {
    if (!fullscreenPageNav) return;
    fullscreenPageNav.innerHTML = '';
    AdminCore.PAGES.forEach(function (page) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'admin-fullscreen-page-btn' + (page.id === currentPage ? ' active' : '');
      btn.textContent = page.label;
      btn.addEventListener('click', function () {
        setCurrentPage(page.id, { loadFrame: true, frameTarget: 'fullscreen' });
      });
      fullscreenPageNav.appendChild(btn);
    });
  }

  function setCurrentPage(pageId, options) {
    options = options || {};
    var page = getPageMeta(pageId);
    if (!page) return;
    if (currentPage === pageId && !options.force) {
      renderFullscreenPageNav();
      return;
    }

    currentPage = pageId;
    pageTitle.textContent = page.label;
    previewLabel.textContent = page.label;
    if (fullscreenOpen) fullscreenLabel.textContent = page.label;

    renderNav();
    renderAllItems();
    renderFullscreenPageNav();

    if (options.loadFrame === false) return;

    if (options.frameTarget === 'fullscreen' || fullscreenOpen) {
      fullscreenReady = false;
      fullscreenFrame.src = page.previewPath;
    }
    if (options.frameTarget !== 'fullscreen') {
      previewReady = false;
      previewFrame.src = page.previewPath;
    }
  }

  function previewUrl() {
    var page = getPageMeta(currentPage);
    return page ? page.previewPath : '/?preview=1';
  }

  function previewTab() {
    if (currentPage === 'index-feed') return 'feed';
    if (currentPage === 'index-docs') return 'documents';
    return null;
  }

  function postToFrame(frameWindow, dragMode) {
    if (!frameWindow) return;
    frameWindow.postMessage({
      type: 'admin-preview',
      config: config,
      tab: previewTab(),
      dragMode: !!dragMode,
    }, '*');
  }

  function pushPreview() {
    postToFrame(previewFrame.contentWindow, false);
    if (fullscreenOpen) postToFrame(fullscreenFrame.contentWindow, true);
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(pushPreview, 80);
  }

  function scaleFullscreenPhone() {
    if (fullscreenMode !== 'preview') return;
    var stage = fullscreenPreviewPanel.querySelector('.admin-fullscreen-stage');
    if (!stage) return;
    var pad = 32;
    var scale = Math.min(
      (stage.clientWidth - pad) / 390,
      (stage.clientHeight - pad) / 844,
      1.4
    );
    fullscreenPhone.style.transform = 'scale(' + scale + ')';
  }

  function updateFullscreenHint() {
    if (!fullscreenHint) return;
    fullscreenHint.textContent = fullscreenMode === 'diff'
      ? 'Завантажте 2 скрини · M — область · L — лінійка · копіюйте заміри'
      : 'Редагуйте текст і стилі зліва · перетягуйте текст у превʼю';
  }

  function ensureScreenshotDiff() {
    if (screenshotDiff || typeof AdminScreenshotDiff === 'undefined') return;
    screenshotDiff = AdminScreenshotDiff.init(fullscreenDiffPanel, {
      active: function () { return fullscreenOpen && fullscreenMode === 'diff'; },
    });
  }

  function destroyScreenshotDiff() {
    if (!screenshotDiff) return;
    screenshotDiff.destroy();
    screenshotDiff = null;
  }

  function setFullscreenMode(mode) {
    if (mode !== 'preview' && mode !== 'diff') return;
    fullscreenMode = mode;

    btnFsModePreview.classList.toggle('active', mode === 'preview');
    btnFsModeDiff.classList.toggle('active', mode === 'diff');
    btnFsModePreview.setAttribute('aria-selected', mode === 'preview' ? 'true' : 'false');
    btnFsModeDiff.setAttribute('aria-selected', mode === 'diff' ? 'true' : 'false');

    fullscreenPreviewPanel.classList.toggle('is-active', mode === 'preview');
    fullscreenPreviewPanel.hidden = mode !== 'preview';
    fullscreenDiffPanel.classList.toggle('is-active', mode === 'diff');
    fullscreenDiffPanel.hidden = mode !== 'diff';

    updateFullscreenHint();

    if (mode === 'preview') {
      scaleFullscreenPhone();
      if (fullscreenReady) postToFrame(fullscreenFrame.contentWindow, true);
    } else {
      ensureScreenshotDiff();
      if (screenshotDiff) screenshotDiff.fitToView();
    }
  }

  function openFullscreen() {
    fullscreenOpen = true;
    fullscreenModal.hidden = false;
    fullscreenModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var page = getPageMeta(currentPage);
    fullscreenLabel.textContent = page ? page.label : currentPage;
    fullscreenReady = false;
    fullscreenFrame.src = previewUrl();
    renderFullscreenPageNav();
    renderItems(fullscreenItemsList, 'fs-');
    setFullscreenMode('preview');
    scaleFullscreenPhone();
  }

  function closeFullscreen() {
    fullscreenOpen = false;
    fullscreenModal.classList.remove('is-open');
    fullscreenModal.hidden = true;
    document.body.style.overflow = '';
    destroyScreenshotDiff();
    setFullscreenMode('preview');
    postToFrame(previewFrame.contentWindow, false);
    fullscreenFrame.src = 'about:blank';
  }

  function handleDragUpdate(id, translateX, translateY) {
    if (!config.elements[id]) {
      config.elements[id] = { text: '', styles: {} };
    }
    if (!config.elements[id].styles) config.elements[id].styles = {};

    if (!translateX || translateX === '0px') delete config.elements[id].styles.translateX;
    else config.elements[id].styles.translateX = translateX;

    if (!translateY || translateY === '0px') delete config.elements[id].styles.translateY;
    else config.elements[id].styles.translateY = translateY;

    syncTranslateInputs(id);
    onConfigChange();
  }

  function renderItems(target, idPrefix) {
    idPrefix = idPrefix || '';
    var container = target || itemsList;
    var page = getPageMeta(currentPage);
    if (target === itemsList) {
      pageTitle.textContent = page ? page.label : currentPage;
    }
    if (target === fullscreenItemsList && fullscreenSidebarMeta) {
      fullscreenSidebarMeta.textContent = page ? page.label : currentPage;
    }

    container.innerHTML = '';

    AdminCore.SCHEMA.filter(function (s) { return s.page === currentPage; }).forEach(function (schemaItem) {
      var data = config.elements[schemaItem.id] || { text: '', styles: {} };
      if (!config.elements[schemaItem.id]) config.elements[schemaItem.id] = data;

      var details = document.createElement('details');
      details.className = 'admin-item';
      details.open = false;

      var summary = document.createElement('summary');
      summary.textContent = schemaItem.label;
      details.appendChild(summary);

      var body = document.createElement('div');
      body.className = 'admin-item-body';

      if (schemaItem.text !== false) {
        var textField = document.createElement('div');
        textField.className = 'admin-field';

        var textFieldId = idPrefix + 'text-' + schemaItem.id;
        var textLabel = document.createElement('label');
        textLabel.textContent = schemaItem.html ? 'Текст (HTML дозволено)' : 'Текст';
        textLabel.setAttribute('for', textFieldId);

        var textInput = schemaItem.multiline ? document.createElement('textarea') : document.createElement('input');
        textInput.id = textFieldId;
        textInput.dataset.fieldKey = 'text-' + schemaItem.id;
        if (!schemaItem.multiline) textInput.type = 'text';
        textInput.value = data.text || '';

        textInput.addEventListener('input', function () {
          config.elements[schemaItem.id].text = textInput.value;
          syncLinkedFields(textInput.dataset.fieldKey, textInput.value, textInput);
          onConfigChange();
        });

        textField.appendChild(textLabel);
        textField.appendChild(textInput);
        body.appendChild(textField);
      }

      var stylesGrid = document.createElement('div');
      stylesGrid.className = 'admin-styles';

      (schemaItem.styles || []).forEach(function (styleKey) {
        var val = (data.styles && data.styles[styleKey]) || (schemaItem.defaults.styles[styleKey] || '');
        var field = renderStyleField(schemaItem.id, styleKey, val, idPrefix);
        if (field) stylesGrid.appendChild(field);
      });

      body.appendChild(stylesGrid);
      details.appendChild(body);
      container.appendChild(details);
    });
  }

  function syncLinkedFields(fieldKey, value, source) {
    document.querySelectorAll('[data-field-key="' + fieldKey + '"]').forEach(function (node) {
      if (node !== source && node.value !== value) node.value = value;
    });
  }

  function syncTranslateInputs(id) {
    var xVal = stripUnit(config.elements[id] && config.elements[id].styles && config.elements[id].styles.translateX);
    var yVal = stripUnit(config.elements[id] && config.elements[id].styles && config.elements[id].styles.translateY);
    syncLinkedFields(id + '-translateX', xVal);
    syncLinkedFields(id + '-translateY', yVal);
  }

  function renderAllItems() {
    renderItems(itemsList, '');
    if (fullscreenOpen) renderItems(fullscreenItemsList, 'fs-');
  }

  function loadPreview() {
    previewReady = false;
    var page = getPageMeta(currentPage);
    previewLabel.textContent = page ? page.label : currentPage;
    previewFrame.src = previewUrl();
    if (fullscreenOpen) {
      fullscreenReady = false;
      fullscreenLabel.textContent = page ? page.label : currentPage;
      fullscreenFrame.src = previewUrl();
    }
  }

  function renderNav() {
    pageNav.innerHTML = '';
    AdminCore.PAGES.forEach(function (page) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'admin-nav-btn' + (page.id === currentPage ? ' active' : '');
      btn.textContent = page.label;
      btn.addEventListener('click', function () {
        setCurrentPage(page.id, { frameTarget: 'preview' });
      });
      pageNav.appendChild(btn);
    });
  }

  function renderStyleField(itemId, styleKey, value, idPrefix) {
    idPrefix = idPrefix || '';
    var meta = stylePropMeta(styleKey);
    if (!meta) return null;

    var wrap = document.createElement('div');
    wrap.className = 'admin-field';

    var fieldKey = itemId + '-' + styleKey;
    var fieldId = idPrefix + fieldKey;
    var label = document.createElement('label');
    label.textContent = meta.label + (meta.unit ? ' (' + meta.unit + ')' : '');
    label.setAttribute('for', fieldId);

    var input = document.createElement('input');
    input.type = 'number';
    input.id = fieldId;
    input.dataset.fieldKey = fieldKey;
    input.step = meta.step || 1;
    input.value = stripUnit(value);

    input.addEventListener('input', function () {
      var parsed = parseStyleInput(styleKey, input.value);
      if (parsed == null && input.value !== '') return;
      if (!config.elements[itemId].styles) config.elements[itemId].styles = {};
      if (parsed == null) delete config.elements[itemId].styles[styleKey];
      else config.elements[itemId].styles[styleKey] = parsed;
      syncLinkedFields(fieldKey, input.value, input);
      onConfigChange();
    });

    wrap.appendChild(label);
    wrap.appendChild(input);
    return wrap;
  }

  function resetPage() {
    AdminCore.SCHEMA.filter(function (s) { return s.page === currentPage; }).forEach(function (s) {
      config.elements[s.id] = {
        text: s.defaults.text,
        styles: Object.assign({}, s.defaults.styles),
      };
    });
    renderAllItems();
    onConfigChange();
    showToast('Сторінку скинуто — натисніть «Зберегти дані»');
  }

  function resetAll() {
    config = AdminCore.buildDefaultsConfig();
    AdminCore.clearStorage();
    renderAllItems();
    onConfigChange();
    pushPreview();
    showToast('Усі налаштування скинуто — натисніть «Зберегти дані»');
  }

  function initActions() {
    btnSave.addEventListener('click', function () {
      persist();
      showToast('Дані збережено');
    });

    document.getElementById('btnResetPage').addEventListener('click', resetPage);
    document.getElementById('btnResetAll').addEventListener('click', resetAll);
    document.getElementById('btnReloadPreview').addEventListener('click', loadPreview);
    document.getElementById('btnFullscreen').addEventListener('click', openFullscreen);
    document.getElementById('btnCloseFullscreen').addEventListener('click', closeFullscreen);
    btnFsModePreview.addEventListener('click', function () { setFullscreenMode('preview'); });
    btnFsModeDiff.addEventListener('click', function () { setFullscreenMode('diff'); });

    document.getElementById('btnCopy').addEventListener('click', function () {
      navigator.clipboard.writeText(AdminCore.exportConfigJson(config)).then(function () {
        showToast('JSON скопійовано');
      });
    });

    document.getElementById('btnDownload').addEventListener('click', function () {
      AdminCore.downloadConfig(config, 'config.json');
      showToast('Завантажте файл у admin/config.json');
    });

    document.getElementById('importFile').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var imported = JSON.parse(reader.result);
          config = AdminCore.migrateConfig(AdminCore.mergeConfig(AdminCore.buildDefaultsConfig(), imported));
          renderAllItems();
          onConfigChange();
          pushPreview();
          showToast('Імпорт успішний — перевірте превʼю');
        } catch (err) {
          showToast('Помилка JSON');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    window.addEventListener('message', function (event) {
      if (!event.data) return;

      if (event.data.type === 'admin-set-page') {
        setCurrentPage(event.data.page, { loadFrame: false });
        return;
      }

      if (event.data.type === 'admin-preview-ready') {
        if (event.source === fullscreenFrame.contentWindow) {
          fullscreenReady = true;
          syncPageFromFrame(fullscreenFrame);
          postToFrame(fullscreenFrame.contentWindow, true);
        } else if (event.source === previewFrame.contentWindow) {
          previewReady = true;
          syncPageFromFrame(previewFrame);
          postToFrame(previewFrame.contentWindow, false);
        }
        return;
      }

      if (event.data.type === 'admin-drag-update') {
        handleDragUpdate(event.data.id, event.data.translateX, event.data.translateY);
      }
    });

    previewFrame.addEventListener('load', function () {
      previewReady = false;
      syncPageFromFrame(previewFrame);
    });
    fullscreenFrame.addEventListener('load', function () {
      fullscreenReady = false;
      syncPageFromFrame(fullscreenFrame);
    });

    window.addEventListener('resize', function () {
      if (!fullscreenOpen) return;
      if (fullscreenMode === 'preview') scaleFullscreenPhone();
      else if (screenshotDiff) screenshotDiff.fitToView();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && fullscreenOpen) {
        e.preventDefault();
        closeFullscreen();
      }
    }, true);
  }

  AdminCore.loadConfig().then(function (loaded) {
    config = loaded;
    fullscreenModal.classList.remove('is-open');
    fullscreenModal.hidden = true;
    fullscreenOpen = false;
    markSaved();
    renderNav();
    renderItems(itemsList, '');
    setStatus('Редагуйте — зміни одразу в превʼю. Збережіть кнопкою внизу.');
    initActions();
    loadPreview();
  });
})();
