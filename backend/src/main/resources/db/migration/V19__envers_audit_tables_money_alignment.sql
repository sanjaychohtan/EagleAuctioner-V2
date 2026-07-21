-- Align Envers audit tables' monetary columns to BIGINT (paise) to match entity definitions and avoid schema validation mismatches

ALTER TABLE IF EXISTS payment_transactions_aud ALTER COLUMN amount TYPE BIGINT USING (amount * 100)::BIGINT;
ALTER TABLE IF EXISTS payment_advices_aud ALTER COLUMN amount_due TYPE BIGINT USING (amount_due * 100)::BIGINT;
ALTER TABLE IF EXISTS payments_aud ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;

ALTER TABLE IF EXISTS wallets_aud ALTER COLUMN available_balance TYPE BIGINT USING (available_balance * 100)::BIGINT;
ALTER TABLE IF EXISTS wallets_aud ALTER COLUMN locked_balance TYPE BIGINT USING (locked_balance * 100)::BIGINT;
ALTER TABLE IF EXISTS wallets_aud ALTER COLUMN permanent_emd TYPE BIGINT USING (permanent_emd * 100)::BIGINT;
ALTER TABLE IF EXISTS wallets_aud ALTER COLUMN refund_pending TYPE BIGINT USING (refund_pending * 100)::BIGINT;
ALTER TABLE IF EXISTS wallets_aud ALTER COLUMN settlement_pending TYPE BIGINT USING (settlement_pending * 100)::BIGINT;

ALTER TABLE IF EXISTS ledger_entries_aud ALTER COLUMN amount TYPE BIGINT USING (amount * 100)::BIGINT;

ALTER TABLE IF EXISTS gst_invoices_aud ALTER COLUMN subtotal TYPE BIGINT USING (subtotal * 100)::BIGINT;
ALTER TABLE IF EXISTS gst_invoices_aud ALTER COLUMN total_tax TYPE BIGINT USING (total_tax * 100)::BIGINT;
ALTER TABLE IF EXISTS gst_invoices_aud ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;

ALTER TABLE IF EXISTS gst_invoice_items_aud ALTER COLUMN amount TYPE BIGINT USING (amount * 100)::BIGINT;
ALTER TABLE IF EXISTS gst_invoice_items_aud ALTER COLUMN tax_amount TYPE BIGINT USING (tax_amount * 100)::BIGINT;
ALTER TABLE IF EXISTS gst_invoice_items_aud ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;

ALTER TABLE IF EXISTS settlements_aud ALTER COLUMN platform_fee TYPE BIGINT USING (platform_fee * 100)::BIGINT;
ALTER TABLE IF EXISTS settlements_aud ALTER COLUMN tax_amount TYPE BIGINT USING (tax_amount * 100)::BIGINT;
ALTER TABLE IF EXISTS settlements_aud ALTER COLUMN payout_amount TYPE BIGINT USING (payout_amount * 100)::BIGINT;
ALTER TABLE IF EXISTS settlements_aud ALTER COLUMN winning_amount TYPE BIGINT USING (winning_amount * 100)::BIGINT;

ALTER TABLE IF EXISTS disputes_aud ALTER COLUMN disputed_amount TYPE BIGINT USING (disputed_amount * 100)::BIGINT;

ALTER TABLE IF EXISTS auction_settings_aud ALTER COLUMN minimum_increment TYPE BIGINT USING (minimum_increment * 100)::BIGINT;

ALTER TABLE IF EXISTS auction_lots_aud ALTER COLUMN starting_price TYPE BIGINT USING (starting_price * 100)::BIGINT;
ALTER TABLE IF EXISTS auction_lots_aud ALTER COLUMN reserve_price TYPE BIGINT USING (reserve_price * 100)::BIGINT;
ALTER TABLE IF EXISTS auction_lots_aud ALTER COLUMN current_highest_bid TYPE BIGINT USING (current_highest_bid * 100)::BIGINT;
ALTER TABLE IF EXISTS auction_lots_aud ALTER COLUMN minimum_increment TYPE BIGINT USING (minimum_increment * 100)::BIGINT;

ALTER TABLE IF EXISTS bids_aud ALTER COLUMN bid_amount TYPE BIGINT USING (bid_amount * 100)::BIGINT;
ALTER TABLE IF EXISTS bids_aud ALTER COLUMN auto_bid_limit TYPE BIGINT USING (auto_bid_limit * 100)::BIGINT;

ALTER TABLE IF EXISTS bid_histories_aud ALTER COLUMN old_highest_bid TYPE BIGINT USING (old_highest_bid * 100)::BIGINT;
ALTER TABLE IF EXISTS bid_histories_aud ALTER COLUMN new_highest_bid TYPE BIGINT USING (new_highest_bid * 100)::BIGINT;

ALTER TABLE IF EXISTS auction_winners_aud ALTER COLUMN winning_amount TYPE BIGINT USING (winning_amount * 100)::BIGINT;
ALTER TABLE IF EXISTS auction_winners_aud ALTER COLUMN winner_bid_amount_snapshot TYPE BIGINT USING (winner_bid_amount_snapshot * 100)::BIGINT;
ALTER TABLE IF EXISTS auction_winners_aud ALTER COLUMN reserve_price_snapshot TYPE BIGINT USING (reserve_price_snapshot * 100)::BIGINT;

ALTER TABLE IF EXISTS auction_results_aud ALTER COLUMN highest_bid_amount TYPE BIGINT USING (highest_bid_amount * 100)::BIGINT;
ALTER TABLE IF EXISTS auction_results_aud ALTER COLUMN reserve_price TYPE BIGINT USING (reserve_price * 100)::BIGINT;

ALTER TABLE IF EXISTS contracts_aud ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;

ALTER TABLE IF EXISTS contract_versions_aud ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;

ALTER TABLE IF EXISTS payment_allocations_aud ALTER COLUMN allocated_amount TYPE BIGINT USING (allocated_amount * 100)::BIGINT;

ALTER TABLE IF EXISTS financial_configurations_aud ALTER COLUMN tolerance_value TYPE BIGINT USING (tolerance_value * 100)::BIGINT;
