const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\anura\\.gemini\\antigravity-ide\\brain\\b6fb20f5-3d47-44c4-b895-3a81547daff3';

let APP_PASSWORD = '';
const envCandidates = ['.env.local', '.env'];
for (const file of envCandidates) {
  const fullPath = path.resolve(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('VITE_APP_PASSWORD=')) {
        APP_PASSWORD = line.trim().slice('VITE_APP_PASSWORD='.length).trim();
        break;
      }
    }
  }
  if (APP_PASSWORD) break;
}

const viewports = [
  {
    name: 'iPhone 15 Pro (iOS Mobile)',
    key: 'iphone',
    width: 393,
    height: 852,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
  },
  {
    name: 'Samsung Galaxy / Pixel (Android Mobile)',
    key: 'android',
    width: 412,
    height: 915,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    isMobile: true,
  },
  {
    name: 'Apple MacBook Air 13" (macOS Desktop)',
    key: 'mac',
    width: 1440,
    height: 900,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    isMobile: false,
  },
  {
    name: 'Windows Desktop (1080p FHD)',
    key: 'windows',
    width: 1920,
    height: 1080,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
    isMobile: false,
  }
];

async function runDeviceTests(baseUrl, prefix) {
  console.log(`\n===========================================================`);
  console.log(`TESTING SUITE ON: ${baseUrl} (${prefix.toUpperCase()})`);
  console.log(`===========================================================`);

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (err) {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  }

  const results = [];

  for (const vp of viewports) {
    console.log(`\n>>> Testing: ${vp.name} [${vp.width}x${vp.height}]...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: vp.userAgent,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });
    const page = await context.newPage();

    page.on('dialog', async (d) => { await d.accept(); });

    // 1. Visit Base URL
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 2. Login if needed
    const pw = await page.$('#login-password');
    if (pw) {
      await pw.fill(APP_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    // 3. For mobile viewports (iPhone & Android), verify the iOS Pill Navigation Bar
    if (vp.isMobile) {
      const pillNav = await page.$('nav.md\\:hidden');
      const hasPillNav = pillNav !== null;
      console.log(`  - iOS Floating Pill Nav present: ${hasPillNav}`);

      // Check pill container style
      const pillContainer = await page.$('nav.md\\:hidden > div.rounded-full');
      const hasRoundedPill = pillContainer !== null;
      console.log(`  - 100% Rounded Pill Container present: ${hasRoundedPill}`);

      // Check all 6 tabs inside the pill
      const tabLinks = await page.$$('nav.md\\:hidden a');
      console.log(`  - Pill tabs count: ${tabLinks.length} (Expected: 6)`);

      // Check active tab styling (Home tab active by default)
      const activeTab = await page.$('nav.md\\:hidden a.bg-black, nav.md\\:hidden a.dark\\:bg-white');
      const hasActivePill = activeTab !== null;
      console.log(`  - iPhone active capsule button styling: ${hasActivePill}`);

      // Test tapping Buy tab
      const buyTab = await page.$('nav.md\\:hidden a[href="/purchases"]');
      if (buyTab) {
        await buyTab.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        const onBuyPage = page.url().includes('/purchases');
        console.log(`  - Navigated to Purchases via Pill Tab: ${onBuyPage}`);

        // Navigate back to Home
        const homeTab = await page.$('nav.md\\:hidden a[href="/"]');
        if (homeTab) {
          await homeTab.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1500);
        }
      }

      results.push({
        device: vp.name,
        pillPresent: hasPillNav && hasRoundedPill,
        tabsCount: tabLinks.length,
        activeCapsule: hasActivePill,
      });
    } else {
      // Desktop: Check Sidebar presence
      const sidebar = await page.$('aside');
      const hasSidebar = sidebar !== null;
      console.log(`  - Desktop Sidebar present: ${hasSidebar}`);

      // Wait for master items to load
      await page.waitForSelector('div[title*="Touch to view purchase rates & history"]', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1000);

      // Check 25 materials grid / table
      const masterItems = await page.$$('div[title*="Touch to view purchase rates & history"]');
      console.log(`  - Dashboard materials cards: ${masterItems.length}`);

      results.push({
        device: vp.name,
        sidebarPresent: hasSidebar,
        materialsCount: masterItems.length,
      });
    }

    // Capture screenshot
    const shotPath = path.resolve(ARTIFACT_DIR, `screenshot_${prefix}_${vp.key}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`  - Screenshot saved: ${shotPath}`);

    await context.close();
  }

  await browser.close();
  return results;
}

(async () => {
  try {
    // 1. Run local test
    console.log('\n================== 1. RUNNING LOCAL DEVICE TESTS ==================');
    const localResults = await runDeviceTests('http://localhost:5173', 'local');
    
    // 2. Run live deployment test
    console.log('\n================== 2. RUNNING LIVE DEPLOYMENT DEVICE TESTS ==================');
    const liveResults = await runDeviceTests('https://raseed-traders-management.vercel.app', 'live');

    console.log('\n===========================================================');
    console.log('COMPREHENSIVE DEVICE TESTING SUMMARY (MAC, WINDOWS, IPHONE, ANDROID):');
    console.log('===========================================================');
    console.log('\n--- LOCAL RESULTS ---');
    console.log(JSON.stringify(localResults, null, 2));
    console.log('\n--- LIVE DEPLOYMENT RESULTS ---');
    console.log(JSON.stringify(liveResults, null, 2));
    console.log('===========================================================');
  } catch (err) {
    console.error('Test run failed:', err);
    process.exit(1);
  }
})();
