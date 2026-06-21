'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist');

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

const DIRS = ['admin', 'assets', 'rezerv', 'screenshot-diff'];

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

rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

for (const file of FILES) {
  const src = path.join(ROOT, file);
  if (!fs.existsSync(src)) {
    console.warn('skip missing file:', file);
    continue;
  }
  copyFile(src, path.join(OUT, file));
}

for (const dir of DIRS) {
  copyDir(path.join(ROOT, dir), path.join(OUT, dir));
}

console.log('Built static site -> dist/');
