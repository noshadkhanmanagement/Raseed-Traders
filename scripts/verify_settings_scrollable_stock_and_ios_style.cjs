const { chromium } = require('playwright');
const path = require('path');

async function verifySettings() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  const artifactDir = 'C:/Users/anura/.gemini/antigravity-ide/brain/b6fb20f5-3d47-44c4-b895-3a81547daff3';

  console.log('1. Loading app and logging in...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('raseed_traders_auth_session', 'authenticated');
    localStorage.setItem('raseed_traders_theme', 'light');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  console.log('2. Navigating to Settings...');
  await page.click('button[aria-label="Settings"]');
  await page.waitForTimeout(500);

  // Check 1: Horizontally scrollable table
  console.log('3. Checking horizontal scrollability of materials table...');
  const tableContainer = page.locator('div.overflow-x-auto');
  await tableContainer.waitFor({ state: 'visible' });

  const scrollMetrics = await tableContainer.evaluate((el) => {
    return {
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
      isScrollable: el.scrollWidth > el.clientWidth,
    };
  });
  console.log(' -> Scroll metrics:', scrollMetrics);
  if (!scrollMetrics.isScrollable) {
    throw new Error(`Expected table to be horizontally scrollable on 393px viewport, got clientWidth=${scrollMetrics.clientWidth}, scrollWidth=${scrollMetrics.scrollWidth}`);
  }

  // Check 2: Edit current stock for LOHA
  console.log('4. Editing current stock for LOHA...');
  await tableContainer.evaluate((el) => {
    el.scrollLeft = 120;
  });
  await page.waitForTimeout(200);

  // Find LOHA row
  const lohaRow = page.locator('tr:has-text("LOHA")');
  await lohaRow.waitFor({ state: 'visible' });
  const stockInput = lohaRow.locator('input[type="number"]');

  await stockInput.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const currentVal = parseFloat(await stockInput.inputValue()) || 0;
  const targetStock = currentVal === 50 ? 80 : 50;
  console.log(` -> Current LOHA stock: ${currentVal}, changing to target: ${targetStock}`);

  await stockInput.click();
  await stockInput.fill(String(targetStock));
  await page.waitForTimeout(300);

  const saveBtnCount = await lohaRow.locator('button:has-text("Save")').count();
  console.log(' -> Save button count in LOHA row:', saveBtnCount);
  if (saveBtnCount > 0) {
    const saveBtn = lohaRow.locator('button:has-text("Save")');
    await saveBtn.click();
    console.log(' -> Clicked Save button!');
  } else {
    console.log(' -> Save button not found, pressing Enter...');
    await stockInput.press('Enter');
  }
  await page.waitForTimeout(600);

  // Verify stock in DB
  const updatedStockInDb = await page.evaluate(() => {
    const raw = localStorage.getItem('scrap_management_storage_db');
    const parsed = JSON.parse(raw);
    const loha = parsed.items.find(i => i.name === 'LOHA');
    return loha ? loha.current_stock : null;
  });
  console.log(` -> LOHA stock in DB after update: ${updatedStockInDb} (Expected: ${targetStock})`);
  if (updatedStockInDb !== targetStock) {
    throw new Error(`Expected LOHA stock to be ${targetStock} in DB, got ${updatedStockInDb}`);
  }

  // Check 3: Quick Reset stock for LOHA
  console.log('5. Testing quick reset stock for LOHA...');
  page.on('dialog', async (dialog) => {
    console.log(' -> Dialog appeared:', dialog.message());
    await dialog.accept();
  });
  const resetBtn = lohaRow.locator('button[title="Reset Stock Count to 0"]');
  await resetBtn.click();
  await page.waitForTimeout(600);

  const resetStockInDb = await page.evaluate(() => {
    const raw = localStorage.getItem('scrap_management_storage_db');
    const parsed = JSON.parse(raw);
    const loha = parsed.items.find(i => i.name === 'LOHA');
    return loha ? loha.current_stock : null;
  });
  console.log(' -> LOHA stock in DB after reset:', resetStockInDb);
  if (resetStockInDb !== 0) {
    throw new Error(`Expected LOHA stock to be 0 after reset, got ${resetStockInDb}`);
  }

  // Check 4: Compact iOS grouped sections below
  console.log('6. Checking compact iOS grouped sections...');
  const shopProfileCount = await page.locator('text=Shop Profile (व्यापार विवरण)').count();
  const dataBackupCount = await page.locator('text=Data & Backup (डेटा बैकअप)').count();
  const securityCount = await page.locator('text=Security & Access (सुरक्षा)').count();
  const dangerZoneCount = await page.locator('text=Danger Zone (डेटा रीसेट)').count();

  console.log(` -> Sections found: Profile=${shopProfileCount}, Backup=${dataBackupCount}, Security=${securityCount}, Reset=${dangerZoneCount}`);
  if (!shopProfileCount || !dataBackupCount || !securityCount || !dangerZoneCount) {
    throw new Error('One or more compact iOS sections were not rendered properly');
  }

  // Scroll back left and capture Light Mode screenshot
  await tableContainer.evaluate((el) => { el.scrollLeft = 0; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(artifactDir, 'settings_ios_compact_light.png'), fullPage: true });
  console.log(' -> Captured settings_ios_compact_light.png');

  // Dark Mode test
  console.log('7. Testing Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('raseed_traders_theme', 'dark');
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(artifactDir, 'settings_ios_compact_dark.png'), fullPage: true });
  console.log(' -> Captured settings_ios_compact_dark.png');

  console.log('ALL VERIFICATIONS FOR SCROLLABLE STOCK TABLE AND COMPACT IOS SECTIONS PASSED 100%!');
  await browser.close();
}

verifySettings().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
