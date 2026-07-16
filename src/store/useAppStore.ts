import { create } from "zustand";
import { STORAGE_KEYS } from "../constants";

export interface AppState {
  themeMode: "light" | "dark";
  sidebarExpanded: boolean;
  globalLoading: boolean;
  setThemeMode: (mode: "light" | "dark") => void;
  toggleThemeMode: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  themeMode: (localStorage.getItem(STORAGE_KEYS.THEME_MODE) as "light" | "dark") || "light",
  sidebarExpanded: true,
  globalLoading: false,

  setThemeMode: (mode) => {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    set({ themeMode: mode });
  },

  toggleThemeMode: () => {
    set((state) => {
      const newMode = state.themeMode === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode);
      return { themeMode: newMode };
    });
  },

  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));
