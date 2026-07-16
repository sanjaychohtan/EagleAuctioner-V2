export enum BidStatus {
  PLACED = "PLACED",
  OUTBID = "OUTBID",
  WINNING = "WINNING",
  WITHDRAWN = "WITHDRAWN",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
  SEALED = "SEALED",
}

export interface PlaceBidRequest {
  bidAmount: number;
}

export interface PlaceSealedBidRequest {
  bidAmount: number;
  encryptedPayload?: string; // Optional for advanced security
}

export interface BidResponse {
  bidId: string;
  lotId: string;
  bidderId: string;
  bidAmount: number; // For Sealed/Rank might be 0/hidden depending on rules
  bidStatus: BidStatus;
  anonymousBidderCode?: string | null;
  currentRank?: number | null; // For RANK_BASED
}

export interface RankStatusResponse {
  lotId: string;
  bidderId: string;
  currentRank: number;
  totalBidders: number;
  timestamp: string;
}

export interface BidHistoryResponse {
  oldHighestBid: number | null;
  newHighestBid: number;
  timestamp: string;
  eventType: string;
  anonymousWinnerBefore: string | null;
  anonymousWinnerAfter: string | null;
  rank?: number | null;
}

export enum AuctionEventType {
  BID_PLACED = "BID_PLACED",
  OUTBID = "OUTBID",
  AUTO_EXTENSION = "AUTO_EXTENSION",
  LOT_CLOSED = "LOT_CLOSED",
  AUCTION_STARTED = "AUCTION_STARTED",
  AUCTION_ENDED = "AUCTION_ENDED",
  WINNER_DECLARED = "WINNER_DECLARED",
  RANK_UPDATED = "RANK_UPDATED",
  SEALED_BIDS_OPENED = "SEALED_BIDS_OPENED",
}

export interface WebSocketAuctionEvent {
  eventId: string;
  eventType: AuctionEventType;
  payload: string | any;
  timestamp: string;
  triggeredBy: string;
}

export interface SealedBidOpeningResponse {
  lotId: string;
  openedBids: BidResponse[];
  winner: BidResponse | null;
  openingTime: string;
}
