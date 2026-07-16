import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { AuthService } from "../api/authService";
import { useAuthStore } from "../store/useAuthStore";
import { USER_ROLE, KYC_STATUS } from "../constants";
import { UserProfileDTO } from "../types/auth";
import { apiClient } from "../api/client";
import { useNotification } from "../providers/NotificationProvider";
import { handleApiError } from "../api/errorHandler";

interface AuthContextType {
  user: UserProfileDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tenantId: string;
  login: (username: string, password: string) => Promise<UserProfileDTO>;
  logout: () => Promise<void>;
  updateTenantId: (id: string) => void;
  hasRole: (roles: USER_ROLE | USER_ROLE[] | string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthData();
      showNotification("Your active session has expired or been terminated. Please sign in.", "warning");
    };

    const handleForbidden = () => {
      showNotification("Access denied. Your role has insufficient permissions to execute this request.", "error");
    };

    window.addEventListener("unauthorized_redirect", handleUnauthorized);
    window.addEventListener("forbidden_redirect", handleForbidden);
    verifySession();

    return () => {
      window.removeEventListener("unauthorized_redirect", handleUnauthorized);
      window.removeEventListener("forbidden_redirect", handleForbidden);
    };
  }, []);

  const verifySession = async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      setSessionStatus("unauthenticated");
      return;
    }

    try {
      setSessionStatus("loading");
      const profile = await AuthService.me();
      setAuthData(
        useAuthStore.getState().accessToken || "",
        useAuthStore.getState().refreshToken || "",
        profile
      );
    } catch (err) {
      console.warn("[Session Verification Error] Invalid session cookie/JWT. Flushing storage.", err);
      clearAuthData();
    }
  };

  const login = async (username: string, password: string): Promise<UserProfileDTO> => {
    setSessionStatus("loading");
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

      showNotification("Session established. Welcome back!", "success");
      return response.user;
    } catch (err: any) {
      setSessionStatus("unauthenticated");
      const friendlyErr = handleApiError(err);
      showNotification(friendlyErr.message, "error");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      clearAuthData();
    }
  };

  const updateTenantId = (id: string) => {
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

  const isAuthenticated = sessionStatus === "authenticated";
  const isLoading = sessionStatus === "loading";

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
