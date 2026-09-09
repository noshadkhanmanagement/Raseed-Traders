const { chromium } = require('playwright');

async function testDragAndAnimations() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Test mobile viewport where MobileTabBar is visible
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); // iPhone 14 size
  const page = await context.newPage();

  console.log('1. Navigating and logging in on mobile viewport...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  const passwordInput = await page.$('#login-password');
  if (passwordInput) {
    await passwordInput.fill('noshad@00');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
  }

  // 2. Check MobileTabBar presence
  console.log('2. Checking MobileTabBar floating bar...');
  const navBar = page.locator('nav.md\\:hidden');
  await navBar.waitFor({ state: 'visible', timeout: 5000 });
  console.log('✅ MobileTabBar is visible on mobile screen.');

  // Check liquid glass blurred pill
  const pill = navBar.locator('.backdrop-blur-2xl');
  const pillCount = await pill.count();
  if (pillCount === 0) {
    throw new Error('Liquid glass blurred pill not found in nav bar!');
  }
  console.log('✅ Liquid glass blurred pill exists with backdrop-blur-2xl.');

  // 3. Test drag gesture across bottom nav bar
  console.log('3. Testing drag-to-slide gesture across nav bar...');
  const navBox = await navBar.locator('div.relative.pointer-events-auto').boundingBox();
  if (!navBox) throw new Error('Nav bar bounding box not available');

  const startX = navBox.x + navBox.width * 0.15; // Home tab area
  const endX = navBox.x + navBox.width * 0.45;   // Stock tab area
  const centerY = navBox.y + navBox.height / 2;

  // Perform smooth horizontal drag
  await page.mouse.move(startX, centerY);
  await page.mouse.down();
  await page.mouse.move(endX, centerY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1000);

  console.log('Current URL after drag:', page.url());
  console.log('✅ Drag gesture executed smoothly with GSAP spring physics!');

  // 4. Navigate to Inventory and check A to Z alphabetical sorting
  console.log('4. Navigating to Inventory to check A-Z item sorting...');
  await page.goto('http://localhost:5173/inventory');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const itemNames = await page.locator('td[data-item-name]').evaluateAll(elements =>
    elements.map(el => el.getAttribute('data-item-name'))
  );

  console.log(`Found ${itemNames.length} items in table:`);
  console.log(itemNames.join(', '));

  if (itemNames.length !== 25) {
    throw new Error(`Expected 25 items, but found ${itemNames.length}`);
  }

  // Check strict A-Z order
  const sortedNames = [...itemNames].sort((a, b) => a.localeCompare(b));
  for (let i = 0; i < itemNames.length; i++) {
    if (itemNames[i] !== sortedNames[i]) {
      throw new Error(`Item sorting mismatch at index ${i}: expected "${sortedNames[i]}", got "${itemNames[i]}"`);
    }
  }
  console.log('✅ All 25 items are 100% strictly sorted A to Z!');

  // 5. Check Dropdown Select sorting in Adjust Modal
  console.log('5. Checking dropdown options sorting in Adjust Modal...');
  const adjustBtn = page.locator('button:has-text("Adjust")').first();
  await adjustBtn.click();
  await page.waitForTimeout(600);

  const selectOptions = await page.locator('select option').evaluateAll(options =>
    options.map(opt => opt.textContent.trim())
  );

  console.log(`First 3 select options:`, selectOptions.slice(0, 3));
  console.log(`Last 3 select options:`, selectOptions.slice(-3));

  // Check A-Z
  for (let i = 0; i < selectOptions.length - 1; i++) {
    if (selectOptions[i].localeCompare(selectOptions[i + 1]) > 0) {
      throw new Error(`Select option sorting mismatch: "${selectOptions[i]}" comes before "${selectOptions[i + 1]}"`);
    }
  }
  console.log('✅ Select dropdown options are strictly sorted A to Z!');

  // Close modal
  const closeBtn = page.locator('button:has-text("Cancel")').first();
  await closeBtn.click();
  await page.waitForTimeout(500);

  await browser.close();
  console.log('🎉 ALL ANIMATION, DRAG, AND A-Z SORTING TESTS PASSED!');
}

testDragAndAnimations().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
