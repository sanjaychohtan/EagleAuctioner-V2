import { create } from "zustand";
import {
  AuctionResponse,
  AuctionSummaryResponse,
  AuctionLotResponse,
} from "../types/auction";

export interface AuctionState {
  auctions: AuctionSummaryResponse[];
  currentAuction: AuctionResponse | null;
  loading: boolean;
  error: string | null;

  setAuctions: (auctions: AuctionSummaryResponse[]) => void;
  setCurrentAuction: (auction: AuctionResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  addAuctionSummary: (auction: AuctionSummaryResponse) => void;
  updateAuctionInList: (auction: AuctionSummaryResponse) => void;
  removeAuctionFromList: (id: string) => void;

  addLotToCurrent: (lot: AuctionLotResponse) => void;
  updateLotInCurrent: (lot: AuctionLotResponse) => void;
  removeLotFromCurrent: (lotId: string) => void;
  reorderLotsInCurrent: (sortedLotIds: string[]) => void;
}

export const useAuctionStore = create<AuctionState>((set) => ({
  auctions: [],
  currentAuction: null,
  loading: false,
  error: null,

  setAuctions: (auctions) => set({ auctions }),
  setCurrentAuction: (currentAuction) => set({ currentAuction, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addAuctionSummary: (auction) =>
    set((state) => ({
      auctions: [auction, ...state.auctions],
    })),

  updateAuctionInList: (auction) =>
    set((state) => ({
      auctions: state.auctions.map((a) => (a.id === auction.id ? auction : a)),
    })),

  removeAuctionFromList: (id) =>
    set((state) => ({
      auctions: state.auctions.filter((a) => a.id !== id),
    })),

  addLotToCurrent: (lot) =>
    set((state) => {
      if (!state.currentAuction) return state;
      const updatedLots = [...(state.currentAuction.lots || []), lot];
      return {
        currentAuction: {
          ...state.currentAuction,
          lots: updatedLots.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
        },
      };
    }),

  updateLotInCurrent: (lot) =>
    set((state) => {
      if (!state.currentAuction) return state;
      const updatedLots = (state.currentAuction.lots || []).map((l) =>
        l.id === lot.id ? lot : l
      );
      return {
        currentAuction: {
          ...state.currentAuction,
          lots: updatedLots.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
        },
      };
    }),

  removeLotFromCurrent: (lotId) =>
    set((state) => {
      if (!state.currentAuction) return state;
      return {
        currentAuction: {
          ...state.currentAuction,
          lots: (state.currentAuction.lots || []).filter((l) => l.id !== lotId),
        },
      };
    }),

  reorderLotsInCurrent: (sortedLotIds) =>
    set((state) => {
      if (!state.currentAuction) return state;
      const lotMap = new Map((state.currentAuction.lots || []).map((l) => [l.id, l]));
      const updatedLots = sortedLotIds
        .map((id, index) => {
          const lot = lotMap.get(id);
          if (lot) {
            return { ...lot, displayOrder: index };
          }
          return null;
        })
        .filter((l): l is AuctionLotResponse => l !== null);

      return {
        currentAuction: {
          ...state.currentAuction,
          lots: updatedLots,
        },
      };
    }),
}));

export default useAuctionStore;
