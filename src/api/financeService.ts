import { apiClient } from "./client";
import { ApiResponse } from "../types/auction";
import { 
  Settlement, 
  Invoice, 
  Wallet, 
  Ledger, 
  Refund, 
  CreateRefundRequest, 
  LedgerAdjustmentRequest 
} from "../types/finance";
import { API_ENDPOINTS } from "../constants";

export const financeService = {
  getSettlements: async (): Promise<Settlement[]> => {
    const response = await apiClient.get<ApiResponse<Settlement[]>>(API_ENDPOINTS.FINANCE.SETTLEMENTS);
    return response.data.data;
  },

  getSettlementById: async (settlementId: string): Promise<Settlement> => {
    const response = await apiClient.get<ApiResponse<Settlement>>(`${API_ENDPOINTS.FINANCE.SETTLEMENTS}/${settlementId}`);
    return response.data.data;
  },

  releaseSettlement: async (settlementId: string): Promise<Settlement> => {
    const response = await apiClient.post<ApiResponse<Settlement>>(`${API_ENDPOINTS.FINANCE.SETTLEMENTS}/${settlementId}/release`);
    return response.data.data;
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const response = await apiClient.get<ApiResponse<Invoice[]>>(API_ENDPOINTS.FINANCE.INVOICES);
    return response.data.data;
  },

  getInvoiceById: async (invoiceId: string): Promise<Invoice> => {
    const response = await apiClient.get<ApiResponse<Invoice>>(`${API_ENDPOINTS.FINANCE.INVOICES}/${invoiceId}`);
    return response.data.data;
  },

  getWallet: async (): Promise<Wallet> => {
    const response = await apiClient.get<ApiResponse<Wallet>>(API_ENDPOINTS.FINANCE.WALLET);
    return response.data.data;
  },

  getLedger: async (): Promise<Ledger[]> => {
    const response = await apiClient.get<ApiResponse<Ledger[]>>(API_ENDPOINTS.FINANCE.LEDGER);
    return response.data.data;
  },

  addLedgerEntry: async (data: LedgerAdjustmentRequest): Promise<Ledger> => {
    const response = await apiClient.post<ApiResponse<Ledger>>(API_ENDPOINTS.FINANCE.LEDGER, data);
    return response.data.data;
  },

  getRefunds: async (): Promise<Refund[]> => {
    const response = await apiClient.get<ApiResponse<Refund[]>>(API_ENDPOINTS.FINANCE.REFUNDS);
    return response.data.data;
  },

  raiseRefund: async (data: CreateRefundRequest): Promise<Refund> => {
    const response = await apiClient.post<ApiResponse<Refund>>(API_ENDPOINTS.FINANCE.REFUNDS, data);
    return response.data.data;
  },

  approveRefund: async (refundId: string): Promise<Refund> => {
    const response = await apiClient.post<ApiResponse<Refund>>(`${API_ENDPOINTS.FINANCE.REFUNDS}/${refundId}/approve`);
    return response.data.data;
  },

  rejectRefund: async (refundId: string, reason: string): Promise<Refund> => {
    const response = await apiClient.post<ApiResponse<Refund>>(`${API_ENDPOINTS.FINANCE.REFUNDS}/${refundId}/reject`, { reason });
    return response.data.data;
  },

  getPayments: async (): Promise<any[]> => {
    const response = await apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.FINANCE.PAYMENTS);
    return response.data.data;
  },

  approvePayment: async (paymentId: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(`${API_ENDPOINTS.FINANCE.PAYMENTS}/${paymentId}/approve`);
  },

  rejectPayment: async (paymentId: string, reason: string): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(`${API_ENDPOINTS.FINANCE.PAYMENTS}/${paymentId}/reject`, { reason });
  },

  reconcilePayments: async (): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(API_ENDPOINTS.FINANCE.RECONCILIATION);
  }
};
