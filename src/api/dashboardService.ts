import { apiClient } from "./client";
import { KPICardData, ActivityLog, CalendarEvent } from "../components/dashboard/DashboardTypes";

export interface DashboardKPIs {
  revenue: number;
  gmv: number;
  completedAuctions: number;
  activeAuctions: number;
  bidSuccessRate: number;
  averageBidCount: number;
  sellerGrowthPercentage: number;
  buyerGrowthPercentage: number;
  settlementStatusCounts: Record<string, number>;
  collectionStatusMetrics: Record<string, number>;
}

export interface RevenueTrend {
  name: string;
  Commission: number;
  PlatformFees: number;
  GST: number;
}

export interface AuctionTrend {
  name: string;
  Active: number;
  Upcoming: number;
  Closed: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
}

export interface BidActivity {
  hour: string;
  BidsPlaced: number;
  ActiveBidders: number;
}

export interface MonthlyGrowth {
  month: string;
  GMV: number;
  Revenue: number;
}

export interface AdminDashboardData {
  apiGatewayLatency: string;
  activeDbConnections: string;
  cpuLoad: string;
  kycBacklogCount: number;
}

export interface BuyerDashboardData {
  walletBalance: number;
  lockedEmd: number;
  activeHighestBids: number;
  winningBids: number;
  lots: any[];
}

export interface SellerDashboardData {
  totalLots: number;
  activeAuctions: number;
  totalRevenue: number;
  pendingApprovals: number;
  recentAuctions: any[];
}

export interface FinanceDashboardData {
  totalWalletPool: number;
  totalEmdLocked: number;
  pendingWithdrawals: number;
  completedSettlements: number;
  recentTransactions: any[];
}

export interface OperationsDashboardData {
  activeLots: number;
  supportTickets: number;
  systemAlerts: number;
  kycPending: number;
  recentAlerts: any[];
}

export interface NotificationData {
  id: string;
  category: "auction" | "outbid" | "settlement" | "finance" | "kyc" | "system";
  title: string;
  message: string;
  priority: "critical" | "high" | "medium" | "low";
  timestamp: string;
  isRead: boolean;
}

export interface ExecutiveDashboardData {
  kpiCards: KPICardData[];
  revenueTrend: RevenueTrend[];
  auctionTrend: AuctionTrend[];
  categoryDistribution: CategoryDistribution[];
  bidActivity: BidActivity[];
  monthlyGrowth: MonthlyGrowth[];
  activities: ActivityLog[];
  calendarEvents: CalendarEvent[];
}

export const dashboardService = {
  exportReport: async (payload: { format: string; scope: string; columns: any }): Promise<{ message: string }> => {
    const response = await apiClient.post("/v1/analytics/reports/export", payload);
    return response.data;
  },
  scheduleReport: async (payload: { scheduleCron: string; recipient: string; scope: string; format: string }): Promise<{ message: string }> => {
    const response = await apiClient.post("/v1/analytics/reports/schedule", payload);
    return response.data;
  },

  getExecutiveDashboard: async (): Promise<ExecutiveDashboardData> => {
    const response = await apiClient.get("/v1/analytics/dashboard/executive");
    return response.data;
  },
  
  getAdminDashboard: async (): Promise<AdminDashboardData> => {
    const response = await apiClient.get("/v1/analytics/dashboard/admin");
    return response.data;
  },

  getBuyerDashboard: async (): Promise<BuyerDashboardData> => {
    const response = await apiClient.get("/v1/analytics/dashboard/buyer");
    return response.data;
  },

  getSellerDashboard: async (): Promise<SellerDashboardData> => {
    const response = await apiClient.get("/v1/analytics/dashboard/seller");
    return response.data;
  },

  getOperationsDashboard: async (): Promise<OperationsDashboardData> => {
    const response = await apiClient.get("/v1/analytics/dashboard/operations");
    return response.data;
  },
  
  getNotifications: async (): Promise<NotificationData[]> => {
    // Just a mocked interceptor/endpoint fallback
    try {
      const response = await apiClient.get("/v1/notifications");
      return response.data;
    } catch {
      return [];
    }
  },
  
  getFinanceDashboard: async (): Promise<FinanceDashboardData> => {
    const response = await apiClient.get("/v1/analytics/dashboard/finance");
    return response.data;
  }
};
