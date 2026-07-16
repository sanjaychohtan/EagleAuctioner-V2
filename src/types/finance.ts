export enum SettlementStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  COMPLETED = "COMPLETED",
  CLOSED = "CLOSED",
  VOID = "VOID",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  PARTIALLY_ALLOCATED = "PARTIALLY_ALLOCATED",
  FULLY_ALLOCATED = "FULLY_ALLOCATED",
}

export enum InvoiceStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  VOID = "VOID",
}

export enum LedgerEntryType {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

export enum LedgerAccountType {
  SELLER_PAYOUT = "SELLER_PAYOUT",
  PLATFORM_REVENUE = "PLATFORM_REVENUE",
  TAX_LIABILITY = "TAX_LIABILITY",
  BUYER_RECEIVABLE = "BUYER_RECEIVABLE",
}

export interface Payment {
  paymentId: string;
  referenceNo: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: PaymentStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  type: "FEE_INVOICE" | "GST_INVOICE";
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  issuedTo: string;
  issuedDate: string;
  dueDate: string;
}

export interface Settlement {
  settlementId: string;
  referenceNo: string;
  auctionId: string;
  lotId: string;
  sellerId: string;
  buyerId: string;
  grossAmount: number;
  platformFee: number;
  taxAmount: number;
  netAmount: number;
  currency: string;
  status: SettlementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Ledger {
  ledgerId: string;
  transactionId: string;
  accountId: string;
  accountType: LedgerAccountType;
  entryType: LedgerEntryType;
  amount: number;
  currency: string;
  description: string;
  timestamp: string;
}

export interface Wallet {
  walletId: string;
  userId: string;
  availableBalance: number;
  lockedBalance: number;
  currency: string;
  lastUpdated: string;
  permanentEmd?: number;
  refundPending?: number;
  settlementPending?: number;
}

export interface Transaction {
  transactionId: string;
  walletId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  status: "SUCCESS" | "PENDING" | "FAILED";
  referenceType: "SETTLEMENT" | "REFUND" | "DEPOSIT" | "WITHDRAWAL" | "FEE";
  referenceId: string;
  timestamp: string;
}

export interface Refund {
  refundId: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  requestedBy: string;
  requestedAt: string;
  processedAt?: string;
}

export interface CreateRefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
}

export interface LedgerAdjustmentRequest {
  accountId: string;
  accountType: LedgerAccountType;
  entryType: LedgerEntryType;
  amount: number;
  currency: string;
  description: string;
}
