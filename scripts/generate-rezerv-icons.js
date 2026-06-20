'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(
  ROOT,
  'rezerv/assets/icon-source.png'
);
const OUT_DIR = path.join(ROOT, 'rezerv/assets');
const BG = '#E9E6D9';
const SIZES = [180, 192, 512];

function squircleMaskSvg(size) {
  const r = size * 0.2237;
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/>` +
    '</svg>'
  );
}

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (err) {
    console.error('Install sharp first: npm install --save-dev sharp');
    process.exit(1);
  }

  if (!fs.existsSync(SOURCE)) {
    console.error('Missing source icon:', SOURCE);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const size of SIZES) {
    const out = path.join(OUT_DIR, `icon-${size}.png`);
    const mask = squircleMaskSvg(size);

    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .flatten({ background: BG })
      .composite([{ input: mask, blend: 'dest-in' }])
      .extend({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        background: BG,
      })
      .flatten({ background: BG })
      .png()
      .toFile(out);

    console.log('wrote', out);
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
