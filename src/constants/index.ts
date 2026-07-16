/**
 * Eagle Auctioner - RC4 Global Constants
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
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    RESET_PASSWORD: "/auth/reset-password",
    FORGOT_PASSWORD: "/auth/forgot-password",
    ME: "/auth/me",
  },
  KYC: {
    SUBMIT: "/kyc/submit",
    STATUS: "/kyc/status",
    APPROVE: "/kyc/approve",
    REJECT: "/kyc/reject",
  },
  AUCTION: {
    CREATE: "/v1/auctions",
    UPDATE: (id: string) => `/v1/auctions/${id}`,
    UPDATE_SETTINGS: (id: string) => `/v1/auctions/${id}/settings`,
    SUBMIT_REVIEW: (id: string) => `/v1/auctions/${id}/submit-review`,
    APPROVE: (id: string) => `/v1/auctions/${id}/approve`,
    REJECT: (id: string) => `/v1/auctions/${id}/reject`,
    PUBLISH: (id: string) => `/v1/auctions/${id}/publish`,
    CANCEL: (id: string) => `/v1/auctions/${id}/cancel`,
    ARCHIVE: (id: string) => `/v1/auctions/${id}/archive`,
    DETAIL: (id: string) => `/v1/auctions/${id}`,
    LIST: "/v1/auctions",
  },
  LOT: {
    CREATE: (auctionId: string) => `/v1/lots/auctions/${auctionId}`,
    UPDATE: (lotId: string) => `/v1/lots/${lotId}`,
    DELETE: (lotId: string) => `/v1/lots/${lotId}`,
    PUBLISH: (lotId: string) => `/v1/lots/${lotId}/publish`,
    SORT: (auctionId: string) => `/v1/lots/auctions/${auctionId}/sort`,
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
  FINANCE: {
    SETTLEMENTS: "/finance/settlements",
    PAYMENTS: "/finance/payments",
    LEDGER: "/finance/ledger",
    RECONCILIATION: "/finance/reconciliation",
    GST_REPORT: "/finance/gst-report",
    INVOICES: "/finance/invoices",
    WALLET: "/finance/wallet",
    REFUNDS: "/finance/refunds",
  },
};

export enum USER_ROLE {
  SUPER_ADMIN = "ROLE_SUPER_ADMIN",
  OPERATIONS = "ROLE_OPERATIONS",
  SELLER = "ROLE_SELLER",
  BUYER = "ROLE_BUYER",
  COMPLIANCE = "ROLE_COMPLIANCE",
  FINANCE = "ROLE_FINANCE",
  ACCOUNTANT = "ROLE_ACCOUNTANT",
  ADMIN = "ROLE_ADMIN",
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
