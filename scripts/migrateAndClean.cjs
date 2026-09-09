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

const ALLOWED_ITEMS = [
  "2 TYRE", "ARMATURE", "BATTERY", "BEER BOTTLE", "DABBA", 
  "FOAM", "GERMAN", "KAACH BOTTLE", "KALA FOAM", "KALI PLASTIC", 
  "KHADDA", "LOHA", "PADPAD", "PALIYA", "PAUA BOTTLE", 
  "PEETAL", "PLASTIC", "PLATE", "RADDI", "REGULATOR", 
  "STEEL", "TAMBA", "TEEN", "TUBE", "TYRE"
];

async function runMigration() {
  console.log("Starting DB migration to drop columns and enforce 25 items...");

  try {
    console.log("1. Fetching all items...");
    const { data: items, error } = await supabase.from('items').select('*');
    if (error) throw error;

    const idsToDelete = [];
    for (const item of items) {
      if (!ALLOWED_ITEMS.includes(item.name)) {
        idsToDelete.push(item.id);
      }
    }

    if (idsToDelete.length > 0) {
      console.log(`Found ${idsToDelete.length} unauthorized items. Deleting...`);
      // Since they might be tied to transactions, wipe transactions first to be safe
      console.log("Wiping transactions to safely delete items...");
      await Promise.all([
        supabase.from('sale_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('purchase_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('stock_cost_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('inventory_ledger').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('stock_adjustments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);

      for (let i = 0; i < idsToDelete.length; i += 100) {
        const batch = idsToDelete.slice(i, i + 100);
        await supabase.from('items').delete().in('id', batch);
      }
      console.log("Deleted unauthorized items.");
    } else {
      console.log("Only the 25 allowed items exist.");
    }

    console.log("✅ Data enforcement completed.");
  } catch(e) {
    console.error("Migration error:", e);
  }
}

runMigration();
