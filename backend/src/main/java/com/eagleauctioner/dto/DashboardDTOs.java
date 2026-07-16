package com.eagleauctioner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;


import java.util.List;
import java.util.Map;

@Data
public class DashboardDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecutiveDashboardData {
        private DashboardKPIs kpis;
        private List<RevenueTrend> revenueTrend;
        private List<AuctionTrend> auctionTrend;
        private List<CategoryDistribution> categoryDistribution;
        private List<BidActivity> bidActivity;
        private List<MonthlyGrowth> monthlyGrowth;
        private List<ActivityLog> activities;
        private List<CalendarEvent> calendarEvents;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminDashboardData {
        private String apiGatewayLatency;
        private String activeDbConnections;
        private String cpuLoad;
        private int kycBacklogCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BuyerDashboardData {
        private Long walletBalance;
        private Long lockedEmd;
        private int activeHighestBids;
        private int winningBids;
        private List<Object> lots;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerDashboardData {
        private int totalLots;
        private int activeAuctions;
        private Long totalRevenue;
        private int pendingApprovals;
        private List<Object> recentAuctions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinanceDashboardData {
        private Long totalWalletPool;
        private Long totalEmdLocked;
        private int pendingWithdrawals;
        private int completedSettlements;
        private List<Object> recentTransactions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperationsDashboardData {
        private int activeLots;
        private int supportTickets;
        private int systemAlerts;
        private int kycPending;
        private List<Object> recentAlerts;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardKPIs {
        private Long revenue;
        private Long gmv;
        private long completedAuctions;
        private long activeAuctions;
        private double bidSuccessRate;
        private double averageBidCount;
        private double sellerGrowthPercentage;
        private double buyerGrowthPercentage;
        private Map<String, Long> settlementStatusCounts;
        private Map<String, Long> collectionStatusMetrics;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueTrend {
        private String name;
        private Long Commission;
        private Long PlatformFees;
        private Long GST;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuctionTrend {
        private String name;
        private int Active;
        private int Upcoming;
        private int Closed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryDistribution {
        private String name;
        private Long value;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BidActivity {
        private String hour;
        private int BidsPlaced;
        private int ActiveBidders;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyGrowth {
        private String month;
        private Long GMV;
        private Long Revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityLog {
        private String id;
        private String timestamp;
        private String user;
        private String action;
        private String details;
        private String status;
        private String slaTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CalendarEvent {
        private String id;
        private String title;
        private String date;
        private String time;
        private String type;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExportRequest {
        @NotBlank(message = "Format is required")
        private String format;
        @NotBlank(message = "Scope is required")
        private String scope;
        private Object columns;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExportResponse {
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScheduleRequest {
        @NotBlank(message = "Schedule cron is required")
        private String scheduleCron;
        @NotBlank(message = "Recipient email is required")
        @Email(message = "Invalid email format")
        private String recipient;
        @NotBlank(message = "Scope is required")
        private String scope;
        @NotBlank(message = "Format is required")
        private String format;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScheduleResponse {
        private String message;
    }
}
