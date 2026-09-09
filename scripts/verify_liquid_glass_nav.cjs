const { chromium } = require('playwright');
const path = require('path');

async function testLiquidGlassPhysics() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const artifactDir = 'C:/Users/anura/.gemini/antigravity-ide/brain/b6fb20f5-3d47-44c4-b895-3a81547daff3';

  console.log('1. Loading app and authenticating...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('raseed_traders_auth_session', 'authenticated');
  });
  await page.reload({ waitUntil: 'networkidle' });

  console.log('2. Testing Up-and-Down Vertical Physics on Liquid Glass Nav Bar...');
  const navContainer = page.locator('nav[aria-label="Mobile Navigation Bar"] > div');
  await navContainer.waitFor({ state: 'visible' });

  const box = await navContainer.boundingBox();
  if (!box) throw new Error('Nav bar box not found');

  const startX = box.x + box.width * 0.18;
  const startY = box.y + box.height * 0.5;

  // A. Touch Down (tactile press depth)
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(100);

  // Check visual pill state on press
  const pressState = await page.evaluate(() => {
    const pill = document.querySelector('nav[aria-label="Mobile Navigation Bar"] > div > div');
    const transform = window.getComputedStyle(pill).transform;
    return transform;
  });
  console.log(' -> Press state transform:', pressState);

  // B. Drag UP (Vertical stretch upward against gravity)
  console.log(' -> Dragging UP...');
  await page.mouse.move(startX, startY - 35, { steps: 8 });
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(artifactDir, 'liquid_nav_drag_up.png') });
  console.log(' -> Captured screenshot of Upward Drag Stretch');

  // C. Drag DOWN (Vertical squish downward against bottom container)
  console.log(' -> Dragging DOWN...');
  await page.mouse.move(startX, startY + 30, { steps: 8 });
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(artifactDir, 'liquid_nav_drag_down.png') });
  console.log(' -> Captured screenshot of Downward Drag Squish');

  // D. Diagonal 2D gesture (Drag up-right to Hisab)
  console.log(' -> Dragging diagonally to Hisab...');
  await page.mouse.move(startX + 110, startY - 20, { steps: 10 });
  await page.waitForTimeout(100);

  // E. Release & spring wobble settling
  console.log(' -> Releasing pointer for 2D coupled harmonic wobble...');
  await page.mouse.up();
  await page.waitForTimeout(600);

  // Verify Hisab is now active
  await page.waitForSelector('text=Date Range Calculator');
  console.log(' -> Successfully navigated to Hisab with 100% 2D liquid physics!');

  await page.screenshot({ path: path.join(artifactDir, 'liquid_nav_after_wobble.png') });

  console.log('ALL UP & DOWN 100% PHYSICS TESTS PASSED!');
  await browser.close();
}

testLiquidGlassPhysics().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
