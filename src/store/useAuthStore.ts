import { create } from "zustand";
import { UserProfileDTO } from "../types/auth";
import { STORAGE_KEYS } from "../constants";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfileDTO | null;
  tenantId: string;
  sessionStatus: "authenticated" | "unauthenticated" | "loading";
  
  setAuthData: (accessToken: string, refreshToken: string, user: UserProfileDTO) => void;
  setTenantId: (tenantId: string) => void;
  clearAuthData: () => void;
  setSessionStatus: (status: "authenticated" | "unauthenticated" | "loading") => void;
  setUserProfile: (user: UserProfileDTO) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  user: (() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  tenantId: localStorage.getItem(STORAGE_KEYS.TENANT_ID) || "05f9024c-9f0e-4361-bd87-35ff5e019a2b",
  sessionStatus: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ? "authenticated" : "unauthenticated",

  setAuthData: (accessToken, refreshToken, user) => {
    if (accessToken) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
    if (user.tenantId) {
      localStorage.setItem(STORAGE_KEYS.TENANT_ID, user.tenantId);
    }
    set({
      accessToken,
      refreshToken,
      user,
      tenantId: user.tenantId || localStorage.getItem(STORAGE_KEYS.TENANT_ID) || "05f9024c-9f0e-4361-bd87-35ff5e019a2b",
      sessionStatus: "authenticated",
    });
  },

  setTenantId: (tenantId) => {
    localStorage.setItem(STORAGE_KEYS.TENANT_ID, tenantId);
    set({ tenantId });
  },

  clearAuthData: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      sessionStatus: "unauthenticated",
    });
  },

  setSessionStatus: (sessionStatus) => set({ sessionStatus }),
  
  setUserProfile: (user) => {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
    set({ user });
  },
}));

