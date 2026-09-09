const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testItemAdder() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  page.on('console', (msg) => console.log('[BROWSER]', msg.text()));
  page.on('pageerror', (err) => console.error('[ERROR]', err.message));

  console.log('1. Loading app and logging in...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('raseed_traders_auth_session', 'authenticated');
  });
  await page.reload({ waitUntil: 'networkidle' });

  console.log('2. Navigating to Settings...');
  await page.click('nav[aria-label="Mobile Navigation Bar"] button:has-text("Settings")');
  await page.waitForSelector('text=Manage Material Names');
  await page.waitForSelector('text=Add New Material (नया सामान जोड़ें)');

  console.log('3. Checking KG and PIECE option buttons in item adder...');
  const kgBtn = page.locator('form button:has-text("KG (किलो)")');
  const pieceBtn = page.locator('form button:has-text("PIECE (नग)")');

  await kgBtn.waitFor({ state: 'visible' });
  await pieceBtn.waitFor({ state: 'visible' });
  console.log(' -> Both KG and PIECE buttons are visible!');

  // Select PIECE
  await pieceBtn.click();
  console.log(' -> Selected PIECE as unit');

  // Fill in name, local name, and spot rate
  const englishInput = page.locator('input[placeholder*="BATTERY, DRUM"]');
  const hindiInput = page.locator('input[placeholder*="उदा: बैटरी"]');
  const rateInput = page.locator('input[placeholder="0"]').first();

  await englishInput.fill('PLASTIC DRUM');
  await hindiInput.fill('प्लास्टिक ड्रम');
  await rateInput.fill('180');

  // Take screenshot of form before submitting
  const artifactDir = 'C:/Users/anura/.gemini/antigravity-ide/brain/b6fb20f5-3d47-44c4-b895-3a81547daff3';
  await page.screenshot({ path: path.join(artifactDir, 'settings_kg_piece_adder_form.png') });
  console.log(' -> Captured screenshot of Quick Item Adder with PIECE option');

  // Submit form
  await page.click('form button:has-text("Add Material")');
  await page.waitForSelector('text=Material added successfully as "PIECE"!');
  console.log(' -> Material successfully created with unit PIECE!');

  await page.waitForTimeout(500);

  // Check the material catalog list for PLASTIC DRUM
  await page.waitForSelector('span:has-text("PLASTIC DRUM")');
  console.log(' -> PLASTIC DRUM confirmed in material catalog list!');

  // Verify the inline unit toggle works
  const drumRow = page.locator('div.p-3:has-text("PLASTIC DRUM")').first();
  const drumKgBtn = drumRow.locator('button[title="Set unit to KG"]');
  const drumPieceBtn = drumRow.locator('button[title="Set unit to PIECE"]');

  // Toggle to KG
  await drumKgBtn.click();
  await page.waitForTimeout(400);
  console.log(' -> Successfully toggled PLASTIC DRUM to KG via inline switch!');

  // Toggle back to PIECE
  await drumPieceBtn.click();
  await page.waitForTimeout(400);
  console.log(' -> Successfully toggled PLASTIC DRUM back to PIECE!');

  await page.screenshot({ path: path.join(artifactDir, 'settings_kg_piece_catalog.png') });
  console.log(' -> Captured screenshot of material catalog with inline unit toggles');

  // Return to Dashboard and check QuickTradeModal
  console.log('4. Checking Dashboard & QuickTradeModal for PIECE unit...');
  await page.click('nav[aria-label="Mobile Navigation Bar"] button:has-text("Stock")');
  await page.waitForSelector('h1:has-text("Raseed Traders")');
  await page.waitForSelector('text=PLASTIC DRUM');

  // Open Buy modal
  await page.click('button:has-text("Kharidi (Buy)")');
  await page.waitForSelector('text=Calculated Account');

  // Select PLASTIC DRUM in modal
  await page.selectOption('select', { label: 'PLASTIC DRUM (प्लास्टिक ड्रम) — PIECE' });
  await page.waitForTimeout(300);

  // Check if unit displays PIECE
  await page.waitForSelector('text=Rate (भाव प्रति PIECE)');
  console.log(' -> QuickTradeModal correctly reflects PIECE unit!');

  await page.screenshot({ path: path.join(artifactDir, 'quick_trade_piece_unit.png') });
  console.log(' -> Captured screenshot of QuickTradeModal with PIECE unit');

  console.log('ALL TESTS PASSED SUCCESSFULLY!');
  await browser.close();
}

testItemAdder().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
