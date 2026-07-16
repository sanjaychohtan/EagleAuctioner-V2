import { useQuery, useMutation } from "@tanstack/react-query";
import { dashboardService } from "../api/dashboardService";

export const useExecutiveDashboard = () => {
  return useQuery({
    queryKey: ["dashboard", "executive"],
    queryFn: () => dashboardService.getExecutiveDashboard(),
    refetchInterval: 30000, // auto-refresh every 30s
  });
};

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => dashboardService.getAdminDashboard(),
    refetchInterval: 30000,
  });
};

export const useBuyerDashboard = () => {
  return useQuery({
    queryKey: ["dashboard", "buyer"],
    queryFn: () => dashboardService.getBuyerDashboard(),
    refetchInterval: 30000,
  });
};

export const useSellerDashboard = () => {
  return useQuery({
    queryKey: ["dashboard", "seller"],
    queryFn: () => dashboardService.getSellerDashboard(),
    refetchInterval: 30000,
  });
};

export const useOperationsDashboard = () => {
  return useQuery({
    queryKey: ["dashboard", "operations"],
    queryFn: () => dashboardService.getOperationsDashboard(),
    refetchInterval: 30000,
  });
};

export const useFinanceDashboard = () => {
  return useQuery({
    queryKey: ["dashboard", "finance"],
    queryFn: () => dashboardService.getFinanceDashboard(),
    refetchInterval: 30000,
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => dashboardService.getNotifications(),
    refetchInterval: 15000,
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
