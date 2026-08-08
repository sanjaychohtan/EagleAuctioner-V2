/**
 * AUCTBIZ - Global Constants
 * Standard enterprise constants aligning perfectly with the Spring Boot RC2 backend specifications.
 */

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "ea_access_token",
  REFRESH_TOKEN: "ea_refresh_token",
  USER_PROFILE: "ea_user_profile",
  TENANT_ID: "ea_tenant_id",
  THEME_MODE: "ea_theme_mode",
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/v1/auth/login",
    REGISTER: "/v1/auth/register",
    LOGOUT: "/v1/auth/logout",
    REFRESH: "/v1/auth/refresh",
    RESET_PASSWORD: "/v1/auth/reset-password",
    FORGOT_PASSWORD: "/v1/auth/forgot-password",
    ME: "/v1/auth/me",
  },
  KYC: {
    REVIEW_BIDDER: (profileId: string) => `/kyc/bidder/${profileId}/review`,
    REVIEW_SELLER: (profileId: string) => `/kyc/seller/${profileId}/review`,
  },
  AUCTION: {
    CREATE: "/v1/auctions",
    UPDATE: (id: string) => `/v1/auctions/${id}`,
    UPDATE_SETTINGS: (id: string) => `/v1/auctions/${id}/settings`,
    SUBMIT_REVIEW: (id: string) => `/v1/auctions/${id}/submit`,
    APPROVE: (id: string) => `/v1/auctions/${id}/approve`,
    REJECT: (id: string) => `/v1/auctions/${id}/reject`,
    PUBLISH: (id: string) => `/v1/auctions/${id}/publish`,
    CANCEL: (id: string) => `/v1/auctions/${id}/cancel`,
    ARCHIVE: (id: string) => `/v1/auctions/${id}/archive`,
    DETAIL: (id: string) => `/v1/auctions/${id}`,
    LIST: "/v1/auctions",
  },
  LOT: {
    CREATE: (auctionId: string, sellerProfileId?: string) => `/v1/auctions/${auctionId}/lots${sellerProfileId ? `?sellerProfileId=${sellerProfileId}` : ""}`,
    UPDATE: (auctionId: string, lotId: string, sellerProfileId?: string) => `/v1/auctions/${auctionId}/lots/${lotId}${sellerProfileId ? `?sellerProfileId=${sellerProfileId}` : ""}`,
    DELETE: (auctionId: string, lotId: string, sellerProfileId?: string) => `/v1/auctions/${auctionId}/lots/${lotId}${sellerProfileId ? `?sellerProfileId=${sellerProfileId}` : ""}`,
    PUBLISH: (auctionId: string, lotId: string, sellerProfileId?: string) => `/v1/auctions/${auctionId}/lots/${lotId}/publish${sellerProfileId ? `?sellerProfileId=${sellerProfileId}` : ""}`,
    SORT: (auctionId: string, sellerProfileId?: string) => `/v1/auctions/${auctionId}/lots/sort${sellerProfileId ? `?sellerProfileId=${sellerProfileId}` : ""}`,
  },
  BID: {
    PLACE: (lotId: string) => `/v1/lots/${lotId}/bid`,
    PLACE_SEALED: (lotId: string) => `/v1/lots/${lotId}/bid/sealed`,
    HISTORY: (lotId: string) => `/v1/lots/${lotId}/history`,
    HIGHEST: (lotId: string) => `/v1/lots/${lotId}/highest`,
    ACTIVE_AUTO: "/bids/auto-bid",
    MY_RANK: (lotId: string) => `/v1/lots/${lotId}/rank`,
    OPEN_SEALED: (lotId: string) => `/v1/lots/${lotId}/sealed/open`,
  },
  REALTIME: {
    STATUS: (auctionId: string) => `/v1/realtime/auction/${auctionId}/status`,
    HIGHEST_BID: (lotId: string) => `/v1/realtime/lot/${lotId}/highest-bid`,
    EVENTS: (auctionId: string) => `/v1/realtime/auction/${auctionId}/events`,
  },
  DASHBOARD: {
    EXECUTIVE: "/v1/analytics/dashboard/executive",
    ADMIN: "/v1/analytics/dashboard/admin",
    BUYER: "/v1/analytics/dashboard/buyer",
    SELLER: "/v1/analytics/dashboard/seller",
    FINANCE: "/v1/analytics/dashboard/finance",
    OPERATIONS: "/v1/analytics/dashboard/operations",
    EXPORT: "/v1/analytics/dashboard/export",
    SCHEDULE: "/v1/analytics/dashboard/schedule",
  },
  NOTIFICATIONS: {
    LIST: "/v1/notifications",
    UNREAD_COUNT: "/v1/notifications/unread-count",
    MARK_READ: (id: string) => `/v1/notifications/${id}/read`,
    ARCHIVE: (id: string) => `/v1/notifications/${id}/archive`,
    DELETE: (id: string) => `/v1/notifications/${id}`,
    PREFERENCES: "/v1/notifications/preferences",
  },
  FINANCE: {
    SETTLEMENTS: "/v1/settlements",
    PAYMENTS: "/v1/finance/payments",
    LEDGER: "/v1/finance/ledger",
    RECONCILIATION: "/v1/finance/reconciliation",
    GST_REPORT: "/v1/finance/gst-report",
    INVOICES: "/v1/finance/invoices",
    WALLET: "/v1/finance/wallet",
    REFUNDS: "/v1/finance/refunds",
  },
  ONBOARDING: {
    BIDDER_REGISTER: "/onboarding/register",
    BIDDER_DOCUMENTS: (profileId: string) => `/onboarding/${profileId}/documents`,
    BIDDER_BANK_VERIFY: (profileId: string) => `/onboarding/${profileId}/bank/verify`,
    BIDDER_ADMIN_REVIEW: (profileId: string) => `/onboarding/admin/review/${profileId}`,
    SELLER_REGISTER: "/seller/register",
    SELLER_DOCUMENTS: (profileId: string) => `/seller/${profileId}/documents`,
    SELLER_ADMIN_REVIEW: (profileId: string) => `/seller/admin/review/${profileId}`,
    SELLER_SEARCH: "/seller/admin/search",
  },
  AUTHORIZATION: {
    ROLES: "/v1/admin/authorization/roles",
    ROLE_BY_ID: (id: string) => `/v1/admin/authorization/roles/${id}`,
    PERMISSIONS: "/v1/admin/authorization/permissions",
    PERMISSIONS_BY_MODULE: (module: string) => `/v1/admin/authorization/permissions/module/${module}`,
    DEPARTMENTS: "/v1/admin/authorization/departments",
    USER_SCOPES: (userId: string) => `/v1/admin/authorization/users/${userId}/scopes`,
    SCOPES: "/v1/admin/authorization/scopes",
    SCOPE_BY_ID: (id: string) => `/v1/admin/authorization/scopes/${id}`,
  },
};

