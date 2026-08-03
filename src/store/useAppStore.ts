import { create } from "zustand";
import { STORAGE_KEYS } from "../constants";

export interface WidgetItem {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
}

export interface AppState {
  themeMode: "light" | "dark";
  sidebarExpanded: boolean;
  globalLoading: boolean;
  widgets: WidgetItem[];
  setThemeMode: (mode: "light" | "dark") => void;
  toggleThemeMode: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  toggleWidget: (id: string) => void;
  resetWidgets: () => void;
}

const DEFAULT_WIDGETS: WidgetItem[] = [
  { id: "w-quick", name: "Quick Commands", category: "Actions", enabled: true },
  { id: "w-wallet", name: "EMR Wallet Pool", category: "Finance", enabled: true },
  { id: "w-ai", name: "AI Analytics Insights", category: "Intelligence", enabled: true },
  { id: "w-calendar", name: "Auction Calendar", category: "Schedule", enabled: true },
  { id: "w-system", name: "System Telemetry", category: "SRE", enabled: true },
  { id: "w-timeline", name: "Activity Feed", category: "Audit", enabled: true },
  { id: "w-export", name: "Reports Export Center", category: "Reports", enabled: true }
];

const PREFERENCES_VERSION = 1;

const loadWidgetPreferences = (): WidgetItem[] => {
  try {
    const raw = localStorage.getItem("ea_widget_preferences");
    if (!raw) return DEFAULT_WIDGETS;
    const parsed = JSON.parse(raw);
    if (parsed.version !== PREFERENCES_VERSION) {
      localStorage.setItem("ea_widget_preferences", JSON.stringify({ version: PREFERENCES_VERSION, data: DEFAULT_WIDGETS }));
      return DEFAULT_WIDGETS;
    }
    const storedData = parsed.data as WidgetItem[];
    return DEFAULT_WIDGETS.map(def => {
      const match = storedData.find(s => s.id === def.id);
      return match ? { ...def, enabled: match.enabled } : def;
    });
  } catch (e) {
    return DEFAULT_WIDGETS;
  }
};

const saveWidgetPreferences = (widgets: WidgetItem[]) => {
  localStorage.setItem("ea_widget_preferences", JSON.stringify({
    version: PREFERENCES_VERSION,
    data: widgets
  }));
};

export const useAppStore = create<AppState>((set) => ({
  themeMode: (localStorage.getItem(STORAGE_KEYS.THEME_MODE) as "light" | "dark") || "light",
  sidebarExpanded: true,
  globalLoading: false,
  widgets: loadWidgetPreferences(),

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

  toggleWidget: (id) => {
    set((state) => {
      const updated = state.widgets.map((w) => w.id === id ? { ...w, enabled: !w.enabled } : w);
      saveWidgetPreferences(updated);
      return { widgets: updated };
    });
  },

  resetWidgets: () => {
    const updated = DEFAULT_WIDGETS.map((w) => ({ ...w, enabled: true }));
    saveWidgetPreferences(updated);
    set({ widgets: updated });
  }
}));
