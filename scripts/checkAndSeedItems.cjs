const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = 'https://ljcognoeysbgzbcmnbxp.supabase.co';
let supabaseKey = 'sb_publishable_2yLzsskShVrEte7O0yQR9Q_UUtviUVD';

const envCandidates = ['.env.local', '.env.production', '.env'];
for (const file of envCandidates) {
  const envPath = path.resolve(__dirname, '..', file);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = trimmed.substring('VITE_SUPABASE_URL='.length).replace(/["']/g, '').trim();
      if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = trimmed.substring('VITE_SUPABASE_ANON_KEY='.length).replace(/["']/g, '').trim();
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

const REQUIRED_ITEMS = [
  { name: '2 TYRE', local_name: '2 टायर', default_unit: 'PIECE', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'ARMATURE', local_name: 'आर्मेचर', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'BATTERY', local_name: 'बैटरी', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'BEER BOTTLE', local_name: 'बीयर बोतल', default_unit: 'PIECE', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'DABBA', local_name: 'डब्बा', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'FOAM', local_name: 'फ़ोम', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'GERMAN', local_name: 'जर्मन', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'KAACH BOTTLE', local_name: 'काँच बोतल', default_unit: 'PIECE', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'KALA FOAM', local_name: 'काला फ़ोम', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'KALI PLASTIC', local_name: 'काली प्लास्टिक', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'KHADDA', local_name: 'खड्डा', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'LOHA', local_name: 'लोहा', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'PADPAD', local_name: 'पड़पड़', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'PALIYA', local_name: 'पलिया', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'PAUA BOTTLE', local_name: 'पौआ बोतल', default_unit: 'PIECE', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'PEETAL', local_name: 'पीतल', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'PLASTIC', local_name: 'प्लास्टिक', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'PLATE', local_name: 'प्लेट', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'RADDI', local_name: 'रद्दी', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'REGULATOR', local_name: 'रेगुलेटर', default_unit: 'PIECE', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'STEEL', local_name: 'स्टील', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'TAMBA', local_name: 'ताँबा', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'TEEN', local_name: 'टीन', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'TUBE', local_name: 'ट्यूब', default_unit: 'KG', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
  { name: 'TYRE', local_name: 'टायर', default_unit: 'PIECE', default_purchase_rate: 0, default_sale_rate: 0, current_stock: 0, average_cost: 0, is_active: true },
];

async function run() {
  console.log('Querying current Supabase items...');
  const { data: existing, error } = await supabase.from('items').select('*').order('name');
  if (error) {
    console.error('Supabase query error:', error);
    return;
  }
  console.log(`Found ${existing.length} items in Supabase:`);
  existing.forEach(it => console.log(`- ${it.name} (${it.local_name}) [${it.default_unit}] stock: ${it.current_stock}`));

  const requiredNames = new Set(REQUIRED_ITEMS.map(i => i.name.toUpperCase().trim()));
  const existingMap = new Map();
  const duplicateIds = [];
  const unauthorizedIds = [];

  for (const it of existing) {
    const norm = it.name.toUpperCase().trim();
    if (!requiredNames.has(norm)) {
      console.log(`Extra/Unauthorized item found: "${it.name}" (ID: ${it.id})`);
      unauthorizedIds.push(it.id);
    } else if (existingMap.has(norm)) {
      console.log(`Duplicate found for "${it.name}": ID ${it.id}`);
      duplicateIds.push(it.id);
    } else {
      existingMap.set(norm, it);
    }
  }

  // Delete duplicates and unauthorized items
  const toDelete = [...duplicateIds, ...unauthorizedIds];
  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} unwanted/duplicate items...`);
    // First clear foreign keys
    await supabase.from('stock_cost_history').delete().in('item_id', toDelete);
    await supabase.from('inventory_ledger').delete().in('item_id', toDelete);
    await supabase.from('stock_adjustments').delete().in('item_id', toDelete);
    await supabase.from('purchase_items').delete().in('item_id', toDelete);
    await supabase.from('sale_items').delete().in('item_id', toDelete);
    await supabase.from('items').delete().in('id', toDelete);
    console.log('Deleted successfully.');
  }

  // Find missing items
  const missing = REQUIRED_ITEMS.filter(req => !existingMap.has(req.name.toUpperCase().trim()));
  console.log(`Missing items count: ${missing.length}`);
  if (missing.length > 0) {
    console.log('Missing items to insert:', missing.map(m => m.name));
    // Get business_id
    const { data: biz } = await supabase.from('businesses').select('id').limit(1);
    const businessId = biz && biz.length > 0 ? biz[0].id : null;

    for (const m of missing) {
      const { data: inserted, error: insErr } = await supabase.from('items').insert({
        business_id: businessId,
        name: m.name,
        local_name: m.local_name,
        default_unit: m.default_unit,
        default_purchase_rate: m.default_purchase_rate,
        default_sale_rate: m.default_sale_rate,
        current_stock: m.current_stock,
        average_cost: m.average_cost,
        is_active: m.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select();
      if (insErr) {
        console.error(`Failed to insert ${m.name}:`, insErr);
      } else {
        console.log(`✅ Successfully seeded: ${m.name}`);
      }
    }
  }

  // Final verification
  const { data: finalItems } = await supabase.from('items').select('*').order('name');
  console.log(`\nFinal count in DB: ${finalItems.length} items (Expected: ${REQUIRED_ITEMS.length})`);
  finalItems.forEach((it, idx) => {
    console.log(`${idx + 1}. ${it.name} — ${it.local_name} (${it.default_unit}) | stock: ${it.current_stock}`);
  });
}

run();
