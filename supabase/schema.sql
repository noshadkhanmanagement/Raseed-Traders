-- Scrap Management System - Complete Database Schema & RPC Functions
-- Compatible with PostgreSQL 15+ & Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL DEFAULT 'Scrap Management System',
    phone VARCHAR(50) DEFAULT '+91 744 061 9649',
    address TEXT DEFAULT 'Behind Masjid, Bus Stand, Lakhnadon 480886',
    settings JSONB DEFAULT '{
        "allow_negative_stock": false,
        "default_unit": "KG",
        "stock_warning_threshold": 50,
        "currency": "₹",
        "default_payment_method": "CASH"
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ITEMS MASTER TABLE
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    local_name VARCHAR(150) NOT NULL, -- Hindi name
    code VARCHAR(50),
    default_unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    default_purchase_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    default_sale_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_stock NUMERIC(14, 3) NOT NULL DEFAULT 0.000,
    average_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Weighted Average Cost (WAC)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_item_stock CHECK (current_stock >= -1000000),
    CONSTRAINT chk_item_rates CHECK (default_purchase_rate >= 0 AND default_sale_rate >= 0 AND average_cost >= 0)
);

-- 3. PARTIES TABLE (Suppliers & Customers)
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    party_type VARCHAR(20) NOT NULL DEFAULT 'BOTH', -- 'SUPPLIER', 'CUSTOMER', 'BOTH'
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    opening_balance_type VARCHAR(20) NOT NULL DEFAULT 'RECEIVABLE', -- 'RECEIVABLE' (they owe us), 'PAYABLE' (we owe them)
    current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00, -- Positive = Customer owes us (Receivable), Negative = We owe supplier (Payable)
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PURCHASES TABLE
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    purchase_number VARCHAR(50) NOT NULL UNIQUE,
    party_id UUID REFERENCES parties(id) ON DELETE RESTRICT,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    due_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'FINAL', -- 'FINAL', 'CANCELLED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_purchase_amounts CHECK (total_amount >= 0 AND paid_amount >= 0 AND due_amount >= 0)
);

-- 5. PURCHASE ITEMS TABLE
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity NUMERIC(14, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    rate NUMERIC(12, 2) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_purchase_item_vals CHECK (quantity > 0 AND rate >= 0 AND amount >= 0)
);

-- 6. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    sale_number VARCHAR(50) NOT NULL UNIQUE,
    party_id UUID REFERENCES parties(id) ON DELETE RESTRICT,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    received_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    due_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00, -- Sum of COGS for all items
    total_profit NUMERIC(14, 2) NOT NULL DEFAULT 0.00, -- Total Amount - Total Cost
    payment_method VARCHAR(50) DEFAULT 'CASH',
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'FINAL', -- 'FINAL', 'CANCELLED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_sale_amounts CHECK (total_amount >= 0 AND received_amount >= 0 AND due_amount >= 0)
);

-- 7. SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity NUMERIC(14, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    rate NUMERIC(12, 2) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    cost_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- WAC at time of sale
    cost_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00, -- quantity * cost_rate
    profit_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00, -- amount - cost_amount
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_sale_item_vals CHECK (quantity > 0 AND rate >= 0 AND amount >= 0)
);

-- 8. STOCK ADJUSTMENTS TABLE
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    adjustment_number VARCHAR(50) NOT NULL UNIQUE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity NUMERIC(14, 3) NOT NULL, -- Positive for increase, Negative for decrease
    adjustment_type VARCHAR(50) NOT NULL, -- 'DAMAGE', 'MISSING', 'WEIGHING_CORRECTION', 'OPENING_STOCK', 'MANUAL'
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    payment_type VARCHAR(50) NOT NULL, -- 'PAYMENT_TO_SUPPLIER', 'PAYMENT_RECEIVED_FROM_CUSTOMER'
    amount NUMERIC(14, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH', -- 'CASH', 'UPI', 'BANK', 'OTHER'
    reference VARCHAR(100),
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_payment_amount CHECK (amount > 0)
);

-- 10. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    expense_number VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- 'TRANSPORT', 'LABOUR', 'ELECTRICITY', 'RENT', 'MAINTENANCE', 'LOADING_UNLOADING', 'OTHER'
    amount NUMERIC(14, 2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_expense_amount CHECK (amount > 0)
);

