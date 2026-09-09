const { chromium } = require('playwright');

async function testCentering() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  for (const width of [360, 375, 390, 393, 412, 430]) {
    const page = await browser.newPage({ viewport: { width, height: 852 } });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head><script src="https://cdn.tailwindcss.com"></script></head>
      <body>
        <nav class="fixed inset-x-0 bottom-5 flex justify-center pointer-events-none">
          <div id="capsule" class="w-[296px] h-[52px] rounded-full px-[3px] py-[3px] border border-black/10 flex items-center">
            <button class="flex-1 h-full">Stock</button>
            <button class="flex-1 h-full">Hisab</button>
            <button class="flex-1 h-full">Settings</button>
          </div>
        </nav>
      </body>
      </html>
    `);

    const metrics = await page.evaluate(() => {
      const cap = document.getElementById('capsule');
      const r = cap.getBoundingClientRect();
      const leftDist = r.left;
      const rightDist = window.innerWidth - r.right;
      return {
        viewportWidth: window.innerWidth,
        left: r.left,
        right: r.right,
        width: r.width,
        leftDist,
        rightDist,
        distDelta: Math.abs(leftDist - rightDist),
        center: r.left + r.width / 2,
        expectedCenter: window.innerWidth / 2,
        centerDelta: Math.abs((r.left + r.width / 2) - (window.innerWidth / 2)),
      };
    });

    console.log(`Viewport ${width}px:`, metrics);
    await page.close();
  }

  await browser.close();
}

testCentering().catch(console.error);
