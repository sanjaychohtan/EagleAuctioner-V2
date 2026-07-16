import { create } from "zustand";

interface AdminKycState {
  selectedProfileId: string | null;
  filterState: string;
  searchQuery: string;
  activeDocPreview: { type: string; url?: string } | null;
  
  setSelectedProfileId: (id: string | null) => void;
  setFilterState: (state: string) => void;
  setSearchQuery: (query: string) => void;
  setActiveDocPreview: (preview: { type: string; url?: string } | null) => void;
  resetAdminStore: () => void;
}

export const useAdminKycStore = create<AdminKycState>((set) => ({
  selectedProfileId: null,
  filterState: "ALL",
  searchQuery: "",
  activeDocPreview: null,

  setSelectedProfileId: (id) => set({ selectedProfileId: id }),
  setFilterState: (state) => set({ filterState: state }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveDocPreview: (preview) => set({ activeDocPreview: preview }),
  resetAdminStore: () => set({
    selectedProfileId: null,
    filterState: "ALL",
    searchQuery: "",
    activeDocPreview: null
  })
}));
