# Enterprise Data Scope Matrix

## 1. Data Scope Hierarchy
Data Scopes govern row-level data access boundaries based on organization hierarchy and entity relationships:

```text
GLOBAL (SUPER_ADMIN)
 └── COMPANY (ADMIN, EXECUTIVE)
      ├── REGION
      │    └── STATE
      │         └── DISTRICT
      │              └── CITY
      │                   └── BRANCH / WAREHOUSE
      ├── SELLER (Seller account isolation)
      └── BUYER (Bidder / User isolation)
```

## 2. Data Scope Enumeration

| Scope Enum | Target Scope Boundary | Typical Resource Access |
| :--- | :--- | :--- |
| `COMPANY` | Entire enterprise tenant | Executive dashboards, system config, roles, user administration |
| `REGION` | Geographic region | Regional auction listings & seller management |
| `STATE` | State jurisdiction | State-level compliance & tax reporting |
| `DISTRICT` | District territory | Local operations & logistcs |
| `CITY` | City location | Local warehouse management |
| `BRANCH` | Corporate branch | Branch-specific financial closing & ledger |
| `WAREHOUSE` | Specific warehouse | Physical lot storage & inspections |
| `SELLER` | Seller profile | Seller lot listings, sale confirmations, wallet balances |
| `BUYER` | Buyer / Bidder profile | Personal bidding history, wallet balance, support tickets, notifications |
| `AUCTION` | Specific auction event | Auction room participation & live bid console |

## 3. ABAC Policy Rules
Attribute-Based Access Control (`AbacPolicyEngine`) dynamically evaluates:
1. **Time Window**: Bids are accepted only during `start_time <= now <= end_time`.
2. **KYC Status**: High-value bids and wallet withdrawals require `KYC_STATUS == APPROVED`.
3. **Credit Balance**: Available wallet balance must cover minimum deposit / EMD requirements before bid placement.
4. **Maker-Checker Boundary**: Initiator ID must not match Approver ID on financial operations (`refund.getInitiatorId() != approverId`).