export enum USER_ROLE {
  SUPER_ADMIN = "ROLE_SUPER_ADMIN",
  ADMIN = "ROLE_ADMIN",
  OPS_HEAD = "ROLE_OPS_HEAD",
  OPERATIONS = "ROLE_OPERATIONS",
  SELLER = "ROLE_SELLER",
  BUYER = "ROLE_BUYER",
  COMPLIANCE = "ROLE_COMPLIANCE",
  FINANCE = "ROLE_FINANCE",
  ACCOUNTANT = "ROLE_ACCOUNTANT",
  KYC = "ROLE_KYC",
  MARKETING = "ROLE_MARKETING",
  SUPPORT = "ROLE_SUPPORT",
  AUCTION = "ROLE_AUCTION",
  REPORTS = "ROLE_REPORTS",
  LEGAL = "ROLE_LEGAL",
  IT = "ROLE_IT",
}

export enum KYC_STATUS {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  NOT_SUBMITTED = "NOT_SUBMITTED",
}

export enum AUCTION_STATUS {
  DRAFT = "DRAFT",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PUBLISHED = "PUBLISHED",
  LIVE = "LIVE",
  ENDED = "ENDED",
  SETTLED = "SETTLED",
  CANCELLED = "CANCELLED",
  SUSPENDED = "SUSPENDED",
  ARCHIVED = "ARCHIVED",
}

export const AUCTION_PERMISSIONS = {
  CREATE: [USER_ROLE.SELLER],
  UPDATE: [USER_ROLE.SELLER],
  UPDATE_SETTINGS: [USER_ROLE.SELLER],
  SUBMIT_REVIEW: [USER_ROLE.SELLER],
  APPROVE: [USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATIONS],
  REJECT: [USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATIONS],
  PUBLISH: [USER_ROLE.SELLER],
  CANCEL: [USER_ROLE.SELLER],
  ARCHIVE: [USER_ROLE.SELLER],
  VIEW_DETAILS: [USER_ROLE.SUPER_ADMIN, USER_ROLE.OPERATIONS, USER_ROLE.SELLER, USER_ROLE.BUYER, USER_ROLE.COMPLIANCE],
  MANAGE_LOTS: [USER_ROLE.SELLER],
};

export const FINANCE_PERMISSIONS = {
  SETTLEMENT_RELEASE: [USER_ROLE.FINANCE, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN],
  REFUND_APPROVAL: [USER_ROLE.FINANCE, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN],
  LEDGER_ADJUSTMENT: [USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN],
  PAYMENT_APPROVAL: [USER_ROLE.FINANCE, USER_ROLE.ACCOUNTANT, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN],
};
