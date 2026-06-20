(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var isEmbedded = window.parent !== window;
  var isPreview = params.get('preview') === '1' || isEmbedded;

  function boot(config) {
    var data = config || null;
    if (data) {
      if (window.ProfileCore) ProfileCore.applyAll(data);
      else AdminCore.applyConfig(data);
      return Promise.resolve();
    }
    return AdminCore.loadConfig().then(function (loaded) {
      if (window.ProfileCore) ProfileCore.applyAll(loaded);
      else AdminCore.applyConfig(loaded);
    });
  }

  function handlePreviewMessage(event) {
    if (!event.data || event.data.type !== 'admin-preview') return;
    if (window.ProfileCore) ProfileCore.applyAll(event.data.config);
    else AdminCore.applyConfig(event.data.config);
    if (event.data.tab && typeof window.switchTab === 'function') {
      window.switchTab(event.data.tab);
    }
    if (window.PreviewDrag) {
      if (event.data.dragMode != null) PreviewDrag.setDragMode(event.data.dragMode);
      PreviewDrag.bindElements();
    }
  }

  if (isPreview) {
    document.documentElement.classList.add('preview-mode');
    window.addEventListener('message', handlePreviewMessage);

    function signalReady() {
      window.parent.postMessage({ type: 'admin-preview-ready' }, '*');
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        signalReady();
        boot();
      });
    } else {
      signalReady();
      boot();
    }
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { boot(); });
  } else {
    boot();
  }

  window.addEventListener('pageshow', function () {
    if (window.ProfileCore) {
      ProfileCore.applyDocUpdate();
      ProfileCore.applyProfile();
    }
  });

  window.addEventListener('storage', function (event) {
    if (!window.ProfileCore || event.key !== ProfileCore.STORAGE_KEY) return;
    AdminCore.loadConfig().then(function (loaded) {
      ProfileCore.applyAll(loaded);
    });
  });
})();
