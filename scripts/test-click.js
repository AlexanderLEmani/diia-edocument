const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:8765/?v=4');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/oleksandr/Projects/diia-edocument/video/debug-overlay.png' });
  const box = await page.locator('.menu-trigger').boundingBox();
  console.log('trigger box', box);
  await page.click('.menu-trigger');
  const open = await page.evaluate(() => !document.querySelector('.menu-overlay').hidden);
  console.log('menu open', open);
  await browser.close();
})();
