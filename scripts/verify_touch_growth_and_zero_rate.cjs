const { chromium } = require('playwright');
const path = require('path');

async function verifyAll() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const artifactDir = 'C:/Users/anura/.gemini/antigravity-ide/brain/b6fb20f5-3d47-44c4-b895-3a81547daff3';

  console.log('1. Loading app and logging in...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('raseed_traders_auth_session', 'authenticated');
    localStorage.setItem('raseed_traders_theme', 'light');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  // --- TEST A: Nav Touch & Hold Symmetrical Growth ---
  console.log('2. Testing Apple Touch & Hold Uniform 4-Sided Growth...');
  const navContainer = page.locator('nav[aria-label="Mobile Navigation Bar"] > div');
  await navContainer.waitFor({ state: 'visible' });
  const box = await navContainer.boundingBox();
  if (!box) throw new Error('Nav bar box not found');

  const tab0X = box.x + 50;
  const tab0Y = box.y + box.height / 2;

  // Touch Down & Hold
  await page.mouse.move(tab0X, tab0Y);
  await page.mouse.down();
  await page.waitForTimeout(200);

  const touchMatrix = await page.evaluate(() => {
    const pill = document.querySelector('nav[aria-label="Mobile Navigation Bar"] > div > div');
    const style = window.getComputedStyle(pill);
    return {
      transform: style.transform,
      transformOrigin: style.transformOrigin,
    };
  });
  console.log(' -> Touch down transform:', touchMatrix.transform);
  // In matrix(a, b, c, d, tx, ty), a is scaleX, d is scaleY
  const match = touchMatrix.transform.match(/matrix\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
  if (match) {
    const scaleX = parseFloat(match[1]);
    const scaleY = parseFloat(match[4]);
    console.log(` -> ScaleX: ${scaleX.toFixed(3)}, ScaleY: ${scaleY.toFixed(3)}`);
    if (Math.abs(scaleX - 1.05) > 0.02 || Math.abs(scaleY - 1.05) > 0.02) {
      throw new Error(`Expected symmetrical ~1.05 growth, got scaleX=${scaleX}, scaleY=${scaleY}`);
    }
  }

  // --- TEST B: Contained Draggability (Max 4.5px Excursion) ---
  console.log('3. Testing Contained Draggability (dragging hard up, down, left, right)...');
  // Drag hard UP (-80px)
  await page.mouse.move(tab0X, tab0Y - 80, { steps: 8 });
  await page.waitForTimeout(100);
  const upExcursion = await page.evaluate(() => {
    const pill = document.querySelector('nav[aria-label="Mobile Navigation Bar"] > div > div');
    const match = window.getComputedStyle(pill).transform.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*([^)]+)\)/);
    return match ? parseFloat(match[1]) : 0;
  });
  console.log(` -> Hard UP excursion: ${upExcursion.toFixed(2)}px (Expected: between -4.5px and 0px)`);
  if (upExcursion < -4.5 || upExcursion > 0.5) {
    throw new Error(`Upward drag went too far: ${upExcursion}px`);
  }

  // Drag hard DOWN (+80px)
  await page.mouse.move(tab0X, tab0Y + 80, { steps: 8 });
  await page.waitForTimeout(100);
  const downData = await page.evaluate(() => {
    const pill = document.querySelector('nav[aria-label="Mobile Navigation Bar"] > div > div');
    const comp = window.getComputedStyle(pill).transform;
    const inline = pill.style.transform;
    return { comp, inline };
  });
  console.log(' -> Down data:', downData);
  const compMatch = downData.comp.match(/matrix\(([^)]+)\)/);
  let downExcursion = 0;
  if (compMatch) {
    const parts = compMatch[1].split(',').map(s => parseFloat(s.trim()));
    // parts = [a, b, c, d, tx, ty]
    console.log(' -> Matrix parts:', parts);
    downExcursion = parts[5];
  }
  console.log(` -> Hard DOWN excursion: ${downExcursion.toFixed(2)}px (Expected: between 0px and +4.5px)`);
  if (downExcursion > 4.5 || downExcursion < -0.5) {
    throw new Error(`Downward drag went too far: ${downExcursion}px`);
  }

  await page.mouse.up();
  await page.waitForTimeout(500);

  // --- TEST C: Zero Default Rates in Database ---
  console.log('4. Testing Zero Default Rates in Database...');
  const rates = await page.evaluate(() => {
    // Check localStorage items directly
    const raw = localStorage.getItem('scrap_management_storage_db');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.items.map(it => ({
      name: it.name,
      purchaseRate: it.default_purchase_rate,
      saleRate: it.default_sale_rate,
    }));
  });
  console.log(` -> Total items in DB: ${rates.length}`);
  const nonZeroRates = rates.filter(r => r.purchaseRate > 0 || r.saleRate > 0);
  console.log(` -> Non-zero default rate items: ${nonZeroRates.length} (Expected: 0)`);
  if (nonZeroRates.length > 0) {
    throw new Error(`Found items with non-zero default rates: ${JSON.stringify(nonZeroRates)}`);
  }

  // --- TEST D: Quick Trade Modal Rate Blank by Default ---
  console.log('5. Testing Quick Trade Modal (Rate is completely empty by default)...');
  await page.click('button:has-text("Kharidi")');
  await page.waitForTimeout(400);

  // Rate input has placeholder="0" and is after quantity
  const inputs = await page.locator('form input[type="number"]').all();
  // inputs[0] is quantity, inputs[1] is rate
  const buyRateValue = await inputs[1].inputValue();
  console.log(` -> Buy modal rate field value: "${buyRateValue}" (Expected: "")`);
  if (buyRateValue !== '') {
    throw new Error(`Expected empty rate input on Buy modal, got "${buyRateValue}"`);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // --- TEST E: Settings Page Item Adder & Full List Layout ---
  console.log('6. Navigating to Settings page...');
  await page.click('button[aria-label="Settings"]');
  await page.waitForTimeout(500);

  // Check that Quick Item Adder has NO spot rate field
  const rateInputInQuickAdder = await page.locator('form:has-text("Add New Material") input[type="number"]').count();
  console.log(` -> Number of number inputs in Quick Adder: ${rateInputInQuickAdder} (Expected: 0)`);
  if (rateInputInQuickAdder !== 0) {
    throw new Error(`Quick adder form still has ${rateInputInQuickAdder} number input fields!`);
  }

  // Check that items list has NO max-h-80 or overflow-y-auto (display full list)
  const isMiniScrollable = await page.evaluate(() => {
    const list = document.querySelector('div.divide-y');
    if (!list) return false;
    const classes = list.className;
    return classes.includes('max-h-') || classes.includes('overflow-y-auto');
  });
  console.log(` -> Items list is mini scrollable widget: ${isMiniScrollable} (Expected: false)`);
  if (isMiniScrollable) {
    throw new Error('Items list still contains max-h- or overflow-y-auto!');
  }

  // Check Full Form (ItemModal) has NO Spot Pricing & Valuation section
  console.log('7. Opening Full Form (ItemModal) in Settings...');
  await page.click('button:has-text("Full Form")');
  await page.waitForTimeout(400);

  const spotPricingHeaderCount = await page.locator('text=Spot Pricing & Valuation').count();
  console.log(` -> "Spot Pricing & Valuation" count in Full Form: ${spotPricingHeaderCount} (Expected: 0)`);
  if (spotPricingHeaderCount !== 0) {
    throw new Error('Spot Pricing & Valuation section is still present in Full Form!');
  }

  await page.screenshot({ path: path.join(artifactDir, 'settings_full_form_clean.png') });
  console.log(' -> Captured screenshot of clean Full Form modal');

  await page.click('button:has-text("Cancel (रद्द करें)")');
  await page.waitForTimeout(300);

  await page.screenshot({ path: path.join(artifactDir, 'settings_full_list_clean.png') });
  console.log(' -> Captured screenshot of full unconstrained items catalog list');

  console.log('ALL VERIFICATIONS FOR TOUCH GROWTH, CONTAINED DRAGGABILITY, AND ZERO DEFAULT RATES PASSED 100%!');
  await browser.close();
}

verifyAll().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
