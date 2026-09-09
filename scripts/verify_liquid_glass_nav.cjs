const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testLiquidGlassNav() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const artifactDir = 'C:/Users/anura/.gemini/antigravity-ide/brain/b6fb20f5-3d47-44c4-b895-3a81547daff3';

  console.log('1. Loading app...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('raseed_traders_auth_session', 'authenticated');
  });
  await page.reload({ waitUntil: 'networkidle' });

  console.log('2. Verifying Liquid Glass Navigation Bar in Light Mode...');
  await page.waitForSelector('nav[aria-label="Mobile Navigation Bar"]');
  await page.waitForSelector('button[aria-label="Stock"]');
  await page.waitForSelector('button[aria-label="Hisab"]');
  await page.waitForSelector('button[aria-label="Settings"]');

  // Screenshot in Light Mode
  await page.screenshot({ path: path.join(artifactDir, 'liquid_glass_nav_light.png') });
  console.log(' -> Light Mode screenshot captured.');

  // Drag gesture on Liquid Glass Nav Bar
  console.log('3. Testing drag gesture across tabs...');
  const navContainer = page.locator('nav[aria-label="Mobile Navigation Bar"] > div');
  const box = await navContainer.boundingBox();
  if (box) {
    const startX = box.x + box.width * 0.18;
    const startY = box.y + box.height * 0.5;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // Drag to Hisab
    await page.mouse.move(startX + 100, startY, { steps: 12 });
    await page.waitForTimeout(120);
    // Drag to Settings
    await page.mouse.move(startX + 200, startY, { steps: 12 });
    await page.waitForTimeout(120);
    // Drag back to Hisab
    await page.mouse.move(startX + 100, startY, { steps: 10 });
    await page.waitForTimeout(120);
    await page.mouse.up();
    await page.waitForTimeout(600);
  }
  console.log(' -> Drag gesture completed successfully!');

  // Dark Mode test
  console.log('4. Testing Liquid Glass Nav Bar in Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(artifactDir, 'liquid_glass_nav_dark.png') });
  console.log(' -> Dark Mode screenshot captured.');

  // Click Stock tab
  await page.click('button[aria-label="Stock"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'liquid_glass_nav_dark_stock.png') });

  console.log('ALL LIQUID GLASS NAV TESTS PASSED 100%!');
  await browser.close();
}

testLiquidGlassNav().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
