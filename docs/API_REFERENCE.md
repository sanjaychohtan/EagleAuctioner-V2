# API Reference Guide

## 1. Authentication Endpoints

* `POST /api/v1/auth/login`: Authenticate user and issue JWT bearer token.
* `POST /api/v1/auth/refresh`: Refresh expired JWT access token.

## 2. Auction & Bidding Endpoints

* `GET /api/v1/auctions`: List auctions with data scope filtering. (`PreAuthorize: hasAuthority('auction.view')`)
* `POST /api/v1/auctions`: Create new auction. (`PreAuthorize: hasAuthority('auction.create')`)
* `GET /api/v1/auctions/{id}`: Fetch auction details. (`PreAuthorize: hasAuthority('auction.view')`)
* `POST /api/v1/bids/place`: Submit live or proxy bid. (`PreAuthorize: hasAuthority('bid.create')`)
* `POST /api/v1/bids/sealed`: Submit sealed bid. (`PreAuthorize: hasAuthority('bid.sealed.create')`)

## 3. Onboarding & KYC Endpoints

* `POST /api/v1/seller/register`: Register seller account. (`PreAuthorize: hasAuthority('seller.create')`)
* `POST /api/v1/bidder/register`: Register bidder profile. (`PreAuthorize: hasAuthority('bidder.create')`)
* `POST /api/v1/kyc/documents`: Upload KYC document. (`PreAuthorize: hasAuthority('kyc.submit')`)
* `POST /api/v1/admin/kyc/{profileId}/review`: Review KYC submission. (`PreAuthorize: hasAuthority('kyc.review')`)

## 4. Finance & Settlement Endpoints

* `GET /api/v1/finance/wallet`: Get wallet balance and transactions. (`PreAuthorize: hasAuthority('finance.ledger.view')`)
* `POST /api/v1/finance/payments`: Initiate payment transaction. (`PreAuthorize: hasAuthority('payment.create')`)
* `POST /api/v1/finance/settlements`: Create settlement. (`PreAuthorize: hasAuthority('settlement.create')`)
* `POST /api/v1/finance/refunds`: Initiate refund request. (`PreAuthorize: hasAuthority('refund.create')`)
* `POST /api/v1/finance/refunds/{id}/approve`: Approve refund request (SoD enforced). (`PreAuthorize: hasAuthority('refund.approve')`)

## 5. Support & Notification Endpoints

* `POST /api/v1/support/tickets`: Raise support ticket. (`PreAuthorize: hasAuthority('support.ticket.create')`)
* `GET /api/v1/support/tickets`: List support tickets. (`PreAuthorize: hasAuthority('support.ticket.view')`)
* `POST /api/v1/support/tickets/{id}/status`: Update ticket status. (`PreAuthorize: hasAuthority('support.ticket.update')`)
* `GET /api/v1/notifications`: Get notification history. (`PreAuthorize: hasAuthority('notification.view')`)

## 6. Admin & Dashboard Endpoints

* `GET /api/v1/analytics/dashboard/executive`: Executive analytics dashboard. (`PreAuthorize: hasAuthority('dashboard.view')`)
* `GET /api/v1/analytics/dashboard/admin`: Admin operations dashboard. (`PreAuthorize: hasAuthority('dashboard.admin')`)
* `POST /api/v1/admin/features`: Update feature flag toggle. (`PreAuthorize: hasAuthority('system.feature_flags.manage')`)
* `POST /api/v1/admin/config`: Update financial config key. (`PreAuthorize: hasAuthority('system.config.manage')`)
* `GET /api/v1/admin/audit/user/{userId}`: Fetch user audit log history. (`PreAuthorize: hasAuthority('audit.view')`)
