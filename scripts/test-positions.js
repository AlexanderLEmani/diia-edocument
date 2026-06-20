const { chromium } = require('playwright');

const sizes = [
  [390, 844],
  [393, 852],
  [375, 667],
  [430, 932],
  [360, 780],
];

(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of sizes) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto('http://localhost:8765/');
    await page.waitForFunction(() => document.querySelector('.screen-video').videoWidth > 0);
    await page.waitForTimeout(200);
    const data = await page.evaluate(() => {
      const trigger = document.querySelector('.menu-trigger');
      const stage = document.querySelector('.video-stage');
      const tr = trigger.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const vw = document.querySelector('.screen-video').videoWidth;
      const vh = document.querySelector('.screen-video').videoHeight;
      const expectedX = sr.left + (954 / 1080) * sr.width;
      const expectedY = sr.top + (1216 / 2340) * sr.height;
      return {
        trigger: { x: tr.x + tr.width / 2, y: tr.y + tr.height / 2 },
        expected: { x: expectedX, y: expectedY },
        delta: {
          x: Math.abs(tr.x + tr.width / 2 - expectedX),
          y: Math.abs(tr.y + tr.height / 2 - expectedY),
        },
        stage: { w: sr.width, h: sr.height },
        vw, vh,
      };
    });
    console.log(`${w}x${h}`, JSON.stringify(data));
  }
  await browser.close();
})();
