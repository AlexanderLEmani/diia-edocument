'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist');

const DIIA_ONLY = process.env.DIIA_ONLY === '1' || process.env.DIIA_ONLY === 'true';
const OPEN_ACCESS = process.env.OPEN_ACCESS === '1' || process.env.OPEN_ACCESS === 'true';

const FILES = [
  'index.html',
  'info.html',
  'secret.html',
  'app.js',
  'auth.js',
  'info.js',
  'pwa.js',
  'sw.js',
  'secret.js',
  'styles.css',
  'auth.css',
  'info.css',
  'pwa.css',
  'secret.css',
  'manifest.webmanifest',
  'apple-touch-icon.png',
  'apple-touch-icon-precomposed.png',
];

const DIRS = DIIA_ONLY
  ? ['assets']
  : ['admin', 'assets', 'rezerv', 'screenshot-diff'];

const ADMIN_RUNTIME_FILES = [
  'core.js',
  'profile.js',
  'apply-config.js',
  'capture-preview.js',
  'preview-drag.js',
  'config.json',
];

const ADMIN_UI_FILES = [
  'admin.html',
  'admin.js',
  'admin.css',
  'screenshot-diff.js',
  'screenshot-diff.css',
];

function rmrf(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === '.git') continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else copyFile(from, to);
  }
}

function copyAdminRuntime() {
  const adminOut = path.join(OUT, 'admin');
  fs.mkdirSync(adminOut, { recursive: true });
  for (const file of ADMIN_RUNTIME_FILES.concat(ADMIN_UI_FILES)) {
    const src = path.join(ROOT, 'admin', file);
    if (!fs.existsSync(src)) {
      console.warn('skip missing admin file:', file);
      continue;
    }
    copyFile(src, path.join(adminOut, file));
  }
}

function patchOpenAccessHtml(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('window.__OPEN_ACCESS__')) return html;

  const marker = '<script src="auth.js';
  if (!html.includes(marker)) return html;

  return html.replace(
    marker,
    '<script>window.__OPEN_ACCESS__=true</script>\n  ' + marker
  );
}

function patchOpenAccessManifest(filePath) {
  const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  manifest.start_url = '/';
  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2) + '\n');
}

rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

for (const file of FILES) {
  const src = path.join(ROOT, file);
  if (!fs.existsSync(src)) {
    console.warn('skip missing file:', file);
    continue;
  }

  const dest = path.join(OUT, file);
  if (OPEN_ACCESS && file === 'index.html') {
    fs.writeFileSync(dest, patchOpenAccessHtml(src));
    continue;
  }

  copyFile(src, dest);
}

if (OPEN_ACCESS) {
  patchOpenAccessManifest(path.join(OUT, 'manifest.webmanifest'));
}

for (const dir of DIRS) {
  copyDir(path.join(ROOT, dir), path.join(OUT, dir));
}

if (DIIA_ONLY) {
  copyAdminRuntime();
}

const flags = [
  DIIA_ONLY ? 'diia-only' : 'full',
  OPEN_ACCESS ? 'open-access' : 'token-auth',
].join(', ');

console.log('Built static site -> dist/ (' + flags + ')');
