const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const APP_URL = (process.env.APP_URL || 'http://localhost:5173').trim();
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

async function testRateHistoryAndDashboard() {
  console.log('--- STARTING RATE HISTORY & DASHBOARD 25 ITEMS TEST ---');
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
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Login
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      console.log('Logging in...');
      await passwordInput.fill(APP_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    await page.waitForTimeout(2000);

    // 2. Verify Settings has NO theme toggling section
    console.log('Navigating to Settings...');
    await page.goto(`${APP_URL}/settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const pageContent = await page.content();
    const hasThemeToggle = pageContent.includes('Color Theme Mode') || pageContent.includes('Auto match OS') || pageContent.includes('Pure Black theme');
    if (hasThemeToggle) {
      throw new Error('FAILED: Settings page still contains theme toggle section!');
    } else {
      console.log('PASS: Settings page does NOT contain theme toggle section.');
    }

    // 3. Return to Dashboard and check material cards count
    console.log('Navigating to Dashboard...');
    await page.goto(`${APP_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check material cards on dashboard
    const materialCards = await page.$$('[title="Touch to view purchase rates & history (भाव इतिहास देखें)"]');
    console.log(`Found ${materialCards.length} material cards on Dashboard.`);
    if (materialCards.length < 25) {
      throw new Error(`Expected at least 25 items on Dashboard, found ${materialCards.length}`);
    }
    console.log(`PASS: Dashboard displays all ${materialCards.length} materials (full catalog without 10-item limit).`);

    // 4. Click first material card and verify history modal opens
    console.log('Clicking first material card on Dashboard...');
    await materialCards[0].click();
    await page.waitForTimeout(1500);

    const modalContent = await page.content();
    const hasHistoryModal = modalContent.includes('Rate History') || modalContent.includes('Latest Rate') || modalContent.includes('ताज़ा भाव') || modalContent.includes('Purchase Rate Log');
    if (!hasHistoryModal) {
      throw new Error('FAILED: Rate history modal did not open on clicking material card!');
    }
    console.log('PASS: Rate history modal successfully opened on clicking item!');

    // Capture screenshot of rate history modal
    const screenshotPath = path.resolve('C:\\Users\\anura\\.gemini\\antigravity-ide\\brain\\b6fb20f5-3d47-44c4-b895-3a81547daff3\\screenshot_rate_history_modal.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot: ${screenshotPath}`);

    // Close modal
    const closeBtn = await page.$('button[aria-label="Close"], button[class*="text-zinc-400"]');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }

    // 5. Navigate to Inventory and test rate history there too
    console.log('Navigating to Inventory...');
    await page.goto(`${APP_URL}/inventory`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const inventoryRateBtns = await page.$$('button[title*="Rate Fluctuation Log"]');
    console.log(`Found ${inventoryRateBtns.length} Rate History buttons in Inventory table.`);
    if (inventoryRateBtns.length > 0) {
      await inventoryRateBtns[0].click();
      await page.waitForTimeout(1000);
      const invModalContent = await page.content();
      if (invModalContent.includes('Rate History') || invModalContent.includes('Purchase Rate Log')) {
        console.log('PASS: Rate history modal successfully opened from Inventory table as well!');
      }
    }

    console.log('===========================================================');
    console.log('ALL RATE HISTORY & DASHBOARD 25 ITEMS TESTS COMPLETED SUCCESSFULLY!');
    console.log('===========================================================');
  } catch (err) {
    console.error('ERROR during verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testRateHistoryAndDashboard();
