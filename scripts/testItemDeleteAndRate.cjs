const { chromium } = require('playwright');

async function testItemDeleteAndRate() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Navigating to Inventory page...');
  await page.goto('http://localhost:5173/inventory');
  await page.waitForLoadState('networkidle');

  // 1. Click Add Material button
  console.log('Clicking Add Material button...');
  const addBtn = page.locator('button:has-text("Add Material")');
  await addBtn.click();
  await page.waitForTimeout(500);

  // 2. Fill in details
  console.log('Filling in material details with Spot Purchase Rate ₹75...');
  await page.locator('input[placeholder="e.g. COPPER WIRE, LOHA"]').fill('TEST COPPER WIRE');
  await page.locator('input[placeholder="उदा: ताँबा तार, लोहा"]').fill('टेस्ट ताँबा तार');

  // Locate the Spot Purchase Rate input
  const spotRateInput = page.locator('input[placeholder="0.00"]').first();
  await spotRateInput.fill('75');

  // Submit
  const submitBtn = page.locator('button:has-text("Save Material")');
  await submitBtn.click();
  await page.waitForTimeout(1000);

  // 3. Verify in inventory table
  console.log('Verifying TEST COPPER WIRE in inventory table...');
  const row = page.locator('tr:has-text("TEST COPPER WIRE")');
  const rowCount = await row.count();
  if (rowCount === 0) {
    throw new Error('TEST COPPER WIRE was not found in inventory!');
  }
  console.log('[PASS] Material created with Spot Rate successfully!');

  // Check that rate is displayed
  const rateText = await row.innerText();
  if (!rateText.includes('75')) {
    throw new Error('Spot rate 75 is not displayed in table row: ' + rateText);
  }
  console.log('[PASS] Spot Rate ₹75 displayed in table row!');

  // 4. Test Delete Button
  console.log('Testing delete button for TEST COPPER WIRE...');
  page.on('dialog', async (dialog) => {
    console.log('Dialog opened with message:', dialog.message());
    await dialog.accept();
  });

  const deleteBtn = row.locator('button[title="Delete Material (सामग्री हटाएं)"]');
  await deleteBtn.click();
  await page.waitForTimeout(1000);

  // Verify it is gone
  const remainingRows = await page.locator('tr:has-text("TEST COPPER WIRE")').count();
  if (remainingRows > 0) {
    throw new Error('TEST COPPER WIRE still present after delete!');
  }
  console.log('[PASS] Material deleted successfully with confirmation!');

  await browser.close();
  console.log('All delete and spot rate tests passed successfully!');
}

testItemDeleteAndRate().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
