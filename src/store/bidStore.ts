import { create } from "zustand";
import { WebSocketAuctionEvent } from "../types/bid";

interface LotRealTimeState {
  highestBid: number | null;
  currentWinner: string | null;
  status: string;
  endTime: string | null;
  currentRank: number | null;
}

interface BidState {
  activeLots: Record<string, LotRealTimeState>;
  recentEvents: WebSocketAuctionEvent[];
  myProxyBids: Record<string, number>;
  mySealedBids: Record<string, number>;

  // Actions
  updateLotState: (lotId: string, update: Partial<LotRealTimeState>) => void;
  addEvent: (event: WebSocketAuctionEvent) => void;
  clearEvents: () => void;
  setProxyBid: (lotId: string, amount: number) => void;
  removeProxyBid: (lotId: string) => void;
  setSealedBid: (lotId: string, amount: number) => void;
}

export const useBidStore = create<BidState>((set) => ({
  activeLots: {},
  recentEvents: [],
  myProxyBids: {},
  mySealedBids: {},

  updateLotState: (lotId, update) =>
    set((state) => ({
      activeLots: {
        ...state.activeLots,
        [lotId]: {
          ...(state.activeLots[lotId] || {
            highestBid: null,
            currentWinner: null,
            status: "UNKNOWN",
            endTime: null,
            currentRank: null,
          }),
          ...update,
        },
      },
    })),

  addEvent: (event) =>
    set((state) => {
      // Keep only the most recent 100 events in memory
      const newEvents = [event, ...state.recentEvents].slice(0, 100);
      return { recentEvents: newEvents };
    }),

  clearEvents: () => set({ recentEvents: [] }),

  setProxyBid: (lotId, amount) =>
    set((state) => ({
      myProxyBids: { ...state.myProxyBids, [lotId]: amount },
    })),

  removeProxyBid: (lotId) =>
    set((state) => {
      const newProxies = { ...state.myProxyBids };
      delete newProxies[lotId];
      return { myProxyBids: newProxies };
    }),

  setSealedBid: (lotId, amount) =>
    set((state) => ({
      mySealedBids: { ...state.mySealedBids, [lotId]: amount },
    })),
}));
