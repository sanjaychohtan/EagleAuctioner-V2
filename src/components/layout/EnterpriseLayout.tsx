import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAppStore } from "../../store/useAppStore";
import { useNotification } from "../../providers/NotificationProvider";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Layers,
  Database,
  UserCheck,
  TrendingUp,
  Settings,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  X,
  Shield
} from "lucide-react";
import { EnterpriseHeaderNav } from "./EnterpriseHeaderNav";
import { AuthService } from "../../api/authService";
import { changePasswordSchema } from "../../validation/authSchema";
import { handleApiError } from "../../api/errorHandler";

import { USER_ROLE } from "../../constants";

interface EnterpriseLayoutProps {
  children?: React.ReactNode;
}

export function EnterpriseLayout({ children }: EnterpriseLayoutProps) {
  const { user, logout, tenantId, updateTenantId, hasPermission, hasRole } = useAuth();
  const { themeMode, toggleThemeMode, sidebarExpanded, setSidebarExpanded } = useAppStore();
  const { showNotification } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const rules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError(null);

    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      setChangePasswordError(result.error.issues[0]?.message || "Validation failed");
      return;
    }

    setIsChangingPassword(true);
    try {
      await AuthService.changePassword({ currentPassword, newPassword });
      showNotification("Password updated successfully.", "success");
      setShowChangePasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const friendly = handleApiError(err);
      setChangePasswordError(friendly.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const allNavLinks = [
    { name: "Monitoring Telemetry", path: "/monitoring", icon: LayoutDashboard, allowedRoles: [USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN, USER_ROLE.OPERATIONS, USER_ROLE.OPS_HEAD] },
    { name: "PostgreSQL Schema", path: "/schema", icon: Database, allowedRoles: [USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN, USER_ROLE.OPERATIONS, USER_ROLE.OPS_HEAD] },
    { name: "Role & Access Studio", path: "/admin/roles", icon: Shield, permission: "role.manage" },
    { name: "KYC Onboarding", path: "/onboarding", icon: UserCheck, permission: "AUTH" },
    { name: "Admin KYC Queue", path: "/admin/kyc", icon: Layers, permission: "kyc.review" },
    { name: "Live Auctions", path: "/auctions", icon: TrendingUp, permission: "AUTH" },
    { name: "Finance Hub", path: "/finance", icon: FileSpreadsheet, permission: "finance.wallet.view" },
  ];

  const navLinks = allNavLinks.filter((link) => {
    if (link.allowedRoles) {
      return hasRole(link.allowedRoles);
    }
    if (link.permission === "AUTH") return true;
    return hasPermission(link.permission);
  });

  return (
    <div className={`min-h-screen font-sans ${themeMode === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <EnterpriseHeaderNav
        user={user}
        tenantId={tenantId}
        themeMode={themeMode}
        toggleThemeMode={toggleThemeMode}
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        showTenantMenu={showTenantMenu}
        setShowTenantMenu={setShowTenantMenu}
        onUpdateTenant={(id) => updateTenantId(id)}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
        onLogout={() => {
          logout();
          navigate("/login");
        }}
      />

      <div className="flex">
        {/* Sidebar Menu */}
        {sidebarExpanded && (
          <aside className={`w-64 border-r p-4 font-mono text-xs space-y-2 shrink-0 ${
            themeMode === "dark" ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-3 px-2">Navigation Portals</span>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isSel = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition-all ${
                    isSel 
                      ? "bg-blue-600 text-white shadow-md" 
                      : themeMode === "dark" ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </aside>
        )}

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-mono">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-400" />
                Change Password
              </h3>
              <button onClick={() => setShowChangePasswordModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {changePasswordError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {changePasswordError}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:border-blue-500"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-2.5 text-slate-400">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:border-blue-500"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-slate-400">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:border-blue-500"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-2.5 text-slate-400">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  {isChangingPassword ? "Saving..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnterpriseLayout;
