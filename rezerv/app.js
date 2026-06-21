(function () {
  'use strict';

  var frame = document.getElementById('app');
  var navItems = document.querySelectorAll('.nav-item[data-tab]');
  var tabPanels = document.querySelectorAll('.tab-panel');
  var openSheetBtn = document.getElementById('openSheet');
  var sheetOverlay = document.getElementById('sheetOverlay');
  var sheetBackdrop = document.getElementById('sheetBackdrop');
  var viewDocumentBtn = document.getElementById('viewDocumentBtn');
  var docSheetOverlay = document.getElementById('docSheetOverlay');
  var docSheet = document.getElementById('docSheet');
  var docSheetBackdrop = document.getElementById('docSheetBackdrop');
  var docSheetDrag = document.getElementById('docSheetDrag');
  var secretFinesLink = document.getElementById('secretFinesLink');
  var secretTaps = 0;
  var secretTapTimer = null;

  function isPreviewMode() {
    return new URLSearchParams(window.location.search).get('preview') === '1'
      || window.parent !== window;
  }

  function secretPageUrl() {
    return isPreviewMode() ? 'secret.html?preview=1' : 'secret.html';
  }

  function tabFromHash() {
    var hash = (window.location.hash || '').replace('#', '');
    if (hash === 'services' || hash === 'vacancies' || hash === 'menu') return hash;
    return 'id';
  }

  function switchTab(tab) {
    if (!frame) return;
    frame.dataset.tab = tab;
    navItems.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    tabPanels.forEach(function (panel) {
      panel.classList.toggle('active', panel.dataset.tab === tab);
    });

    if (!isPreviewMode()) {
      var newHash = tab === 'id' ? '' : '#' + tab;
      if (window.location.hash !== newHash) {
        history.replaceState(null, '', window.location.pathname + window.location.search + newHash);
      }
    }

    if (isPreviewMode() && window.parent !== window) {
      var pageMap = {
        id: 'rezerv-id',
        services: 'rezerv-services',
        vacancies: 'rezerv-vacancies',
        menu: 'rezerv-menu'
      };
      window.parent.postMessage({ type: 'admin-set-page', page: pageMap[tab] }, '*');
    }
  }

  window.switchTab = switchTab;

  navItems.forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(btn.dataset.tab);
    });
  });

  var cardFlip = document.getElementById('idCardFlip');
  var cardFlipInner = document.getElementById('idCardFlipInner');
  var cardFlipped = false;
  var flipBusy = false;

  function flipToBack() {
    if (flipBusy || cardFlipped || !cardFlipInner) return;
    cardFlipped = true;
    cardFlipInner.style.transition = '';
    cardFlipInner.style.transform = '';
    if (cardFlip) cardFlip.classList.add('is-flipped');
  }

  function flipToFront() {
    if (flipBusy || !cardFlipped || !cardFlipInner) return;
    flipBusy = true;

    cardFlipInner.style.transform = 'rotateY(360deg)';

    function finishFlip() {
      cardFlipInner.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(flipFallback);
      cardFlipInner.style.transition = 'none';
      cardFlipInner.style.transform = 'rotateY(0deg)';
      if (cardFlip) cardFlip.classList.remove('is-flipped');
      cardFlipped = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          cardFlipInner.style.transition = '';
          cardFlipInner.style.transform = '';
          flipBusy = false;
        });
      });
    }

    function onTransitionEnd(e) {
      if (e.target !== cardFlipInner || e.propertyName !== 'transform') return;
      finishFlip();
    }

    var flipFallback = setTimeout(finishFlip, 700);
    cardFlipInner.addEventListener('transitionend', onTransitionEnd);
  }

  if (cardFlip) {
    cardFlip.addEventListener('click', function (e) {
      if (flipBusy) return;
      if (e.target.closest('#openSheet') || e.target.closest('.id-fab')) return;

      if (cardFlipped) {
        flipToFront();
        return;
      }

      flipToBack();
    });
  }

  function closeSheet() {
    document.body.classList.remove('sheet-open');
    if (sheetOverlay) sheetOverlay.hidden = true;
  }

  function openSheet() {
    if (docSheetOverlay && !docSheetOverlay.hidden) return;
    document.body.classList.add('sheet-open');
    if (sheetOverlay) sheetOverlay.hidden = false;
  }

  function getTranslateY(el) {
    if (!el) return 0;
    var tr = window.getComputedStyle(el).transform;
    if (!tr || tr === 'none') return 0;
    var m = tr.match(/matrix\(([^)]+)\)/);
    if (m) return parseFloat(m[1].split(',')[5]) || 0;
    var m3 = tr.match(/matrix3d\(([^)]+)\)/);
    if (m3) return parseFloat(m3[1].split(',')[13]) || 0;
    return 0;
  }

  function closeDocSheet() {
    if (!docSheetOverlay || docSheetOverlay.hidden) return;
    document.body.classList.remove('doc-sheet-open');
    if (docSheet) {
      docSheet.classList.remove('is-dragging');
      docSheetOverlay.classList.remove('is-open');
      docSheet.style.transform = 'translateY(100%)';
    }
    setTimeout(function () {
      if (docSheetOverlay) docSheetOverlay.hidden = true;
      if (docSheet) docSheet.style.transform = '';
    }, 320);
  }

  function openDocSheet() {
    if (!docSheetOverlay || !docSheet) return;
    closeSheet();
    docSheet.style.transform = 'translateY(100%)';
    docSheet.classList.remove('is-dragging');
    docSheetOverlay.hidden = false;
    docSheetOverlay.classList.remove('is-open');
    document.body.classList.add('doc-sheet-open');
    if (window.ProfileCore && typeof window.ProfileCore.applyProfile === 'function') {
      window.ProfileCore.applyProfile();
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        docSheet.style.transform = '';
        docSheetOverlay.classList.add('is-open');
        if (window.RezervTicker && typeof window.RezervTicker.init === 'function') {
          window.RezervTicker.init();
        }
      });
    });
  }

  var docDragState = null;

  function onDocPointerDown(e) {
    if (!docSheet || e.button > 0) return;
    docDragState = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startTranslate: getTranslateY(docSheet),
    };
    docSheet.classList.add('is-dragging');
    if (docSheetDrag && docSheetDrag.setPointerCapture) {
      docSheetDrag.setPointerCapture(e.pointerId);
    }
  }

  function onDocPointerMove(e) {
    if (!docDragState || e.pointerId !== docDragState.pointerId || !docSheet) return;
    var dy = e.clientY - docDragState.startY;
    var next = Math.max(0, docDragState.startTranslate + dy);
    docSheet.style.transform = 'translateY(' + next + 'px)';
  }

  function onDocPointerUp(e) {
    if (!docDragState || e.pointerId !== docDragState.pointerId || !docSheet) return;
    if (docSheetDrag && docSheetDrag.releasePointerCapture) {
      try { docSheetDrag.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    var offset = getTranslateY(docSheet);
    var threshold = Math.min(docSheet.offsetHeight * 0.22, 140);
    docSheet.classList.remove('is-dragging');
    docDragState = null;
    if (offset > threshold) {
      closeDocSheet();
      return;
    }
    docSheet.style.transform = 'translateY(0)';
  }

  closeSheet();

  if (openSheetBtn) {
    openSheetBtn.addEventListener('click', openSheet);
  }
  if (sheetBackdrop) {
    sheetBackdrop.addEventListener('click', closeSheet);
  }
  if (viewDocumentBtn) {
    viewDocumentBtn.addEventListener('click', openDocSheet);
  }
  if (docSheetBackdrop) {
    docSheetBackdrop.addEventListener('click', closeDocSheet);
  }
  if (docSheetDrag) {
    docSheetDrag.addEventListener('pointerdown', onDocPointerDown);
    docSheetDrag.addEventListener('pointermove', onDocPointerMove);
    docSheetDrag.addEventListener('pointerup', onDocPointerUp);
    docSheetDrag.addEventListener('pointercancel', onDocPointerUp);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (docSheetOverlay && !docSheetOverlay.hidden) {
      closeDocSheet();
      return;
    }
    if (sheetOverlay && !sheetOverlay.hidden) closeSheet();
  });

  window.addEventListener('pageshow', function () {
    if (docSheetOverlay && docSheetOverlay.hidden) document.body.classList.remove('doc-sheet-open');
    if (sheetOverlay && sheetOverlay.hidden) document.body.classList.remove('sheet-open');
  });

  function bindSecretTap(el) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      if (isPreviewMode()) return;
      e.preventDefault();
      secretTaps += 1;
      clearTimeout(secretTapTimer);
      secretTapTimer = setTimeout(function () { secretTaps = 0; }, 900);
      if (secretTaps >= 5) {
        secretTaps = 0;
        window.location.href = secretPageUrl();
      }
    });
  }

  bindSecretTap(secretFinesLink);

  switchTab(tabFromHash());
  window.addEventListener('hashchange', function () {
    switchTab(tabFromHash());
  });
})();
