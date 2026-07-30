# Platform Changelog

## [1.0.0-ENTERPRISE] - 2026-07-28

### Added
* **Enterprise Authorization Framework**: Fine-grained Action Permissions (`hasAuthority('action.key')`), ABAC Policy Engine, and `@EnforceDataScope` tenant boundaries.
* **Module 2 Audit & Verification**: Multi-unit proxy bidding, cryptographic sealed bidding, winner approval matrix, and Redisson concurrency locking.
* **Batch 1 Integration**: Seller, Buyer, and KYC onboarding APIs governed by Enterprise Action Permissions (`seller.create`, `bidder.create`, `kyc.submit`, `kyc.review`).
* **Batch 2 Integration**: Financial operations (Wallet, Payment, Settlement, Refund, Reconciliation) guarded by Action Permissions and Maker-Checker Segregation of Duties.
* **Batch 3 Integration**: Support ticket lifecycle, dispute resolution, and multi-channel notification preferences guarded by `support.*` and `notification.*` action keys.
* **Final Batch Integration**: Executive & Admin dashboards, feature flag toggles, financial configurations, role studio, and audit log lookups guarded by `dashboard.*`, `system.*`, and `audit.*` action keys.
