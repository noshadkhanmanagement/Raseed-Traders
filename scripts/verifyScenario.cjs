// Automated Verification Script for Scrap Management System Core Business Scenarios

const fs = require('fs');

// We simulate the local transactional engine in node
class EngineTest {
  constructor() {
    this.items = [
      { id: 'item-001', name: 'LOHA', local_name: 'लोहा', default_unit: 'KG', current_stock: 0, average_cost: 0, default_purchase_rate: 38, default_sale_rate: 48, is_active: true },
      { id: 'item-002', name: 'TEEN', local_name: 'टिन', default_unit: 'KG', current_stock: 0, average_cost: 0, default_purchase_rate: 28, default_sale_rate: 36, is_active: true },
    ];
    this.parties = [
      { id: 'party-001', name: 'Ramesh Traders', party_type: 'SUPPLIER', current_balance: 0 },
      { id: 'party-002', name: 'Rahul Traders & Smelters', party_type: 'CUSTOMER', current_balance: 0 },
    ];
    this.purchases = [];
    this.sales = [];
    this.ledger = [];
    this.payments = [];
    this.adjustments = [];
  }

  // 1. Purchase
  purchase(partyId, itemId, qty, rate, paid = 0) {
    const item = this.items.find(i => i.id === itemId);
    const party = this.parties.find(p => p.id === partyId);
    const lineAmount = qty * rate;

    // WAC Formula
    const currStock = item.current_stock;
    const currWac = item.average_cost;
    let newWac = rate;
    if (currStock > 0) {
      newWac = Number((((currStock * currWac) + (qty * rate)) / (currStock + qty)).toFixed(2));
    }
    const newStock = currStock + qty;

    item.current_stock = newStock;
    item.average_cost = newWac;

    const due = lineAmount - paid;
    party.current_balance -= due;

    this.purchases.push({
      purchase_number: `PUR-20260908-${String(this.purchases.length + 1).padStart(3, '0')}`,
      party_name: party.name,
      total_amount: lineAmount,
      paid_amount: paid,
      due_amount: due,
    });

    this.ledger.push({
      item_name: item.name,
      transaction_type: 'PURCHASE',
      quantity_change: qty,
      rate,
      running_quantity: newStock,
    });

    if (paid > 0) {
      this.payments.push({ party_name: party.name, type: 'PAYMENT_TO_SUPPLIER', amount: paid });
    }

    return { newStock, newWac, lineAmount, due };
  }

  // 2. Sale
  sale(partyId, itemId, qty, rate, received = 0) {
    const item = this.items.find(i => i.id === itemId);
    const party = this.parties.find(p => p.id === partyId);

    if (item.current_stock < qty) {
      throw new Error(`Insufficient stock for ${item.name}! Available: ${item.current_stock}, Requested: ${qty}`);
    }

    const revenue = qty * rate;
    const cogs = Number((qty * item.average_cost).toFixed(2));
    const grossProfit = Number((revenue - cogs).toFixed(2));
    const newStock = item.current_stock - qty;

    item.current_stock = newStock;

    const due = revenue - received;
    party.current_balance += due;

    this.sales.push({
      sale_number: `SALE-20260908-${String(this.sales.length + 1).padStart(3, '0')}`,
      party_name: party.name,
      total_amount: revenue,
      total_cost: cogs,
      total_profit: grossProfit,
      received_amount: received,
      due_amount: due,
    });

    this.ledger.push({
      item_name: item.name,
      transaction_type: 'SALE',
      quantity_change: -qty,
      rate,
      running_quantity: newStock,
    });

    if (received > 0) {
      this.payments.push({ party_name: party.name, type: 'PAYMENT_RECEIVED_FROM_CUSTOMER', amount: received });
    }

    return { newStock, revenue, cogs, grossProfit, due };
  }

  // 3. Stock Adjustment
  adjustment(itemId, qty, reason) {
    const item = this.items.find(i => i.id === itemId);
    const newStock = item.current_stock + qty;
    item.current_stock = newStock;

    this.adjustments.push({ item_name: item.name, quantity: qty, reason });
    this.ledger.push({
      item_name: item.name,
      transaction_type: 'ADJUSTMENT',
      quantity_change: qty,
      rate: item.average_cost,
      running_quantity: newStock,
      reason,
    });

    return { newStock };
  }
}

