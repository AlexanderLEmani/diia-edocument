(function () {
  'use strict';

  var dragMode = false;
  var active = null;
  var captureEl = null;
  var pointerId = null;
  var mode = null;
  var resizeAxis = null;
  var startPointer = { x: 0, y: 0 };
  var startTranslate = { x: 0, y: 0 };
  var startSize = { width: 0, height: 0 };
  var lastConfig = null;

  function parsePx(val) {
    if (val == null || val === '') return 0;
    return parseFloat(String(val).replace('px', '')) || 0;
  }

  function schemaItem(id) {
    if (!id || typeof AdminCore === 'undefined') return null;
    return AdminCore.schemaById()[id];
  }

  function isDraggable(el) {
    if (!el || !el.getAttribute) return false;
    var id = el.getAttribute('data-ed');
    var item = schemaItem(id);
    if (!item) return false;
    if (item.selector && item.selector !== '[data-ed="' + id + '"]') return false;
    return true;
  }

  function isResizable(el) {
    var item = schemaItem(el && el.getAttribute('data-ed'));
    return !!(item && item.resizable);
  }

  function resizeMinFor(id) {
    var item = schemaItem(id);
    if (item && item.resizeMin) return item.resizeMin;
    if (id === 'rezerv-card') return { width: 200, height: 280 };
    return { width: 16, height: 16 };
  }

  function dragAxisFor(id) {
    var item = schemaItem(id);
    return (item && item.dragAxis) || 'xy';
  }

  function setDragMode(enabled) {
    dragMode = !!enabled;
    document.documentElement.classList.toggle('drag-mode', dragMode);
    if (dragMode) bindElements();
    else clearResizeHandles();
  }

  function getTranslateFromConfig(id) {
    if (lastConfig && lastConfig.elements && lastConfig.elements[id]) {
      var styles = lastConfig.elements[id].styles || {};
      return { x: parsePx(styles.translateX), y: parsePx(styles.translateY) };
    }
    return { x: 0, y: 0 };
  }

  function getSizeFromConfig(id) {
    if (lastConfig && lastConfig.elements && lastConfig.elements[id]) {
      var styles = lastConfig.elements[id].styles || {};
      return {
        width: parsePx(styles.width),
        height: parsePx(styles.height),
      };
    }
    return { width: 0, height: 0 };
  }

  function applyLocalTranslate(el, x, y) {
    var parts = [];
    if (x) parts.push('translateX(' + x + 'px)');
    if (y) parts.push('translateY(' + y + 'px)');
    if (parts.length) el.style.transform = parts.join(' ');
    else el.style.removeProperty('transform');
  }

  function applyLocalSize(el, width, height) {
    if (width > 0) el.style.width = Math.round(width) + 'px';
    if (height > 0) el.style.height = Math.round(height) + 'px';
    el.style.boxSizing = 'border-box';
  }

  function notifyDragEnd(id, x, y) {
    window.parent.postMessage({
      type: 'admin-drag-update',
      id: id,
      translateX: x ? x + 'px' : '0px',
      translateY: y ? y + 'px' : '0px',
    }, '*');
  }

  function notifyResizeEnd(id, width, height) {
    window.parent.postMessage({
      type: 'admin-resize-update',
      id: id,
      width: width > 0 ? Math.round(width) + 'px' : null,
      height: height > 0 ? Math.round(height) + 'px' : null,
    }, '*');
  }

  function clearResizeHandles() {
    document.querySelectorAll('.drag-resize-handle').forEach(function (h) { h.remove(); });
    document.querySelectorAll('[data-ed].has-resize-handles').forEach(function (el) {
      el.classList.remove('has-resize-handles');
    });
  }

  function ensureResizeHandles(el) {
    if (!isResizable(el) || el.querySelector('.drag-resize-handle')) return;
    el.classList.add('has-resize-handles');

    var bottom = document.createElement('div');
    bottom.className = 'drag-resize-handle drag-resize-handle--bottom';
    bottom.setAttribute('aria-hidden', 'true');
    bottom.title = 'Висота';

    var right = document.createElement('div');
    right.className = 'drag-resize-handle drag-resize-handle--right';
    right.setAttribute('aria-hidden', 'true');
    right.title = 'Ширина';

    var corner = document.createElement('div');
    corner.className = 'drag-resize-handle drag-resize-handle--corner';
    corner.setAttribute('aria-hidden', 'true');
    corner.title = 'Ширина + висота';

    el.appendChild(bottom);
    el.appendChild(right);
    el.appendChild(corner);
  }

  function onPointerDown(e) {
    if (!dragMode || pointerId != null) return;

    var handle = e.target.closest('.drag-resize-handle');
    if (handle) {
      var el = handle.parentElement;
      if (!el || !isDraggable(el) || !isResizable(el)) return;

      e.preventDefault();
      e.stopPropagation();
      pointerId = e.pointerId;
      active = el;
      captureEl = handle;
      mode = 'resize';
      if (handle.classList.contains('drag-resize-handle--bottom')) resizeAxis = 'height';
      else if (handle.classList.contains('drag-resize-handle--right')) resizeAxis = 'width';
      else resizeAxis = 'both';
      captureEl.setPointerCapture(pointerId);
      active.classList.add('is-resizing');

      startPointer.x = e.clientX;
      startPointer.y = e.clientY;

      var rect = active.getBoundingClientRect();
      var stored = getSizeFromConfig(active.getAttribute('data-ed'));
      startSize.width = stored.width || rect.width;
      startSize.height = stored.height || rect.height;
      return;
    }

    var el = e.target.closest('[data-ed]');
    if (!isDraggable(el)) return;

    e.preventDefault();
    e.stopPropagation();
    pointerId = e.pointerId;
    active = el;
    captureEl = el;
    mode = 'drag';
    resizeAxis = null;
    captureEl.setPointerCapture(pointerId);
    active.classList.add('is-dragging');

    startPointer.x = e.clientX;
    startPointer.y = e.clientY;

    var id = active.getAttribute('data-ed');
    var inline = active.style.transform || '';
    var mx = inline.match(/translateX\(([-\d.]+)px\)/);
    var my = inline.match(/translateY\(([-\d.]+)px\)/);
    var stored = getTranslateFromConfig(id);
    startTranslate.x = mx ? parseFloat(mx[1]) : stored.x;
    startTranslate.y = my ? parseFloat(my[1]) : stored.y;
  }

  function onPointerMove(e) {
    if (!active || e.pointerId !== pointerId) return;
    e.preventDefault();

    var dx = e.clientX - startPointer.x;
    var dy = e.clientY - startPointer.y;

    if (mode === 'resize') {
      var min = resizeMinFor(active.getAttribute('data-ed'));
      var w = startSize.width;
      var h = startSize.height;
      if (resizeAxis === 'width' || resizeAxis === 'both') w = Math.max(min.width, startSize.width + dx);
      if (resizeAxis === 'height' || resizeAxis === 'both') h = Math.max(min.height, startSize.height + dy);
      applyLocalSize(active, w, h);
      return;
    }

    var id = active.getAttribute('data-ed');
    var axis = dragAxisFor(id);
    var x = axis === 'y' ? startTranslate.x : Math.round(startTranslate.x + dx);
    var y = Math.round(startTranslate.y + dy);
    applyLocalTranslate(active, x, y);
  }

  function onPointerUp(e) {
    if (!active || e.pointerId !== pointerId) return;
    e.preventDefault();

    var id = active.getAttribute('data-ed');

    if (mode === 'resize') {
      var w = parsePx(active.style.width) || startSize.width;
      var h = parsePx(active.style.height) || startSize.height;
      active.classList.remove('is-resizing');
      if (captureEl) captureEl.releasePointerCapture(pointerId);
      notifyResizeEnd(id, w, h);
    } else {
      var inline = active.style.transform || '';
      var mx = inline.match(/translateX\(([-\d.]+)px\)/);
      var my = inline.match(/translateY\(([-\d.]+)px\)/);
      var axis = dragAxisFor(id);
      var x = axis === 'y' ? startTranslate.x : (mx ? parseFloat(mx[1]) : 0);
      var y = my ? parseFloat(my[1]) : 0;

      active.classList.remove('is-dragging');
      if (captureEl) captureEl.releasePointerCapture(pointerId);
      notifyDragEnd(id, x, y);
    }

    active = null;
    captureEl = null;
    pointerId = null;
    mode = null;
    resizeAxis = null;
  }

  function bindElements() {
    clearResizeHandles();
    document.querySelectorAll('[data-ed]').forEach(function (el) {
      if (!isDraggable(el)) return;
      if (dragMode && isResizable(el)) ensureResizeHandles(el);
      if (el.dataset.dragBound) return;
      el.dataset.dragBound = '1';
      el.addEventListener('pointerdown', onPointerDown);
    });
  }

  function init() {
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    bindElements();

    window.addEventListener('message', function (event) {
      if (!event.data) return;
      if (event.data.type === 'admin-preview') {
        if (event.data.config) lastConfig = event.data.config;
        if (event.data.dragMode != null) setDragMode(event.data.dragMode);
        bindElements();
      }
      if (event.data.type === 'admin-drag-mode') {
        setDragMode(event.data.enabled);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PreviewDrag = { setDragMode: setDragMode, bindElements: bindElements };
})();
