function isPreviewMode() {
  return new URLSearchParams(window.location.search).get('preview') === '1'
    || window.parent !== window;
}

function indexPageUrl() {
  return isPreviewMode() ? '/?preview=1' : '/';
}

const backLink = document.querySelector('.info-back[data-nav="index"]');
if (backLink) {
  backLink.href = indexPageUrl();
  backLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'admin-set-page', page: 'index-docs' }, '*');
    }
    window.location.assign(indexPageUrl());
  });
}

if (isPreviewMode() && window.parent !== window) {
  window.parent.postMessage({ type: 'admin-set-page', page: 'info' }, '*');
}

document.querySelector('.copy-btn')?.addEventListener('click', async () => {
  const el = document.querySelector('[data-ed="info-rnokpp-value"]');
  const text = el?.textContent?.trim() || '';
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
});
