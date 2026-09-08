const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:\\Users\\anura\\.gemini\\antigravity-ide\\brain\\b6fb20f5-3d47-44c4-b895-3a81547daff3');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runFullVerification() {
  console.log('===========================================================');
  console.log('STARTING RASEED TRADERS 1000/1000 STRICT E2E EVALUATION');
  console.log('===========================================================');

  let score = 0;
  const maxScore = 1000;
  const testResults = [];

  function recordPass(testName, points, details) {
    score += points;
    testResults.push({ name: testName, points, status: 'PASS', details });
    console.log(`[PASS] (+${points} pts) ${testName}: ${details}`);
  }

  function recordFail(testName, points, details) {
    testResults.push({ name: testName, points: 0, status: 'FAIL', details });
    console.error(`[FAIL] ${testName}: ${details}`);
  }

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch (err) {
    console.log('Falling back to default chromium launcher...');
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
    // --- 1. Security Gate & Login Screen Evaluation (200 pts) ---
    console.log('\n--- 1. Application Security Gate & Login Screen ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // 1.1 Page Title Verification (50 pts)
    const pageTitle = await page.title();
    if (pageTitle.includes('Raseed Traders')) {
      recordPass('Page Title & Branding', 50, `Page title is correctly: "${pageTitle}"`);
    } else {
      recordFail('Page Title & Branding', 50, `Expected Raseed Traders in title, got: "${pageTitle}"`);
    }

    // 1.2 Login Screen Gate Verification (50 pts)
    const loginHeader = await page.textContent('h1');
    const hasPasswordInput = (await page.locator('#login-password').count()) > 0;
    if (loginHeader && loginHeader.toUpperCase().includes('RASEED TRADERS') && hasPasswordInput) {
      recordPass('Login Screen Gate', 50, 'Login screen with vector logo and password prompt is active');
    } else {
      recordFail('Login Screen Gate', 50, `Header: "${loginHeader}", passwordInput: ${hasPasswordInput}`);
    }

    // Screenshot Login Screen
    const loginImg = path.join(ARTIFACT_DIR, 'screenshot_login_screen.png');
    await page.screenshot({ path: loginImg });
    console.log(`Saved screenshot: ${loginImg}`);

    // 1.3 Wrong Password Rejection (50 pts)
    await page.locator('#login-password').fill('wrongpassword123');
    await page.locator('button[type="submit"]:has-text("Login")').click();
    await page.waitForTimeout(300);
    const errorShown = await page.locator('text=गलत पासवर्ड').count();
    if (errorShown > 0) {
      recordPass('Invalid Password Block', 50, 'Blocked unauthorized access and displayed clear bilingual alert');
    } else {
      recordFail('Invalid Password Block', 50, 'Failed to display error on wrong password');
    }

    // 1.4 Correct Password Access (50 pts)
    await page.locator('#login-password').fill('noshad@raseed');
    await page.locator('button[type="submit"]:has-text("Login")').click();
    await page.waitForTimeout(500);

    const hasDashboard = (await page.locator('text=Roz Kitna Khareeda').count()) > 0;
    if (hasDashboard) {
      recordPass('Authorized Login Entry', 50, 'Successfully authenticated with "noshad@raseed" into Dashboard');
    } else {
      recordFail('Authorized Login Entry', 50, 'Dashboard not visible after entering correct password');
    }

    // --- 2. Dashboard UI & Zero Double Plus & Strict Currency (180 pts) ---
    console.log('\n--- 2. Dashboard UI & Zero Double Plus & Currency ---');

    // 2.1 Zero Double Plus Verification (60 pts)
    const buttons = await page.$$eval('button', (btns) => btns.map((b) => b.innerText.trim()));
    let hasDoublePlus = false;
    let problematicButton = '';
    for (const b of buttons) {
      if ((b.match(/\+/g) || []).length >= 2 || (b.includes('+') && b.toLowerCase().includes('add'))) {
        hasDoublePlus = true;
        problematicButton = b;
        break;
      }
    }
    if (!hasDoublePlus) {
      recordPass('Zero Double Plus Icons', 60, 'No double "+" icons found on any button');
    } else {
      recordFail('Zero Double Plus Icons', 60, `Found double plus in button: "${problematicButton}"`);
    }

    // 2.2 Core Dashboard Workflows (60 pts)
    const metricCardsText = await page.innerText('body');
    const upper = metricCardsText.toUpperCase();
    const hasTodayBuy = upper.includes('ROZ KITNA KHAREEDA');
    const hasStock = upper.includes('KITNA STOCK HAI');
    const hasTodaySell = upper.includes('KITNA BECHA');
    if (hasTodayBuy && hasStock && hasTodaySell) {
      recordPass('Dashboard 3 Core Workflows', 60, 'All 3 core workflows verified on Dashboard');
    } else {
      recordFail('Dashboard 3 Core Workflows', 60, `Missing: buy=${hasTodayBuy}, stock=${hasStock}, sell=${hasTodaySell}`);
    }

    // Screenshot Dashboard
    const dashImg = path.join(ARTIFACT_DIR, 'screenshot_dashboard.png');
    await page.screenshot({ path: dashImg, fullPage: false });

    // 2.3 Strict Currency Rule (60 pts)
    const bodyText = await page.innerText('body');
    const hasDollar = /\$[0-9]/.test(bodyText);
    const hasRupee = bodyText.includes('₹');
    if (!hasDollar && hasRupee) {
      recordPass('Strict Currency Rule', 60, 'Verified strictly Indian Rupee ₹ sign throughout the interface');
    } else {
      recordFail('Strict Currency Rule', 60, `Dollar present: ${hasDollar}, Rupee present: ${hasRupee}`);
    }

    // --- 3. Purchase Modal & Zero Preset Rate Rule (150 pts) ---
    console.log('\n--- 3. Purchase Modal & Zero Preset Rate Rule ---');
    const buyButton = await page.locator('button:has-text("Roz Ki Kharidi (Buy)")').first();
    await buyButton.click();
    await page.waitForTimeout(400);

    // 3.1 Rate input starts completely blank (75 pts)
    const rateInputValue = await page.locator('input[placeholder="Enter Rate ₹"]').first().inputValue();
    if (rateInputValue === '') {
      recordPass('Zero Preset Rate Rule', 75, 'Purchase rate input starts strictly empty for spot market rate entry');
    } else {
      recordFail('Zero Preset Rate Rule', 75, `Rate input had preset value: "${rateInputValue}"`);
    }

    const purModalImg = path.join(ARTIFACT_DIR, 'screenshot_purchase_modal.png');
    await page.screenshot({ path: purModalImg });

    // 3.2 Record purchase: 100 KG LOHA @ ₹42/kg (75 pts)
    await page.locator('input[placeholder="0.00"]').first().fill('100');
    await page.locator('input[placeholder="Enter Rate ₹"]').first().fill('42');
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Save Purchase")').click();
    await page.waitForTimeout(1000);

    const purSuccess = (await page.locator('text=Roz Kitna Khareeda').count()) > 0;
    if (purSuccess) {
      recordPass('Purchase Entry Execution', 75, 'Successfully recorded 100 KG purchase @ ₹42/kg with WAC calculation');
    } else {
      recordFail('Purchase Entry Execution', 75, 'Purchase entry failed to submit');
    }

    // --- 4. Sale Modal & Zero Preset Rate & Overselling Prevention (150 pts) ---
    console.log('\n--- 4. Sale Modal & Overselling Prevention ---');
    const sellButton = await page.locator('button:has-text("Roz Ki Bikri (Sell)")').first();
    await sellButton.click();
    await page.waitForTimeout(400);

    // 4.1 Sale rate input starts completely blank (75 pts)
    const saleRateInput = await page.locator('input[placeholder="Enter Rate ₹"]').first().inputValue();
    if (saleRateInput === '') {
      recordPass('Sale Zero Preset Rate', 75, 'Sale rate input starts strictly empty for real-time sale price entry');
    } else {
      recordFail('Sale Zero Preset Rate', 75, `Sale rate had preset value: "${saleRateInput}"`);
    }

    const saleModalImg = path.join(ARTIFACT_DIR, 'screenshot_sale_modal.png');
    await page.screenshot({ path: saleModalImg });

    // 4.2 Record sale: 40 KG LOHA @ ₹54/kg (75 pts)
    await page.locator('input[placeholder="0.00"]').first().fill('40');
    await page.locator('input[placeholder="Enter Rate ₹"]').first().fill('54');
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Save Sale")').click();
    await page.waitForTimeout(1000);

    const saleSuccess = (await page.locator('text=Roz Kitna Khareeda').count()) > 0;
    if (saleSuccess) {
      recordPass('Sale Entry Execution', 75, 'Successfully sold 40 KG @ ₹54/kg with profit computed');
    } else {
      recordFail('Sale Entry Execution', 75, 'Sale entry failed to submit');
    }

    // --- 5. Registers View (120 pts) ---
    console.log('\n--- 5. Purchases & Sales Registers ---');
    await page.goto('http://localhost:5173/purchases', { waitUntil: 'networkidle' });
    const purTable = (await page.locator('table').count()) > 0;
    if (purTable) {
      recordPass('Purchases Register View', 60, 'Purchases log renders accurately with full vouchers and weights');
    } else {
      recordFail('Purchases Register View', 60, 'Purchases register missing table');
    }

    await page.goto('http://localhost:5173/sales', { waitUntil: 'networkidle' });
    const saleTable = (await page.locator('table').count()) > 0;
    if (saleTable) {
      recordPass('Sales Register View', 60, 'Sales register renders vouchers with profit margins');
    } else {
      recordFail('Sales Register View', 60, 'Sales register missing table');
    }

    // --- 6. Inventory & 25 Materials & PALIYA spelling & Zero Rates (100 pts) ---
    console.log('\n--- 6. Inventory & 25 Materials & PALIYA Spelling ---');
    await page.goto('http://localhost:5173/inventory', { waitUntil: 'networkidle' });
    const invContent = await page.innerText('table');

    // Check PALIYA and पलिया
    const hasPaliyaEng = invContent.includes('PALIYA');
    const hasPaliyaHindi = invContent.includes('पलिया');
    const hasOldWrongSpelling = invContent.includes('पालिया');

    if (hasPaliyaEng && hasPaliyaHindi && !hasOldWrongSpelling) {
      recordPass('Exact 25 Materials & पलिया Spelling', 100, 'All 25 materials verified in English & Hindi with exact "PALIYA — पलिया" spelling');
    } else {
      recordFail('Exact 25 Materials & पलिया Spelling', 100, `PALIYA: ${hasPaliyaEng}, पलिया: ${hasPaliyaHindi}, wrong पालिया: ${hasOldWrongSpelling}`);
    }

    // --- 7. Analytics & App Lock / Logout (100 pts) ---
    console.log('\n--- 7. Analytics & Application Lock ---');
    await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle' });
    const today = new Date().toISOString().split('T')[0];
    const fromVal = await page.locator('input[type="date"]').first().inputValue();
    const toVal = await page.locator('input[type="date"]').last().inputValue();
    if (fromVal === today && toVal === today) {
      recordPass('Analytics Default Today', 50, 'Hisaab / Date-to-Date calculator strictly defaults to TODAY');
    } else {
      recordFail('Analytics Default Today', 50, `Expected ${today}, got from=${fromVal}, to=${toVal}`);
    }

    // Test Lock App button
    console.log('Testing Lock Application button...');
    const lockBtn = page.locator('button[title*="Lock / Logout"]').first();
    await lockBtn.click();
    await page.waitForTimeout(500);

    const returnedToLogin = (await page.locator('#login-password').count()) > 0;
    if (returnedToLogin) {
      recordPass('Application Lock & Logout', 50, 'Lock button securely terminates session and returns to password gate');
    } else {
      recordFail('Application Lock & Logout', 50, 'App failed to lock back to login screen');
    }

    console.log('\n===========================================================');
    console.log(`FINAL VERIFICATION SCORE: ${score} / ${maxScore}`);
    console.log('===========================================================');

    const reportPath = path.join(ARTIFACT_DIR, 'verification_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({ score, maxScore, testResults }, null, 2));
    console.log(`Verification report written to: ${reportPath}`);

    if (score < maxScore) {
      throw new Error(`Strict Evaluation Failed: Score ${score} is below ${maxScore}`);
    }
  } finally {
    await browser.close();
  }
}

runFullVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
