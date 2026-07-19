- **Failing Migration**: `V14__admin_dashboard.sql`
- **Exact SQL Line**: 
  - `LEFT JOIN ledgers l ON l.reference_id = cl.id`
  - `CREATE INDEX IF NOT EXISTS idx_ledgers_recon_lookup ON ledgers (account_type, entry_type, amount);`
- **Referenced Table**: `ledgers` (which does not exist)
- **Migration where that table is created**: `V11__ledger_engine.sql` creates `ledger_transactions` and `ledger_entries`, but not `ledgers`.
- **Verified Root Cause**: The view `vw_revenue_gst_ledger_reconciliation` and the index `idx_ledgers_recon_lookup` incorrectly referenced a non-existent `ledgers` table. The ledger feature was implemented using `ledger_transactions` and `ledger_entries` instead. The join condition `l.reference_id = cl.id` was also incorrect because ledger entries link to a contract via `ledger_transactions -> settlement_id -> contracts`.
- **Files Modified**: `backend/src/main/resources/db/migration/V14__admin_dashboard.sql`
- **Exact SQL Lines Changed**:
  ```diff
  - LEFT JOIN ledgers l ON l.reference_id = cl.id
  + LEFT JOIN settlements s ON s.contract_id = cl.id
  + LEFT JOIN ledger_transactions lt ON lt.settlement_id = s.id
  + LEFT JOIN ledger_entries l ON l.ledger_transaction_id = lt.id
  
  - CREATE INDEX IF NOT EXISTS idx_ledgers_recon_lookup ON ledgers (account_type, entry_type, amount);
  + CREATE INDEX IF NOT EXISTS idx_ledger_entries_recon_lookup ON ledger_entries (account_type, entry_type, amount);
  ```
- **Confidence**: High

I have applied the minimum migration fix. No business services or tests were modified.
Waiting for your approval.
