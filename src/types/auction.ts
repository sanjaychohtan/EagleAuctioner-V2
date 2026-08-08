/**
 * AUCTBIZ - Auction Type Definitions & DTOs
 * Standard enterprise types aligning perfectly with the Spring Boot RC2 backend specifications.
 */

export enum AuctionState {
  DRAFT = "DRAFT",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PUBLISHED = "PUBLISHED",
  LIVE = "LIVE",
  ENDED = "ENDED",
  SETTLED = "SETTLED",
  CANCELLED = "CANCELLED",
  SUSPENDED = "SUSPENDED",
  ARCHIVED = "ARCHIVED",
}

export enum AuctionType {
  FORWARD = "FORWARD",
  REVERSE = "REVERSE",
  SEALED_BID = "SEALED_BID",
  RANK_BASED = "RANK_BASED",
}

export enum AuctionVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
  RESTRICTED = "RESTRICTED",
}

export enum AuctionLotStatus {
  DRAFT = "DRAFT",
  READY = "READY",
  LIVE = "LIVE",
  SOLD = "SOLD",
  UNSOLD = "UNSOLD",
  CANCELLED = "CANCELLED",
}

// Next Valid States Transition Map representing the domain state machine rules
export const NEXT_VALID_STATES: Record<AuctionState, AuctionState[]> = {
  [AuctionState.DRAFT]: [AuctionState.UNDER_REVIEW],
  [AuctionState.UNDER_REVIEW]: [AuctionState.APPROVED, AuctionState.REJECTED],
  [AuctionState.APPROVED]: [AuctionState.PUBLISHED, AuctionState.CANCELLED],
  [AuctionState.REJECTED]: [AuctionState.DRAFT, AuctionState.UNDER_REVIEW],
  [AuctionState.PUBLISHED]: [AuctionState.LIVE, AuctionState.CANCELLED, AuctionState.SUSPENDED],
  [AuctionState.LIVE]: [AuctionState.ENDED, AuctionState.CANCELLED, AuctionState.SUSPENDED],
  [AuctionState.ENDED]: [AuctionState.SETTLED, AuctionState.CANCELLED],
  [AuctionState.SETTLED]: [AuctionState.ARCHIVED],
  [AuctionState.CANCELLED]: [AuctionState.ARCHIVED],
  [AuctionState.SUSPENDED]: [AuctionState.PUBLISHED, AuctionState.LIVE, AuctionState.CANCELLED],
  [AuctionState.ARCHIVED]: [],
};

// Standard API Envelope Response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

// Create Auction Request DTO
export interface CreateAuctionRequest {
  title: string;
  description?: string;
  sellerProfileId?: string; // UUID. Resolves to current seller on backend, but optionally provided
  auctionType: AuctionType;
  visibility: AuctionVisibility;
  currency: string;
  timezone: string;
  registrationStart: string; // ISO 8601 string (Instant)
  registrationEnd: string;
  inspectionStart?: string;
  inspectionEnd?: string;
  auctionStart: string;
  auctionEnd: string;
  reservePriceEnabled?: boolean;
  autoExtensionEnabled?: boolean;
  extensionMinutes?: number;
}

// Update Auction Request DTO
export interface UpdateAuctionRequest {
  title: string;
  description?: string;
  auctionType: AuctionType;
  visibility: AuctionVisibility;
  currency: string;
  timezone: string;
  registrationStart: string;
  registrationEnd: string;
  inspectionStart?: string;
  inspectionEnd?: string;
  auctionStart: string;
  auctionEnd: string;
  reservePriceEnabled?: boolean;
  autoExtensionEnabled?: boolean;
  extensionMinutes?: number;
}

// Update Auction Settings Request DTO
export interface UpdateSettingsRequest {
  anonymousBidding?: boolean;
  allowAutoExtension?: boolean;
  extensionMinutes?: number;
  maxExtensions?: number;
  bidIncrementType?: string;
  minimumIncrement?: number;
  reservePriceEnabled?: boolean;
  allowProxyBid?: boolean;
  allowManualWinner?: boolean;
  allowSellerApproval?: boolean;
  allowBidWithdrawal?: boolean;
  allowRankDisplay?: boolean;
  showBidderNames?: boolean;
  registrationRequired?: boolean;
  emdRequired?: boolean;
  timezone?: string;
}

// Create Lot Request DTO
export interface CreateLotRequest {
  lotNumber: string;
  title: string;
  description?: string;
  materialCategory: string;
  quantity: number;
  unitOfMeasure: string;
  startingPrice: number;
  reservePrice?: number;
  minimumIncrement: number;
  currency: string;
  displayOrder?: number;
}

// Update Lot Request DTO
export interface UpdateLotRequest {
  lotNumber: string;
  title: string;
  description?: string;
  materialCategory: string;
  quantity: number;
  unitOfMeasure: string;
  startingPrice: number;
  reservePrice?: number;
  minimumIncrement: number;
  currency: string;
  displayOrder?: number;
}

// Auction Settings Response DTO
export interface AuctionSettingsResponse {
  id: string;
  anonymousBidding: boolean;
  allowAutoExtension: boolean;
  extensionMinutes: number;
  maxExtensions: number;
  bidIncrementType: string;
  minimumIncrement: number;
  reservePriceEnabled: boolean;
  allowProxyBid: boolean;
  allowManualWinner: boolean;
  allowSellerApproval: boolean;
  allowBidWithdrawal: boolean;
  allowRankDisplay: boolean;
  showBidderNames: boolean;
  registrationRequired: boolean;
  emdRequired: boolean;
  timezone: string;
}

// Auction Lot Response DTO
export interface AuctionLotResponse {
  id: string;
  auctionId: string;
  lotNumber: string;
  title: string;
  description?: string;
  materialCategory: string;
  quantity: number;
  unitOfMeasure: string;
  startingPrice: number;
  reservePrice?: number;
  currentHighestBid?: number;
  minimumIncrement: number;
  currency: string;
  lotStatus: AuctionLotStatus;
  winnerBidderId?: string;
  displayOrder: number;
}

// Full Auction Response DTO
export interface AuctionResponse {
  id: string;
  auctionNumber: string;
  title: string;
  description?: string;
  sellerProfileId: string;
  sellerCompanyName?: string;
  state: AuctionState;
  auctionType: AuctionType;
  visibility: AuctionVisibility;
  currency: string;
  timezone: string;
  registrationStart: string;
  registrationEnd: string;
  inspectionStart?: string;
  inspectionEnd?: string;
  auctionStart: string;
  auctionEnd: string;
  reservePriceEnabled: boolean;
  autoExtensionEnabled: boolean;
  extensionMinutes?: number;
  settings?: AuctionSettingsResponse;
  lots: AuctionLotResponse[];
  createdAt: string;
  updatedAt: string;
}

// Auction Summary Response DTO
export interface AuctionSummaryResponse {
  id: string;
  auctionNumber: string;
  title: string;
  state: AuctionState;
  auctionType: AuctionType;
  visibility: AuctionVisibility;
  auctionStart: string;
  auctionEnd: string;
  lotCount: number;
}

// Reorder Lots Request DTO
export interface LotSortRequest {
  sortedLotIds: string[];
}
