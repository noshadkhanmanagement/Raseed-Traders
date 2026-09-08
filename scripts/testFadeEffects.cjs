const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

let password = '';
fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
  if (l.startsWith('VITE_APP_PASSWORD=')) password = l.split('=')[1].trim();
});

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  const pw = await page.$('#login-password');
  if (pw) {
    await pw.fill(password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }
  await page.waitForSelector('div[title*="Touch to view purchase rates"]', { timeout: 8000 }).catch(() => {});
  
  // Scroll down halfway to observe content passing under the top and bottom ambient fades
  await page.evaluate(() => window.scrollBy(0, 240));
  await page.waitForTimeout(1000);

  const shotPath = path.resolve('C:\\Users\\anura\\.gemini\\antigravity-ide\\brain\\b6fb20f5-3d47-44c4-b895-3a81547daff3', 'screenshot_iphone_fade_effects.png');
  await page.screenshot({ path: shotPath, fullPage: false });
  console.log('Saved iPhone fade effects screenshot to:', shotPath);
  await browser.close();
})();
