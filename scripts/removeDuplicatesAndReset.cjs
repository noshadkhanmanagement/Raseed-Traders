const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

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

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeDuplicatesAndReset() {
  console.log("Starting full database reset and duplicate cleanup...");

  try {
    console.log("1. Wiping all transactions...");
    await Promise.all([
      supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('purchase_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('stock_cost_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('inventory_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('stock_adjustments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ]);

    await Promise.all([
      supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    ]);

    console.log("2. Resetting parties to 0 balance...");
    await supabase.from('parties').update({
      current_balance: 0,
      updated_at: new Date().toISOString(),
    }).neq('id', '00000000-0000-0000-0000-000000000000');

    console.log("3. Fetching all items to identify duplicates...");
    const { data: items, error: itemsError } = await supabase.from('items').select('*').order('created_at', { ascending: true });
    
    if (itemsError) throw itemsError;

    const seenNames = new Set();
    const idsToDelete = [];

    for (const item of items) {
      const normalizedName = item.name.toUpperCase().trim();
      if (seenNames.has(normalizedName)) {
        idsToDelete.push(item.id);
      } else {
        seenNames.add(normalizedName);
      }
    }

    if (idsToDelete.length > 0) {
      console.log(`Found ${idsToDelete.length} duplicate items. Deleting...`);
      // Delete in batches of 100 to be safe
      for (let i = 0; i < idsToDelete.length; i += 100) {
        const batch = idsToDelete.slice(i, i + 100);
        await supabase.from('items').delete().in('id', batch);
      }
    } else {
      console.log("No duplicate items found.");
    }

    console.log(`4. Resetting remaining ${items.length - idsToDelete.length} items to 0 stock...`);
    await supabase.from('items').update({
      current_stock: 0,
      average_cost: 0,
      default_purchase_rate: 0,
      default_sale_rate: 0,
      updated_at: new Date().toISOString(),
    }).neq('id', '00000000-0000-0000-0000-000000000000');

    console.log("✅ Database successfully reset and duplicates removed!");

  } catch (err) {
    console.error("Error during reset:", err);
  }
}

removeDuplicatesAndReset();
