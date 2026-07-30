# Enterprise Permission Matrix

## Action Permission Mapping

| Action Permission Key | Module | Description | Enforced Endpoints / Actions |
| :--- | :--- | :--- | :--- |
| `auction.view` | AUCTION | View auction listings & details | `GET /api/v1/auctions`, `GET /api/v1/auctions/{id}` |
| `auction.create` | AUCTION | Create new auctions | `POST /api/v1/auctions` |
| `auction.edit` | AUCTION | Edit auction settings | `PUT /api/v1/auctions/{id}` |
| `bid.create` | BID | Place live or proxy bid | `POST /api/v1/bids/place` |
| `bid.sealed.create` | BID | Submit sealed bid | `POST /api/v1/bids/sealed` |
| `winner.override` | AUCTION | Admin winner override | `POST /api/v1/admin/auction-lots/{lotId}/override` |
| `seller.create` | SELLER | Register seller account | `POST /api/v1/seller/register` |
| `seller.review` | SELLER | Review seller onboarding | `POST /api/v1/admin/seller/{profileId}/review` |
| `bidder.create` | BIDDER | Register bidder profile | `POST /api/v1/bidder/register` |
| `kyc.submit` | KYC | Upload KYC documents | `POST /api/v1/kyc/documents` |
| `kyc.review` | KYC | Approve/reject KYC | `POST /api/v1/admin/kyc/{profileId}/review` |
| `finance.ledger.view` | FINANCE | View wallet & ledger balances | `GET /api/v1/finance/wallet`, `GET /api/v1/finance/ledger` |
| `payment.create` | FINANCE | Initiate payments | `POST /api/v1/finance/payments` |
| `settlement.create` | FINANCE | Create settlement batch | `POST /api/v1/finance/settlements` |
| `settlement.approve` | FINANCE | Approve settlement | `POST /api/v1/finance/settlements/{id}/approve` |
| `refund.create` | FINANCE | Create refund request | `POST /api/v1/finance/refunds` |
| `refund.approve` | FINANCE | Approve refund request | `POST /api/v1/finance/refunds/{id}/approve` |
| `support.ticket.create`| SUPPORT | Create support tickets | `POST /api/v1/support/tickets` |
| `support.ticket.view` | SUPPORT | View support tickets | `GET /api/v1/support/tickets` |
| `support.ticket.update`| SUPPORT | Update support ticket status | `POST /api/v1/support/tickets/{id}/status` |
| `support.dispute.resolve`| SUPPORT | Resolve customer disputes | `POST /api/v1/admin/disputes/{disputeId}/resolve` |
| `notification.view` | NOTIFICATION | View notifications | `GET /api/v1/notifications` |
| `notification.manage` | NOTIFICATION | Update preferences & templates| `PUT /api/v1/notifications/preferences` |
| `dashboard.view` | REPORTING | View dashboards | `GET /api/v1/analytics/dashboard/*` |
| `dashboard.admin` | REPORTING | Admin dashboard analytics | `GET /api/v1/analytics/dashboard/admin` |
| `system.feature_flags.manage` | SYSTEM | Feature flag toggles | `POST /api/v1/admin/features` |
| `system.config.manage` | SYSTEM | System config updates | `POST /api/v1/admin/config` |
| `audit.view` | SYSTEM | View audit trails | `GET /api/v1/admin/audit/*` |
| `admin.access` | SYSTEM | Access admin console | `GET /api/v1/admin/*` |
| `role.manage` | SYSTEM | Manage roles & scopes | `/api/v1/admin/authorization/*` |
