import React, { useState } from "react";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertOctagon, 
  TrendingUp, 
  FileCheck, 
  ShieldAlert, 
  Clock,
  Filter,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNotifications } from "../../hooks/useDashboardQueries";

interface NotificationItem {
  id: string;
  category: "auction" | "outbid" | "settlement" | "finance" | "kyc" | "system";
  title: string;
  message: string;
  priority: "critical" | "high" | "medium" | "low";
  timestamp: string;
  isRead: boolean;
}

interface NotificationsWidgetProps {
  themeMode: "light" | "dark";
  showToast: (msg: string, type: "success" | "info" | "warning") => void;
}

export function NotificationsWidget({ themeMode, showToast }: NotificationsWidgetProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const { data: serverNotifs } = useNotifications();

  // For simulation interactiveness, we still use local state, but initialize from server
  const [localNotifs, setLocalNotifs] = useState<NotificationItem[]>([]);
  
  React.useEffect(() => {
    if (serverNotifs && serverNotifs.length > 0) {
      setLocalNotifs(serverNotifs as any);
    } else if (localNotifs.length === 0) {
      // Fallback dummy data if server gives nothing
      setLocalNotifs([
        { id: "NT-1", category: "outbid", title: "Outbid Alert: Lot #402 (Steel Billets)", message: "Mumbai Steel Corp exceeded your bid threshold of ₹1,45,00,000. Next minimum bid required is ₹1,47,00,000.", priority: "critical", timestamp: "3m ago", isRead: false },
        { id: "NT-2", category: "kyc", title: "KYC Approved: GMR Coal Trade", message: "Operator approved regulatory documentation. Corporate credentials registered under SEC validation.", priority: "high", timestamp: "12m ago", isRead: false },
        { id: "NT-3", category: "finance", title: "Settlement Settled: Lot #391 Payout", message: "₹1,24,00,000 disbursed via dual-signature check. Reconciled in SBI core clearing database.", priority: "medium", timestamp: "45m ago", isRead: false },
        { id: "NT-4", category: "system", title: "System Broadcast: SBI Server Sync", message: "SBI portal will undergo standard backup maintenance from 12:00 AM - 12:30 AM. Expect occasional API lags.", priority: "low", timestamp: "2h ago", isRead: true },
        { id: "NT-5", category: "auction", title: "Auction Published: Coal Grade G6", message: "State minerals board successfully published Coal lot listing for live bidding tomorrow.", priority: "medium", timestamp: "4h ago", isRead: true }
      ] as any[]);
    }
  }, [serverNotifs]);

  const notifs = localNotifs;
  const unreadCount = notifs.filter(n => !n.isRead).length;

  const handleToggleRead = (id: string) => {
    setLocalNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
    const isNowRead = !notifs.find(n => n.id === id)?.isRead;
    showToast(isNowRead ? "Marked notification as read" : "Marked notification as unread", "info");
  };

  const handleMarkAllRead = () => {
    setLocalNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    showToast("All enterprise notifications marked as read", "success");
  };

  const handleDelete = (id: string) => {
    setLocalNotifs(prev => prev.filter(n => n.id !== id));
    showToast("Notification dismissed from ledger", "warning");
  };

  const getPriorityBadgeStyle = (priority: "critical" | "high" | "medium" | "low") => {
    switch (priority) {
      case "critical": return "bg-red-500/15 text-red-500 border-red-500/25";
      case "high": return "bg-orange-500/15 text-orange-500 border-orange-500/25";
      case "medium": return "bg-blue-500/15 text-blue-500 border-blue-500/25";
      case "low": return "bg-slate-500/15 text-slate-500 border-slate-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "outbid": return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case "kyc": return <FileCheck className="h-4 w-4 text-orange-500" />;
      case "finance": return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "system": return <AlertOctagon className="h-4 w-4 text-amber-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const filteredNotifs = notifs.filter(n => {
    const matchesCat = activeFilter === "all" || n.category === activeFilter;
    const matchesPriority = priorityFilter === "all" || n.priority === priorityFilter;
    return matchesCat && matchesPriority;
  });

  return (
    <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
      themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"
    }`}>
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800/85 pb-4 mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500 relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-600 text-white flex items-center justify-center font-mono text-[8px] font-extrabold animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">Notification Center</h4>
            <p className="text-[10px] text-slate-500 font-mono">Consolidated Operational Alerts</p>
          </div>
        </div>

        {/* OPERATIONS MARK READ */}
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 cursor-pointer"
          >
            <CheckCheck className="h-3 w-3" /> Mark All Read
          </button>
        )}
      </div>

      {/* FILTER BUTTONS & DROPDOWNS */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-150 dark:border-slate-800/50 pb-3 mb-3 flex-wrap">
        {/* Category switcher */}
        <div className="flex border rounded-lg p-0.5 font-mono text-[9px] bg-slate-950/20 border-slate-800/60 overflow-x-auto max-w-full">
          {["all", "outbid", "kyc", "finance", "system", "auction"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-2 py-1 rounded uppercase font-bold cursor-pointer transition-all ${
                activeFilter === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Priority Filter dropdown */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono">
          <Filter className="h-3 w-3 text-slate-400" />
          <span className="text-slate-500 uppercase font-bold">Priority:</span>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className={`text-[9px] font-mono font-extrabold uppercase px-2 py-1 rounded border outline-none ${
              themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <option value="all">ALL SCOPES</option>
            <option value="critical">CRITICAL ONLY</option>
            <option value="high">HIGH PRIORITY</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
          </select>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="flex-1">
        {filteredNotifs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Volume2 className="h-8 w-8 text-slate-600 animate-pulse" />
            <p className="text-xs font-mono">No active alerts matched filters</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {filteredNotifs.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className={`p-3 rounded-xl border flex gap-3 transition-all relative ${
                    item.isRead 
                      ? themeMode === "dark" ? "bg-slate-950/20 border-slate-900 opacity-60" : "bg-slate-50 border-slate-150 opacity-65"
                      : themeMode === "dark" ? "bg-slate-950/60 border-slate-800" : "bg-slate-100/40 border-slate-200"
                  }`}
                >
                  {/* UNREAD BLUE DOT */}
                  {!item.isRead && (
                    <span className="absolute left-1 top-1 h-2 w-2 rounded-full bg-blue-500" />
                  )}

                  {/* ICON */}
                  <div className={`p-2 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center bg-slate-950/20 border border-slate-800`}>
                    {getCategoryIcon(item.category)}
                  </div>

                  {/* BODY */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`text-[9px] font-mono uppercase font-bold ${
                        item.isRead ? "text-slate-500" : "text-blue-500"
                      }`}>{item.category}</span>
                      
                      <div className="flex items-center gap-1.5 text-[8px] font-mono">
                        <span className={`border uppercase px-1 rounded ${getPriorityBadgeStyle(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className="text-slate-400 shrink-0">{item.timestamp}</span>
                      </div>
                    </div>

                    <h5 className={`text-[11px] font-bold tracking-tight block truncate ${
                      item.isRead ? "text-slate-400" : themeMode === "dark" ? "text-white" : "text-slate-900"
                    }`}>{item.title}</h5>
                    <p className={`text-[10px] leading-relaxed text-slate-400`}>{item.message}</p>
                  </div>

                  {/* MINI INTERACTIONS CONTROLS */}
                  <div className="flex flex-col gap-1.5 justify-center pl-2 shrink-0 border-l border-slate-850">
                    <button
                      onClick={() => handleToggleRead(item.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white cursor-pointer"
                      title={item.isRead ? "Mark unread" : "Mark read"}
                    >
                      {item.isRead ? <Clock className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 cursor-pointer"
                      title="Dismiss alert"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
