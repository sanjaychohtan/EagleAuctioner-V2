import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { AuthService } from "../api/authService";
import { useAuthStore } from "../store/useAuthStore";
import { USER_ROLE, STORAGE_KEYS } from "../constants";
import { UserProfileDTO } from "../types/auth";
import { apiClient } from "../api/client";
import { useNotification } from "../providers/NotificationProvider";
import { handleApiError } from "../api/errorHandler";
import { auditLogger } from "../utils/auditLogger";
import { useIdleTimer } from "../hooks/useIdleTimer";

export function sanitizeRedirectUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "/monitoring";
  // Trim leading/trailing whitespace
  const clean = url.trim();
  // Reject absolute URLs, protocol relative URLs (//), and javascript: URIs
  if (clean.startsWith("//") || clean.includes(":") || clean.startsWith("\\")) {
    return "/monitoring";
  }
  // Ensure it starts with /
  if (!clean.startsWith("/")) {
    return "/monitoring";
  }
  return clean;
}

interface AuthContextType {
  user: UserProfileDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tenantId: string;
  login: (username: string, password: string) => Promise<UserProfileDTO>;
  logout: () => Promise<void>;
  updateTenantId: (id: string) => void;
  hasRole: (roles: USER_ROLE | USER_ROLE[] | string | string[]) => boolean;
  hasPermission: (permission: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_CHANNEL_NAME = "ea_auth_channel";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    user,
    tenantId,
    sessionStatus,
    setAuthData,
    clearAuthData,
    setSessionStatus,
    setTenantId,
  } = useAuthStore();

  const { showNotification } = useNotification();

  const isAuthenticated = sessionStatus === "authenticated";
  const isLoading = sessionStatus === "loading";

  // Enterprise Idle Session Timeout: 15 mins total, 14 mins warning
  useIdleTimer({
    enabled: isAuthenticated,
    timeoutMs: 15 * 60 * 1000,
    warningMs: 14 * 60 * 1000,
    onWarning: () => {
      showNotification("Session Idle Warning: You will be logged out in 1 minute due to inactivity.", "warning");
    },
    onTimeout: () => {
      auditLogger.log("IDLE_TIMEOUT", { userId: user?.id, username: user?.username, tenantId });
      showNotification("Session Expired: Automatically logged out due to inactivity.", "error");
      logout();
    },
  });

