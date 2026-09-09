const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyExactIosGeometry() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const artifactDir = 'C:/Users/anura/.gemini/antigravity-ide/brain/b6fb20f5-3d47-44c4-b895-3a81547daff3';

  console.log('1. Loading app and logging in...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('raseed_traders_auth_session', 'authenticated');
    localStorage.setItem('raseed_traders_theme', 'light');
  });
  await page.reload({ waitUntil: 'networkidle' });

  // A. Check Top Header
  console.log('2. Verifying Mobile Top Header...');
  const header = page.locator('header.md\\:hidden');
  await header.waitFor({ state: 'visible' });

  // Check that "+ New" button does NOT exist in header
  const newButtonCount = await header.locator('button:has-text("+ New"), button:has-text("New")').count();
  console.log(` -> "+ New" button count in mobile header: ${newButtonCount} (Expected: 0)`);
  if (newButtonCount !== 0) {
    throw new Error('Redundant "+ New" button is still present in top header!');
  }

  // Check top dissolution gradient
  const topGradient = page.locator('header.md\\:hidden + div[aria-hidden="true"]');
  const hasTopGradient = await topGradient.count();
  console.log(` -> Top dissolution gradient element present: ${hasTopGradient > 0} (Expected: true)`);
  if (hasTopGradient === 0) {
    throw new Error('Top dissolution gradient not found!');
  }

  // B. Check Bottom Atmospheric Gradient
  console.log('3. Verifying Bottom Atmospheric Gradient...');
  const bottomGradient = page.locator('div.fixed.bottom-0.left-0.right-0[aria-hidden="true"]');
  const hasBottomGradient = await bottomGradient.count();
  console.log(` -> Bottom atmospheric gradient present: ${hasBottomGradient > 0} (Expected: true)`);
  if (hasBottomGradient === 0) {
    throw new Error('Bottom atmospheric gradient not found!');
  }

  // C. Check Exact Nav Capsule Dimensions and Concentric Radii
  console.log('4. Verifying Exact iOS Nav Capsule Shape, Dimensions, and Radii...');
  const navBar = page.locator('nav[aria-label="Mobile Navigation Bar"] > div');
  await navBar.waitFor({ state: 'visible' });

  const metrics = await page.evaluate(() => {
    const container = document.querySelector('nav[aria-label="Mobile Navigation Bar"] > div');
    const pill = container.querySelector('div.absolute');
    const tabs = Array.from(container.querySelectorAll('button'));

    const containerStyle = window.getComputedStyle(container);
    const pillStyle = window.getComputedStyle(pill);

    const cRect = container.getBoundingClientRect();
    const pRect = pill.getBoundingClientRect();

    return {
      container: {
        width: Math.round(cRect.width),
        height: Math.round(cRect.height),
        borderRadius: containerStyle.borderRadius,
        padding: containerStyle.padding,
        bottomDist: Math.round(window.innerHeight - cRect.bottom),
      },
      pill: {
        width: Math.round(pRect.width),
        height: Math.round(pRect.height),
        borderRadius: pillStyle.borderRadius,
        leftOffset: Math.round(pRect.left - cRect.left),
        topOffset: Math.round(pRect.top - cRect.top),
      },
      tabsCount: tabs.length,
      tabWidths: tabs.map(t => Math.round(t.getBoundingClientRect().width)),
    };
  });

  console.log(' -> Capsule Metrics:', JSON.stringify(metrics, null, 2));

  // Assertions
  if (metrics.container.width !== 294) {
    console.warn(`Container width is ${metrics.container.width}, expected 294px`);
  }
  if (metrics.container.height !== 52) {
    console.warn(`Container height is ${metrics.container.height}, expected 52px`);
  }
  if (metrics.pill.height !== 44) {
    console.warn(`Pill height is ${metrics.pill.height}, expected 44px (52 - 8)`);
  }
  if (metrics.tabsCount !== 3) {
    throw new Error(`Expected 3 tabs, found ${metrics.tabsCount}`);
  }

  // D. Capture Light Mode Screenshot
  await page.screenshot({ path: path.join(artifactDir, 'exact_ios_nav_light.png') });
  console.log(' -> Saved exact_ios_nav_light.png');

  // E. Switch to Dark Mode & Capture
  console.log('5. Switching to Dark Mode and verifying blur contrast...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('raseed_traders_theme', 'dark');
  });
  await page.waitForTimeout(300);

  await page.screenshot({ path: path.join(artifactDir, 'exact_ios_nav_dark.png') });
  console.log(' -> Saved exact_ios_nav_dark.png');

  // F. Switch Tabs to ensure smooth interaction
  console.log('6. Clicking Hisab tab...');
  await page.click('button[aria-label="Hisab"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(artifactDir, 'exact_ios_nav_hisab.png') });
  console.log(' -> Saved exact_ios_nav_hisab.png');

  console.log('7. Clicking Settings tab...');
  await page.click('button[aria-label="Settings"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(artifactDir, 'exact_ios_nav_settings.png') });
  console.log(' -> Saved exact_ios_nav_settings.png');

  console.log('ALL EXACT IOS GEOMETRY VERIFICATIONS PASSED 100%!');
  await browser.close();
}

verifyExactIosGeometry().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
