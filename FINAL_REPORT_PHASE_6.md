- **Root cause**: The alias `b` refers to the `bids` table. The `bids` schema (defined in `V5__bidding_engine.sql`) does not have a `lot_id` column; it links to `auction_lots` using the column `auction_lot_id`.
- **Full SQL before and after**:
  Before:
  ```sql
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
  LEFT JOIN bids b ON b.lot_id = al.id
  GROUP BY u.id;
  ```
  After:
  ```sql
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
  ```
- **Every invalid column found**: Just `b.lot_id`. All other columns in the view (`a.state`, `aw.winning_amount`, etc.) were verified against their respective schemas.
- **Exact SQL diff**:
  ```diff
  --- backend/src/main/resources/db/migration/V14__admin_dashboard.sql
  +++ backend/src/main/resources/db/migration/V14__admin_dashboard.sql
  @@ -101,7 +101,7 @@
   LEFT JOIN auctions a ON a.seller_profile_id = sp.id
   LEFT JOIN auction_lots al ON al.auction_id = a.id
   LEFT JOIN auction_winners aw ON aw.auction_lot_id = al.id
  -LEFT JOIN bids b ON b.lot_id = al.id
  +LEFT JOIN bids b ON b.auction_lot_id = al.id
   GROUP BY u.id;
  ```
- **Files modified**: `backend/src/main/resources/db/migration/V14__admin_dashboard.sql`
- **Confidence**: High
