- **Full SQL statement before fix**:
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
      g.total_gst_amount,
      g.cgst_amount,
      g.sgst_amount,
      g.igst_amount,
      cl.created_at AS transaction_time
  FROM contracts cl
  LEFT JOIN auction_winners aw ON cl.winner_id = aw.id
  LEFT JOIN bidder_profiles b ON aw.bidder_id = b.id
  LEFT JOIN users u ON b.user_id = u.id
  LEFT JOIN settlements s ON s.contract_id = cl.id
  LEFT JOIN ledger_transactions lt ON lt.settlement_id = s.id
  LEFT JOIN ledger_entries l ON l.ledger_transaction_id = lt.id
  LEFT JOIN gst_invoices g ON g.contract_id = cl.id;
  ```
- **Root cause**: The alias `g` refers to the `gst_invoices` table. In the initial schema design, the view incorrectly joined `gst_invoices` on `contract_id` and selected non-existent breakdown columns (`total_gst_amount`, `cgst_amount`, `sgst_amount`, `igst_amount`). The actual `gst_invoices` schema (defined in `V13__document_engine.sql`) references a `settlement_id` instead of a `contract_id` and tracks a unified `total_tax` column. Additionally, an index (`idx_gst_invoice_recon_lookup`) incorrectly targeted the non-existent columns.
- **Correct alias/column**: 
  - The join should use `ON g.settlement_id = s.id`.
  - The select list should use `g.total_tax` instead of the broken-down tax columns.
  - The index should target `(settlement_id, total_tax)`.
- **Exact SQL diff**:
  ```diff
  --- backend/src/main/resources/db/migration/V14__admin_dashboard.sql
  +++ backend/src/main/resources/db/migration/V14__admin_dashboard.sql
  @@ -75,11 +75,7 @@
       l.entry_type,
       l.amount,
       g.id AS gst_invoice_id,
  -    g.total_gst_amount,
  -    g.cgst_amount,
  -    g.sgst_amount,
  -    g.igst_amount,
  +    g.total_tax,
       cl.created_at AS transaction_time
   FROM contracts cl
   LEFT JOIN auction_winners aw ON cl.winner_id = aw.id
  @@ -87,7 +83,7 @@
   LEFT JOIN settlements s ON s.contract_id = cl.id
   LEFT JOIN ledger_transactions lt ON lt.settlement_id = s.id
   LEFT JOIN ledger_entries l ON l.ledger_transaction_id = lt.id
  -LEFT JOIN gst_invoices g ON g.contract_id = cl.id;
  +LEFT JOIN gst_invoices g ON g.settlement_id = s.id;
   
   -- Materialized views for high-performance sub-second Analytics Dashboard KPIs
  @@ -107,7 +103,7 @@
   
   -- Composite Indexes for analytical performance optimization
   CREATE INDEX IF NOT EXISTS idx_ledger_entries_recon_lookup ON ledger_entries (account_type, entry_type, amount);
  -CREATE INDEX IF NOT EXISTS idx_gst_invoice_recon_lookup ON gst_invoices (contract_id, total_gst_amount);
  +CREATE INDEX IF NOT EXISTS idx_gst_invoice_recon_lookup ON gst_invoices (settlement_id, total_tax);
   CREATE INDEX IF NOT EXISTS idx_contracts_winning_bidder ON contracts (winner_id, status);
  ```
- **Files modified**: `backend/src/main/resources/db/migration/V14__admin_dashboard.sql`
- **Confidence**: High
