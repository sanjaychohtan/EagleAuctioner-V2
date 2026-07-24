import React, { memo } from "react";
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  ChevronDown, 
  LogOut, 
  Lock
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { UserProfileDTO } from "../../types/auth";

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
  tenantId,
  themeMode,
  toggleThemeMode,
  sidebarExpanded,
  setSidebarExpanded,
  showProfileMenu,
  setShowProfileMenu,
  showTenantMenu,
  setShowTenantMenu,
  onUpdateTenant,
  onOpenChangePassword,
  onLogout
}) => {
  return (
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
          <span className="font-bold tracking-tight text-sm">Eagle Auctioner Suite</span>
        </div>

        <div className="flex items-center gap-3">
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
  );
});

EnterpriseHeaderNav.displayName = "EnterpriseHeaderNav";
