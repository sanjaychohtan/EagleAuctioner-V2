import React, { memo, useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  ChevronDown, 
  LogOut, 
  Lock,
  Search,
  LayoutDashboard,
  Database,
  Shield,
  UserCheck,
  Layers,
  TrendingUp,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { UserProfileDTO } from "../../types/auth";
import { useAuth } from "../../context/AuthContext";
import { useAuctions } from "../../hooks/useAuctionQueries";
import { useSettlements } from "../../hooks/useFinanceQueries";

interface EnterpriseHeaderNavProps {
  user: UserProfileDTO | null;
  tenantId: string;
  themeMode: "light" | "dark";
  toggleThemeMode: () => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (val: boolean) => void;
  showProfileMenu: boolean;
  setShowProfileMenu: (val: boolean) => void;
  showTenantMenu: boolean;
  setShowTenantMenu: (val: boolean) => void;
  onUpdateTenant: (id: string) => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

export const EnterpriseHeaderNav: React.FC<EnterpriseHeaderNavProps> = memo(({
  user,
  themeMode,
  toggleThemeMode,
  sidebarExpanded,
  setSidebarExpanded,
  showProfileMenu,
  setShowProfileMenu,
  onOpenChangePassword,
  onLogout
}) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch data for search indexes (only when search overlay is active)
  const { data: auctions } = useAuctions({ enabled: showSearch });
  const { data: settlements } = useSettlements({ enabled: showSearch });

  // Navigation Portals
  const navPortals = useMemo(() => {
    const list = [
      { name: "Monitoring Telemetry", path: "/monitoring", icon: LayoutDashboard, permission: "AUTH" },
      { name: "PostgreSQL Schema", path: "/schema", icon: Database, permission: "AUTH" },
      { name: "Role & Access Studio", path: "/admin/roles", icon: Shield, permission: "role.manage" },
      { name: "KYC Onboarding", path: "/onboarding", icon: UserCheck, permission: "AUTH" },
      { name: "Admin KYC Queue", path: "/admin/kyc", icon: Layers, permission: "kyc.review" },
      { name: "Live Auctions", path: "/auctions", icon: TrendingUp, permission: "AUTH" },
      { name: "Finance Hub", path: "/finance", icon: FileSpreadsheet, permission: "finance.wallet.view" },
    ];
    return list.filter(item => item.permission === "AUTH" || hasPermission(item.permission));
  }, [hasPermission]);

  // Global search shortcut listener (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset indices and focus when search overlay toggles
  useEffect(() => {
    if (showSearch) {
      setSelectedIndex(0);
      setSearchQuery("");
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showSearch]);

  // Search filter logic
  const filteredPortals = useMemo(() => {
    if (!searchQuery) return navPortals;
    const q = searchQuery.toLowerCase();
    return navPortals.filter(p => p.name.toLowerCase().includes(q));
  }, [searchQuery, navPortals]);

  const filteredAuctions = useMemo(() => {
    if (!searchQuery || !auctions) return [];
    const q = searchQuery.toLowerCase();
    return auctions.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.auctionNumber.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery, auctions]);

  const filteredSettlements = useMemo(() => {
    if (!searchQuery || !settlements) return [];
    const q = searchQuery.toLowerCase();
    return settlements.filter(s => 
      s.referenceNo.toLowerCase().includes(q) || 
      s.settlementId.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery, settlements]);

  // Flattened results for arrow key navigation
  const flatResults = useMemo(() => {
    const list: Array<{ 
      type: "portal" | "auction" | "settlement"; 
      label: string; 
      sublabel?: string; 
      path: string; 
      icon: React.ComponentType<any> 
    }> = [];

    filteredPortals.forEach(p => {
      list.push({ type: "portal", label: p.name, path: p.path, icon: p.icon });
    });

    filteredAuctions.forEach(a => {
      list.push({ 
        type: "auction", 
        label: a.title, 
        sublabel: `${a.auctionNumber} • ${a.state}`, 
        path: `/auctions/${a.id}`, 
        icon: TrendingUp 
      });
    });

    filteredSettlements.forEach(s => {
      list.push({ 
        type: "settlement", 
        label: `Settlement Ref: ${s.referenceNo}`, 
        sublabel: `Status: ${s.status} • Platform Fee: ${(s.platformFee / 100).toFixed(2)} ${s.currency}`, 
        path: `/finance/settlements/${s.settlementId}`, 
        icon: FileText 
      });
    });

    return list;
  }, [filteredPortals, filteredAuctions, filteredSettlements]);

  // Auto-scroll to selected element in scrollable list
  useEffect(() => {
    const container = resultsContainerRef.current;
    if (!container) return;
    const selectedElement = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (!selectedElement) return;

    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const elemTop = selectedElement.offsetTop;
    const elemBottom = elemTop + selectedElement.clientHeight;

    if (elemTop < containerTop) {
      container.scrollTop = elemTop;
    } else if (elemBottom > containerBottom) {
      container.scrollTop = elemBottom - container.clientHeight;
    }
  }, [selectedIndex]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (flatResults.length > 0 ? (prev + 1) % flatResults.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (flatResults.length > 0 ? (prev - 1 + flatResults.length) % flatResults.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        navigate(flatResults[selectedIndex].path);
        setShowSearch(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowSearch(false);
    }
  };

  return (
    <>
      <header className={`border-b sticky top-0 z-30 font-mono transition-colors ${
        themeMode === "dark" ? "bg-slate-950/80 border-slate-800 backdrop-blur-md text-slate-100" : "bg-white/90 border-slate-200 backdrop-blur-md text-slate-900"
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-2 rounded-xl border border-slate-800/80 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Toggle menu"
            >
              {sidebarExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <img src="/src/assets/auctbiz-logo.png" alt="AUCTBIZ" className="h-6 w-auto object-contain" />
              <span className="font-extrabold tracking-wider text-sm text-white">AUCTBIZ</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Command Palette Trigger Button */}
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/20 text-xs font-medium cursor-pointer transition-colors"
              title="Search System (Ctrl+K or /)"
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline text-slate-500">Search system...</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-semibold bg-slate-800 border border-slate-700 text-slate-400 rounded">
                Ctrl K
              </kbd>
            </button>

            {/* Theme switcher */}
            <button
              onClick={toggleThemeMode}
              className="p-2 rounded-xl border border-slate-800/80 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Toggle theme"
            >
              {themeMode === "dark" ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
            </button>

            {/* User profile menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800/80 text-xs font-bold cursor-pointer"
              >
                <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px]">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="hidden sm:inline">{user?.username || "User"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl z-50 p-2 font-mono text-xs ${
                        themeMode === "dark" ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
                      }`}
                    >
                      <div className="p-2 border-b border-slate-800/80 mb-1">
                        <p className="font-bold text-white text-xs">{user?.username}</p>
                        <p className="text-[10px] text-slate-400">{user?.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenChangePassword();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2 text-slate-300 cursor-pointer"
                      >
                        <Lock className="h-4 w-4 text-blue-400" />
                        <span>Change Password</span>
                      </button>

                      <button
                        onClick={onLogout}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-400 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Command Palette Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(false)}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -5 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden font-mono text-xs"
            >
              {/* Header Search Field */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type to search portals, auctions, or settlements..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full bg-transparent outline-none border-none text-white placeholder-slate-500 text-sm"
                />
                <button 
                  onClick={() => setShowSearch(false)}
                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable results list */}
              <div 
                ref={resultsContainerRef}
                className="max-h-96 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800"
              >
                {flatResults.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  flatResults.map((item, index) => {
                    const Icon = item.icon;
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={`${item.type}-${item.path}-${index}`}
                        data-index={index}
                        onClick={() => {
                          navigate(item.path);
                          setShowSearch(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                          isSelected 
                            ? "bg-blue-600 text-white" 
                            : "text-slate-300 hover:bg-slate-800/40 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
                          <div>
                            <p className="font-semibold text-white">{item.label}</p>
                            {item.sublabel && (
                              <p className={`text-[10px] ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                                {item.sublabel}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded tracking-wider border font-bold ${
                          isSelected 
                            ? "bg-blue-700 border-blue-500 text-white" 
                            : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}>
                          {item.type}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer instruction guidelines */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span>↑↓ Nav</span>
                  <span>↵ Select</span>
                  <span>ESC Close</span>
                </div>
                <div>
                  Shortcut: <span className="text-slate-400">Ctrl+K</span> or <span className="text-slate-400">/</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});

EnterpriseHeaderNav.displayName = "EnterpriseHeaderNav";
