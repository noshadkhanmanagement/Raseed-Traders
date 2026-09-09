const { chromium } = require('playwright');

async function testTwoOptionsDelete() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('1. Navigating to App and authenticating...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  const passwordInput = await page.$('#login-password');
  if (passwordInput) {
    console.log('Logging in with password...');
    await passwordInput.fill('noshad@00');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
  }

  console.log('2. Navigating to Inventory page...');
  await page.goto('http://localhost:5173/inventory');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Verify Restore 25 Items button exists
  console.log('3. Checking "Restore 25 Items" button...');
  const restoreBtn = page.locator('button:has-text("Restore 25 Items")');
  await restoreBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ "Restore 25 Items" button is visible.');

  // Verify 2 TYRE is present
  console.log('3. Verifying "2 TYRE" is present in table...');
  const twoTyreRow = page.locator('tr:has-text("2 TYRE")');
  await twoTyreRow.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ "2 TYRE" is present in inventory table.');

  // Test row Trash icon -> opens 2-option modal
  console.log('4. Clicking Trash icon on 2 TYRE row to test 2-option modal...');
  const trashBtn = twoTyreRow.locator('button[title="Delete Material (सामग्री हटाएं)"]');
  await trashBtn.click();
  await page.waitForTimeout(500);

  // Check 2 options in modal
  const option1Btn = page.locator('button:has-text("Reset Stock Count to 0")');
  const option2Btn = page.locator('button:has-text("Delete")').filter({ hasText: 'Permanently' });
  await option1Btn.waitFor({ state: 'visible', timeout: 3000 });
  await option2Btn.waitFor({ state: 'visible', timeout: 3000 });
  console.log('✅ Both Option 1 (Reset Stock Count to 0) and Option 2 (Delete Permanently) are visible in modal!');

  // Test Option 1: Reset count to 0
  console.log('5. Testing Option 1: Reset Stock Count to 0...');
  await option1Btn.click();
  await page.waitForTimeout(1000);
  console.log('✅ Option 1 executed! Verifying 2 TYRE is still in list with stock 0...');

  const twoTyreStillPresent = await page.locator('tr:has-text("2 TYRE")').count();
  if (twoTyreStillPresent === 0) {
    throw new Error('FAILED: 2 TYRE was removed from list when only stock reset was chosen!');
  }
  console.log('✅ 2 TYRE is safely kept in the list after stock count reset!');

  // Now test ItemAdjustmentModal has both options
  console.log('6. Opening Adjust Modal for 2 TYRE to verify Section 3 options...');
  const adjustBtn = twoTyreRow.locator('button:has-text("Adjust")');
  await adjustBtn.click();
  await page.waitForTimeout(500);

  const adjOpt1 = page.locator('button:has-text("Reset Count to 0 (गिनती 0 करें)")');
  const adjOpt2 = page.locator('button:has-text("Delete from List (लिस्ट से हटाएं)")');
  await adjOpt1.waitFor({ state: 'visible', timeout: 3000 });
  await adjOpt2.waitFor({ state: 'visible', timeout: 3000 });
  console.log('✅ Both options visible in ItemAdjustmentModal as well!');

  // Close modal
  const cancelBtn = page.locator('button:has-text("Cancel (रद्द करें)")').first();
  await cancelBtn.click();
  await page.waitForTimeout(500);

  // Click Restore 25 Items button to verify auto-heal
  console.log('7. Testing "Restore 25 Items" button click...');
  await restoreBtn.click();
  await page.waitForTimeout(1500);

  // Verify all 25 items are present
  const rows = await page.locator('tbody tr').count();
  console.log(`Total rows in inventory: ${rows}`);
  if (rows !== 25) {
    throw new Error(`Expected exactly 25 items, but found ${rows}`);
  }
  console.log('✅ Exactly 25 items present in inventory table!');

  await browser.close();
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

testTwoOptionsDelete().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
