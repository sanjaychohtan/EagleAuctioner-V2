- **payment_advices schema**: Contains `id`, `version`, `created_at`, `updated_at`, `deleted_at`, `advice_number`, `settlement_id`, `amount_due`, `due_date`, `status`. Only `amount_due` is a numeric monetary column.
- **migration where it is created**: `V10__payment_engine.sql`
- **every outdated column in V18**: The `V18__money_architecture_alignment.sql` incorrectly attempted to run `ALTER TABLE payment_advices ALTER COLUMN total_amount` and `ALTER TABLE payment_advices ALTER COLUMN allocated_amount`. These columns never existed on `payment_advices` (they belong to `payments` and `payment_allocations` respectively, and V18 already had separate valid `ALTER TABLE` statements for those).
- **exact SQL diff**:
  ```diff
  --- backend/src/main/resources/db/migration/V18__money_architecture_alignment.sql
  +++ backend/src/main/resources/db/migration/V18__money_architecture_alignment.sql
  @@ -1,8 +1,6 @@
   -- Change all monetary fields from NUMERIC/DECIMAL to BIGINT (paise)
   -- V10
   ALTER TABLE payment_transactions ALTER COLUMN amount TYPE BIGINT USING (amount * 100)::BIGINT;
  -ALTER TABLE payment_advices ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;
  -ALTER TABLE payment_advices ALTER COLUMN allocated_amount TYPE BIGINT USING (allocated_amount * 100)::BIGINT;
   ALTER TABLE payment_advices ALTER COLUMN amount_due TYPE BIGINT USING (amount_due * 100)::BIGINT;
   ALTER TABLE payments ALTER COLUMN total_amount TYPE BIGINT USING (total_amount * 100)::BIGINT;
  ```
- **files modified**: `backend/src/main/resources/db/migration/V18__money_architecture_alignment.sql`
- **confidence**: High

I have investigated every monetary column in the V18 migration against the actual creation schemas (V4 through V14) and confirmed that `total_amount` and `allocated_amount` were the only falsely referenced columns for `payment_advices`. All other schema conversions in V18 are correct according to their base migrations. No Java files or tests were changed. Waiting for your approval.
