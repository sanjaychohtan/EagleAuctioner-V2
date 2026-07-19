A. Objects modified by V18
- Tables altered: payment_transactions, payment_advices, payments, wallets, ledger_entries, sale_confirmations, sale_confirmation_versions, purchase_orders, purchase_order_items, fee_invoices, fee_invoice_items, gst_invoices, gst_invoice_items, settlements, disputes, auction_settings, auction_lots, bids, bid_histories, auction_winners, auction_results, contracts, contract_versions, payment_allocations, financial_configurations.

B. Dependency graph
- View `vw_revenue_gst_ledger_reconciliation` depends on `ledger_entries.amount` and `gst_invoices.total_tax`.
- Materialized View `mv_tenant_performance_kpis` depends on `auction_winners.winning_amount`.
- Index `idx_ledger_entries_recon_lookup` depends on `ledger_entries.amount` (auto-handled by Postgres).
- Index `idx_gst_invoice_recon_lookup` depends on `gst_invoices.total_tax` (auto-handled by Postgres).
- Index `idx_mv_tenant_kpis_tenant` depends on `mv_tenant_performance_kpis.tenant_id`.

C. Every outdated column reference
- Previously removed: `payment_advices.total_amount` and `payment_advices.allocated_amount`.
- Verified all 45 remaining `ALTER COLUMN` target columns exist in V1-V17 base schemas. No outdated references remain.

D. Every dependency-order problem
- PostgreSQL categorically blocks `ALTER TABLE ... ALTER COLUMN ... TYPE` if the target column is referenced by a VIEW or MATERIALIZED VIEW. 
- Attempting to alter `ledger_entries.amount`, `gst_invoices.total_tax`, or `auction_winners.winning_amount` will throw "cannot alter type of a column used by a view or rule".
- We must DROP the views before the ALTER TABLE statements, and RECREATE them afterwards.

E. Every required SQL modification
1. Add to the top of `V18__money_architecture_alignment.sql`:
   ```sql
   DROP MATERIALIZED VIEW IF EXISTS mv_tenant_performance_kpis;
   DROP VIEW IF EXISTS vw_revenue_gst_ledger_reconciliation;
   ```
2. Keep the 45 valid `ALTER TABLE` statements (as they currently are).
3. Append to the bottom of `V18__money_architecture_alignment.sql`:
   ```sql
   CREATE OR REPLACE VIEW vw_revenue_gst_ledger_reconciliation AS
   SELECT 
       cl.id AS contract_id,
       cl.document_number AS contract_number,
       b.id AS bidder_profile_id,
       u.id AS user_id,
       u.email AS user_email,
       l.id AS ledger_entry_id,
       l.account_type,
       l.entry_type,
       l.amount,
       g.id AS gst_invoice_id,
       g.total_tax,
       cl.created_at AS transaction_time
   FROM contracts cl
   LEFT JOIN auction_winners aw ON cl.winner_id = aw.id
   LEFT JOIN bidder_profiles b ON aw.bidder_id = b.id
   LEFT JOIN users u ON b.user_id = u.id
   LEFT JOIN settlements s ON s.contract_id = cl.id
   LEFT JOIN ledger_transactions lt ON lt.settlement_id = s.id
   LEFT JOIN ledger_entries l ON l.ledger_transaction_id = lt.id
   LEFT JOIN gst_invoices g ON g.settlement_id = s.id;

   CREATE MATERIALIZED VIEW IF NOT EXISTS mv_tenant_performance_kpis AS
   SELECT
       COALESCE(u.id, '00000000-0000-0000-0000-000000000000'::uuid) AS tenant_id,
       COUNT(DISTINCT a.id) AS total_auctions,
       COUNT(DISTINCT CASE WHEN a.state IN ('ENDED', 'SETTLED') THEN a.id END) AS completed_auctions,
       COUNT(DISTINCT CASE WHEN a.state = 'LIVE' THEN a.id END) AS active_auctions,
       COALESCE(SUM(aw.winning_amount), 0) AS total_gmv,
       COUNT(DISTINCT b.id) AS total_bids
   FROM users u
   LEFT JOIN seller_profiles sp ON sp.user_id = u.id
   LEFT JOIN auctions a ON a.seller_profile_id = sp.id
   LEFT JOIN auction_lots al ON al.auction_id = a.id
   LEFT JOIN auction_winners aw ON aw.auction_lot_id = al.id
   LEFT JOIN bids b ON b.auction_lot_id = al.id
   GROUP BY u.id;

   CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_tenant_kpis_tenant ON mv_tenant_performance_kpis(tenant_id);
   ```

F. Risk assessment
- Low risk. Re-creating the views at the end of the migration maintains parity with V14. The data types of `amount`, `total_tax`, and `winning_amount` will cleanly transition from `NUMERIC(18,2)` to `BIGINT` within the views.

G. Confidence
- High. I script-verified all 45 column existences against the `CREATE TABLE` and `ALTER TABLE` statements in migrations V1 through V17. The view dependency is a standard PostgreSQL limitation that this architecture alignment must respect.
