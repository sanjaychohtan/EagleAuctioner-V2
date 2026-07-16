import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAppStore } from "../../store/useAppStore";
import { useNotification } from "../../providers/NotificationProvider";
import {
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Bell,
  ShieldCheck,
  LayoutDashboard,
  FileSpreadsheet,
  Layers,
  Database,
  UserCheck,
  TrendingUp,
  Settings,
  HelpCircle,
  Lock,
  ShieldAlert,
  DollarSign,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthService } from "../../api/authService";
import { changePasswordSchema } from "../../validation/authSchema";
import { handleApiError } from "../../api/errorHandler";

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

interface EnterpriseLayoutProps {
  children?: React.ReactNode;
}

export function EnterpriseLayout({ children }: EnterpriseLayoutProps) {
  const { user, logout, tenantId, updateTenantId, hasRole } = useAuth();
  const { themeMode, toggleThemeMode, sidebarExpanded, setSidebarExpanded } = useAppStore();
  const { showNotification } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTenantMenu, setShowTenantMenu] = useState(false);

  // Password Recovery / Change states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // Show/Hide password states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password rules validation
  const rules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const strengthScore = Object.values(rules).filter(Boolean).length;
  const strengthText = 
    strengthScore === 0 ? "Empty" :
    strengthScore <= 2 ? "Weak" :
    strengthScore <= 4 ? "Medium" : "Strong";
    
  const strengthColor = 
    strengthScore <= 2 ? "bg-red-500" :
    strengthScore <= 4 ? "bg-amber-500" : "bg-emerald-500";

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError(null);

    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      const msg = result.error.issues[0]?.message || "Validation failed";
      setChangePasswordError(msg);
      return;
    }

    setIsChangingPassword(true);
    try {
      await AuthService.changePassword({
        currentPassword,
        newPassword,
      });
      showNotification("Enterprise credential passphrase updated successfully.", "success");
      setShowChangePasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const mapped = handleApiError(err);
      setChangePasswordError(mapped.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Tenant choices matching Spring Boot database partitions
  const tenantOptions = [
    { id: "05f9024c-9f0e-4361-bd87-35ff5e019a2b", label: "Mumbai HQ (India)" },
    { id: "7ba6de1a-381c-4b52-b91a-9ab1c3d4e8ef", label: "Bengaluru Dev Division" },
    { id: "3c91b402-29ac-4029-9182-e3a1f9a2d3b4", label: "Singapore Trade Pool" },
  ];

  const menuItems: MenuItem[] = [
    { name: "Observability Hub", path: "/monitoring", icon: LayoutDashboard },
    { name: "Interactive Database ER", path: "/schema", icon: Database },
    { name: "Onboarding & KYC", path: "/onboarding", icon: ShieldCheck },
    { name: "Auction Desk", path: "/auctions", icon: Layers },
  ];

  if (hasRole(["ADMIN", "SUPER_ADMIN", "OPERATIONS", "COMPLIANCE"])) {
    menuItems.push({ name: "Compliance Desk", path: "/admin/kyc", icon: UserCheck });
  }

  if (hasRole(["ROLE_FINANCE", "ROLE_ACCOUNTANT", "ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_OPERATIONS", "ROLE_COMPLIANCE", "FINANCE", "ACCOUNTANT", "SUPER_ADMIN", "ADMIN"])) {
    menuItems.push({ name: "Finance Desk", path: "/finance", icon: DollarSign });
  }

  const handleLogout = async () => {
    await logout();
    showNotification("Successfully signed out of secure session.", "success");
    navigate("/login");
  };

  const currentTenantLabel =
    tenantOptions.find((t) => t.id === tenantId)?.label || "Default Tenant Partition";

  return (
    <div className={`min-h-screen flex ${themeMode === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"} transition-colors duration-200`}>
      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`border-r shrink-0 transition-all duration-300 flex flex-col justify-between ${
          themeMode === "dark" ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        } ${sidebarExpanded ? "w-64" : "w-20"}`}
      >
        <div>
          {/* LOGO AREA */}
          <div className={`p-5 flex items-center justify-between border-b ${themeMode === "dark" ? "border-slate-800/80" : "border-slate-100"}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-9 w-9 rounded-xl bg-blue-900 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-blue-900/20 border-l-4 border-orange-500">
                EA
              </div>
              {sidebarExpanded && (
                <span className={`font-bold tracking-tight text-sm font-mono whitespace-nowrap animate-fadeIn ${themeMode === "dark" ? "text-slate-100" : "text-blue-950"}`}>
                  EAGLE <span className="text-orange-500">AUCTIONER</span>
                </span>
              )}
            </div>
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                themeMode === "dark"
                  ? "hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200"
                  : "hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700"
              }`}
            >
              {sidebarExpanded ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {/* MENU LIST */}
          <nav className="p-3.5 space-y-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all group relative ${
                    isActive
                      ? "bg-blue-900 text-white shadow-lg shadow-blue-900/15 border-r-4 border-orange-500"
                      : themeMode === "dark"
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      : "text-slate-600 hover:text-blue-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-orange-400" : "text-blue-700 group-hover:scale-105 transition-transform"}`} />
                  {sidebarExpanded ? (
                    <span className="animate-fadeIn">{item.name}</span>
                  ) : (
                    <div className="absolute left-16 bg-slate-950 text-white text-[10px] py-1 px-2.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-800 font-mono z-50 shadow-xl">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className={`p-4 border-t ${themeMode === "dark" ? "border-slate-800/80" : "border-slate-100"}`}>
          {sidebarExpanded ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs text-indigo-400 font-bold border border-indigo-500/20">
                  U
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold truncate text-slate-300">
                    {user?.username || "Guest Operator"}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate">
                    {user?.email || "operator@eagle.in"}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 rounded-xl hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* GLOBAL HEADER */}
        <header
          className={`h-16 border-b px-6 flex items-center justify-between shrink-0 ${
            themeMode === "dark" ? "bg-slate-900/40 border-slate-800/80" : "bg-white border-slate-200"
          }`}
        >
          {/* LEFT HEADER: ACTIVE ROUTE TITLE */}
          <div className="flex items-center gap-4">
            <h1 className={`text-sm font-bold tracking-tight ${themeMode === "dark" ? "text-white" : "text-blue-950"} font-mono uppercase hidden sm:block`}>
              {location.pathname === "/monitoring" && "Observability & SRE Dashboard"}
              {location.pathname === "/schema" && "Active Schema & SQL Designer"}
              {location.pathname === "/onboarding" && "Onboarding & KYC Hub"}
              {location.pathname === "/admin/kyc" && "Compliance Review Desk"}
              {location.pathname === "/auctions" && "Auction Registry Desk"}
              {location.pathname === "/auctions/create" && "Create Enterprise Auction"}
              {location.pathname.includes("/settings") && "Auction Business Settings"}
              {location.pathname.includes("/edit") && "Edit Auction Specifications"}
              {(!location.pathname.includes("/settings") && !location.pathname.includes("/edit") && location.pathname.match(/^\/auctions\/[^/]+$/)) && "Auction Operational Sheet"}
              {location.pathname === "/unauthorized" && "Authorization Refused"}
              {location.pathname === "/login" && "Gateway Authorization"}
            </h1>
          </div>

          {/* RIGHT HEADER ACTIONS */}
          <div className="flex items-center gap-4">
            {/* TENANT SELECTOR */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTenantMenu(!showTenantMenu);
                  setShowProfileMenu(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border font-mono transition-all cursor-pointer ${
                  themeMode === "dark"
                    ? "bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500/60"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:border-indigo-500/60"
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{currentTenantLabel}</span>
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>

              <AnimatePresence>
                {showTenantMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTenantMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`absolute right-0 mt-2 w-60 rounded-xl shadow-2xl border p-2 z-20 font-mono text-xs ${
                        themeMode === "dark" ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="px-2.5 py-1.5 text-[10px] text-slate-500 border-b border-slate-900 uppercase font-bold tracking-wider">
                        Select isolated tenant partition
                      </div>
                      <div className="space-y-1 mt-1.5">
                        {tenantOptions.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              updateTenantId(t.id);
                              setShowTenantMenu(false);
                              showNotification(`Active tenant partition updated: ${t.label}`, "success");
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-lg transition-all flex flex-col gap-0.5 cursor-pointer ${
                              tenantId === t.id
                                ? "bg-indigo-600/15 border-l-2 border-indigo-500 text-indigo-300"
                                : themeMode === "dark"
                                ? "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span className="font-bold">{t.label}</span>
                            <span className="text-[9px] text-slate-500 truncate">{t.id}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* THEME TOGGLE */}
            <button
              onClick={toggleThemeMode}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                themeMode === "dark"
                  ? "bg-slate-950 hover:bg-slate-800 border-slate-800 text-amber-400"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600"
              }`}
              title="Toggle Theme Mode"
            >
              {themeMode === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* NOTIFICATION HUB BELL */}
            <button
              className={`p-2 rounded-lg border transition-all cursor-pointer relative ${
                themeMode === "dark"
                  ? "bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500"
              }`}
              onClick={() => showNotification("Real-time telemetry and transactional outbox healthy.", "info")}
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping" />
            </button>

            {/* SETTINGS / CHANGE PASSWORD */}
            <button
              onClick={() => {
                setShowChangePasswordModal(true);
                setChangePasswordError(null);
              }}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                themeMode === "dark"
                  ? "bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500"
              }`}
              title="Change Password Settings"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>
 
        {/* CONTENT STAGE WITH SMOOTH PAGE ANIMATIONS */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* CHANGE PASSWORD MODAL OVERLAY */}
      <AnimatePresence>
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isChangingPassword) setShowChangePasswordModal(false);
              }}
              className="absolute inset-0 bg-slate-950"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative max-w-md w-full rounded-2xl border p-6 shadow-2xl font-mono text-xs overflow-hidden ${
                themeMode === "dark" ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              {/* TOP GLOW LINE */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

              <div className="flex items-center justify-between pb-4 border-b border-slate-800/20 mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-indigo-400" />
                  <span className="font-bold uppercase tracking-wider text-sm">Passphrase Settings</span>
                </div>
                <button
                  onClick={() => setShowChangePasswordModal(false)}
                  disabled={isChangingPassword}
                  className="text-slate-500 hover:text-slate-400 font-bold uppercase hover:bg-slate-850 p-1.5 rounded"
                >
                  Close
                </button>
              </div>

              {changePasswordError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-[11px] text-red-400 flex items-start gap-2 font-mono">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{changePasswordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className={`block text-[9px] font-bold ${themeMode === "dark" ? "text-slate-400" : "text-slate-500"} uppercase tracking-wider mb-1.5 font-mono`}>Current Access Passphrase</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••••"
                      className={`w-full ${themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"} rounded-lg p-2.5 pr-10 text-xs focus:outline-none focus:border-blue-900 font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-300"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-[9px] font-bold ${themeMode === "dark" ? "text-slate-400" : "text-slate-500"} uppercase tracking-wider mb-1.5 font-mono`}>New Access Passphrase</label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters with upper, lower, number, special"
                      className={`w-full ${themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"} rounded-lg p-2.5 pr-10 text-xs focus:outline-none focus:border-blue-900 font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-300"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* PASSWORD STRENGTH METER */}
                  {newPassword && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="text-slate-500 uppercase font-bold">Strength Meter:</span>
                        <span className={`font-bold uppercase ${
                          strengthScore <= 2 ? "text-red-500" : strengthScore <= 4 ? "text-amber-500" : "text-emerald-500"
                        }`}>{strengthText}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${strengthColor} transition-all duration-300`} 
                          style={{ width: `${(strengthScore / 5) * 100}%` }}
                        />
                      </div>

                      {/* RULES CHECKLIST */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 text-[9px] font-mono text-slate-500 border-t border-slate-800/10">
                        <div className="flex items-center gap-1">
                          <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${rules.length ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-950 text-slate-600"}`}>
                            {rules.length ? <Check className="h-2.5 w-2.5" /> : "•"}
                          </div>
                          <span>Min 8 characters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${rules.upper ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-950 text-slate-600"}`}>
                            {rules.upper ? <Check className="h-2.5 w-2.5" /> : "•"}
                          </div>
                          <span>Uppercase [A-Z]</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${rules.lower ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-950 text-slate-600"}`}>
                            {rules.lower ? <Check className="h-2.5 w-2.5" /> : "•"}
                          </div>
                          <span>Lowercase [a-z]</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${rules.number ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-950 text-slate-600"}`}>
                            {rules.number ? <Check className="h-2.5 w-2.5" /> : "•"}
                          </div>
                          <span>Number [0-9]</span>
                        </div>
                        <div className="flex items-center gap-1 col-span-2">
                          <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${rules.special ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-950 text-slate-600"}`}>
                            {rules.special ? <Check className="h-2.5 w-2.5" /> : "•"}
                          </div>
                          <span>Special Character (@, #, $, etc.)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-[9px] font-bold ${themeMode === "dark" ? "text-slate-400" : "text-slate-500"} uppercase tracking-wider mb-1.5 font-mono`}>Confirm New Access Passphrase</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Must match new password exactly"
                      className={`w-full ${themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"} rounded-lg p-2.5 pr-10 text-xs focus:outline-none focus:border-blue-900 font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-300"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* MATCH INDICATOR */}
                  {confirmPassword && (
                    <div className="mt-1.5 flex items-center gap-1 text-[9px] font-mono">
                      {newPassword === confirmPassword ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Passwords match perfectly
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 justify-end pt-2">
                  <button
                    type="button"
                    disabled={isChangingPassword}
                    onClick={() => setShowChangePasswordModal(false)}
                    className="px-4 py-2 border border-slate-800 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-850 cursor-pointer text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white shadow-lg cursor-pointer"
                  >
                    {isChangingPassword ? "Applying Update..." : "Update Passphrase"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default EnterpriseLayout;
