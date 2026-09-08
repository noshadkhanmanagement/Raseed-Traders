const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:\\Users\\anura\\.gemini\\antigravity-ide\\brain\\b6fb20f5-3d47-44c4-b895-3a81547daff3\\screens');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

// Comprehensive Device Profiles Matrix
const SCREEN_PROFILES = [
  // 1. Android Phones
  {
    name: 'android_compact_360',
    label: 'Android Compact (360x640 - Samsung Galaxy A)',
    width: 360,
    height: 640,
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'android_pixel_393',
    label: 'Android Pixel (393x873 - Google Pixel 7/8)',
    width: 393,
    height: 873,
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'android_flagship_412',
    label: 'Android Flagship (412x915 - Galaxy S24 Ultra)',
    width: 412,
    height: 915,
    isMobile: true,
    hasTouch: true,
  },

  // 2. iOS iPhones
  {
    name: 'iphone_se_375',
    label: 'Apple iPhone SE (375x667)',
    width: 375,
    height: 667,
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'iphone_15_pro_393',
    label: 'Apple iPhone 15 Pro (393x852)',
    width: 393,
    height: 852,
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'iphone_15_pro_max_430',
    label: 'Apple iPhone 15 Pro Max (430x932)',
    width: 430,
    height: 932,
    isMobile: true,
    hasTouch: true,
  },

  // 3. Tablets / iPad
  {
    name: 'ipad_air_820',
    label: 'Apple iPad Air (820x1180)',
    width: 820,
    height: 1180,
    isMobile: true,
    hasTouch: true,
  },
  {
    name: 'ipad_pro_1024',
    label: 'Apple iPad Pro 12.9" (1024x1366)',
    width: 1024,
    height: 1366,
    isMobile: false,
    hasTouch: true,
  },

  // 4. Laptops & MacBooks
  {
    name: 'laptop_standard_1366',
    label: 'Standard Laptop (1366x768 - Windows/Linux)',
    width: 1366,
    height: 768,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: 'macbook_air_1440',
    label: 'MacBook Air 13" (1440x900 - macOS)',
    width: 1440,
    height: 900,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: 'macbook_pro_1512',
    label: 'MacBook Pro 14" Retina (1512x982 - macOS)',
    width: 1512,
    height: 982,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: 'macbook_pro_1728',
    label: 'MacBook Pro 16" (1728x1117 - macOS)',
    width: 1728,
    height: 1117,
    isMobile: false,
    hasTouch: false,
  },

  // 5. Desktop & 2K Monitors
  {
    name: 'desktop_1080p_1920',
    label: 'Desktop Full HD (1920x1080 - Windows/Linux PC)',
    width: 1920,
    height: 1080,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: 'desktop_2k_2560',
    label: 'Ultra-wide 2K Monitor (2560x1440)',
    width: 2560,
    height: 1440,
    isMobile: false,
    hasTouch: false,
  },
];

