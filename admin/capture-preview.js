(function () {
  'use strict';

  var html2canvasPromise = null;

  function isPreviewContext() {
    return new URLSearchParams(window.location.search).get('preview') === '1'
      || window.parent !== window;
  }

  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (html2canvasPromise) return html2canvasPromise;
    html2canvasPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.async = true;
      script.onload = function () {
        if (window.html2canvas) resolve(window.html2canvas);
        else reject(new Error('html2canvas unavailable'));
      };
      script.onerror = function () { reject(new Error('html2canvas load failed')); };
      document.head.appendChild(script);
    });
    return html2canvasPromise;
  }

  function captureTarget(selector) {
    var target = document.querySelector(selector || '.frame') || document.querySelector('.screen') || document.body;
    var bg = window.getComputedStyle(document.body).backgroundColor || '#ffffff';

    return loadHtml2Canvas().then(function (html2canvas) {
      return html2canvas(target, {
        backgroundColor: bg,
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: function (doc) {
          doc.documentElement.classList.remove('drag-mode');
          doc.querySelectorAll('.drag-resize-handle').forEach(function (node) { node.remove(); });
          doc.querySelectorAll('[data-ed]').forEach(function (node) {
            node.classList.remove('is-dragging', 'is-resizing', 'has-resize-handles');
          });
        },
      });
    }).then(function (canvas) {
      return canvas.toDataURL('image/png');
    });
  }

  if (!isPreviewContext()) return;

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'admin-capture-request') return;

    var requestId = event.data.requestId;
    var selector = event.data.selector || '.frame';

    captureTarget(selector).then(function (dataUrl) {
      if (!event.source) return;
      event.source.postMessage({
        type: 'admin-capture-result',
        requestId: requestId,
        dataUrl: dataUrl,
      }, '*');
    }).catch(function (err) {
      if (!event.source) return;
      event.source.postMessage({
        type: 'admin-capture-result',
        requestId: requestId,
        error: err && err.message ? err.message : 'capture failed',
      }, '*');
    });
  });
})();
