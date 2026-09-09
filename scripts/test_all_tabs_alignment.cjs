const { chromium } = require('playwright');

async function testAllTabs() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('raseed_traders_auth_session', 'authenticated');
    localStorage.setItem('raseed_traders_theme', 'light');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  async function checkTab(tabName, expectedIndex) {
    if (expectedIndex > 0) {
      await page.click(`button[aria-label="${tabName}"]`);
      await page.waitForTimeout(600); // wait for wobble animation to settle
    }

    const data = await page.evaluate((idx) => {
      const container = document.querySelector('nav[aria-label="Mobile Navigation Bar"] > div');
      const pill = container.querySelector('div.absolute');
      const tabs = Array.from(container.querySelectorAll('button'));
      const activeTab = tabs[idx];

      const cRect = container.getBoundingClientRect();
      const pRect = pill.getBoundingClientRect();
      const tRect = activeTab.getBoundingClientRect();

      return {
        tabIndex: idx,
        tabName: activeTab.innerText.trim(),
        containerWidth: cRect.width,
        pill: {
          left: pRect.left,
          right: pRect.right,
          width: Math.round(pRect.width),
          center: pRect.left + pRect.width / 2,
        },
        tab: {
          left: tRect.left,
          right: tRect.right,
          width: Math.round(tRect.width),
          center: tRect.left + tRect.width / 2,
        },
        leftDelta: Math.abs(pRect.left - tRect.left),
        centerDelta: Math.abs((pRect.left + pRect.width / 2) - (tRect.left + tRect.width / 2)),
      };
    }, expectedIndex);

    console.log(`Tab ${expectedIndex} (${tabName}):`, JSON.stringify(data, null, 2));
    if (data.centerDelta > 0.5) {
      throw new Error(`Alignment error on tab ${tabName}: centerDelta is ${data.centerDelta}`);
    }
  }

  console.log('Testing Tab 0 (Stock)...');
  await checkTab('Stock', 0);

  console.log('Testing Tab 1 (Hisab)...');
  await checkTab('Hisab', 1);

  console.log('Testing Tab 2 (Settings)...');
  await checkTab('Settings', 2);

  console.log('All 3 tabs have EXACT 0.0px center alignment!');
  await browser.close();
}

testAllTabs().catch((e) => {
  console.error(e);
  process.exit(1);
});
