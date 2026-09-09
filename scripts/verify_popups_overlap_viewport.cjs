const { chromium } = require('playwright');
const path = require('path');

async function verifyPopupsOverlapViewport() {
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

  // TEST 1: Quick Trade Buy Popup from top
  console.log('\n2. Testing Kharidi (Buy) Popup...');
  await page.click('button:has-text("Kharidi (Buy)")');
  await page.waitForTimeout(350);

  const buyModal = page.locator('div.fixed.inset-0.z-50');
  await buyModal.waitFor({ state: 'visible' });

  const buyCardBox = await buyModal.locator('> div.relative').boundingBox();
  console.log(' -> Buy popup card bounding box:', buyCardBox);

  // Verify it is inside the viewport [0, 852]
  if (!buyCardBox || buyCardBox.y < 0 || buyCardBox.y + buyCardBox.height > 852) {
    throw new Error(`Buy popup is outside viewport! y: ${buyCardBox?.y}, height: ${buyCardBox?.height}`);
  }
  console.log(' -> Verified: Buy popup card fits 100% inside visible screen with ZERO scrolling!');
  await page.screenshot({ path: path.join(artifactDir, 'popup_buy_centered.png') });

  // Close buy modal
  await page.click('button[aria-label="Close dialog"]');
  await page.waitForTimeout(300);

  // TEST 2: Scroll down to bottom of the list and test "Edit" popup
  console.log('\n3. Scrolling down 600px in the stock table...');
  await page.evaluate(() => window.scrollTo(0, 600));
  const scrollY = await page.evaluate(() => window.scrollY);
  console.log(` -> Current page scrollY: ${scrollY}px`);

  console.log(' -> Touching "Edit" button on a scrolled item...');
  // Find visible Edit button on mobile
  const editButtons = page.locator('button:has-text("Edit")');
  const count = await editButtons.count();
  console.log(` -> Total Edit buttons available: ${count}`);

  // Click an edit button in the currently visible middle/bottom
  await editButtons.nth(5).click();
  await page.waitForTimeout(400);

  const editCard = page.locator('div.fixed.inset-0.z-50 > div.relative');
  await editCard.waitFor({ state: 'visible' });

  const editCardBox = await editCard.boundingBox();
  console.log(' -> Edit popup card bounding box while scrolled:', editCardBox);

  if (!editCardBox || editCardBox.y < 0 || editCardBox.y + editCardBox.height > 852) {
    throw new Error(`Edit popup is outside viewport! y: ${editCardBox?.y}, height: ${editCardBox?.height}`);
  }
  console.log(' -> Verified: Edit popup directly overlaps the visible area without scrolling up/down!');
  await page.screenshot({ path: path.join(artifactDir, 'popup_edit_scrolled_overlap.png') });

  // Close edit modal
  await page.click('button[aria-label="Close dialog"]');
  await page.waitForTimeout(300);

  // TEST 3: Touch an item card for Item History Sheet
  console.log('\n4. Touching item to open History Sheet...');
  const itemCards = page.locator('div.md\\:hidden.rounded-2xl > div');
  await itemCards.nth(4).click();
  await page.waitForTimeout(400);

  const historyCard = page.locator('div.fixed.inset-0.z-50 > div.relative');
  await historyCard.waitFor({ state: 'visible' });
  const historyCardBox = await historyCard.boundingBox();
  console.log(' -> History popup card bounding box:', historyCardBox);

  if (!historyCardBox || historyCardBox.y < 0 || historyCardBox.y + historyCardBox.height > 852) {
    throw new Error(`History popup is outside viewport! y: ${historyCardBox?.y}`);
  }
  console.log(' -> Verified: History popup directly overlaps visible area with zero outer scroll!');
  await page.screenshot({ path: path.join(artifactDir, 'popup_history_overlap.png') });

  // Close history modal
  await page.click('button[aria-label="Close dialog"]');
  await page.waitForTimeout(300);

  // TEST 4: Global Search Popup
  console.log('\n5. Testing Global Search Popup...');
  await page.click('button[aria-label="Search"]');
  await page.waitForTimeout(350);

  const searchCard = page.locator('div.fixed.inset-0.z-50 > div.relative');
  await searchCard.waitFor({ state: 'visible' });
  const searchCardBox = await searchCard.boundingBox();
  console.log(' -> Search popup card bounding box:', searchCardBox);

  if (!searchCardBox || searchCardBox.y < 0 || searchCardBox.y + searchCardBox.height > 852) {
    throw new Error(`Search popup is outside viewport! y: ${searchCardBox?.y}`);
  }
  console.log(' -> Verified: Search popup directly overlaps visible screen area!');
  await page.screenshot({ path: path.join(artifactDir, 'popup_search_overlap.png') });

  console.log('\nALL POPUPS DIRECT VIEWPORT OVERLAP TESTS PASSED 100%!');
  await browser.close();
}

verifyPopupsOverlapViewport().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
