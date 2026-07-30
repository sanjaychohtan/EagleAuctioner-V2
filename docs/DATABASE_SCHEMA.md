# Database Schema Reference

## 1. Overview
The database schema is managed via Flyway incremental migrations (V1 through V8).

## 2. Migration History

| Version | File | Description |
| :--- | :--- | :--- |
| **V1** | `V1__initial_schema.sql` | Core domain entities (users, roles, permissions, auctions, lots, bids, wallets, payments, settlements, invoices) |
| **V2** | `V2__initial_seed_data.sql` | System roles, admin seeds, initial permission associations |
| **V3** | `V3__enterprise_authorization.sql` | Enterprise Authorization schema extension (departments, user_data_scopes, action_key permissions) |
| **V4** | `V4__enterprise_authorization_hardening.sql` | FK constraints, indices on `user_data_scopes`, enterprise audit tables |
| **V5** | `V5__batch1_permissions.sql` | Action permissions for Seller, Buyer, and KYC modules |
| **V6** | `V6__batch2_permissions.sql` | Action permissions for Wallet, Payment, Settlement, Refund, Reconciliation |
| **V7** | `V7__batch3_permissions.sql` | Action permissions for Support and Notification modules |
| **V8** | `V8__final_batch_permissions.sql` | Action permissions for Admin, Feature Flags, System Config, Audit, Dashboards |

## 3. Core Database Tables

* **`users`**: Base user entity with attributes (`id`, `email`, `password_hash`, `active`, `locked`, `deleted_at`).
* **`roles`**: System and custom roles (`id`, `name`, `description`).
* **`permissions`**: System permissions (`id`, `name`, `action_key`, `module`, `description`).
* **`user_data_scopes`**: User data scope bindings (`user_id`, `scope_type`, `scope_value_id`).
* **`auctions`**: Auction headers (`id`, `title`, `state`, `auction_type`, `start_time`, `end_time`).
* **`auction_lots`**: Individual lots (`id`, `auction_id`, `title`, `starting_price`, `reserve_price`, `lot_status`, `winner_bidder_id`).
* **`bids`**: Bid ledger (`id`, `lot_id`, `bidder_id`, `bid_amount`, `bid_time`, `sealed_bid_hash`).
* **`wallets`**: Financial ledger balances (`id`, `user_id`, `balance`, `held_amount`).
* **`payments` & `settlements`**: Financial transactions, invoices, and reconciliation records.
* **`support_tickets`**: Platform customer support tickets (`id`, `user_id`, `title`, `description`, `status`, `assigned_to`).