async function runMultiScreenSuite() {
  console.log('================================================================');
  console.log('STARTING RASEED TRADERS ALL ANDROID, IOS & DESKTOP SCREEN SUITE');
  console.log('================================================================');

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  const results = [];
  let passedScreens = 0;

  for (const profile of SCREEN_PROFILES) {
    console.log(`\nTesting: [${profile.label}] (${profile.width}x${profile.height})...`);

    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      isMobile: profile.isMobile,
      hasTouch: profile.hasTouch,
      deviceScaleFactor: 2,
    });

    const page = await context.newPage();

    try {
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        localStorage.setItem('raseed_traders_auth_session', 'authenticated');
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      // Check 1: No horizontal overflow on page
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      // Check 2: Responsive Navigation checks
      const isMobileNavVisible = await page.isVisible('nav.md\\:hidden');
      const isDesktopSidebarVisible = await page.isVisible('aside.md\\:flex');

      let navCorrect = false;
      if (profile.width < 768) {
        // Mobile layout: Bottom tab bar should be visible, desktop sidebar hidden
        navCorrect = isMobileNavVisible && !isDesktopSidebarVisible;
      } else {
        // Desktop / Tablet layout: Sidebar should be visible, bottom tab bar hidden
        navCorrect = isDesktopSidebarVisible && !isMobileNavVisible;
      }

      // Check 3: Header branding visible
      const titleText = await page.textContent('h1');
      const hasBrand = titleText && titleText.includes('Raseed Traders');

      // Check 4: Test Modal opening and bounds on this screen
      let modalFits = true;
      if (profile.width < 768) {
        // Open purchase modal via entry button
        const newEntryBtn = await page.locator('header button:has-text("New Entry")').first();
        if (await newEntryBtn.isVisible()) {
          await newEntryBtn.click();
          await page.waitForTimeout(300);
          // Check quick actions sheet fits
          const sheetFits = await page.evaluate(() => {
            const sheet = document.querySelector('.max-w-md, .max-w-xl');
            if (!sheet) return true;
            const rect = sheet.getBoundingClientRect();
            return rect.bottom <= window.innerHeight + 5 && rect.width <= window.innerWidth;
          });
          modalFits = sheetFits;
          // Close sheet
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
        }
      } else {
        // Desktop: Open purchase modal
        const buyBtn = await page.locator('button:has-text("Roz Ki Kharidi (Buy)")').first();
        if (await buyBtn.isVisible()) {
          await buyBtn.click();
          await page.waitForTimeout(300);
          const modalFitsWithinScreen = await page.evaluate(() => {
            const modal = document.querySelector('.max-w-xl');
            if (!modal) return true;
            const rect = modal.getBoundingClientRect();
            return rect.top >= 0 && rect.bottom <= window.innerHeight + 10;
          });
          modalFits = modalFitsWithinScreen;
          await page.keyboard.press('Escape');
          await page.waitForTimeout(200);
        }
      }

      const screenshotFile = path.join(ARTIFACT_DIR, `${profile.name}.png`);
      await page.screenshot({ path: screenshotFile, fullPage: false });

      const isPass = !hasHorizontalScroll && navCorrect && hasBrand && modalFits;
      if (isPass) {
        passedScreens++;
        console.log(`  -> [PASS] Perfect layout! Horizontal scroll: ${hasHorizontalScroll}, Nav: OK, Brand: OK, Modal: OK`);
      } else {
        console.error(`  -> [FAIL] Issues detected! HScroll: ${hasHorizontalScroll}, NavCorrect: ${navCorrect}, Brand: ${hasBrand}, ModalFits: ${modalFits}`);
      }

      results.push({
        profile: profile.name,
        label: profile.label,
        dimensions: `${profile.width}x${profile.height}`,
        hasHorizontalScroll,
        navCorrect,
        hasBrand,
        modalFits,
        passed: isPass,
        screenshot: `${profile.name}.png`,
      });

    } catch (err) {
      console.error(`  -> Exception on ${profile.label}:`, err.message);
      results.push({
        profile: profile.name,
        label: profile.label,
        dimensions: `${profile.width}x${profile.height}`,
        passed: false,
        error: err.message,
      });
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('\n================================================================');
  console.log(`ALL SCREENS TEST RESULTS: ${passedScreens} / ${SCREEN_PROFILES.length} PASSED`);
  console.log('================================================================');

  const report = {
    totalScreensTested: SCREEN_PROFILES.length,
    passedScreens,
    passRate: `${((passedScreens / SCREEN_PROFILES.length) * 100).toFixed(1)}%`,
    results,
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'screen_test_report.json'),
    JSON.stringify(report, null, 2)
  );

  return passedScreens === SCREEN_PROFILES.length;
}

runMultiScreenSuite()
  .then((allPassed) => {
    process.exit(allPassed ? 0 : 1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
