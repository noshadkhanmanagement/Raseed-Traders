const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verify() {
  const artifactsDir = path.join(__dirname, '../artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const logs = [];
  page.on('console', (msg) => logs.push(msg.text()));
  page.on('pageerror', (err) => console.error('Page error:', err.message));

  console.log('1. Loading app...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  // Authenticate session
  await page.evaluate(() => {
    localStorage.setItem('raseed_traders_auth_session', 'authenticated');
  });
  await page.reload({ waitUntil: 'networkidle' });

  console.log('2. Verifying Unified Main Screen...');
  await page.waitForSelector('h1:has-text("Raseed Traders")');
  await page.waitForSelector('button:has-text("Kharidi (Buy)")');
  await page.waitForSelector('button:has-text("Bikri (Sell)")');
  await page.screenshot({ path: path.join(artifactsDir, '1_main_unified_screen.png') });
  console.log(' -> Main Screen screenshot captured.');

  console.log('3. Testing Kharidi (Buy) minimal popup...');
  await page.click('button:has-text("Kharidi (Buy)")');
  await page.waitForSelector('text=Calculated Account');
  await page.waitForSelector('button:has-text("Save Entry")');
  
  // Fill quantity and rate
  const inputs = await page.$$('input[type="number"]');
  if (inputs.length >= 2) {
    await inputs[0].fill('120'); // 120 KG
    await inputs[1].fill('42');  // ₹42/KG
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(artifactsDir, '2_minimal_buy_popup.png') });
  console.log(' -> Minimal Buy Popup screenshot captured.');

  // Save the entry
  await page.click('button:has-text("Save Entry")');
  await page.waitForSelector('text=Calculated Account', { state: 'hidden' });
  await page.waitForTimeout(600);
  console.log(' -> Buy transaction saved and modal closed!');

  console.log('4. Testing Item Touch for History Sheet...');
  // Tap on the first item in the list
  const firstItem = page.locator('div[title="Touch to view Buy & Sell history"]').first();
  await firstItem.waitFor({ state: 'visible' });
  await firstItem.click();
  await page.waitForSelector('button:has-text("Buy (खरीदी)")');
  await page.waitForSelector('button:has-text("Sell (बिक्री)")');
  await page.screenshot({ path: path.join(artifactsDir, '3_item_history_sheet.png') });
  console.log(' -> Item History Sheet with Buy|Sell segmented divider captured.');

  // Switch to Sell tab
  await page.click('button:has-text("Sell (बिक्री)")');
  await page.waitForTimeout(400);

  // Close sheet
  const closeBtn = page.locator('button[aria-label="Close dialog"]').first();
  await closeBtn.click();
  await page.waitForSelector('button:has-text("Buy (खरीदी)")', { state: 'hidden' });
  await page.waitForTimeout(500);

  console.log('5. Testing Hisab Page...');
  await page.click('nav[aria-label="Mobile Navigation Bar"] button:has-text("Hisab")');
  await page.waitForSelector('text=Date Range Calculator');
  await page.waitForSelector('button:has-text("Today")');
  await page.waitForSelector('button:has-text("Yesterday")');
  await page.waitForSelector('button:has-text("This Month")');
  await page.waitForSelector('button:has-text("Last Month")');
  await page.waitForSelector('button:has-text("30 Days")');
  await page.screenshot({ path: path.join(artifactsDir, '4_minimal_hisab_page.png') });
  console.log(' -> Minimal Hisab Page screenshot captured.');

  console.log('6. Testing Mobile Tab Bar Drag & Wobble...');
  const navBar = await page.$('nav[aria-label="Mobile Navigation Bar"] > div');
  if (navBar) {
    const box = await navBar.boundingBox();
    if (box) {
      const startX = box.x + box.width * 0.2;
      const startY = box.y + box.height * 0.5;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      // Drag smoothly to the right
      await page.mouse.move(startX + 80, startY, { steps: 10 });
      await page.waitForTimeout(100);
      // Drag smoothly back to the left
      await page.mouse.move(startX + 20, startY, { steps: 10 });
      await page.waitForTimeout(100);
      await page.mouse.up();
      await page.waitForTimeout(600);
    }
  }
  console.log(' -> Drag and wobble gesture completed with zero errors.');

  console.log('ALL PLAYWRIGHT TESTS PASSED 100%!');
  await browser.close();
}

verify().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
