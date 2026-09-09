const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runAudit() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  const issues = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      issues.push({ type: 'CONSOLE_ERROR', text: msg.text() });
    }
  });

  page.on('pageerror', (err) => {
    issues.push({ type: 'PAGE_ERROR', text: err.message });
  });

  console.log('--- Navigating to app ---');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  // Ensure logged in
  await page.evaluate(() => {
    localStorage.setItem('raseed_traders_auth_session', 'authenticated');
  });
  await page.reload({ waitUntil: 'networkidle' });

  const routes = [
    { path: '/', name: 'Dashboard' },
    { path: '/inventory', name: 'Inventory' },
    { path: '/purchases', name: 'Purchases' },
    { path: '/sales', name: 'Sales' },
    { path: '/analytics', name: 'Analytics' },
    { path: '/settings', name: 'Settings' },
  ];

  for (const theme of ['light', 'dark']) {
    await page.evaluate((th) => {
      if (th === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, theme);

    for (const route of routes) {
      console.log(`Checking ${route.name} in ${theme} mode...`);
      await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      // Check horizontal overflow
      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;

        // Find specific element causing overflow if any
        let culprit = null;
        if (scrollWidth > docWidth || bodyScrollWidth > docWidth) {
          const all = document.querySelectorAll('*');
          for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.right > docWidth + 1) {
              culprit = {
                tag: el.tagName,
                className: el.className,
                id: el.id,
                right: rect.right,
                docWidth: docWidth
              };
              break;
            }
          }
        }
        return {
          hasOverflow: scrollWidth > docWidth || bodyScrollWidth > docWidth,
          docWidth,
          scrollWidth,
          bodyScrollWidth,
          culprit
        };
      });

      if (overflow.hasOverflow) {
        issues.push({
          type: 'HORIZONTAL_OVERFLOW',
          page: route.name,
          theme,
          details: overflow
        });
      }

      // Check z-index collisions or header/footer overlapping
      const layoutChecks = await page.evaluate(() => {
        const header = document.querySelector('header');
        const tabBar = document.querySelector('nav') || document.querySelector('[role="navigation"]');
        const main = document.querySelector('main');
        return {
          headerHeight: header ? header.offsetHeight : 0,
          tabBarHeight: tabBar ? tabBar.offsetHeight : 0,
          mainPaddingBottom: main ? window.getComputedStyle(main).paddingBottom : null,
          mainPaddingTop: main ? window.getComputedStyle(main).paddingTop : null,
        };
      });

      // Check if main padding bottom is sufficient for bottom tab bar (tabBar is ~72px plus safe area)
      const pbNum = parseInt(layoutChecks.mainPaddingBottom || '0', 10);
      if (pbNum < 64) {
        issues.push({
          type: 'INSUFFICIENT_BOTTOM_PADDING',
          page: route.name,
          theme,
          paddingBottom: layoutChecks.mainPaddingBottom
        });
      }
    }
  }

  // Test modals on Dashboard
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  
  // Test Quick Action Sheet (+ button in header or tab)
  console.log('Testing Quick Actions Sheet...');
  const quickActionBtn = await page.$('button[aria-label="New Transaction"], button[title="New Transaction"]');
  if (quickActionBtn) {
    await quickActionBtn.click();
    await page.waitForTimeout(400);
    const sheetVisible = await page.$('.bottom-sheet-content, [role="dialog"]');
    if (!sheetVisible) {
      issues.push({ type: 'MODAL_NOT_OPENING', modal: 'QuickActionSheet' });
    } else {
      // Close it
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  }

  // Test Desktop Layout
  console.log('Checking Desktop 1920x1080...');
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const route of routes) {
    await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    if (desktopOverflow) {
      issues.push({ type: 'DESKTOP_OVERFLOW', page: route.name });
    }
  }

  await browser.close();

  console.log('\n===========================================');
  console.log('AUDIT SUMMARY');
  console.log('Total issues detected:', issues.length);
  console.log(JSON.stringify(issues, null, 2));
  console.log('===========================================');
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
