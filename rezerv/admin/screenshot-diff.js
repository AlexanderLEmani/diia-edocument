(function (global) {
  'use strict';

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'className') node.className = attrs[key];
        else if (key === 'text') node.textContent = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function dataTransferToFileList(file) {
    var dt = new DataTransfer();
    dt.items.add(file);
    return dt.files;
  }

  function round(n) {
    return Math.round(n * 10) / 10;
  }

  function init(container, options) {
    options = options || {};
    container.innerHTML = '';
    container.classList.add('admin-diff-root');

    var toolbar = el('div', { className: 'admin-diff-toolbar' });
    var workspace = el('div', { className: 'admin-diff-workspace' });
    var viewport = el('div', { className: 'admin-diff-viewport' });
    var stack = el('div', { className: 'admin-diff-stack' });
    var imgA = el('img', { className: 'admin-diff-img-a', alt: 'screenshot 1', draggable: 'false' });
    var imgB = el('img', { className: 'admin-diff-img-b', alt: 'screenshot 2', draggable: 'false' });
    var measureSvg = el('svg', { className: 'admin-diff-measure-svg' });
    stack.appendChild(imgA);
    stack.appendChild(imgB);
    stack.appendChild(measureSvg);
    viewport.appendChild(stack);
    workspace.appendChild(viewport);
    container.appendChild(toolbar);
    container.appendChild(workspace);

    var fileA = el('input', { type: 'file', accept: 'image/*', hidden: 'hidden' });
    var fileB = el('input', { type: 'file', accept: 'image/*', hidden: 'hidden' });
    container.appendChild(fileA);
    container.appendChild(fileB);

    var opacity = el('input', { type: 'range', min: '0', max: '100', value: '50' });
    var opacityVal = el('span', { text: '50%' });
    var showA = el('input', { type: 'checkbox' });
    showA.checked = true;
    var showB = el('input', { type: 'checkbox' });
    showB.checked = true;
    var blendMode = el('select');
    [
      ['normal', 'наложение'],
      ['difference', 'разница'],
      ['exclusion', 'исключение'],
      ['multiply', 'multiply'],
    ].forEach(function (pair) {
      blendMode.appendChild(el('option', { value: pair[0], text: pair[1] }));
    });
    var blinkMode = el('input', { type: 'checkbox' });
    var blinkSpeed = el('input', { type: 'range', min: '100', max: '2000', value: '500', step: '50' });
    var offsetX = el('input', { type: 'number', value: '0', step: '1' });
    var offsetY = el('input', { type: 'number', value: '0', step: '1' });
    var scaleB = el('input', { type: 'range', min: '50', max: '150', value: '100', step: '0.1' });
    var scaleVal = el('span', { text: '100%' });
    var zoom = el('input', { type: 'range', min: '10', max: '400', value: '100', step: '5' });
    var zoomVal = el('span', { text: '100%' });
    var info = el('span', { text: '—' });
    var measureReadout = el('span', { className: 'admin-diff-measure-readout', text: '—' });
    var measureList = el('div', { className: 'admin-diff-measure-list' });

    var measureMode = 'navigate';
    var measureLayer = 'a';
    var measurements = [];
    var measureDraft = null;
    var measureSeq = 0;
    var lineFirstPoint = null;

    function makeGroup(children, extraClass) {
      return el('div', { className: 'admin-diff-group' + (extraClass ? ' ' + extraClass : '') }, children);
    }

    function makeBtn(text, onClick) {
      var btn = el('button', { type: 'button', text: text });
      btn.addEventListener('click', onClick);
      return btn;
    }

    function makeToggleBtn(text, mode) {
      var btn = el('button', { type: 'button', text: text, className: 'admin-diff-tool-btn' });
      btn.dataset.mode = mode;
      btn.addEventListener('click', function () { setMeasureMode(mode); });
      return btn;
    }

    function makeNudge(dx, dy, text) {
      var btn = el('button', { type: 'button', text: text });
      btn.dataset.dx = String(dx);
      btn.dataset.dy = String(dy);
      btn.addEventListener('click', function () { nudge(dx, dy); });
      return btn;
    }

    function makeFileBtn(label, input) {
      return makeBtn(label, function () { input.click(); });
    }

    var btnToolNav = makeToggleBtn('↖ навиг.', 'navigate');
    var btnToolRect = makeToggleBtn('□ область', 'rect');
    var btnToolLine = makeToggleBtn('— линейка', 'line');
    var btnLayerA = makeBtn('слой 1', function () { setMeasureLayer('a'); });
    var btnLayerB = makeBtn('слой 2', function () { setMeasureLayer('b'); });
    btnLayerA.classList.add('admin-diff-layer-btn', 'is-active');
    btnLayerB.classList.add('admin-diff-layer-btn');

    toolbar.appendChild(makeGroup([
      makeFileBtn('1 (низ)', fileA),
      makeFileBtn('2 (верх)', fileB),
      makeBtn('⇄ поменять', swapImages),
      makeBtn('очистить', clearAll),
    ]));

    toolbar.appendChild(makeGroup([
      btnToolNav,
      btnToolRect,
      btnToolLine,
      btnLayerA,
      btnLayerB,
      makeBtn('✕ замеры', clearMeasurements),
      makeBtn('копировать', copyMeasurements),
    ], 'admin-diff-measure-tools'));

    toolbar.appendChild(makeGroup([
      el('label', null, [document.createTextNode('Прозрачность 2 '), opacity]),
      opacityVal,
      el('label', null, [showA, document.createTextNode(' 1')]),
      el('label', null, [showB, document.createTextNode(' 2')]),
    ]));

    toolbar.appendChild(makeGroup([
      el('label', null, [document.createTextNode('Режим '), blendMode]),
      el('label', null, [blinkMode, document.createTextNode(' мигание')]),
      el('label', null, [document.createTextNode('скорость '), blinkSpeed]),
    ]));

    toolbar.appendChild(makeGroup([
      el('span', { text: 'X' }),
      makeNudge(-10, 0, '←10'),
      makeNudge(-1, 0, '←1'),
      offsetX,
      makeNudge(1, 0, '1→'),
      makeNudge(10, 0, '10→'),
      el('span', { text: 'Y' }),
      makeNudge(0, -10, '↑10'),
      makeNudge(0, -1, '↑1'),
      offsetY,
      makeNudge(0, 1, '1↓'),
      makeNudge(0, 10, '10↓'),
      makeBtn('сброс', resetOffset),
    ]));

    toolbar.appendChild(makeGroup([
      el('label', null, [document.createTextNode('Масштаб 2 '), scaleB]),
      scaleVal,
      el('label', null, [document.createTextNode('Zoom '), zoom]),
      zoomVal,
      makeBtn('вписать', fitToView),
    ]));

    toolbar.appendChild(makeGroup([
      measureReadout,
    ], 'admin-diff-measure-readout-row'));

    toolbar.appendChild(makeGroup([
      measureList,
    ], 'admin-diff-measure-list-row'));

    toolbar.appendChild(makeGroup([
      el('span', { text: 'N навиг · M область · L линейка · Del последний · Cmd+V · drag · Space · D · Cmd+колёсико' }),
      info,
    ], 'admin-diff-hints'));

    var blinkTimer = null;
    var dragState = null;
    var measureDrag = null;
    var destroyed = false;
    var keyHandler = null;
    var pasteHandler = null;
    var wheelHandler = null;

    function getZoom() {
      return Number(zoom.value) / 100 || 1;
    }

    function stackPointFromEvent(e) {
      var rect = stack.getBoundingClientRect();
      var z = getZoom();
      return { x: (e.clientX - rect.left) / z, y: (e.clientY - rect.top) / z };
    }

    function layerTransform() {
      return {
        x: Number(offsetX.value) || 0,
        y: Number(offsetY.value) || 0,
        s: Number(scaleB.value) / 100 || 1,
      };
    }

    function stackToImage(point, layer) {
      if (layer === 'a') return { x: point.x, y: point.y };
      var t = layerTransform();
      return { x: (point.x - t.x) / t.s, y: (point.y - t.y) / t.s };
    }

    function imageToStack(point, layer) {
      if (layer === 'a') return { x: point.x, y: point.y };
      var t = layerTransform();
      return { x: point.x * t.s + t.x, y: point.y * t.s + t.y };
    }

    function normalizeRect(p1, p2) {
      return {
        x: Math.min(p1.x, p2.x),
        y: Math.min(p1.y, p2.y),
        w: Math.abs(p2.x - p1.x),
        h: Math.abs(p2.y - p1.y),
      };
    }

    function setMeasureMode(mode) {
      measureMode = mode;
      measureDraft = null;
      lineFirstPoint = null;
      [btnToolNav, btnToolRect, btnToolLine].forEach(function (btn) {
        btn.classList.toggle('is-active', btn.dataset.mode === mode);
      });
      stack.classList.toggle('is-measuring', mode !== 'navigate');
      stack.classList.toggle('is-measure-rect', mode === 'rect');
      stack.classList.toggle('is-measure-line', mode === 'line');
      imgB.style.cursor = mode === 'navigate' ? 'move' : 'crosshair';
      renderMeasurements();
      updateMeasureReadout();
    }

    function setMeasureLayer(layer) {
      measureLayer = layer;
      btnLayerA.classList.toggle('is-active', layer === 'a');
      btnLayerB.classList.toggle('is-active', layer === 'b');
      updateMeasureReadout();
    }

    function svgEl(tag, attrs) {
      var node = document.createElementNS('http://www.w3.org/2000/svg', tag);
      if (attrs) {
        Object.keys(attrs).forEach(function (key) {
          node.setAttribute(key, attrs[key]);
        });
      }
      return node;
    }

    function renderMeasurements() {
      while (measureSvg.firstChild) measureSvg.removeChild(measureSvg.firstChild);

      var w = imgA.naturalWidth || stack.clientWidth;
      var h = imgA.naturalHeight || stack.clientHeight;
      if (w && h) {
        measureSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        measureSvg.setAttribute('width', String(w));
        measureSvg.setAttribute('height', String(h));
      }

      drawRulers(w, h);

      measurements.forEach(function (m) {
        drawMeasurement(m, false);
      });

      if (measureDraft) drawMeasurement(measureDraft, true);
      if (lineFirstPoint && measureMode === 'line') {
        var p = imageToStack(lineFirstPoint, measureLayer);
        measureSvg.appendChild(svgEl('circle', {
          cx: String(round(p.x)),
          cy: String(round(p.y)),
          r: '4',
          class: 'admin-diff-measure-dot',
        }));
      }
    }

    function drawRulers(w, h) {
      if (measureMode === 'navigate' || !w || !h) return;
      var step = w > 1200 ? 100 : 50;
      var g = svgEl('g', { class: 'admin-diff-rulers' });

      for (var x = 0; x <= w; x += step) {
        g.appendChild(svgEl('line', {
          x1: String(x), y1: '0', x2: String(x), y2: String(Math.min(16, h)),
          class: 'admin-diff-ruler-tick',
        }));
        if (x > 0) {
          var tx = svgEl('text', {
            x: String(x + 2), y: '12', class: 'admin-diff-ruler-label',
          });
          tx.textContent = String(x);
          g.appendChild(tx);
        }
      }

      for (var y = 0; y <= h; y += step) {
        g.appendChild(svgEl('line', {
          x1: '0', y1: String(y), x2: String(Math.min(16, w)), y2: String(y),
          class: 'admin-diff-ruler-tick',
        }));
        if (y > 0) {
          var ty = svgEl('text', {
            x: '2', y: String(y - 2), class: 'admin-diff-ruler-label',
          });
          ty.textContent = String(y);
          g.appendChild(ty);
        }
      }

      measureSvg.appendChild(g);
    }

    function drawMeasurement(m, draft) {
      var color = m.layer === 'a' ? '#3b82f6' : '#f97316';
      var g = svgEl('g', { class: 'admin-diff-measure-item' + (draft ? ' is-draft' : '') });

      if (m.type === 'rect') {
        var tl = imageToStack({ x: m.x, y: m.y }, m.layer);
        var br = imageToStack({ x: m.x + m.w, y: m.y + m.h }, m.layer);
        var rect = normalizeRect(tl, br);
        g.appendChild(svgEl('rect', {
          x: String(round(rect.x)),
          y: String(round(rect.y)),
          width: String(round(rect.w)),
          height: String(round(rect.h)),
          stroke: color,
          fill: color,
          'fill-opacity': draft ? '0.12' : '0.08',
          'stroke-width': draft ? '2' : '1.5',
        }));
        var label = svgEl('text', {
          x: String(round(rect.x + 4)),
          y: String(round(rect.y + 16)),
          class: 'admin-diff-measure-label',
          fill: color,
        });
        label.textContent = (m.layer === 'a' ? '1' : '2') + ': ' + round(m.w) + '×' + round(m.h);
        g.appendChild(label);
      } else if (m.type === 'line') {
        var p1 = imageToStack({ x: m.x1, y: m.y1 }, m.layer);
        var p2 = imageToStack({ x: m.x2, y: m.y2 }, m.layer);
        g.appendChild(svgEl('line', {
          x1: String(round(p1.x)),
          y1: String(round(p1.y)),
          x2: String(round(p2.x)),
          y2: String(round(p2.y)),
          stroke: color,
          'stroke-width': draft ? '2' : '1.5',
        }));
        g.appendChild(svgEl('circle', {
          cx: String(round(p1.x)), cy: String(round(p1.y)), r: '3', fill: color,
        }));
        g.appendChild(svgEl('circle', {
          cx: String(round(p2.x)), cy: String(round(p2.y)), r: '3', fill: color,
        }));
        var midX = (p1.x + p2.x) / 2;
        var midY = (p1.y + p2.y) / 2;
        var lineLabel = svgEl('text', {
          x: String(round(midX + 6)),
          y: String(round(midY - 6)),
          class: 'admin-diff-measure-label',
          fill: color,
        });
        lineLabel.textContent = (m.layer === 'a' ? '1' : '2') + ': ' + round(m.len) + ' px';
        g.appendChild(lineLabel);
      }

      measureSvg.appendChild(g);
    }

    function formatMeasurement(m) {
      if (m.type === 'rect') {
        return '[' + m.layer + '#' + m.id + '] □ ' + round(m.w) + '×' + round(m.h) + ' px @ (' + round(m.x) + ', ' + round(m.y) + ')';
      }
      return '[' + m.layer + '#' + m.id + '] — ' + round(m.len) + ' px (Δx ' + round(m.dx) + ', Δy ' + round(m.dy) + ')';
    }

    function compareMeasurements() {
      var rectsA = measurements.filter(function (m) { return m.type === 'rect' && m.layer === 'a'; });
      var rectsB = measurements.filter(function (m) { return m.type === 'rect' && m.layer === 'b'; });
      if (!rectsA.length || !rectsB.length) return '';
      var a = rectsA[rectsA.length - 1];
      var b = rectsB[rectsB.length - 1];
      return 'Δ размер: ' + (round(b.w - a.w) >= 0 ? '+' : '') + round(b.w - a.w) + '×' +
        (round(b.h - a.h) >= 0 ? '+' : '') + round(b.h - a.h) +
        ' px · Δ позиция: ' + (round(b.x - a.x) >= 0 ? '+' : '') + round(b.x - a.x) + '×' +
        (round(b.y - a.y) >= 0 ? '+' : '') + round(b.y - a.y);
    }

    function renderMeasureList() {
      measureList.innerHTML = '';
      if (!measurements.length) {
        measureList.textContent = 'Выделите область (M) или линейку (L) — размеры в px скриншота';
        return;
      }
      measurements.forEach(function (m) {
        var row = el('div', { className: 'admin-diff-measure-row' });
        row.appendChild(el('span', { text: formatMeasurement(m) }));
        var del = makeBtn('×', function () {
          measurements = measurements.filter(function (x) { return x.id !== m.id; });
          renderMeasureList();
          renderMeasurements();
          updateMeasureReadout();
        });
        del.className = 'admin-diff-measure-del';
        row.appendChild(del);
        measureList.appendChild(row);
      });
      var delta = compareMeasurements();
      if (delta) {
        measureList.appendChild(el('div', { className: 'admin-diff-measure-delta', text: delta }));
      }
    }

    function updateMeasureReadout(extra) {
      var layerLabel = measureLayer === 'a' ? 'слой 1' : 'слой 2';
      var modeLabel = measureMode === 'rect' ? 'область' : measureMode === 'line' ? 'линейка' : 'навигация';
      measureReadout.textContent = extra || (modeLabel + ' · ' + layerLabel + (measurements.length ? ' · замеров: ' + measurements.length : ''));
    }

    function addMeasurement(data) {
      measureSeq += 1;
      measurements.push(Object.assign({ id: measureSeq }, data));
      renderMeasureList();
      renderMeasurements();
      updateMeasureReadout(formatMeasurement(measurements[measurements.length - 1]));
    }

    function clearMeasurements() {
      measurements = [];
      measureDraft = null;
      lineFirstPoint = null;
      renderMeasureList();
      renderMeasurements();
      updateMeasureReadout();
    }

    function copyMeasurements() {
      var lines = measurements.map(formatMeasurement);
      var delta = compareMeasurements();
      if (delta) lines.push(delta);
      if (!lines.length) {
        updateMeasureReadout('Нет замеров');
        return;
      }
      var text = lines.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          updateMeasureReadout('Скопировано');
        }).catch(function () {
          updateMeasureReadout(text);
        });
      } else {
        updateMeasureReadout(text);
      }
    }

    function finishRectDraft(p1, p2) {
      var stackRect = normalizeRect(p1, p2);
      if (stackRect.w < 3 && stackRect.h < 3) return;
      var imgP1 = stackToImage({ x: stackRect.x, y: stackRect.y }, measureLayer);
      var imgP2 = stackToImage({ x: stackRect.x + stackRect.w, y: stackRect.y + stackRect.h }, measureLayer);
      var imgRect = normalizeRect(imgP1, imgP2);
      addMeasurement({
        type: 'rect',
        layer: measureLayer,
        x: round(imgRect.x),
        y: round(imgRect.y),
        w: round(imgRect.w),
        h: round(imgRect.h),
      });
    }

    function addLineMeasurement(ip1, ip2) {
      var dx = ip2.x - ip1.x;
      var dy = ip2.y - ip1.y;
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len < 3) return;
      addMeasurement({
        type: 'line',
        layer: measureLayer,
        x1: round(ip1.x),
        y1: round(ip1.y),
        x2: round(ip2.x),
        y2: round(ip2.y),
        dx: round(dx),
        dy: round(dy),
        len: round(len),
      });
    }

    function finishLineDraft(p1, p2) {
      addLineMeasurement(stackToImage(p1, measureLayer), stackToImage(p2, measureLayer));
    }

    function onMeasurePointerDown(e) {
      if (measureMode === 'navigate') return;
      if (e.button !== 0) return;
      var p = stackPointFromEvent(e);

      if (measureMode === 'line') {
        if (lineFirstPoint) {
          addLineMeasurement(lineFirstPoint, stackToImage(p, measureLayer));
          lineFirstPoint = null;
          measureDraft = null;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        lineFirstPoint = stackToImage(p, measureLayer);
        updateMeasureReadout('Линейка: второй клик или протяните');
        renderMeasurements();
        measureDrag = { start: p, current: p, lineClick: true };
        measureSvg.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      measureDrag = { start: p, current: p };
      measureSvg.setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    }

    function onMeasurePointerMove(e) {
      if (!measureDrag) return;
      var p = stackPointFromEvent(e);
      measureDrag.current = p;

      if (measureMode === 'rect') {
        var stackRect = normalizeRect(measureDrag.start, p);
        var imgP1 = stackToImage({ x: stackRect.x, y: stackRect.y }, measureLayer);
        var imgP2 = stackToImage({ x: stackRect.x + stackRect.w, y: stackRect.y + stackRect.h }, measureLayer);
        var imgRect = normalizeRect(imgP1, imgP2);
        measureDraft = {
          type: 'rect',
          layer: measureLayer,
          x: round(imgRect.x),
          y: round(imgRect.y),
          w: round(imgRect.w),
          h: round(imgRect.h),
        };
        updateMeasureReadout('□ ' + round(imgRect.w) + '×' + round(imgRect.h) + ' px');
        renderMeasurements();
      } else if (measureMode === 'line' && lineFirstPoint) {
        var ip2 = stackToImage(p, measureLayer);
        var dx = ip2.x - lineFirstPoint.x;
        var dy = ip2.y - lineFirstPoint.y;
        var len = Math.sqrt(dx * dx + dy * dy);
        measureDraft = {
          type: 'line',
          layer: measureLayer,
          x1: round(lineFirstPoint.x),
          y1: round(lineFirstPoint.y),
          x2: round(ip2.x),
          y2: round(ip2.y),
          dx: round(dx),
          dy: round(dy),
          len: round(len),
        };
        updateMeasureReadout('— ' + round(len) + ' px · Δx ' + round(dx) + ' · Δy ' + round(dy));
        renderMeasurements();
      }
    }

    function onMeasurePointerUp(e) {
      if (!measureDrag) return;
      var p = stackPointFromEvent(e);
      if (measureMode === 'rect') {
        finishRectDraft(measureDrag.start, p);
      } else if (measureMode === 'line') {
        var moved = Math.abs(p.x - measureDrag.start.x) + Math.abs(p.y - measureDrag.start.y);
        if (moved >= 3) {
          finishLineDraft(measureDrag.start, p);
          lineFirstPoint = null;
        }
      }
      measureDraft = null;
      measureDrag = null;
      renderMeasurements();
    }

    measureSvg.addEventListener('pointerdown', onMeasurePointerDown);
    measureSvg.addEventListener('pointermove', onMeasurePointerMove);
    measureSvg.addEventListener('pointerup', onMeasurePointerUp);
    measureSvg.addEventListener('pointercancel', function () { measureDrag = null; measureDraft = null; });

    function updateInfo() {
      var aw = imgA.naturalWidth;
      var ah = imgA.naturalHeight;
      var bw = imgB.naturalWidth;
      var bh = imgB.naturalHeight;
      if (!aw && !bw) {
        info.textContent = '—';
        return;
      }
      var parts = [];
      if (aw) parts.push('1: ' + aw + '×' + ah);
      if (bw) parts.push('2: ' + bw + '×' + bh);
      if (aw && bw && (aw !== bw || ah !== bh)) {
        parts.push('Δ ' + (bw - aw) + '×' + (bh - ah));
      }
      info.textContent = parts.join(' · ');
      renderMeasurements();
    }

    function applyTransform() {
      var x = Number(offsetX.value) || 0;
      var y = Number(offsetY.value) || 0;
      var s = Number(scaleB.value) / 100;
      var o = Number(opacity.value) / 100;

      imgB.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + s + ')';
      imgB.style.transformOrigin = '0 0';
      imgB.style.opacity = String(o);
      imgB.style.mixBlendMode = blendMode.value;

      opacityVal.textContent = opacity.value + '%';
      scaleVal.textContent = Number(scaleB.value).toFixed(1) + '%';
      zoomVal.textContent = zoom.value + '%';

      stack.classList.toggle('is-hidden-a', !showA.checked);
      stack.classList.toggle('is-hidden-b', !showB.checked);
      renderMeasurements();
    }

    function applyZoom() {
      viewport.style.transform = 'scale(' + getZoom() + ')';
    }

    function fitToView() {
      var w = Math.max(imgA.naturalWidth, imgB.naturalWidth || 0);
      var h = Math.max(imgA.naturalHeight, imgB.naturalHeight || 0);
      if (!w || !h) return;

      var pad = 64;
      var availW = workspace.clientWidth - pad;
      var availH = workspace.clientHeight - pad;
      var fit = Math.min(1, availW / w, availH / h);
      zoom.value = String(Math.round(Math.max(10, Math.min(400, fit * 100))));
      applyZoom();
    }

    function nudge(dx, dy) {
      offsetX.value = String((Number(offsetX.value) || 0) + dx);
      offsetY.value = String((Number(offsetY.value) || 0) + dy);
      applyTransform();
    }

    function resetOffset() {
      offsetX.value = '0';
      offsetY.value = '0';
      scaleB.value = '100';
      applyTransform();
    }

    function loadFile(input, img) {
      var file = input.files && input.files[0];
      if (!file) return;
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        updateInfo();
        if (img === imgA || (imgA.naturalWidth && imgB.naturalWidth)) fitToView();
      };
      img.src = url;
    }

    function setImageFromBlob(img, blob, onDone) {
      var url = URL.createObjectURL(blob);
      img.onload = function () {
        URL.revokeObjectURL(url);
        updateInfo();
        if (onDone) onDone();
      };
      img.src = url;
    }

    function loadNextSlot(blob) {
      if (!imgA.src) {
        setImageFromBlob(imgA, blob, fitToView);
      } else if (!imgB.src) {
        setImageFromBlob(imgB, blob, fitToView);
      } else {
        setImageFromBlob(imgB, blob);
      }
    }

    function swapImages() {
      var tmpSrc = imgA.src;
      imgA.src = imgB.src;
      imgB.src = tmpSrc;
      if (!imgA.src) imgA.removeAttribute('src');
      if (!imgB.src) imgB.removeAttribute('src');
      fileA.value = '';
      fileB.value = '';
      resetOffset();
      updateInfo();
    }

    function clearAll() {
      imgA.removeAttribute('src');
      imgB.removeAttribute('src');
      fileA.value = '';
      fileB.value = '';
      resetOffset();
      clearMeasurements();
      updateInfo();
    }

    function setBlink(on) {
      blinkMode.checked = on;
      if (blinkTimer) {
        clearInterval(blinkTimer);
        blinkTimer = null;
      }
      stack.classList.remove('is-blink-hide-b');
      if (on) {
        var visible = true;
        blinkTimer = setInterval(function () {
          visible = !visible;
          stack.classList.toggle('is-blink-hide-b', !visible);
        }, Number(blinkSpeed.value));
      }
    }

    fileA.addEventListener('change', function () { loadFile(fileA, imgA); });
    fileB.addEventListener('change', function () { loadFile(fileB, imgB); });

    [opacity, showA, showB, offsetX, offsetY, scaleB].forEach(function (inputEl) {
      inputEl.addEventListener('input', applyTransform);
    });

    blendMode.addEventListener('change', function () {
      if (blendMode.value === 'difference' || blendMode.value === 'exclusion') {
        opacity.value = '100';
      }
      applyTransform();
    });

    zoom.addEventListener('input', applyZoom);
    blinkMode.addEventListener('change', function () { setBlink(blinkMode.checked); });
    blinkSpeed.addEventListener('input', function () {
      if (blinkMode.checked) setBlink(true);
    });

    imgB.addEventListener('pointerdown', function (e) {
      if (measureMode !== 'navigate') return;
      if (!imgB.src) return;
      dragState = {
        startX: e.clientX,
        startY: e.clientY,
        baseX: Number(offsetX.value) || 0,
        baseY: Number(offsetY.value) || 0,
      };
      imgB.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    imgB.addEventListener('pointermove', function (e) {
      if (!dragState || measureMode !== 'navigate') return;
      var z = getZoom();
      var dx = (e.clientX - dragState.startX) / z;
      var dy = (e.clientY - dragState.startY) / z;
      offsetX.value = String(Math.round(dragState.baseX + dx));
      offsetY.value = String(Math.round(dragState.baseY + dy));
      applyTransform();
    });

    imgB.addEventListener('pointerup', function () { dragState = null; });
    imgB.addEventListener('pointercancel', function () { dragState = null; });

    wheelHandler = function (e) {
      if (!container.isConnected || destroyed) return;
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      var step = e.deltaY > 0 ? -5 : 5;
      zoom.value = String(Math.min(400, Math.max(10, Number(zoom.value) + step)));
      applyZoom();
    };
    workspace.addEventListener('wheel', wheelHandler, { passive: false });

    pasteHandler = function (e) {
      if (!container.isConnected || destroyed) return;
      if (!options.active || !options.active()) return;
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      var imageItem = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image/') === 0) {
          imageItem = items[i];
          break;
        }
      }
      if (!imageItem) return;
      e.preventDefault();
      loadNextSlot(imageItem.getAsFile());
    };
    document.addEventListener('paste', pasteHandler);

    keyHandler = function (e) {
      if (!container.isConnected || destroyed) return;
      if (!options.active || !options.active()) return;
      if (e.target.matches('input, select, textarea')) return;

      var step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case 'n':
        case 'N':
          setMeasureMode('navigate');
          e.preventDefault();
          break;
        case 'm':
        case 'M':
          setMeasureMode('rect');
          e.preventDefault();
          break;
        case 'l':
        case 'L':
          setMeasureMode('line');
          e.preventDefault();
          break;
        case 'Delete':
        case 'Backspace':
          if (measurements.length) {
            measurements.pop();
            renderMeasureList();
            renderMeasurements();
            updateMeasureReadout();
            e.preventDefault();
          }
          break;
        case '1':
          setMeasureLayer('a');
          e.preventDefault();
          break;
        case '2':
          if (!e.metaKey && !e.ctrlKey) {
            setMeasureLayer('b');
            e.preventDefault();
          }
          break;
        case 'ArrowLeft':
          if (measureMode === 'navigate') {
            nudge(-step, 0);
            e.preventDefault();
          }
          break;
        case 'ArrowRight':
          if (measureMode === 'navigate') {
            nudge(step, 0);
            e.preventDefault();
          }
          break;
        case 'ArrowUp':
          if (measureMode === 'navigate') {
            nudge(0, -step);
            e.preventDefault();
          }
          break;
        case 'ArrowDown':
          if (measureMode === 'navigate') {
            nudge(0, step);
            e.preventDefault();
          }
          break;
        case ' ':
          setBlink(!blinkMode.checked);
          e.preventDefault();
          break;
        case 'd':
        case 'D':
          blendMode.value = blendMode.value === 'difference' ? 'normal' : 'difference';
          applyTransform();
          e.preventDefault();
          break;
        case 'r':
        case 'R':
          if (measureMode === 'navigate') resetOffset();
          e.preventDefault();
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', keyHandler);

    ['dragover', 'drop'].forEach(function (evt) {
      workspace.addEventListener(evt, function (e) {
        if (!options.active || !options.active()) return;
        e.preventDefault();
        if (evt !== 'drop') return;
        var files = Array.prototype.slice.call(e.dataTransfer.files).filter(function (f) {
          return f.type.indexOf('image/') === 0;
        });
        if (!files.length) return;
        if (!imgA.src) {
          fileA.files = dataTransferToFileList(files[0]);
          loadFile(fileA, imgA);
        } else if (!imgB.src) {
          fileB.files = dataTransferToFileList(files[0]);
          loadFile(fileB, imgB);
        }
      });
    });

    setMeasureMode('navigate');
    applyTransform();
    applyZoom();
    renderMeasureList();

    return {
      fitToView: fitToView,
      getMeasurements: function () { return measurements.slice(); },
      copyMeasurements: copyMeasurements,
      destroy: function () {
        destroyed = true;
        if (blinkTimer) clearInterval(blinkTimer);
        document.removeEventListener('paste', pasteHandler);
        document.removeEventListener('keydown', keyHandler);
        workspace.removeEventListener('wheel', wheelHandler);
        container.innerHTML = '';
        container.classList.remove('admin-diff-root');
      },
    };
  }

  global.AdminScreenshotDiff = { init: init };
})(typeof window !== 'undefined' ? window : this);
