(function () {
  'use strict';

  var dragMode = false;
  var active = null;
  var pointerId = null;
  var startPointer = { x: 0, y: 0 };
  var startTranslate = { x: 0, y: 0 };
  var lastConfig = null;

  function parsePx(val) {
    if (val == null || val === '') return 0;
    return parseFloat(String(val).replace('px', '')) || 0;
  }

  function isDraggable(el) {
    if (!el || !el.getAttribute) return false;
    var id = el.getAttribute('data-ed');
    if (!id || typeof AdminCore === 'undefined') return false;
    var item = AdminCore.schemaById()[id];
    if (!item) return false;
    if (item.selector && item.selector !== '[data-ed="' + id + '"]') return false;
    return true;
  }

  function setDragMode(enabled) {
    dragMode = !!enabled;
    document.documentElement.classList.toggle('drag-mode', dragMode);
  }

  function getTranslateFromConfig(id) {
    if (lastConfig && lastConfig.elements && lastConfig.elements[id]) {
      var styles = lastConfig.elements[id].styles || {};
      return { x: parsePx(styles.translateX), y: parsePx(styles.translateY) };
    }
    return { x: 0, y: 0 };
  }

  function applyLocalTranslate(el, x, y) {
    var parts = [];
    if (x) parts.push('translateX(' + x + 'px)');
    if (y) parts.push('translateY(' + y + 'px)');
    if (parts.length) el.style.transform = parts.join(' ');
    else el.style.removeProperty('transform');
  }

  function notifyDragEnd(id, x, y) {
    window.parent.postMessage({
      type: 'admin-drag-update',
      id: id,
      translateX: x ? x + 'px' : '0px',
      translateY: y ? y + 'px' : '0px',
    }, '*');
  }

  function onPointerDown(e) {
    if (!dragMode || pointerId != null) return;
    var el = e.target.closest('[data-ed]');
    if (!isDraggable(el)) return;

    e.preventDefault();
    e.stopPropagation();
    pointerId = e.pointerId;
    active = el;
    active.setPointerCapture(pointerId);
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
    var x = Math.round(startTranslate.x + dx);
    var y = Math.round(startTranslate.y + dy);
    applyLocalTranslate(active, x, y);
  }

  function onPointerUp(e) {
    if (!active || e.pointerId !== pointerId) return;
    e.preventDefault();

    var id = active.getAttribute('data-ed');
    var inline = active.style.transform || '';
    var mx = inline.match(/translateX\(([-\d.]+)px\)/);
    var my = inline.match(/translateY\(([-\d.]+)px\)/);
    var x = mx ? parseFloat(mx[1]) : 0;
    var y = my ? parseFloat(my[1]) : 0;

    active.classList.remove('is-dragging');
    active.releasePointerCapture(pointerId);
    notifyDragEnd(id, x, y);

    active = null;
    pointerId = null;
  }

  function bindElements() {
    document.querySelectorAll('[data-ed]').forEach(function (el) {
      if (!isDraggable(el)) return;
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
