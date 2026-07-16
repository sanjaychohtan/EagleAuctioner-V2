export type DashboardRole = "executive" | "admin" | "buyer" | "seller" | "finance" | "operations" | "personalized";

export interface DashboardState {
  role: DashboardRole;
  simulationMode: "normal" | "loading" | "empty" | "error";
  isAutoRefreshing: boolean;
  refreshIntervalSeconds: number;
}

export interface KPICardData {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  description: string;
  iconName: string;
  colorClass: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  status: "success" | "pending" | "failed" | "info";
  slaTime?: string;
}

export interface AuctionMonitorItem {
  id: string;
  title: string;
  currentBid: number;
  increment: number;
  bidsCount: number;
  endTime: string;
  status: "live" | "upcoming" | "closed" | "suspended";
  category: string;
  slaIndicator?: "normal" | "warning" | "breach";
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "auction_start" | "auction_end" | "payout" | "compliance";
}