-- 11. INVENTORY LEDGER TABLE (Permanent Audit Trail)
CREATE TABLE IF NOT EXISTS inventory_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL, -- 'PURCHASE', 'SALE', 'ADJUSTMENT'
    reference_id UUID NOT NULL, -- purchase_id, sale_id, or adjustment_id
    reference_number VARCHAR(50) NOT NULL,
    quantity_change NUMERIC(14, 3) NOT NULL, -- + for in, - for out
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    running_quantity NUMERIC(14, 3) NOT NULL,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. STOCK COST HISTORY TABLE
CREATE TABLE IF NOT EXISTS stock_cost_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity_before NUMERIC(14, 3) NOT NULL,
    average_cost_before NUMERIC(12, 2) NOT NULL,
    quantity_change NUMERIC(14, 3) NOT NULL,
    cost_rate NUMERIC(12, 2) NOT NULL,
    average_cost_after NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR FAST PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_items_business ON items(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_parties_business ON parties(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_purchases_business_date ON purchases(business_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_party ON purchases(party_id);
CREATE INDEX IF NOT EXISTS idx_sales_business_date ON sales(business_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_party ON sales(party_id);
CREATE INDEX IF NOT EXISTS idx_ledger_item_date ON inventory_ledger(item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_party_date ON payments(party_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(business_id, expense_date DESC);

-- ============================================================================
-- RPC FUNCTIONS: ATOMIC TRANSACTION HANDLERS
-- ============================================================================

-- Function 1: Atomic Purchase Recording
CREATE OR REPLACE FUNCTION rpc_create_purchase(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business_id UUID;
    v_purchase_id UUID;
    v_purchase_number VARCHAR(50);
    v_party_id UUID;
    v_purchase_date DATE;
    v_total_amount NUMERIC(14, 2);
    v_paid_amount NUMERIC(14, 2);
    v_due_amount NUMERIC(14, 2);
    v_payment_method VARCHAR(50);
    v_notes TEXT;
    v_item RECORD;
    v_curr_stock NUMERIC(14, 3);
    v_curr_wac NUMERIC(12, 2);
    v_new_stock NUMERIC(14, 3);
    v_new_wac NUMERIC(12, 2);
    v_item_id UUID;
    v_qty NUMERIC(14, 3);
    v_rate NUMERIC(12, 2);
    v_amount NUMERIC(14, 2);
    v_unit VARCHAR(20);
    v_pay_num VARCHAR(50);
BEGIN
    v_business_id := (p_payload->>'business_id')::UUID;
    v_purchase_number := p_payload->>'purchase_number';
    v_party_id := (p_payload->>'party_id')::UUID;
    v_purchase_date := COALESCE((p_payload->>'purchase_date')::DATE, CURRENT_DATE);
    v_total_amount := (p_payload->>'total_amount')::NUMERIC;
    v_paid_amount := COALESCE((p_payload->>'paid_amount')::NUMERIC, 0.00);
    v_due_amount := v_total_amount - v_paid_amount;
    v_payment_method := COALESCE(p_payload->>'payment_method', 'CASH');
    v_notes := p_payload->>'notes';

    -- 1. Insert Purchase
    INSERT INTO purchases (
        business_id, purchase_number, party_id, purchase_date,
        subtotal, total_amount, paid_amount, due_amount,
        payment_method, notes
    ) VALUES (
        v_business_id, v_purchase_number, v_party_id, v_purchase_date,
        v_total_amount, v_total_amount, v_paid_amount, v_due_amount,
        v_payment_method, v_notes
    ) RETURNING id INTO v_purchase_id;

    -- 2. Process Line Items
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_payload->'items') AS x(
        item_id UUID, quantity NUMERIC, unit VARCHAR, rate NUMERIC, amount NUMERIC
    )
    LOOP
        v_item_id := v_item.item_id;
        v_qty := v_item.quantity;
        v_rate := v_item.rate;
        v_amount := v_item.amount;
        v_unit := COALESCE(v_item.unit, 'KG');

        -- Insert purchase line
        INSERT INTO purchase_items (purchase_id, item_id, quantity, unit, rate, amount)
        VALUES (v_purchase_id, v_item_id, v_qty, v_unit, v_rate, v_amount);

        -- Lock item and get current stock & WAC
        SELECT current_stock, average_cost INTO v_curr_stock, v_curr_wac
        FROM items WHERE id = v_item_id FOR UPDATE;

        IF v_curr_stock <= 0 THEN
            v_new_wac := v_rate;
        ELSE
            -- Weighted Average Cost formula
            v_new_wac := ROUND(((v_curr_stock * v_curr_wac) + (v_qty * v_rate)) / (v_curr_stock + v_qty), 2);
        END IF;

        v_new_stock := v_curr_stock + v_qty;

        -- Record cost history
        INSERT INTO stock_cost_history (
            business_id, item_id, quantity_before, average_cost_before,
            quantity_change, cost_rate, average_cost_after
        ) VALUES (
            v_business_id, v_item_id, v_curr_stock, v_curr_wac,
            v_qty, v_rate, v_new_wac
        );

        -- Update Item
        UPDATE items
        SET current_stock = v_new_stock,
            average_cost = v_new_wac,
            default_purchase_rate = v_rate,
            updated_at = NOW()
        WHERE id = v_item_id;

        -- Insert into inventory ledger
        INSERT INTO inventory_ledger (
            business_id, item_id, transaction_type, reference_id,
            reference_number, quantity_change, unit, rate,
            running_quantity, party_id, notes
        ) VALUES (
            v_business_id, v_item_id, 'PURCHASE', v_purchase_id,
            v_purchase_number, v_qty, v_unit, v_rate,
            v_new_stock, v_party_id, 'Purchase from supplier'
        );
    END LOOP;

    -- 3. Update Party Balance (Payable increases by due amount)
    -- In our ledger: Negative balance = We owe party (Payable)
    UPDATE parties
    SET current_balance = current_balance - v_due_amount,
        updated_at = NOW()
    WHERE id = v_party_id;

    -- 4. Create Payment Record if paid > 0
    IF v_paid_amount > 0 THEN
        v_pay_num := 'PAY-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 4);
        INSERT INTO payments (
            business_id, payment_number, party_id, payment_type,
            amount, payment_date, payment_method, purchase_id, notes
        ) VALUES (
            v_business_id, v_pay_num, v_party_id, 'PAYMENT_TO_SUPPLIER',
            v_paid_amount, v_purchase_date, v_payment_method, v_purchase_id, 'Initial payment on purchase ' || v_purchase_number
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'purchase_id', v_purchase_id,
        'purchase_number', v_purchase_number,
        'due_amount', v_due_amount
    );
END;
$$;

-- Function 2: Atomic Sale Recording with Stock Validation
CREATE OR REPLACE FUNCTION rpc_create_sale(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business_id UUID;
    v_sale_id UUID;
    v_sale_number VARCHAR(50);
    v_party_id UUID;
    v_sale_date DATE;
    v_total_amount NUMERIC(14, 2);
    v_received_amount NUMERIC(14, 2);
    v_due_amount NUMERIC(14, 2);
    v_payment_method VARCHAR(50);
    v_notes TEXT;
    v_allow_negative_stock BOOLEAN := false;
    v_settings JSONB;
    v_item RECORD;
    v_curr_stock NUMERIC(14, 3);
    v_curr_wac NUMERIC(12, 2);
    v_new_stock NUMERIC(14, 3);
    v_item_id UUID;
    v_qty NUMERIC(14, 3);
    v_rate NUMERIC(12, 2);
    v_amount NUMERIC(14, 2);
    v_unit VARCHAR(20);
    v_line_cost NUMERIC(14, 2);
    v_line_profit NUMERIC(14, 2);
    v_total_cost NUMERIC(14, 2) := 0.00;
    v_total_profit NUMERIC(14, 2) := 0.00;
    v_item_name VARCHAR(150);
    v_pay_num VARCHAR(50);
BEGIN
    v_business_id := (p_payload->>'business_id')::UUID;
    v_sale_number := p_payload->>'sale_number';
    v_party_id := (p_payload->>'party_id')::UUID;
    v_sale_date := COALESCE((p_payload->>'sale_date')::DATE, CURRENT_DATE);
    v_total_amount := (p_payload->>'total_amount')::NUMERIC;
    v_received_amount := COALESCE((p_payload->>'received_amount')::NUMERIC, 0.00);
    v_due_amount := v_total_amount - v_received_amount;
    v_payment_method := COALESCE(p_payload->>'payment_method', 'CASH');
    v_notes := p_payload->>'notes';

    -- Check business negative stock setting
    SELECT settings INTO v_settings FROM businesses WHERE id = v_business_id;
    IF v_settings IS NOT NULL AND (v_settings->>'allow_negative_stock')::BOOLEAN IS TRUE THEN
        v_allow_negative_stock := true;
    END IF;

    -- Validate Stock First for all items
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_payload->'items') AS x(
        item_id UUID, quantity NUMERIC, unit VARCHAR, rate NUMERIC, amount NUMERIC
    )
    LOOP
        SELECT current_stock, name INTO v_curr_stock, v_item_name FROM items WHERE id = v_item.item_id;
        IF NOT v_allow_negative_stock AND v_curr_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for %: Available % %, Requested % %',
                v_item_name, v_curr_stock, COALESCE(v_item.unit, 'KG'), v_item.quantity, COALESCE(v_item.unit, 'KG');
        END IF;
    END LOOP;

    -- Insert Sale record initially
    INSERT INTO sales (
        business_id, sale_number, party_id, sale_date,
        subtotal, total_amount, received_amount, due_amount,
        total_cost, total_profit, payment_method, notes
    ) VALUES (
        v_business_id, v_sale_number, v_party_id, v_sale_date,
        v_total_amount, v_total_amount, v_received_amount, v_due_amount,
        0.00, 0.00, v_payment_method, v_notes
    ) RETURNING id INTO v_sale_id;

    -- Process Line Items
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_payload->'items') AS x(
        item_id UUID, quantity NUMERIC, unit VARCHAR, rate NUMERIC, amount NUMERIC
    )
    LOOP
        v_item_id := v_item.item_id;
        v_qty := v_item.quantity;
        v_rate := v_item.rate;
        v_amount := v_item.amount;
        v_unit := COALESCE(v_item.unit, 'KG');

        SELECT current_stock, average_cost INTO v_curr_stock, v_curr_wac
        FROM items WHERE id = v_item_id FOR UPDATE;

        -- COGS and Gross profit for this line
        v_line_cost := ROUND(v_qty * v_curr_wac, 2);
        v_line_profit := v_amount - v_line_cost;
        v_total_cost := v_total_cost + v_line_cost;
        v_total_profit := v_total_profit + v_line_profit;

        v_new_stock := v_curr_stock - v_qty;

        -- Insert Sale item
        INSERT INTO sale_items (
            sale_id, item_id, quantity, unit, rate, amount,
            cost_rate, cost_amount, profit_amount
        ) VALUES (
            v_sale_id, v_item_id, v_qty, v_unit, v_rate, v_amount,
            v_curr_wac, v_line_cost, v_line_profit
        );

        -- Update Item Stock
        UPDATE items
        SET current_stock = v_new_stock,
            default_sale_rate = v_rate,
            updated_at = NOW()
        WHERE id = v_item_id;

        -- Inventory Ledger entry
        INSERT INTO inventory_ledger (
            business_id, item_id, transaction_type, reference_id,
            reference_number, quantity_change, unit, rate,
            running_quantity, party_id, notes
        ) VALUES (
            v_business_id, v_item_id, 'SALE', v_sale_id,
            v_sale_number, -v_qty, v_unit, v_rate,
            v_new_stock, v_party_id, 'Sale to customer'
        );
    END LOOP;

    -- Update Sale with computed COGS and profit
    UPDATE sales
    SET total_cost = v_total_cost,
        total_profit = v_total_profit
    WHERE id = v_sale_id;

    -- Update Customer Balance (Receivable increases by due amount)
    UPDATE parties
    SET current_balance = current_balance + v_due_amount,
        updated_at = NOW()
    WHERE id = v_party_id;

    -- Create Payment Record if received > 0
    IF v_received_amount > 0 THEN
        v_pay_num := 'PAY-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 4);
        INSERT INTO payments (
            business_id, payment_number, party_id, payment_type,
            amount, payment_date, payment_method, sale_id, notes
        ) VALUES (
            v_business_id, v_pay_num, v_party_id, 'PAYMENT_RECEIVED_FROM_CUSTOMER',
            v_received_amount, v_sale_date, v_payment_method, v_sale_id, 'Initial payment on sale ' || v_sale_number
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'sale_number', v_sale_number,
        'total_cost', v_total_cost,
        'total_profit', v_total_profit,
        'due_amount', v_due_amount
    );
END;
$$;

-- Function 3: Stock Adjustment Recording
CREATE OR REPLACE FUNCTION rpc_create_stock_adjustment(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business_id UUID;
    v_adj_id UUID;
    v_adj_num VARCHAR(50);
    v_item_id UUID;
    v_quantity NUMERIC(14, 3);
    v_adj_type VARCHAR(50);
    v_reason TEXT;
    v_notes TEXT;
    v_curr_stock NUMERIC(14, 3);
    v_curr_wac NUMERIC(12, 2);
    v_new_stock NUMERIC(14, 3);
    v_unit VARCHAR(20);
BEGIN
    v_business_id := (p_payload->>'business_id')::UUID;
    v_adj_num := p_payload->>'adjustment_number';
    v_item_id := (p_payload->>'item_id')::UUID;
    v_quantity := (p_payload->>'quantity')::NUMERIC;
    v_adj_type := p_payload->>'adjustment_type';
    v_reason := p_payload->>'reason';
    v_notes := p_payload->>'notes';

    SELECT current_stock, average_cost, default_unit INTO v_curr_stock, v_curr_wac, v_unit
    FROM items WHERE id = v_item_id FOR UPDATE;

    v_new_stock := v_curr_stock + v_quantity;

    INSERT INTO stock_adjustments (
        business_id, adjustment_number, item_id, quantity,
        adjustment_type, reason, notes
    ) VALUES (
        v_business_id, v_adj_num, v_item_id, v_quantity,
        v_adj_type, v_reason, v_notes
    ) RETURNING id INTO v_adj_id;

    UPDATE items
    SET current_stock = v_new_stock,
        updated_at = NOW()
    WHERE id = v_item_id;

    INSERT INTO inventory_ledger (
        business_id, item_id, transaction_type, reference_id,
        reference_number, quantity_change, unit, rate,
        running_quantity, notes
    ) VALUES (
        v_business_id, v_item_id, 'ADJUSTMENT', v_adj_id,
        v_adj_num, v_quantity, v_unit, v_curr_wac,
        v_new_stock, v_reason
    );

    RETURN jsonb_build_object(
        'success', true,
        'adjustment_id', v_adj_id,
        'new_stock', v_new_stock
    );
END;
$$;

-- Function 4: Atomic Payment Recording
CREATE OR REPLACE FUNCTION rpc_create_payment(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business_id UUID;
    v_pay_id UUID;
    v_pay_num VARCHAR(50);
    v_party_id UUID;
    v_pay_type VARCHAR(50);
    v_amount NUMERIC(14, 2);
    v_pay_date DATE;
    v_method VARCHAR(50);
    v_ref VARCHAR(100);
    v_purchase_id UUID;
    v_sale_id UUID;
    v_notes TEXT;
BEGIN
    v_business_id := (p_payload->>'business_id')::UUID;
    v_pay_num := p_payload->>'payment_number';
    v_party_id := (p_payload->>'party_id')::UUID;
    v_pay_type := p_payload->>'payment_type';
    v_amount := (p_payload->>'amount')::NUMERIC;
    v_pay_date := COALESCE((p_payload->>'payment_date')::DATE, CURRENT_DATE);
    v_method := COALESCE(p_payload->>'payment_method', 'CASH');
    v_ref := p_payload->>'reference';
    IF p_payload->>'purchase_id' IS NOT NULL THEN
        v_purchase_id := (p_payload->>'purchase_id')::UUID;
    END IF;
    IF p_payload->>'sale_id' IS NOT NULL THEN
        v_sale_id := (p_payload->>'sale_id')::UUID;
    END IF;
    v_notes := p_payload->>'notes';

    INSERT INTO payments (
        business_id, payment_number, party_id, payment_type,
        amount, payment_date, payment_method, reference,
        purchase_id, sale_id, notes
    ) VALUES (
        v_business_id, v_pay_num, v_party_id, v_pay_type,
        v_amount, v_pay_date, v_method, v_ref,
        v_purchase_id, v_sale_id, v_notes
    ) RETURNING id INTO v_pay_id;

    IF v_pay_type = 'PAYMENT_TO_SUPPLIER' THEN
        -- Paying supplier reduces payable (increases current_balance towards 0)
        UPDATE parties
        SET current_balance = current_balance + v_amount,
            updated_at = NOW()
        WHERE id = v_party_id;

        IF v_purchase_id IS NOT NULL THEN
            UPDATE purchases
            SET paid_amount = paid_amount + v_amount,
                due_amount = GREATEST(0.00, total_amount - (paid_amount + v_amount))
            WHERE id = v_purchase_id;
        END IF;
    ELSIF v_pay_type = 'PAYMENT_RECEIVED_FROM_CUSTOMER' THEN
        -- Receiving money from customer reduces receivable (decreases current_balance)
        UPDATE parties
        SET current_balance = current_balance - v_amount,
            updated_at = NOW()
        WHERE id = v_party_id;

        IF v_sale_id IS NOT NULL THEN
            UPDATE sales
            SET received_amount = received_amount + v_amount,
                due_amount = GREATEST(0.00, total_amount - (received_amount + v_amount))
            WHERE id = v_sale_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_pay_id,
        'payment_number', v_pay_num
    );
END;
$$;

-- Function 5: Dashboard KPI Aggregator
CREATE OR REPLACE FUNCTION rpc_get_dashboard_kpis(p_business_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today_purchase NUMERIC(14, 2) := 0.00;
    v_today_sales NUMERIC(14, 2) := 0.00;
    v_today_profit NUMERIC(14, 2) := 0.00;
    v_period_purchase NUMERIC(14, 2) := 0.00;
    v_period_sales NUMERIC(14, 2) := 0.00;
    v_period_profit NUMERIC(14, 2) := 0.00;
    v_period_expenses NUMERIC(14, 2) := 0.00;
    v_stock_value NUMERIC(14, 2) := 0.00;
    v_pending_receivables NUMERIC(14, 2) := 0.00;
    v_pending_payables NUMERIC(14, 2) := 0.00;
BEGIN
    -- Today metrics
    SELECT COALESCE(SUM(total_amount), 0.00) INTO v_today_purchase
    FROM purchases WHERE business_id = p_business_id AND purchase_date = CURRENT_DATE AND status = 'FINAL';

    SELECT COALESCE(SUM(total_amount), 0.00), COALESCE(SUM(total_profit), 0.00)
    INTO v_today_sales, v_today_profit
    FROM sales WHERE business_id = p_business_id AND sale_date = CURRENT_DATE AND status = 'FINAL';

    -- Period metrics
    SELECT COALESCE(SUM(total_amount), 0.00) INTO v_period_purchase
    FROM purchases
    WHERE business_id = p_business_id AND purchase_date BETWEEN p_start_date AND p_end_date AND status = 'FINAL';

    SELECT COALESCE(SUM(total_amount), 0.00), COALESCE(SUM(total_profit), 0.00)
    INTO v_period_sales, v_period_profit
    FROM sales
    WHERE business_id = p_business_id AND sale_date BETWEEN p_start_date AND p_end_date AND status = 'FINAL';

    SELECT COALESCE(SUM(amount), 0.00) INTO v_period_expenses
    FROM expenses
    WHERE business_id = p_business_id AND expense_date BETWEEN p_start_date AND p_end_date;

    -- Current Stock Value
    SELECT COALESCE(SUM(GREATEST(0, current_stock) * average_cost), 0.00) INTO v_stock_value
    FROM items WHERE business_id = p_business_id AND is_active = true;

    -- Pending Receivables (current_balance > 0) & Payables (current_balance < 0)
    SELECT
        COALESCE(SUM(CASE WHEN current_balance > 0 THEN current_balance ELSE 0 END), 0.00),
        COALESCE(SUM(CASE WHEN current_balance < 0 THEN ABS(current_balance) ELSE 0 END), 0.00)
    INTO v_pending_receivables, v_pending_payables
    FROM parties WHERE business_id = p_business_id AND is_active = true;

    RETURN jsonb_build_object(
        'today_purchase', v_today_purchase,
        'today_sales', v_today_sales,
        'today_profit', v_today_profit,
        'period_purchase', v_period_purchase,
        'period_sales', v_period_sales,
        'period_profit', v_period_profit,
        'period_expenses', v_period_expenses,
        'current_stock_value', v_stock_value,
        'pending_receivables', v_pending_receivables,
        'pending_payables', v_pending_payables
    );
END;
$$;

-- ============================================================================
-- PRECONFIGURED 25 SCRAP ITEMS SEED
-- ============================================================================
-- Default business seed
INSERT INTO businesses (id, name, phone, address)
VALUES ('00000000-0000-0000-0000-000000000001', 'Scrap Management System', '+91 744 061 9649', 'Behind Masjid, Bus Stand, Lakhnadon 480886')
ON CONFLICT (id) DO NOTHING;

-- Seed the 25 Master Scrap Items
INSERT INTO items (business_id, name, local_name, default_unit, default_purchase_rate, default_sale_rate) VALUES
('00000000-0000-0000-0000-000000000001', 'LOHA', 'लोहा', 'KG', 38.00, 48.00),
('00000000-0000-0000-0000-000000000001', 'TEEN', 'टिन', 'KG', 28.00, 36.00),
('00000000-0000-0000-0000-000000000001', 'PLASTIC', 'प्लास्टिक', 'KG', 22.00, 30.00),
('00000000-0000-0000-0000-000000000001', 'KALI PLASTIC', 'काली प्लास्टिक', 'KG', 18.00, 25.00),
('00000000-0000-0000-0000-000000000001', 'PADPAD', 'परपर', 'KG', 14.00, 20.00),
('00000000-0000-0000-0000-000000000001', 'DABBA', 'डब्बा', 'KG', 16.00, 22.00),
('00000000-0000-0000-0000-000000000001', 'RADDI', 'रद्दी', 'KG', 12.00, 16.00),
('00000000-0000-0000-0000-000000000001', 'KHADDA', 'खड्डा', 'KG', 10.00, 14.00),
('00000000-0000-0000-0000-000000000001', 'TAMBA', 'ताम्बा', 'KG', 640.00, 720.00),
('00000000-0000-0000-0000-000000000001', 'PEETAL', 'पीतल', 'KG', 420.00, 480.00),
('00000000-0000-0000-0000-000000000001', 'GERMAN', 'जर्मन', 'KG', 130.00, 160.00),
('00000000-0000-0000-0000-000000000001', 'ARMATURE', 'आर्मचर', 'KG', 75.00, 95.00),
('00000000-0000-0000-0000-000000000001', 'PLATE', 'प्लेट', 'KG', 35.00, 44.00),
('00000000-0000-0000-0000-000000000001', 'BATTERY', 'बैटरी', 'KG', 90.00, 110.00),
('00000000-0000-0000-0000-000000000001', 'REGIRATOR', 'रेग्युलेटर', 'PIECE', 40.00, 60.00),
('00000000-0000-0000-0000-000000000001', 'STEEL', 'एस्टील', 'KG', 65.00, 85.00),
('00000000-0000-0000-0000-000000000001', 'PALIYA', 'पालिया', 'KG', 32.00, 42.00),
('00000000-0000-0000-0000-000000000001', 'TUBE', 'तुइबे', 'KG', 45.00, 60.00),
('00000000-0000-0000-0000-000000000001', 'TYRE', 'टायर', 'PIECE', 80.00, 120.00),
('00000000-0000-0000-0000-000000000001', '2 TYRE', '2 टायर', 'PIECE', 50.00, 80.00),
('00000000-0000-0000-0000-000000000001', 'FOAM', 'फोम', 'KG', 30.00, 45.00),
('00000000-0000-0000-0000-000000000001', 'KALA FOAM', 'काला फोम', 'KG', 25.00, 38.00),
('00000000-0000-0000-0000-000000000001', 'PAUE BOTTLE', 'पाउये बोतल', 'PIECE', 1.50, 2.50),
('00000000-0000-0000-0000-000000000001', 'BEER BOTTLE', 'बीयर बोतल', 'PIECE', 2.00, 3.50),
('00000000-0000-0000-0000-000000000001', 'KAACH BOTTLE', 'काच बोतल', 'PIECE', 1.00, 2.00)
ON CONFLICT DO NOTHING;

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_cost_history ENABLE ROW LEVEL SECURITY;

-- Standard open policy for authenticated users / single business mode
CREATE POLICY "Full access to business items" ON items FOR ALL USING (true);
CREATE POLICY "Full access to business parties" ON parties FOR ALL USING (true);
CREATE POLICY "Full access to business purchases" ON purchases FOR ALL USING (true);
CREATE POLICY "Full access to business sales" ON sales FOR ALL USING (true);
CREATE POLICY "Full access to business payments" ON payments FOR ALL USING (true);
CREATE POLICY "Full access to business expenses" ON expenses FOR ALL USING (true);
CREATE POLICY "Full access to business ledger" ON inventory_ledger FOR ALL USING (true);
