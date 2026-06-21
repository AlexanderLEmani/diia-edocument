const frame = document.getElementById('app');
const gradientBg = document.getElementById('gradientBg');
const carousel = document.getElementById('carousel');
const carouselTrack = document.getElementById('carouselTrack');
const carouselDots = document.getElementById('carouselDots');
const overlay = document.querySelector('.menu-overlay');
const closeBtn = document.querySelector('.menu-close');
const backdrop = document.querySelector('.menu-backdrop');
const infoNavLink = document.querySelector('.menu-item--info');
const navItems = document.querySelectorAll('.nav-item[data-tab]');
const tabPanels = document.querySelectorAll('.tab-panel');

function isPreviewMode() {
  return new URLSearchParams(window.location.search).get('preview') === '1'
    || window.parent !== window;
}

function infoPageUrl() {
  return isPreviewMode() ? '/info?preview=1' : '/info';
}

function indexPageUrl() {
  return isPreviewMode() ? '/?preview=1' : '/';
}

/* ── Gradient presets per document card ── */
const GRADIENTS = [
  { b1: '#5ec4c0', b2: '#a8d4e0', b3: '#c8bce8', b4: '#b8a8dc' },
  { b1: '#a8c8e8', b2: '#f0e8a0', b3: '#b8e8c8', b4: '#d0c0f0' },
];

const FEED_GRADIENT = { b1: '#7ec0e8', b2: '#eef4ee', b3: '#d0e8e4', b4: '#98cce8' };
const SERVICES_GRADIENT = { b1: '#8ec8ea', b2: '#eef6f8', b3: '#d4ece8', b4: '#a0d0ea' };
const MENU_GRADIENT = { b1: '#90cce8', b2: '#eef8f0', b3: '#d8eee4', b4: '#98cce8' };

function applyGradient(preset) {
  const root = document.documentElement;
  root.style.setProperty('--blob-1', preset.b1);
  root.style.setProperty('--blob-2', preset.b2);
  root.style.setProperty('--blob-3', preset.b3);
  root.style.setProperty('--blob-4', preset.b4);
}

function lerpColor(a, b, t) {
  const parse = (hex) => {
    const h = hex.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const mix = (c1, c2) => Math.round(c1 + (c2 - c1) * t);
  const toHex = (r, g, b) =>
    '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
  return toHex(mix(r1, r2), mix(g1, g2), mix(b1, b2));
}

function interpolateGradient(index, offset) {
  const i = Math.floor(index);
  const t = index - i;
  const g1 = GRADIENTS[Math.min(i, GRADIENTS.length - 1)];
  const g2 = GRADIENTS[Math.min(i + 1, GRADIENTS.length - 1)];
  applyGradient({
    b1: lerpColor(g1.b1, g2.b1, t),
    b2: lerpColor(g1.b2, g2.b2, t),
    b3: lerpColor(g1.b3, g2.b3, t),
    b4: lerpColor(g1.b4, g2.b4, t),
  });
}

/* ── Tab switching ── */
function switchTab(tab) {
  frame.dataset.tab = tab;
  navItems.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
  tabPanels.forEach((panel) => panel.classList.toggle('active', panel.dataset.tab === tab));

  if (tab === 'feed') {
    applyGradient(FEED_GRADIENT);
  } else if (tab === 'services') {
    applyGradient(SERVICES_GRADIENT);
  } else if (tab === 'menu') {
    applyGradient(MENU_GRADIENT);
  } else if (tab === 'documents') {
    requestAnimationFrame(() => {
      layoutSlides();
      updateCarousel(false);
    });
    interpolateGradient(currentIndex, 0);
  }
}

navItems.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ── Carousel ── */
const cards = [...carouselTrack.querySelectorAll('.doc-card')];
const dots = [...carouselDots.querySelectorAll('.carousel-dot')];
let currentIndex = 0;
let startX = 0;
let isDragging = false;
let dragOffset = 0;
let slideStride = 0;
let suppressCardFlip = false;

function layoutSlides() {
  const viewport = carousel.clientWidth;
  const slideWidth = viewport * 0.9;
  const gap = viewport * 0.02;
  slideStride = slideWidth + gap * 2;

  carousel.style.setProperty('--slide-width', `${slideWidth}px`);
  carousel.style.setProperty('--slide-gap', `${gap}px`);

  cards.forEach((card) => {
    card.style.flex = `0 0 ${slideWidth}px`;
    card.style.width = `${slideWidth}px`;
  });
}

function clampDragOffset() {
  if (currentIndex === 0 && dragOffset > 0) dragOffset *= 0.25;
  if (currentIndex === cards.length - 1 && dragOffset < 0) dragOffset *= 0.25;
}

function updateCarousel(animate = true) {
  if (!slideStride) layoutSlides();

  const center = carousel.clientWidth / 2;
  const offset = center - slideStride / 2 - currentIndex * slideStride + dragOffset;

  if (!animate) carousel.classList.add('is-dragging');
  else carousel.classList.remove('is-dragging');

  carouselTrack.style.transform = `translateX(${offset}px)`;

  cards.forEach((card, i) => {
    card.classList.toggle('is-active', i === currentIndex);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });

  const gradPos = currentIndex + (animate ? 0 : -dragOffset / slideStride);
  interpolateGradient(gradPos, 0);
}

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => snapTo(i));
});

