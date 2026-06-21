(function (global) {
  'use strict';

  var SPEED = 67;

  var TICKERS = [
    { wrap: '.id-ticker-wrap', track: '.id-ticker-track' },
    { wrap: '.doc-ticker', track: '.doc-ticker-track' },
  ];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function getChunkText(source) {
    var part = source.querySelector('.id-ticker-part');
    if (part) return part.textContent;
    return (source.textContent || '').trim();
  }

  function measureChunkWidth(text, track, wrap) {
    var probe = document.createElement('span');
    var cs = window.getComputedStyle(track);
    probe.className = 'id-ticker-part';
    probe.textContent = text;
    probe.style.cssText = [
      'position:absolute',
      'left:-9999px',
      'top:0',
      'visibility:hidden',
      'pointer-events:none',
      'white-space:nowrap',
      'font:' + cs.font,
      'letter-spacing:' + cs.letterSpacing,
      'line-height:' + cs.lineHeight,
    ].join(';');
    wrap.appendChild(probe);
    var w = probe.getBoundingClientRect().width;
    probe.remove();
    return Math.ceil(w);
  }

  function initTicker(wrap, track) {
    if (!wrap || !track) return;

    var text = getChunkText(track);
    if (!text) return;

    track.classList.remove('is-ready');
    track.style.removeProperty('--ticker-shift');
    track.style.removeProperty('--ticker-duration');

    var chunkW = measureChunkWidth(text, track, wrap);
    if (!chunkW) return;

    var wrapW = wrap.getBoundingClientRect().width;
    if (!wrapW) return;

    var copies = Math.max(4, Math.ceil((wrapW * 2) / chunkW) + 2);
    var html = '';
    var i;

    for (i = 0; i < copies; i += 1) {
      html += '<span class="id-ticker-part">' + escapeHtml(text) + '</span>';
    }
    track.innerHTML = html;

    track.style.setProperty('--ticker-shift', chunkW + 'px');
    track.style.setProperty('--ticker-duration', (chunkW / SPEED) + 's');
    track.classList.add('is-ready');
  }

  function initAll() {
    TICKERS.forEach(function (cfg) {
      initTicker(document.querySelector(cfg.wrap), document.querySelector(cfg.track));
    });
  }

  global.RezervTicker = { init: initAll };

  function scheduleInit() {
    var run = function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(initAll);
      });
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run).catch(run);
    } else {
      run();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInit);
  } else {
    scheduleInit();
  }

  window.addEventListener('resize', function () {
    clearTimeout(global.__rezervTickerResize);
    global.__rezervTickerResize = setTimeout(initAll, 120);
  });

  window.addEventListener('orientationchange', function () {
    clearTimeout(global.__rezervTickerResize);
    global.__rezervTickerResize = setTimeout(initAll, 250);
  });
})(window);
