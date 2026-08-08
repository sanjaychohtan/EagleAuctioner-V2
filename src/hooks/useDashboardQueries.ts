import { useQuery, useMutation } from "@tanstack/react-query";
import { dashboardService } from "../api/dashboardService";

export const useExecutiveDashboard = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["dashboard", "executive"],
    queryFn: () => dashboardService.getExecutiveDashboard(),
    refetchInterval: 30000, // auto-refresh every 30s
    refetchIntervalInBackground: false,
    enabled: options?.enabled ?? true,
  });
};

export const useAdminDashboard = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => dashboardService.getAdminDashboard(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    enabled: options?.enabled ?? true,
  });
};

export const useBuyerDashboard = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["dashboard", "buyer"],
    queryFn: () => dashboardService.getBuyerDashboard(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    enabled: options?.enabled ?? true,
  });
};

export const useSellerDashboard = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["dashboard", "seller"],
    queryFn: () => dashboardService.getSellerDashboard(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    enabled: options?.enabled ?? true,
  });
};

export const useOperationsDashboard = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["dashboard", "operations"],
    queryFn: () => dashboardService.getOperationsDashboard(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    enabled: options?.enabled ?? true,
  });
};

export const useFinanceDashboard = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["dashboard", "finance"],
    queryFn: () => dashboardService.getFinanceDashboard(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    enabled: options?.enabled ?? true,
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => dashboardService.getNotifications(),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
};

export const useExportReportMutation = () => {
  return useMutation({
    mutationFn: (payload: { format: string; scope: string; columns: any }) => dashboardService.exportReport(payload),
  });
};

export const useScheduleReportMutation = () => {
  return useMutation({
    mutationFn: (payload: { scheduleCron: string; recipient: string; scope: string; format: string }) => dashboardService.scheduleReport(payload),
  });
};
