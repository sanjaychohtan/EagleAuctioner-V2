-- Change all monetary fields from NUMERIC/DECIMAL to BIGINT (paise)
-- V10
ALTER TABLE payment_transactions ALTER COLUMN amount TYPE BIGINT USING (amount * 100)::BIGINT;
ALTER TABLE payment_advices ALTER COLUMN amount_due TYPE BIGINT USING (amount_due * 100)::BIGINT;
ALTER TABLE payments ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;

-- V11
ALTER TABLE wallets ALTER COLUMN available_balance TYPE BIGINT USING (available_balance * 100)::BIGINT;
ALTER TABLE wallets ALTER COLUMN locked_balance TYPE BIGINT USING (locked_balance * 100)::BIGINT;
ALTER TABLE wallets ALTER COLUMN permanent_emd TYPE BIGINT USING (permanent_emd * 100)::BIGINT;
ALTER TABLE wallets ALTER COLUMN refund_pending TYPE BIGINT USING (refund_pending * 100)::BIGINT;
ALTER TABLE wallets ALTER COLUMN settlement_pending TYPE BIGINT USING (settlement_pending * 100)::BIGINT;
ALTER TABLE ledger_entries ALTER COLUMN amount TYPE BIGINT USING (amount * 100)::BIGINT;

-- V13
-- Note: currency_precision should probably be ignored.
-- sale_confirmations, purchase_orders, etc.
ALTER TABLE sale_confirmations ALTER COLUMN sale_amount TYPE BIGINT USING (sale_amount * 100)::BIGINT;
ALTER TABLE sale_confirmation_versions ALTER COLUMN sale_amount TYPE BIGINT USING (sale_amount * 100)::BIGINT;
ALTER TABLE purchase_orders ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;
ALTER TABLE purchase_order_items ALTER COLUMN unit_price TYPE BIGINT USING (unit_price * 100)::BIGINT;
ALTER TABLE purchase_order_items ALTER COLUMN line_total TYPE BIGINT USING (line_total * 100)::BIGINT;
ALTER TABLE fee_invoices ALTER COLUMN subtotal TYPE BIGINT USING (subtotal * 100)::BIGINT;
ALTER TABLE fee_invoices ALTER COLUMN tax_amount TYPE BIGINT USING (tax_amount * 100)::BIGINT;
ALTER TABLE fee_invoices ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;
ALTER TABLE fee_invoice_items ALTER COLUMN amount TYPE BIGINT USING (amount * 100)::BIGINT;

ALTER TABLE gst_invoices ALTER COLUMN subtotal TYPE BIGINT USING (subtotal * 100)::BIGINT;
ALTER TABLE gst_invoices ALTER COLUMN total_tax TYPE BIGINT USING (total_tax * 100)::BIGINT;
ALTER TABLE gst_invoices ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;

ALTER TABLE gst_invoice_items ALTER COLUMN amount TYPE BIGINT USING (amount * 100)::BIGINT;
ALTER TABLE gst_invoice_items ALTER COLUMN tax_amount TYPE BIGINT USING (tax_amount * 100)::BIGINT;
ALTER TABLE gst_invoice_items ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;

ALTER TABLE settlements ALTER COLUMN platform_fee TYPE BIGINT USING (platform_fee * 100)::BIGINT;
ALTER TABLE settlements ALTER COLUMN tax_amount TYPE BIGINT USING (tax_amount * 100)::BIGINT;
ALTER TABLE settlements ALTER COLUMN payout_amount TYPE BIGINT USING (payout_amount * 100)::BIGINT;

-- V14
ALTER TABLE disputes ALTER COLUMN disputed_amount TYPE BIGINT USING (disputed_amount * 100)::BIGINT;

-- V4
ALTER TABLE auction_settings ALTER COLUMN minimum_increment TYPE BIGINT USING (minimum_increment * 100)::BIGINT;
ALTER TABLE auction_lots ALTER COLUMN starting_price TYPE BIGINT USING (starting_price * 100)::BIGINT;
ALTER TABLE auction_lots ALTER COLUMN reserve_price TYPE BIGINT USING (reserve_price * 100)::BIGINT;
ALTER TABLE auction_lots ALTER COLUMN current_highest_bid TYPE BIGINT USING (current_highest_bid * 100)::BIGINT;
ALTER TABLE auction_lots ALTER COLUMN minimum_increment TYPE BIGINT USING (minimum_increment * 100)::BIGINT;

-- V5
ALTER TABLE bids ALTER COLUMN bid_amount TYPE BIGINT USING (bid_amount * 100)::BIGINT;
ALTER TABLE bids ALTER COLUMN auto_bid_limit TYPE BIGINT USING (auto_bid_limit * 100)::BIGINT;
ALTER TABLE bid_histories ALTER COLUMN old_highest_bid TYPE BIGINT USING (old_highest_bid * 100)::BIGINT;
ALTER TABLE bid_histories ALTER COLUMN new_highest_bid TYPE BIGINT USING (new_highest_bid * 100)::BIGINT;

-- V6
ALTER TABLE auction_winners ALTER COLUMN winning_amount TYPE BIGINT USING (winning_amount * 100)::BIGINT;
ALTER TABLE auction_winners ALTER COLUMN winner_bid_amount_snapshot TYPE BIGINT USING (winner_bid_amount_snapshot * 100)::BIGINT;
ALTER TABLE auction_winners ALTER COLUMN reserve_price_snapshot TYPE BIGINT USING (reserve_price_snapshot * 100)::BIGINT;
ALTER TABLE auction_results ALTER COLUMN highest_bid_amount TYPE BIGINT USING (highest_bid_amount * 100)::BIGINT;
ALTER TABLE auction_results ALTER COLUMN reserve_price TYPE BIGINT USING (reserve_price * 100)::BIGINT;

-- V7
ALTER TABLE contracts ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;
ALTER TABLE contract_versions ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;

-- V8
ALTER TABLE settlements ALTER COLUMN winning_amount TYPE BIGINT USING (winning_amount * 100)::BIGINT;

-- Also payment_allocations from V10
ALTER TABLE payment_allocations ALTER COLUMN allocated_amount TYPE BIGINT USING (allocated_amount * 100)::BIGINT;

ALTER TABLE financial_configurations ALTER COLUMN tolerance_value TYPE BIGINT USING (tolerance_value * 100)::BIGINT;
