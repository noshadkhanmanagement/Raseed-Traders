const { chromium } = require('playwright');

async function fetchDb() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(500);

  const dump = await page.evaluate(() => {
    const raw = localStorage.getItem('scrap_management_storage_db');
    const allKeys = Object.keys(localStorage);
    const otherStorage = {};
    for (const k of allKeys) {
      if (k !== 'scrap_management_storage_db') {
        otherStorage[k] = localStorage.getItem(k);
      }
    }
    return {
      db: raw ? JSON.parse(raw) : null,
      otherStorage,
    };
  });

  const expectedList = [
    { name: '2 TYRE', local: '2 टायर', unit: 'PIECE' },
    { name: 'ARMATURE', local: 'आर्मेचर', unit: 'KG' },
    { name: 'BATTERY', local: 'बैटरी', unit: 'KG' },
    { name: 'BEER BOTTLE', local: 'बीयर बोतल', unit: 'PIECE' },
    { name: 'DABBA', local: 'डब्बा', unit: 'KG' },
    { name: 'FOAM', local: 'फ़ोम', unit: 'KG' },
    { name: 'GERMAN', local: 'जर्मन', unit: 'KG' },
    { name: 'KAACH BOTTLE', local: 'काँच बोतल', unit: 'PIECE' },
    { name: 'KALA FOAM', local: 'काला फ़ोम', unit: 'KG' },
    { name: 'KALI PLASTIC', local: 'काली प्लास्टिक', unit: 'KG' },
    { name: 'KHADDA', local: 'खड्डा', unit: 'KG' },
    { name: 'LOHA', local: 'लोहा', unit: 'KG' },
    { name: 'PADPAD', local: 'पड़पड़', unit: 'KG' },
    { name: 'PALIYA', local: 'पलिया', unit: 'KG' },
    { name: 'PAUA BOTTLE', local: 'पौआ बोतल', unit: 'PIECE' },
    { name: 'PEETAL', local: 'पीतल', unit: 'KG' },
    { name: 'PLASTIC', local: 'प्लास्टिक', unit: 'KG' },
    { name: 'PLATE', local: 'प्लेट', unit: 'KG' },
    { name: 'RADDI', local: 'रद्दी', unit: 'KG' },
    { name: 'REGULATOR', local: 'रेगुलेटर', unit: 'PIECE' },
    { name: 'STEEL', local: 'स्टील', unit: 'KG' },
    { name: 'TAMBA', local: 'ताँबा', unit: 'KG' },
    { name: 'TEEN', local: 'टीन', unit: 'KG' },
    { name: 'TUBE', local: 'ट्यूब', unit: 'KG' },
    { name: 'TYRE', local: 'टायर', unit: 'PIECE' }
  ];

  console.log('=== 1. DATABASE RECORD COUNTS ===');
  const db = dump.db;
  if (!db) {
    console.log('No DB found in localStorage');
    await browser.close();
    return;
  }

  for (const [table, val] of Object.entries(db)) {
    if (Array.isArray(val)) {
      console.log(`- ${table}: ${val.length} records`);
    } else {
      console.log(`- ${table}:`, JSON.stringify(val));
    }
  }

  console.log('\n=== 2. ALL ITEMS IN DB (' + db.items.length + ' items) ===');
  db.items.forEach((it, idx) => {
    console.log(`${String(idx + 1).padStart(2, ' ')}. [${it.id}] ${it.name.padEnd(14, ' ')} | Hindi: ${(it.local_name || '-').padEnd(14, ' ')} | Unit: ${it.default_unit.padEnd(6, ' ')} | Stock: ${it.current_stock} | Rate: ${it.default_purchase_rate}`);
  });

  console.log('\n=== 3. MATCHING WITH OFFICIAL 25 USER ITEMS ===');
  const expectedMap = new Map(expectedList.map(e => [e.name.toUpperCase().trim(), e]));
  const dbMap = new Map(db.items.map(i => [i.name.toUpperCase().trim(), i]));

  const extras = [];
  const matches = [];
  const mismatches = [];

  for (const it of db.items) {
    const key = it.name.toUpperCase().trim();
    if (expectedMap.has(key)) {
      const exp = expectedMap.get(key);
      const unitMatch = exp.unit === it.default_unit;
      matches.push({
        name: it.name,
        expectedUnit: exp.unit,
        actualUnit: it.default_unit,
        unitMatch,
      });
      if (!unitMatch) {
        mismatches.push({ name: it.name, issue: `Unit mismatch: expected ${exp.unit}, got ${it.default_unit}` });
      }
    } else {
      extras.push(it);
    }
  }

  const missing = [];
  for (const exp of expectedList) {
    if (!dbMap.has(exp.name.toUpperCase().trim())) {
      missing.push(exp);
    }
  }

  console.log(`- Total Official Expected: ${expectedList.length}`);
  console.log(`- Total In DB: ${db.items.length}`);
  console.log(`- Exact Matches: ${matches.length}`);
  console.log(`- Extra Items Added: ${extras.length > 0 ? JSON.stringify(extras) : 'NONE (0 extra)'}`);
  console.log(`- Missing Items: ${missing.length > 0 ? JSON.stringify(missing) : 'NONE (0 missing)'}`);
  console.log(`- Attribute Mismatches: ${mismatches.length > 0 ? JSON.stringify(mismatches) : 'NONE (0 mismatches)'}`);

  console.log('\n=== 4. OTHER COLLECTIONS (Parties, Purchases, Sales, etc.) ===');
  console.log('parties:', db.parties.length, db.parties);
  console.log('purchases:', db.purchases.length, db.purchases);
  console.log('sales:', db.sales.length, db.sales);
  console.log('stock_adjustments:', db.stock_adjustments.length, db.stock_adjustments);
  console.log('payments:', db.payments.length, db.payments);
  console.log('expenses:', db.expenses.length, db.expenses);
  console.log('inventory_ledger:', db.inventory_ledger.length, db.inventory_ledger);
  console.log('stock_cost_history:', db.stock_cost_history.length, db.stock_cost_history);

  console.log('\n=== 5. OTHER LOCALSTORAGE KEYS ===');
  console.log(JSON.stringify(dump.otherStorage, null, 2));

  await browser.close();
}

fetchDb().catch(console.error);
