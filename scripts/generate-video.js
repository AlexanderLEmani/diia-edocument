const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const WIDTH = 390;
const HEIGHT = 844;
const DURATION_MS = 12000;
const OUTPUT = path.join(__dirname, '..', 'video', 'screen.mp4');
const TEMP_DIR = path.join(__dirname, '..', 'video', '.tmp');

async function main() {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: TEMP_DIR,
      size: { width: WIDTH, height: HEIGHT },
    },
  });

  const page = await context.newPage();
  const source = `file://${path.join(__dirname, 'video-source.html')}`;
  await page.goto(source, { waitUntil: 'networkidle' });
  await page.waitForTimeout(DURATION_MS);

  await context.close();
  await browser.close();

  const files = fs.readdirSync(TEMP_DIR).filter((f) => f.endsWith('.webm'));
  if (!files.length) {
    throw new Error('No video file recorded');
  }

  const webmPath = path.join(TEMP_DIR, files[0]);
  const { execSync } = require('child_process');

  execSync(
    `ffmpeg -y -i "${webmPath}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${OUTPUT}"`,
    { stdio: 'inherit' }
  );

  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  console.log(`Video saved: ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
