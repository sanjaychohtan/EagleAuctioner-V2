import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeService } from "../api/financeService";
import { CreateRefundRequest, LedgerAdjustmentRequest } from "../types/finance";

export const useSettlements = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["settlements"],
    queryFn: financeService.getSettlements,
    enabled: options?.enabled ?? true,
  });
};

export const useSettlement = (settlementId: string) => {
  return useQuery({
    queryKey: ["settlement", settlementId],
    queryFn: () => financeService.getSettlementById(settlementId),
    enabled: !!settlementId,
  });
};

export const useInvoices = () => {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: financeService.getInvoices,
  });
};

export const useInvoice = (invoiceId: string) => {
  return useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => financeService.getInvoiceById(invoiceId),
    enabled: !!invoiceId,
  });
};

export const useWallet = () => {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: financeService.getWallet,
  });
};

export const useLedger = () => {
  return useQuery({
    queryKey: ["ledger"],
    queryFn: financeService.getLedger,
  });
};

export const useRefunds = () => {
  return useQuery({
    queryKey: ["refunds"],
    queryFn: financeService.getRefunds,
  });
};

export const usePayments = () => {
  return useQuery({
    queryKey: ["payments"],
    queryFn: financeService.getPayments,
  });
};

// Mutations
export const useApprovePaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) => financeService.approvePayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
};

export const useRejectPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) => 
      financeService.rejectPayment(paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
};

export const useReleaseSettlementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settlementId: string) => financeService.releaseSettlement(settlementId),
    onSuccess: (_, settlementId) => {
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
      queryClient.invalidateQueries({ queryKey: ["settlement", settlementId] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    },
  });
};

export const useRaiseRefundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRefundRequest) => financeService.raiseRefund(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
};

export const useApproveRefundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (refundId: string) => financeService.approveRefund(refundId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
};

export const useRejectRefundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ refundId, reason }: { refundId: string; reason: string }) => 
      financeService.rejectRefund(refundId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
    },
  });
};

export const useAddLedgerEntryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LedgerAdjustmentRequest) => financeService.addLedgerEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
};