function snapTo(index) {
  currentIndex = Math.max(0, Math.min(cards.length - 1, index));
  dragOffset = 0;
  updateCarousel(true);
}

function onDragStart(x) {
  isDragging = true;
  startX = x;
  dragOffset = 0;
  carousel.classList.add('is-dragging');
}

function onDragMove(x) {
  if (!isDragging) return;
  dragOffset = x - startX;
  if (Math.abs(dragOffset) > 8) suppressCardFlip = true;
  clampDragOffset();
  updateCarousel(false);
}

function onDragEnd() {
  if (!isDragging) return;
  isDragging = false;
  carousel.classList.remove('is-dragging');

  const threshold = slideStride * 0.18;
  if (dragOffset < -threshold) snapTo(currentIndex + 1);
  else if (dragOffset > threshold) snapTo(currentIndex - 1);
  else snapTo(currentIndex);
}

let carouselCaptureId = null;

function releaseCarouselCapture() {
  if (carouselCaptureId != null) {
    try {
      if (carousel.hasPointerCapture(carouselCaptureId)) {
        carousel.releasePointerCapture(carouselCaptureId);
      }
    } catch { /* ignore */ }
    carouselCaptureId = null;
  }
}

function resetCarouselDrag() {
  releaseCarouselCapture();
  if (isDragging) {
    isDragging = false;
    dragOffset = 0;
    carousel.classList.remove('is-dragging');
    updateCarousel(true);
  }
}

carousel.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.menu-trigger, .copy-btn')) return;
  if (!overlay.hidden) return;
  carousel.setPointerCapture(e.pointerId);
  carouselCaptureId = e.pointerId;
  onDragStart(e.clientX);
});

carousel.addEventListener('pointermove', (e) => {
  if (!isDragging) return;
  onDragMove(e.clientX);
});

function onCarouselPointerEnd(e) {
  suppressCardFlip = Math.abs(dragOffset) > 8;
  onDragEnd();
  if (carouselCaptureId != null && e.pointerId === carouselCaptureId) {
    releaseCarouselCapture();
  }
  window.setTimeout(() => { suppressCardFlip = false; }, 80);
}

carousel.addEventListener('pointerup', onCarouselPointerEnd);
carousel.addEventListener('pointercancel', onCarouselPointerEnd);

carouselTrack.addEventListener('click', (e) => {
  const card = e.target.closest('.doc-card');
  if (!card) return;
  if (suppressCardFlip || !overlay.hidden) return;
  if (e.target.closest('.menu-trigger, .copy-btn, button, a')) return;
  card.classList.toggle('is-flipped');
});

window.addEventListener('resize', () => {
  layoutSlides();
  updateCarousel(false);
});

/* ── Menu ── */
function openMenu(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  resetCarouselDrag();
  overlay.hidden = false;
  overlay.setAttribute('aria-hidden', 'false');
  frame.classList.add('is-menu-open');
}

function closeMenu() {
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  frame.classList.remove('is-menu-open');
}

function notifyAdminPage(page) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'admin-set-page', page: page }, '*');
  }
}

function navigateToInfo() {
  closeMenu();
  notifyAdminPage('info');
  window.location.assign(infoPageUrl());
}

if (infoNavLink) {
  infoNavLink.href = infoPageUrl();
  infoNavLink.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToInfo();
  });
}

frame.addEventListener('click', (e) => {
  const trigger = e.target.closest('.menu-trigger');
  if (trigger) openMenu(e);
});

closeBtn.addEventListener('click', closeMenu);
overlay.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-panel, .menu-close')) closeMenu();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !overlay.hidden) closeMenu();
});

/* ── Secret profile: 5 taps on «Код для перевірки» ── */
const verifyCodeBtn = document.getElementById('verifyCodeBtn');
let verifyTapCount = 0;
let verifyTapTimer = null;

if (verifyCodeBtn) {
  verifyCodeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    verifyTapCount += 1;
    clearTimeout(verifyTapTimer);
    verifyTapTimer = setTimeout(() => { verifyTapCount = 0; }, 2500);
    if (verifyTapCount >= 5) {
      verifyTapCount = 0;
      closeMenu();
      window.location.assign('/secret.html');
    }
  });
}

/* ── Copy button ── */
function getRnokppText() {
  const el = document.querySelector('[data-ed="tax-id-num"], [data-ed="info-rnokpp-value"], [data-ed="edoc-rnokpp-value"]');
  return el?.textContent?.trim() || '';
}

frame.addEventListener('click', async (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  e.stopPropagation();
  const text = getRnokppText();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch { /* ignore */ }
});

/* ── Init ── */
window.switchTab = switchTab;

requestAnimationFrame(() => {
  layoutSlides();
  var previewTab = new URLSearchParams(window.location.search).get('preview') === '1'
    && window.location.hash === '#feed' ? 'feed' : 'documents';
  switchTab(previewTab);
  snapTo(0);
  if (new URLSearchParams(window.location.search).get('preview') === '1') {
    window.parent.postMessage({ type: 'admin-preview-ready' }, '*');
  }
});
