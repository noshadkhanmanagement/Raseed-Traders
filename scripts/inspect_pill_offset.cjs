const { chromium } = require('playwright');

async function inspect() {
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

  const data = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Mobile Navigation Bar"]');
    const container = nav.querySelector('div');
    const pill = container.querySelector('div.absolute');
    const tabs = Array.from(container.querySelectorAll('button'));

    const navRect = nav.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();
    const pRect = pill.getBoundingClientRect();

    return {
      viewportWidth: window.innerWidth,
      navRect: { left: navRect.left, right: navRect.right, width: navRect.width },
      containerRect: { left: cRect.left, right: cRect.right, width: cRect.width, center: cRect.left + cRect.width / 2 },
      screenCenter: window.innerWidth / 2,
      diffCenter: (cRect.left + cRect.width / 2) - (window.innerWidth / 2),
      pillRect: { left: pRect.left, right: pRect.right, width: pRect.width, center: pRect.left + pRect.width / 2 },
      pillRelativeOffset: pRect.left - cRect.left,
      tabs: tabs.map((t, i) => {
        const tr = t.getBoundingClientRect();
        return {
          index: i,
          text: t.innerText.trim(),
          left: tr.left,
          right: tr.right,
          width: tr.width,
          center: tr.left + tr.width / 2,
          relativeLeft: tr.left - cRect.left,
          pillCenterDelta: (pRect.left + pRect.width / 2) - (tr.left + tr.width / 2),
        };
      }),
    };
  });

  console.log('Inspection Data:', JSON.stringify(data, null, 2));
  await browser.close();
}

inspect().catch(console.error);
