import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Terminal, 
  User, 
  Settings, 
  Database, 
  HelpCircle, 
  Compass, 
  RefreshCw, 
  Zap, 
  FileSpreadsheet,
  AlertTriangle,
  LayoutDashboard,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DashboardRole } from "./DashboardTypes";

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  shortcut?: string;
  icon: React.ComponentType<any>;
  action: () => void;
}

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: DashboardRole) => void;
  onSelectSimulation: (mode: "normal" | "loading" | "empty" | "error") => void;
  onTriggerRefresh: () => void;
  themeMode: "light" | "dark";
}

export function GlobalCommandPalette({
  isOpen,
  onClose,
  onSelectRole,
  onSelectSimulation,
  onTriggerRefresh,
  themeMode
}: GlobalCommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // NAVIGATION / ROLES
    {
      id: "role-personalized",
      category: "Dashboard Perspectives",
      title: "Switch to Personalized Workspace Cockpit",
      subtitle: "Customize your active bento workspace from 15 available modules",
      shortcut: "⌥ 7",
      icon: LayoutDashboard,
      action: () => { onSelectRole("personalized"); onClose(); }
    },
    {
      id: "role-executive",
      category: "Dashboard Perspectives",
      title: "Switch to Executive Dashboard",
      subtitle: "View high-level revenue charts, growth trends, and executive DTO stats",
      shortcut: "⌥ 1",
      icon: LayoutDashboard,
      action: () => { onSelectRole("executive"); onClose(); }
    },
    {
      id: "role-admin",
      category: "Dashboard Perspectives",
      title: "Switch to Admin Dashboard",
      subtitle: "System operator metrics, KYC queues, SLA settings, and system health",
      shortcut: "⌥ 2",
      icon: Settings,
      action: () => { onSelectRole("admin"); onClose(); }
    },
    {
      id: "role-buyer",
      category: "Dashboard Perspectives",
      title: "Switch to Buyer Dashboard",
      subtitle: "Active lots bidding console, EMD balances, upcoming auction calendar",
      shortcut: "⌥ 3",
      icon: User,
      action: () => { onSelectRole("buyer"); onClose(); }
    },
    {
      id: "role-seller",
      category: "Dashboard Perspectives",
      title: "Switch to Seller Dashboard",
      subtitle: "Manage listings, track lot activity, analyze increments and sales",
      shortcut: "⌥ 4",
      icon: Compass,
      action: () => { onSelectRole("seller"); onClose(); }
    },
    {
      id: "role-finance",
      category: "Dashboard Perspectives",
      title: "Switch to Finance Dashboard",
      subtitle: "Maker-checker bank gate payouts, GST ledgers, EMD releases",
      shortcut: "⌥ 5",
      icon: FileSpreadsheet,
      action: () => { onSelectRole("finance"); onClose(); }
    },
    {
      id: "role-operations",
      category: "Dashboard Perspectives",
      title: "Switch to Operations Dashboard",
      subtitle: "Live bid streams, L1/L2 dispute tickets, and system broadcasts",
      shortcut: "⌥ 6",
      icon: ShieldAlert,
      action: () => { onSelectRole("operations"); onClose(); }
    },

    // SIMULATIONS
    {
      id: "sim-normal",
      category: "UX Testing Sandbox",
      title: "Simulate Normal State",
      subtitle: "Reset dashboard to live, responsive data visualizers",
      icon: Zap,
      action: () => { onSelectSimulation("normal"); onClose(); }
    },
    {
      id: "sim-loading",
      category: "UX Testing Sandbox",
      title: "Simulate Loading Skeleton States",
      subtitle: "Inspect graceful rounded bone structure elements",
      icon: Loader2,
      action: () => { onSelectSimulation("loading"); onClose(); }
    },
    {
      id: "sim-empty",
      category: "UX Testing Sandbox",
      title: "Simulate Zero-Data Empty States",
      subtitle: "Inspect illustrative void lists and default fallback calls",
      icon: HelpCircle,
      action: () => { onSelectSimulation("empty"); onClose(); }
    },
    {
      id: "sim-error",
      category: "UX Testing Sandbox",
      title: "Simulate Network Error State",
      subtitle: "Inspect SLA warning indicators and connection failure alerts",
      icon: AlertTriangle,
      action: () => { onSelectSimulation("error"); onClose(); }
    },

    // SYSTEM ACTIONS
    {
      id: "action-refresh",
      category: "Operational Utilities",
      title: "Force Data Refresh Sync",
      shortcut: "⌘ R",
      subtitle: "Trigger an out-of-band REST query fetch & refresh timer",
      icon: RefreshCw,
      action: () => { onTriggerRefresh(); onClose(); }
    }
  ];

  // Dynamic searchable entities database (Task 1)
  const searchableEntities: CommandItem[] = [
    { id: "ent-lot-402", category: "Global Ledger Entities", title: "Lot #402: A-Grade Steel Billets", subtitle: "Active lot listing in metals division • Current bid: ₹1,45,00,000", icon: Terminal, action: () => { onSelectRole("personalized"); onClose(); } },
    { id: "ent-lot-308", category: "Global Ledger Entities", title: "Lot #308: Coal Block G6 Sovereign", subtitle: "Sovereign mining concession in energy division • Current bid: ₹4,80,00,000", icon: Terminal, action: () => { onSelectRole("personalized"); onClose(); } },
    { id: "ent-lot-112", category: "Global Ledger Entities", title: "Lot #112: Copper Wire Recycler stocks", subtitle: "Archived metals lot listing • Closed at: ₹72,00,000", icon: Terminal, action: () => { onSelectRole("personalized"); onClose(); } },
    { id: "ent-buyer-mumbai", category: "Global Ledger Entities", title: "Mumbai Steel Corporation", subtitle: "Active buyer ledger profile • SEC KYC validated • escrow: ₹4.20 Cr", icon: User, action: () => { onSelectRole("buyer"); onClose(); } },
    { id: "ent-buyer-gmr", category: "Global Ledger Entities", title: "GMR Coal Trade Pvt Ltd", subtitle: "Active buyer ledger profile • SEC KYC validated • escrow: ₹3.50 Cr", icon: User, action: () => { onSelectRole("buyer"); onClose(); } },
    { id: "ent-seller-jsw", category: "Global Ledger Entities", title: "JSW Steel Salvage Desk", subtitle: "Approved seller corporate partition • GSTIN: 27AAAAA1111A1Z1", icon: Compass, action: () => { onSelectRole("seller"); onClose(); } }
  ];

  // Combine default commands and matching search entities
  const getFilteredCommands = () => {
    const defaultFiltered = commands.filter(cmd =>
      cmd.title.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category.toLowerCase().includes(search.toLowerCase()) ||
      cmd.subtitle.toLowerCase().includes(search.toLowerCase())
    );

    if (!search) return defaultFiltered;

    const matchingEntities = searchableEntities.filter(ent =>
      ent.title.toLowerCase().includes(search.toLowerCase()) ||
      ent.subtitle.toLowerCase().includes(search.toLowerCase())
    );

    return [...defaultFiltered, ...matchingEntities];
  };

  const filteredCommands = getFilteredCommands();

  // Keyboard navigation inside list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Scroll into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 pb-4">
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* PALETTE CONTAINER */}
          <motion.div
            initial={{ scale: 0.97, y: -8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: -8, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
            className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[480px] ${
              themeMode === "dark" 
                ? "bg-slate-900 border-slate-800 text-slate-100" 
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* SEARCH INPUT BAR */}
            <div className={`flex items-center gap-3 px-4 py-3.5 border-b shrink-0 ${
              themeMode === "dark" ? "border-slate-800/80" : "border-slate-150"
            }`}>
              <Search className="h-5 w-5 text-blue-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a role, simulation or utility command..."
                className="w-full bg-transparent border-none text-sm outline-none focus:ring-0 placeholder-slate-400 font-sans"
                aria-label="Search command palette"
              />
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 select-none ${
                themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-500"
              }`}>
                ESC
              </span>
            </div>

            {/* ACTION ITEMS LIST */}
            <div 
              ref={listRef}
              className="flex-1 overflow-y-auto p-2 space-y-3"
              role="listbox"
            >
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Terminal className="h-8 w-8 text-slate-600 animate-pulse" />
                  <p className="text-xs font-mono">No matching console instructions found</p>
                </div>
              ) : (
                // Group commands by category
                Object.entries(
                  filteredCommands.reduce((groups, item) => {
                    const group = groups[item.category] || [];
                    group.push(item);
                    groups[item.category] = group;
                    return groups;
                  }, {} as Record<string, CommandItem[]>)
                ).map(([category, items]) => (
                  <div key={category} className="space-y-1">
                    <h3 className={`text-[9px] uppercase tracking-wider font-extrabold px-3 py-1 font-mono ${
                      themeMode === "dark" ? "text-slate-500" : "text-slate-450"
                    }`}>
                      {category}
                    </h3>

                    <div className="space-y-0.5">
                      {items.map(item => {
                        const globalIndex = filteredCommands.findIndex(c => c.id === item.id);
                        const isSelected = globalIndex === selectedIndex;
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.id}
                            data-active={isSelected}
                            onClick={item.action}
                            className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                              isSelected
                                ? themeMode === "dark"
                                  ? "bg-blue-600/15 text-blue-300 border-l-4 border-blue-500 font-medium"
                                  : "bg-blue-50 text-blue-900 border-l-4 border-blue-600 font-medium"
                                : themeMode === "dark"
                                ? "hover:bg-slate-800/40 text-slate-300"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className={`p-1.5 rounded-lg shrink-0 ${
                                isSelected
                                  ? "bg-blue-500/10 text-blue-500"
                                  : themeMode === "dark" ? "bg-slate-950 text-slate-500" : "bg-slate-100 text-slate-500"
                              }`}>
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <div className="overflow-hidden">
                                <span className="text-xs block font-semibold tracking-wide truncate">{item.title}</span>
                                <span className={`text-[10px] block truncate mt-0.5 ${
                                  isSelected ? "text-blue-400" : "text-slate-500"
                                }`}>{item.subtitle}</span>
                              </div>
                            </div>

                            {item.shortcut && (
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 select-none ${
                                isSelected
                                  ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                                  : themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-500"
                              }`}>
                                {item.shortcut}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* BOTTOM HELP FOOTER */}
            <div className={`px-4 py-2.5 border-t text-[10px] font-mono flex items-center justify-between gap-4 shrink-0 ${
              themeMode === "dark" ? "border-slate-800/85 bg-slate-950/40 text-slate-500" : "bg-slate-50 border-slate-150 text-slate-500"
            }`}>
              <div className="flex gap-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
              </div>
              <div className="hidden sm:block">
                <span>AUCTBIZ Console Gateway v2.4</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default React.memo(GlobalCommandPalette);