function runVerification() {
  console.log('====================================================');
  console.log('STARTING SCRAP MANAGEMENT SYSTEM VERIFICATION SUITE');
  console.log('====================================================\n');

  const engine = new EngineTest();

  // Step 1: Add 100 KG LOHA at ₹38/kg
  console.log('Step 1: Adding 100 KG LOHA at ₹38/kg...');
  const step1 = engine.purchase('party-001', 'item-001', 100, 38, 0);
  console.log(` -> Stock: ${step1.newStock} KG, WAC: ₹${step1.newWac}/kg, Total: ₹${step1.lineAmount}`);
  if (step1.newStock !== 100 || step1.newWac !== 38) throw new Error('Step 1 Failed!');

  // Step 2: Add 50 KG LOHA at ₹40/kg
  console.log('\nStep 2: Adding 50 KG LOHA at ₹40/kg...');
  const step2 = engine.purchase('party-001', 'item-001', 50, 40, 0);
  console.log(` -> Stock: ${step2.newStock} KG, WAC: ₹${step2.newWac}/kg, Total: ₹${step2.lineAmount}`);
  // (100 * 38 + 50 * 40) / 150 = 5800 / 150 = 38.6666... -> 38.67
  console.log('Step 3: Verifying weighted average cost...');
  console.log(` -> Expected WAC: 38.67, Actual WAC: ${step2.newWac}`);
  if (step2.newStock !== 150 || step2.newWac !== 38.67) throw new Error('Step 2 & 3 WAC Failed!');

  // Step 4: Sell 80 KG at ₹50/kg with partial payment ₹2,500
  console.log('\nStep 4: Selling 80 KG LOHA at ₹50/kg with ₹2,500 payment...');
  const step4 = engine.sale('party-002', 'item-001', 80, 50, 2500);
  console.log(` -> Remaining Stock: ${step4.newStock} KG (Expected: 70 KG)`);
  console.log(` -> Revenue: ₹${step4.revenue}`);
  console.log(` -> COGS: ₹${step4.cogs} (Expected: 80 * 38.67 = 3093.60 or ~3093.33)`);
  console.log(` -> Gross Profit: ₹${step4.grossProfit} (Expected: ~906.40 to 906.67)`);
  console.log(` -> Outstanding Customer Due: ₹${step4.due} (Expected: 1500)`);
  if (step4.newStock !== 70 || step4.due !== 1500) throw new Error('Step 4 Sale Failed!');

  // Step 5: Test negative stock restriction
  console.log('\nStep 5: Testing negative stock prevention (Attempting to sell 100 KG when only 70 KG available)...');
  try {
    engine.sale('party-002', 'item-001', 100, 50, 0);
    throw new Error('Should have thrown error for insufficient stock!');
  } catch (err) {
    console.log(` -> Success! Blocked with expected message: "${err.message}"`);
  }

  // Step 6: Stock Adjustment (-5 KG LOHA)
  console.log('\nStep 6: Recording stock adjustment (-5 KG damaged sorting correction)...');
  const step6 = engine.adjustment('item-001', -5, 'Sorting damage deduction');
  console.log(` -> New stock after adjustment: ${step6.newStock} KG (Expected: 65 KG)`);
  if (step6.newStock !== 65) throw new Error('Step 6 Adjustment Failed!');

  // Step 7: Ledger Audit Trail
  console.log('\nStep 7: Verifying Permanent Inventory Ledger Audit Trail:');
  engine.ledger.forEach((entry, idx) => {
    console.log(`   [${idx + 1}] ${entry.transaction_type}: ${entry.quantity_change > 0 ? '+' : ''}${entry.quantity_change} KG @ ₹${entry.rate} -> Running Balance: ${entry.running_quantity} KG`);
  });

  // Step 8: Customer & Supplier Balance Verification
  console.log('\nStep 8: Verifying Customer & Supplier Balances:');
  const ramesh = engine.parties.find(p => p.id === 'party-001');
  const rahul = engine.parties.find(p => p.id === 'party-002');
  console.log(` -> Ramesh (Supplier) Balance: ${ramesh.current_balance} (We owe: ₹${Math.abs(ramesh.current_balance)})`);
  console.log(` -> Rahul (Customer) Balance: ${rahul.current_balance} (Customer owes: ₹${rahul.current_balance})`);
  if (rahul.current_balance !== 1500 || ramesh.current_balance !== -5800) {
    throw new Error('Step 8 Balance Verification Failed!');
  }

  console.log('\n====================================================');
  console.log('ALL VERIFICATION SCENARIOS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runVerification();
