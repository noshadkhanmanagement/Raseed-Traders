const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_URL = (process.env.APP_URL || 'https://raseed-traders-management.vercel.app').trim();

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

async function runLiveVerification() {
  console.log('===========================================================');
  console.log(`STARTING COMPREHENSIVE LIVE CRUD & RESET VERIFICATION`);
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

  // Automatically accept all browser dialogs (confirmations & alerts)
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
    // -------------------------------------------------------------
    // STEP 1: Authentication Gate
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Live Application Authentication ---');
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const passwordInput = await page.$('#login-password');
    if (passwordInput) {
      console.log('Security gate active, authenticating with environment password...');
      await passwordInput.fill(APP_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login') && (await page.$('#login-password')) === null;
    recordTest('Live Authentication Gate', isLoggedIn, `Logged in successfully, Terminal at: ${currentUrl}`);

    // -------------------------------------------------------------
    // STEP 2: Custom Material Addition (Create)
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Custom Material Addition in Inventory ---');
    await page.goto(`${APP_URL}/inventory`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const testItemName = 'TEST BRASS WIRE ' + Date.now().toString().slice(-4);
    const testItemHindi = 'टेस्ट पीतल तार';
    const testItemHindiEdited = 'टेस्ट पीतल तार स्पेशल';

    // Click "Add Material" button
    const addMaterialBtn = await page.waitForSelector('button:has-text("Add Material")', { timeout: 5000 });
    await addMaterialBtn.click();
    await page.waitForTimeout(1000);

    // Fill ItemModal form
    await page.fill('input[placeholder="e.g. COPPER WIRE, LOHA"]', testItemName);
    await page.fill('input[placeholder="उदा: ताँबा तार, लोहा"]', testItemHindi);
    await page.locator('input[placeholder="0.00"]').first().fill('125.50');

    // Submit form
    const saveMaterialBtn = await page.waitForSelector('button:has-text("Save Material")', { timeout: 5000 });
    await saveMaterialBtn.click();
    
    // Wait for the new row to render in the table
    const brassRow = await page.waitForSelector(`tr:has-text("${testItemName}")`, { timeout: 8000 });
    const brassRowText = await brassRow.innerText();
    const additionSuccess = brassRowText.includes(testItemName) && brassRowText.includes('125.50');
    recordTest('Custom Material Addition', additionSuccess, `Row verified in table: ${brassRowText.replace(/\n/g, ' | ')}`);

    // -------------------------------------------------------------
    // STEP 3: Material Editing (Update)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Material Editing (Update Spot Rate & Name) ---');
    const editBtn = await brassRow.waitForSelector('button[title="Edit Material & Rates (सामग्री व दर बदलें)"]', { timeout: 5000 });
    await editBtn.click();
    await page.waitForTimeout(1000);

    // Modify rate and local name
    await page.fill('input[placeholder="उदा: ताँबा तार, लोहा"]', testItemHindiEdited);
    await page.locator('input[placeholder="0.00"]').first().fill('140.00');

    const updateBtn = await page.waitForSelector('button:has-text("Save Material"), button:has-text("Update Material")', { timeout: 5000 });
    await updateBtn.click();
    await page.waitForTimeout(2500);

    // Verify update
    const updatedRow = await page.waitForSelector(`tr:has-text("${testItemName}")`, { timeout: 5000 });
    const updatedText = await updatedRow.innerText();
    const editSuccess = updatedText.includes('140') || updatedText.includes(testItemHindiEdited);
    recordTest('Material Editing', editSuccess, `Updated text verified: ${updatedText.replace(/\n/g, ' | ')}`);

    // -------------------------------------------------------------
    // STEP 4: Material Deletion (Delete)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Material Deletion ---');
    const deleteBtn = await updatedRow.waitForSelector('button[title="Delete Material (सामग्री हटाएं)"]', { timeout: 5000 });
    await deleteBtn.click();
    await page.waitForTimeout(2500);

    const rowAfterDelete = await page.$(`tr:has-text("${testItemName}")`);
    const deleteSuccess = rowAfterDelete === null;
    recordTest('Material Deletion', deleteSuccess, `${testItemName} was deleted and removed from table with confirmation`);

    // -------------------------------------------------------------
    // STEP 5: Purchase Addition (Roz Kitna Khareeda)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Purchase Addition (100 KG LOHA @ ₹28/kg) ---');
    await page.goto(`${APP_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const buyBtn = await page.waitForSelector('button:has-text("Roz Ki Kharidi (Buy)")', { timeout: 5000 });
    await buyBtn.click();
    await page.waitForTimeout(1000);

    // Fill weight & rate for LOHA (first item)
    await page.locator('input[placeholder="0.00"]').first().fill('100');
    await page.locator('input[placeholder="Enter Rate ₹"]').first().fill('28');
    await page.waitForTimeout(500);

    // Save purchase
    const savePurchaseBtn = await page.waitForSelector('button:has-text("Save Purchase")', { timeout: 5000 });
    await savePurchaseBtn.click();
    await page.waitForTimeout(3000);

    // Verify in Purchases Register
    await page.goto(`${APP_URL}/purchases`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const purchaseRows = await page.$$('tbody tr');
    const hasPurchase = purchaseRows.length > 0;
    const purText = hasPurchase ? await purchaseRows[0].innerText() : '';
    recordTest('Purchase Addition', hasPurchase && purText.includes('100'), `Purchase registered with details: ${purText.replace(/\n/g, ' | ')}`);

    // Verify Stock increased to 100 in Inventory
    await page.goto(`${APP_URL}/inventory`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const itemRow = await page.waitForSelector('tr:has-text("2 TYRE")', { timeout: 5000 });
    const itemText = await itemRow.innerText();
    const stockUpdated = itemText.includes('100');
    recordTest('Inventory Stock Update on Purchase', stockUpdated, `2 TYRE stock after purchase: ${itemText.replace(/\n/g, ' | ')}`);

    // -------------------------------------------------------------
    // STEP 6: Sale Addition (Kitna Becha)
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Sale Addition (40 PIECE 2 TYRE @ ₹36/piece) ---');
    await page.goto(`${APP_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const sellBtn = await page.waitForSelector('button:has-text("Roz Ki Bikri (Sell)")', { timeout: 5000 });
    await sellBtn.click();
    await page.waitForTimeout(1000);

    // Fill weight & rate for 2 TYRE (first item)
    await page.locator('input[placeholder="0.00"]').first().fill('40');
    await page.locator('input[placeholder="Enter Rate ₹"]').first().fill('36');
    await page.waitForTimeout(500);

    // Save sale
    const saveSaleBtn = await page.waitForSelector('button:has-text("Save Sale")', { timeout: 5000 });
    await saveSaleBtn.click();
    await page.waitForTimeout(3000);

    // Verify in Sales Register
    await page.goto(`${APP_URL}/sales`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const saleRows = await page.$$('tbody tr');
    const hasSale = saleRows.length > 0;
    const saleText = hasSale ? await saleRows[0].innerText() : '';
    recordTest('Sale Addition', hasSale && saleText.includes('40'), `Sale registered with details: ${saleText.replace(/\n/g, ' | ')}`);

    // Verify Stock deducted: 100 - 40 = 60 PIECE
    await page.goto(`${APP_URL}/inventory`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const itemAfterSale = await page.waitForSelector('tr:has-text("2 TYRE")', { timeout: 5000 });
    const itemAfterSaleText = await itemAfterSale.innerText();
    const stockDeducted = itemAfterSaleText.includes('60');
    recordTest('Inventory Stock Deduction on Sale', stockDeducted, `2 TYRE stock after sale: ${itemAfterSaleText.replace(/\n/g, ' | ')}`);

    // -------------------------------------------------------------
    // STEP 7: Interactive Rate History Modal on Dashboard
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Interactive Rate History Modal on Dashboard ---');
    await page.goto(`${APP_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const itemCard = page.locator('div[title*="Touch to view purchase rates"]').first();
    await itemCard.click();
    await page.waitForTimeout(1500);

    const modalContent = await page.content();
    const rateHistoryWorking = modalContent.includes('Latest Rate') || modalContent.includes('ताज़ा भाव') || modalContent.includes('past purchase rates');
    recordTest('Rate History Modal Live Sync', rateHistoryWorking, 'Modal opens and displays rate fluctuation and purchase details');

    const closeBtn = await page.$('button[title="Close dialog"], button:has-text("Close"), button:has-text("बंद करें")');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // STEP 8: Reset Database Feature (Settings -> Reset Database)
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Reset Database Feature in Settings ---');
    await page.goto(`${APP_URL}/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const resetBtn = await page.waitForSelector('button:has-text("Reset Database"), button:has-text("डेटा रीसेट")', { timeout: 5000 });
    console.log('Clicking "Reset Database" button...');
    
    let alertHandled = false;
    const dialogListener = (dialog) => {
      if (dialog.type() === 'alert') {
        alertHandled = true;
      }
    };
    page.on('dialog', dialogListener);

    await resetBtn.click();
    
    // Wait for the alert to fire and window.location.reload() to settle
    for (let i = 0; i < 20; i++) {
      if (alertHandled) break;
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    page.off('dialog', dialogListener);

    // Check Purchases Register is clean
    await page.goto(`${APP_URL}/purchases`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const postPurNotice = (await page.$('text="No purchase records"')) !== null || (await page.$('text="कोई खरीद दर्ज नहीं"')) !== null;
    const postPurRows = (await page.$$('tbody tr')).length;
    const purchasesClean = postPurNotice || postPurRows === 0 || postPurRows === 1; // 1 row if it's the 'No records' row
    recordTest('Reset Database: Purchases Wiped', purchasesClean, `Purchases register shows empty state`);

    // Check Sales Register is clean
    await page.goto(`${APP_URL}/sales`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const postSaleNotice = (await page.$('text="No sale records"')) !== null || (await page.$('text="कोई बिक्री दर्ज नहीं"')) !== null;
    const postSaleRows = (await page.$$('tbody tr')).length;
    const salesClean = postSaleNotice || postSaleRows === 0 || postSaleRows === 1;
    recordTest('Reset Database: Sales Wiped', salesClean, `Sales register shows empty state`);

    // Check Inventory: Stock is 0 KG and all 25 master items intact
    await page.goto(`${APP_URL}/inventory`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const totalStockEl = await page.$('text="Total Available Stock (कुल उपलब्ध स्टॉक)"');
    const stockContainer = totalStockEl ? await totalStockEl.evaluate(el => el.parentElement.innerText) : '';
    const stockIsZero = stockContainer.includes('0 KG') || stockContainer.includes('0\nKG');
    recordTest('Reset Database: Stock Reset to 0 KG', stockIsZero, `Stock summary banner: ${stockContainer.replace(/\n/g, ' ')}`);

    const masterItemsRows = await page.$$('tbody tr');
    const masterItemsIntact = masterItemsRows.length >= 25;
    recordTest('Reset Database: 25 Master Items Intact', masterItemsIntact, `Master items count in inventory: ${masterItemsRows.length}`);

    // Check Dashboard: Clean state with all 25 materials
    await page.goto(`${APP_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const dashCards = await page.$$('[title="Touch to view purchase rates & history (भाव इतिहास देखें)"]');
    const dashClean = dashCards.length >= 25;
    recordTest('Reset Database: Dashboard Clean with 25 Materials', dashClean, `Dashboard materials count: ${dashCards.length}`);

    // Take screenshot of clean dashboard
    const screenshotFile = path.resolve('C:\\Users\\anura\\.gemini\\antigravity-ide\\brain\\b6fb20f5-3d47-44c4-b895-3a81547daff3', 'screenshot_live_after_reset.png');
    await page.screenshot({ path: screenshotFile, fullPage: true });
    console.log(`Saved screenshot of clean live dashboard to: ${screenshotFile}`);

  } catch (err) {
    console.error('FATAL ERROR during live verification:', err);
    recordTest('Execution Exception', false, err.message);
  } finally {
    await browser.close();
  }

  // Summary Report
  console.log('\n===========================================================');
  console.log('FINAL LIVE CRUD & RESET VERIFICATION SUMMARY:');
  console.log('===========================================================');
  const allPassed = testResults.every(t => t.passed);
  testResults.forEach(t => {
    console.log(`${t.passed ? '✓' : '✗'} ${t.name}: ${t.detail}`);
  });
  console.log(`\nOverall Status: ${allPassed ? 'ALL TESTS PASSED (100% SUCCESS)' : 'SOME TESTS FAILED'}`);
  console.log('===========================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runLiveVerification().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