  useEffect(() => {
    // Cross-tab Synchronization via BroadcastChannel & Storage Event
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
        channel.onmessage = (event) => {
          if (event.data?.type === "LOGOUT") {
            auditLogger.log("CROSS_TAB_SYNC", { details: "Received multi-tab logout event" });
            clearAuthData();
            showNotification("Session terminated from another browser tab.", "info");
          } else if (event.data?.type === "LOGIN") {
            auditLogger.log("CROSS_TAB_SYNC", { details: "Received multi-tab login event" });
            verifySession();
          }
        };
      } catch (err) {
        console.warn("BroadcastChannel not available:", err);
      }
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ACCESS_TOKEN && !e.newValue) {
        auditLogger.log("CROSS_TAB_SYNC", { details: "Storage key purge detected" });
        clearAuthData();
      }
    };

    const handleUnauthorized = () => {
      auditLogger.log("SESSION_EXPIRED", { userId: user?.id, username: user?.username });
      clearAuthData();
      showNotification("Your active session has expired or been terminated. Please sign in.", "warning");
    };

    const handleForbidden = () => {
      auditLogger.log("UNAUTHORIZED_ACCESS", { userId: user?.id, username: user?.username });
      showNotification("Access denied. Your role has insufficient permissions to execute this request.", "error");
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        verifySession();
      }
    };

    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener("unauthorized_redirect", handleUnauthorized);
    window.addEventListener("forbidden_redirect", handleForbidden);
    window.addEventListener("pageshow", handlePageShow);
    verifySession();

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("unauthorized_redirect", handleUnauthorized);
      window.removeEventListener("forbidden_redirect", handleForbidden);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const broadcastAuthEvent = (type: "LOGIN" | "LOGOUT") => {
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
        channel.postMessage({ type, timestamp: Date.now() });
        channel.close();
      } catch (err) {
        console.warn("Failed to broadcast auth event:", err);
      }
    }
  };

  const verifySession = async () => {
    const token = useAuthStore.getState().accessToken || localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = useAuthStore.getState().refreshToken || localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!token && !refreshToken) {
      setSessionStatus("unauthenticated");
      return;
    }

    try {
      setSessionStatus("loading");
      const profile = await AuthService.getCurrentUser();
      const currentAccessToken = useAuthStore.getState().accessToken || token || "";
      const currentRefreshToken = useAuthStore.getState().refreshToken || refreshToken || "";
      setAuthData(
        currentAccessToken,
        currentRefreshToken,
        profile
      );
      auditLogger.log("TOKEN_REFRESH_SUCCESS", { userId: profile.id, username: profile.username, tenantId: profile.tenantId });
    } catch (err) {
      auditLogger.log("TOKEN_REFRESH_FAILED", { details: "Session verification error" });
      console.warn("[Session Verification Error] Invalid session cookie/JWT. Flushing storage.", err);
      clearAuthData();
    }
  };

  const login = async (username: string, password: string): Promise<UserProfileDTO> => {
    clearAuthData();
    setSessionStatus("loading");
    auditLogger.log("LOGIN_ATTEMPT", { username, tenantId });
    try {
      const response = await AuthService.login({ username, password });
      
      setAuthData(
        response.accessToken,
        response.refreshToken,
        response.user
      );

      // Force refresh of default network configuration context
      if (response.user.tenantId) {
        apiClient.defaults.headers.common["X-Tenant-Id"] = response.user.tenantId;
      }

      auditLogger.log("LOGIN_SUCCESS", { userId: response.user.id, username: response.user.username, tenantId: response.user.tenantId });
      broadcastAuthEvent("LOGIN");
      showNotification("Session established. Welcome back!", "success");
      return response.user;
    } catch (err: any) {
      auditLogger.log("LOGIN_FAILED", { username, details: err.message });
      setSessionStatus("unauthenticated");
      const friendlyErr = handleApiError(err);
      showNotification(friendlyErr.message, "error");
      throw err;
    }
  };

  const logout = async () => {
    auditLogger.log("LOGOUT", { userId: user?.id, username: user?.username, tenantId });
    try {
      await AuthService.logout();
    } finally {
      clearAuthData();
      broadcastAuthEvent("LOGOUT");
    }
  };

  const updateTenantId = (id: string) => {
    if (!id || typeof id !== "string") return;
    auditLogger.log("TENANT_SWITCH", { userId: user?.id, tenantId: id });
    setTenantId(id);
    apiClient.defaults.headers.common["X-Tenant-Id"] = id;
  };

  const hasRole = (roles: USER_ROLE | USER_ROLE[] | string | string[]): boolean => {
    if (!user || !Array.isArray(user.roles)) return false;
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    // Normalise roles for maximum compatibility (e.g. "ROLE_SUPER_ADMIN" matches "SUPER_ADMIN" or "ADMIN")
    const cleanUserRoles = user.roles.map(r => r.toUpperCase().replace(/^ROLE_/, ""));
    
    return requiredRoles.some((reqRole) => {
      const cleanReqRole = reqRole.toUpperCase().replace(/^ROLE_/, "");
      // Special check: ADMIN matches SUPER_ADMIN or ADMIN
      if (cleanReqRole === "ADMIN" && (cleanUserRoles.includes("ADMIN") || cleanUserRoles.includes("SUPER_ADMIN"))) {
        return true;
      }
      // Special check: BIDDER matches BUYER or BIDDER
      if (cleanReqRole === "BIDDER" && (cleanUserRoles.includes("BUYER") || cleanUserRoles.includes("BIDDER"))) {
        return true;
      }
      // Special check: OPS matches OPERATIONS or OPS
      if (cleanReqRole === "OPS" && (cleanUserRoles.includes("OPERATIONS") || cleanUserRoles.includes("OPS"))) {
        return true;
      }
      return cleanUserRoles.includes(cleanReqRole) || user.roles.includes(reqRole as any);
    });
  };

  const hasPermission = (permission: string | string[]): boolean => {
    if (!user) return false;
    if (user.roles?.some(r => r === USER_ROLE.SUPER_ADMIN || r.includes("SUPER_ADMIN"))) {
      return true;
    }
    const reqPerms = Array.isArray(permission) ? permission : [permission];
    if (user.permissions && Array.isArray(user.permissions)) {
      if (reqPerms.some(p => user.permissions?.includes(p))) {
        return true;
      }
    }
    return hasRole(reqPerms as any);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        tenantId,
        login,
        logout,
        updateTenantId,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

