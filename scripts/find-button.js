const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const framePath = path.join(__dirname, '..', 'video', 'frame.png');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const b64 = require('fs').readFileSync(framePath).toString('base64');
  await page.setContent(`<canvas id="c" width="1080" height="2340"></canvas>`);
  const result = await page.evaluate(async (data) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + data;
    await img.decode();
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const w = 1080, h = 2340;

    // Find black circle in card footer (36px-ish)
    let best = null;
    for (let cy = Math.floor(h * 0.5); cy < h * 0.58; cy++) {
      for (let cx = Math.floor(w * 0.78); cx < w * 0.92; cx++) {
        let black = 0;
        for (let dy = -20; dy <= 20; dy++) {
          for (let dx = -20; dx <= 20; dx++) {
            if (dx * dx + dy * dy > 20 * 20) continue;
            const [r, g, b] = ctx.getImageData(cx + dx, cy + dy, 1, 1).data;
            if (r < 60 && g < 60 && b < 60) black++;
          }
        }
        if (black > 180 && (!best || black > best.score)) {
          best = { cx, cy, score: black };
        }
      }
    }
    return best;
  }, b64);
  console.log(result);
  await browser.close();
})();
