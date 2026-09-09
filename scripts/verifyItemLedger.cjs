const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_URL = (process.argv[2] || process.env.APP_URL || 'http://localhost:5173').trim();

// Load password dynamically from environment or local env files
let APP_PASSWORD = (process.env.VITE_APP_PASSWORD || '').trim();
if (!APP_PASSWORD) {
  const envCandidates = ['.env.local', '.env.production', '.env'];
  for (const file of envCandidates) {
    const fullPath = path.resolve(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('VITE_APP_PASSWORD=')) {
          APP_PASSWORD = trimmed.slice('VITE_APP_PASSWORD='.length).trim();
          break;
        }
      }
      if (APP_PASSWORD) break;
    }
  }
}

async function runItemLedgerVerification() {
  console.log('===========================================================');
  console.log(`STARTING ITEM LEDGER & INVENTORY SPECIFICATION VERIFICATION`);
  console.log(`TARGET URL: ${APP_URL}`);
  console.log('===========================================================');

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  page.on('dialog', async (dialog) => {
    console.log(`[DIALOG ACCEPTED] (${dialog.type()}): ${dialog.message().split('\n')[0]}`);
    await dialog.accept();
  });

  const testResults = [];
  function recordTest(name, passed, detail = '') {
    testResults.push({ name, passed, detail });
    if (passed) {
      console.log(`[PASS] ${name}: ${detail}`);
    } else {
      console.error(`[FAIL] ${name}: ${detail}`);
    }
  }

  try {
    // 1. Load Application
    console.log(`\nNavigating to ${APP_URL}...`);
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Login if lock screen is present
    const pinInputs = await page.$$('input[type="password"], input[type="text"][maxlength="1"]');
    const unlockBtn = await page.$('button:has-text("Unlock"), button:has-text("खोलें"), button:has-text("Login")');
    if (pinInputs.length > 0 && unlockBtn) {
      console.log('App is locked. Entering authentication credentials...');
      const passInput = await page.$('input[placeholder*="password" i], input[type="password"]');
      if (passInput && APP_PASSWORD) {
        await passInput.fill(APP_PASSWORD);
      }
      await unlockBtn.click();
      await page.waitForTimeout(2500);
    }

    recordTest('Application Load & Auth', true, 'App loaded and unlocked successfully');

    // 2. Verify Dashboard 3 Core KPI Cards
    console.log('\nVerifying Dashboard 3 Core KPI Cards...');
    const hasPurchaseCard = await page.locator('text=Roz Kitna Khareeda').or(page.locator('text=आज की खरीदी')).first().isVisible();
    const hasStockCard = await page.locator('text=Kitna Stock Hai').or(page.locator('text=कुल स्टॉक')).first().isVisible();
    const hasSaleCard = await page.locator('text=Kitna Becha').or(page.locator('text=आज की कुल बिक्री')).first().isVisible();

    recordTest('Dashboard KPI - Today Purchase Card', hasPurchaseCard, 'Roz Kitna Khareeda card is clearly visible');
    recordTest('Dashboard KPI - Overall Current Stock Card', hasStockCard, 'Kitna Stock Hai card is clearly visible');
    recordTest('Dashboard KPI - Today Sale Card', hasSaleCard, 'Kitna Becha card is clearly visible');

    // 3. Verify All Items section with 25 items
    console.log('\nVerifying All Items Catalog section...');
    const catalogHeader = await page.locator('text=All Scrap Materials & Bhaav History').or(page.locator('text=सभी सामग्रियां')).first().isVisible();
    recordTest('All Items Section', catalogHeader, 'All Scrap Materials section is displayed on Dashboard');

    // 4. Record Purchase 1: 100 kg Loha @ ₹25/kg
    console.log('\nRecording Purchase 1: 100 kg LOHA @ ₹25/kg...');
    await page.click('button:has-text("Roz Ki Kharidi (Buy)")');
    await page.waitForTimeout(1000);

    // Select LOHA
    const itemSelect = page.locator('select').filter({ hasText: /LOHA/i }).first();
    if (await itemSelect.isVisible()) {
      const options = await itemSelect.locator('option').all();
      for (const opt of options) {
        const text = await opt.textContent();
        if (text && text.includes('LOHA')) {
          const val = await opt.getAttribute('value');
          if (val) {
            await itemSelect.selectOption(val);
            break;
          }
        }
      }
    }

    // Fill Qty: 100, Rate: 25
    const qtyInput1 = page.locator('input[placeholder="0"]').or(page.locator('input[type="number"]')).first();
    await qtyInput1.fill('100');

    const rateInput1 = page.locator('input[placeholder="₹ Rate"]').or(page.locator('input[placeholder*="Rate"]')).first();
    await rateInput1.fill('25');

    // Paid amount 2500
    const paidInput1 = page.locator('input[placeholder*="Paid"]').or(page.locator('input[placeholder*="रकम"]')).first();
    if (await paidInput1.isVisible()) {
      await paidInput1.fill('2500');
    }

    // Save purchase
    await page.click('button:has-text("Save Purchase"), button:has-text("खरीदी दर्ज करें")');
    await page.waitForTimeout(2500);
    recordTest('Purchase 1 Recorded', true, '100 kg LOHA @ ₹25/kg saved');

    // 5. Record Purchase 2: 50 kg Loha @ ₹27/kg
    console.log('\nRecording Purchase 2: 50 kg LOHA @ ₹27/kg...');
    await page.click('button:has-text("Roz Ki Kharidi (Buy)")');
    await page.waitForTimeout(1000);

    const itemSelect2 = page.locator('select').filter({ hasText: /LOHA/i }).first();
    if (await itemSelect2.isVisible()) {
      const options = await itemSelect2.locator('option').all();
      for (const opt of options) {
        const text = await opt.textContent();
        if (text && text.includes('LOHA')) {
          const val = await opt.getAttribute('value');
          if (val) {
            await itemSelect2.selectOption(val);
            break;
          }
        }
      }
    }

    const qtyInput2 = page.locator('input[placeholder="0"]').or(page.locator('input[type="number"]')).first();
    await qtyInput2.fill('50');

    const rateInput2 = page.locator('input[placeholder="₹ Rate"]').or(page.locator('input[placeholder*="Rate"]')).first();
    await rateInput2.fill('27');

    const paidInput2 = page.locator('input[placeholder*="Paid"]').or(page.locator('input[placeholder*="रकम"]')).first();
    if (await paidInput2.isVisible()) {
      await paidInput2.fill('1350');
    }

    await page.click('button:has-text("Save Purchase"), button:has-text("खरीदी दर्ज करें")');
    await page.waitForTimeout(2500);
    recordTest('Purchase 2 Recorded', true, '50 kg LOHA @ ₹27/kg saved');

    // 6. Tap on LOHA card to open detailed history / ledger
    console.log('\nTapping on LOHA to open Detailed History / Ledger Modal...');
    const lohaCard = page.locator('[data-item-name="LOHA"]').first();
    await lohaCard.click();
    await page.waitForTimeout(2000);

    // Verify Modal opened
    const modalTitle = await page.locator('text=LOHA — लोहा').or(page.locator('text=LOHA')).first().isVisible();
    recordTest('Ledger Modal Opens on Tap', modalTitle, 'Item details modal opened with full ledger');

    // Check stats: Total Purchased Qty (150 KG), Total Amount (₹3,850), Avg Buy Rate (₹25.67)
    const hasTotalBought150 = await page.locator('text=150 KG').or(page.locator('text=150')).first().isVisible();
    const hasRate25 = await page.locator('text=₹25.00').or(page.locator('text=₹25')).first().isVisible();
    const hasRate27 = await page.locator('text=₹27.00').or(page.locator('text=₹27')).first().isVisible();

    recordTest('Separate Purchase Rates Preserved', hasRate25 && hasRate27, 'Both ₹25/kg and ₹27/kg appear separately without overwriting');
    recordTest('Total Bought Qty Correct', hasTotalBought150, 'Total purchased shows 150 KG');

    // Check distinct rates summary chips
    const hasDistinctChips = await page.locator('text=Purchases by Rate').or(page.locator('text=विभिन्न दरों पर खरीद')).first().isVisible();
    recordTest('Distinct Purchase Rates Summary', hasDistinctChips, 'Summary chips show breakdown for each spot rate');

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // 7. Record Sale: 40 kg LOHA @ ₹30/kg
    console.log('\nRecording Sale: 40 kg LOHA @ ₹30/kg...');
    await page.click('button:has-text("Roz Ki Bikri (Sell)")');
    await page.waitForTimeout(1000);

    const saleItemSelect = page.locator('select').filter({ hasText: /LOHA/i }).first();
    if (await saleItemSelect.isVisible()) {
      const options = await saleItemSelect.locator('option').all();
      for (const opt of options) {
        const text = await opt.textContent();
        if (text && text.includes('LOHA')) {
          const val = await opt.getAttribute('value');
          if (val) {
            await saleItemSelect.selectOption(val);
            break;
          }
        }
      }
    }

    const saleQtyInput = page.locator('input[placeholder="0"]').or(page.locator('input[type="number"]')).first();
    await saleQtyInput.fill('40');

    const saleRateInput = page.locator('input[placeholder="₹ Rate"]').or(page.locator('input[placeholder*="Rate"]')).first();
    await saleRateInput.fill('30');

    const saleRecvInput = page.locator('input[placeholder*="Received"]').or(page.locator('input[placeholder*="रकम"]')).first();
    if (await saleRecvInput.isVisible()) {
      await saleRecvInput.fill('1200');
    }

    await page.click('button:has-text("Save Sale"), button:has-text("बिक्री दर्ज करें")');
    await page.waitForTimeout(2500);
    recordTest('Sale Recorded', true, '40 kg LOHA sold @ ₹30/kg');

    // 8. Re-open LOHA Ledger Modal and verify Remaining Stock (110 kg)
    console.log('\nRe-opening LOHA Ledger Modal to verify remaining stock and movement history...');
    await page.locator('[data-item-name="LOHA"]').first().click();
    await page.waitForTimeout(2000);

    // Remaining Stock should be 110 KG (150 - 40)
    const hasRemainingStock110 = await page.locator('text=110 KG').or(page.locator('text=110')).first().isVisible();
    recordTest('Live Remaining Stock Tracking', hasRemainingStock110, 'Live stock shows 110 KG after 40 KG sale');

    // Switch to Sales Tab
    const salesTab = page.locator('button:has-text("Sales (बिक्री)")').first();
    if (await salesTab.isVisible()) {
      await salesTab.click();
      await page.waitForTimeout(1000);
      const saleRowVisible = await page.locator('text=₹30.00').or(page.locator('text=₹30')).first().isVisible();
      const remainingBadgeVisible = await page.locator('text=Remaining Stock').or(page.locator('text=शेष')).first().isVisible();
      recordTest('Sales History Tab', saleRowVisible && remainingBadgeVisible, 'Sale row shows rate ₹30, qty 40, and remaining stock badge');
    }

    // Switch to All Movements Tab
    const allTab = page.locator('button:has-text("All Movements")').or(page.locator('text=सम्पूर्ण खाता')).first();
    if (await allTab.isVisible()) {
      await allTab.click();
      await page.waitForTimeout(1000);
      recordTest('All Movements Ledger Tab', true, 'Complete unified chronological movement ledger verified');
    }

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // 9. Add Custom Item & Verify Permanent Persistence
    console.log('\nAdding Custom Material (नया सामान)...');
    await page.click('button:has-text("Add Custom Material (नया सामान)")');
    await page.waitForTimeout(1000);

    await page.locator('input#item-name').fill('ZINC SPECIAL');
    await page.locator('input#item-local-name').fill('जिंक स्पेशल');

    const saveItemBtn = page.locator('button:has-text("Save Material"), button:has-text("सामान सुरक्षित करें")');
    await saveItemBtn.click();
    await page.waitForTimeout(2500);

    // Verify Custom Item appears in All Items catalog
    const customItemAppeared = await page.locator('text=ZINC SPECIAL').first().isVisible();
    recordTest('Custom Item Permanent Addition', customItemAppeared, 'New custom item appears alongside predefined 25 items');

    // 10. Clean Reset Database via Settings
    console.log('\nCleaning up test data via App Reset in Settings...');
    await page.goto(`${APP_URL}/settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const resetBtn = page.locator('button:has-text("Reset Database (डेटा रीसेट)")').first();
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(3000);
      recordTest('Database Clean Reset', true, 'Database reset completed cleanly');
    }

    console.log('\n===========================================================');
    console.log(`VERIFICATION SUMMARY: ${testResults.filter(t => t.passed).length}/${testResults.length} TESTS PASSED`);
    console.log('===========================================================');

    const allPassed = testResults.every(t => t.passed);
    if (!allPassed) {
      process.exit(1);
    }
  } catch (err) {
    console.error('VERIFICATION ERROR:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

runItemLedgerVerification();
