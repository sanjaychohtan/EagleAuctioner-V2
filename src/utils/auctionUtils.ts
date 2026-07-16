import { AuctionState, NEXT_VALID_STATES, AuctionResponse } from "../types/auction";

/**
 * Domain scheduling and configuration validator aligning perfectly with 
 * the Spring Boot Auction entity business rules.
 * 
 * Returns an object indicating whether validation passed, along with specific error messages.
 */
export const validateAuctionScheduling = (config: {
  registrationStart?: string | Date | null;
  registrationEnd?: string | Date | null;
  inspectionStart?: string | Date | null;
  inspectionEnd?: string | Date | null;
  auctionStart?: string | Date | null;
  auctionEnd?: string | Date | null;
  autoExtensionEnabled?: boolean | null;
  extensionMinutes?: number | null;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const parseTime = (val?: string | Date | null): number | null => {
    if (!val) return null;
    return new Date(val).getTime();
  };

  const regStart = parseTime(config.registrationStart);
  const regEnd = parseTime(config.registrationEnd);
  const inspStart = parseTime(config.inspectionStart);
  const inspEnd = parseTime(config.inspectionEnd);
  const aucStart = parseTime(config.auctionStart);
  const aucEnd = parseTime(config.auctionEnd);

  if (regStart !== null && regEnd !== null && regStart >= regEnd) {
    errors.push("Registration start must be before registration end");
  }

  if (inspStart !== null && inspEnd !== null && inspStart >= inspEnd) {
    errors.push("Inspection start must be before inspection end");
  }

  if (aucStart !== null && aucEnd !== null && aucStart >= aucEnd) {
    errors.push("Auction start must be before auction end");
  }

  if (regEnd !== null && aucStart !== null && regEnd > aucStart) {
    errors.push("Registration end must be before or equal to auction start");
  }

  if (config.autoExtensionEnabled === true) {
    if (config.extensionMinutes === null || config.extensionMinutes === undefined || config.extensionMinutes <= 0) {
      errors.push("Extension minutes must be greater than 0 when auto-extension is enabled");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Checks if a proposed transition from currentState to targetState is valid 
 * in the Auction lifecycle state machine.
 */
export const canTransitionAuctionState = (
  currentState: AuctionState,
  targetState: AuctionState
): boolean => {
  if (currentState === targetState) {
    return true; // Self-transition is always allowed (idempotent)
  }
  const validTargets = NEXT_VALID_STATES[currentState] || [];
  return validTargets.includes(targetState);
};

/**
 * Returns the list of valid next target states from the current state.
 */
export const getNextValidAuctionStates = (currentState: AuctionState): AuctionState[] => {
  return NEXT_VALID_STATES[currentState] || [];
};

/**
 * Formats a Date or ISO string into a standard readable date and time string.
 */
export const formatAuctionDateTime = (dateVal: string | Date, locale = "en-US"): string => {
  try {
    const date = new Date(dateVal);
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch (err) {
    console.error("Error formatting date:", err);
    return String(dateVal);
  }
};

/**
 * Calculates the duration (in milliseconds or formatted string) between two dates.
 */
export const getDurationBetween = (startVal: string | Date, endVal: string | Date): string => {
  try {
    const diffMs = new Date(endVal).getTime() - new Date(startVal).getTime();
    if (diffMs <= 0) return "0s";

    const diffSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(diffSecs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${mins % 60}m`;
    }
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`;
    }
    if (mins > 0) {
      return `${mins}m ${diffSecs % 60}s`;
    }
    return `${diffSecs}s`;
  } catch {
    return "N/A";
  }
};

/**
 * Formats currency values nicely according to the ISO 3-letter currency code.
 */
export const formatAuctionCurrency = (amount: number, currency: string): string => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "INR"} ${amount.toFixed(2)}`;
  }
};

/**
 * Computes the total starting valuation of all lots inside an auction (startingPrice * quantity).
 */
export const calculateTotalLotsValue = (auction: AuctionResponse): number => {
  if (!auction.lots || auction.lots.length === 0) return 0;
  return auction.lots.reduce((total, lot) => {
    return total + (lot.startingPrice || 0) * (lot.quantity || 1);
  }, 0);
};

/**
 * Determines if the auction is actively in its live bidding window.
 */
export const isAuctionCurrentlyLive = (auction: AuctionResponse): boolean => {
  if (auction.state !== AuctionState.LIVE) return false;
  const now = Date.now();
  const start = new Date(auction.auctionStart).getTime();
  const end = new Date(auction.auctionEnd).getTime();
  return now >= start && now <= end;
};

/**
 * Returns a human-friendly label and color classification classes for tailwind 
 * corresponding to the current state.
 */
export const getAuctionStatusConfig = (state: AuctionState): { label: string; badgeClass: string } => {
  switch (state) {
    case AuctionState.DRAFT:
      return { label: "Draft", badgeClass: "bg-slate-100 text-slate-800 border-slate-200" };
    case AuctionState.UNDER_REVIEW:
      return { label: "Under Review", badgeClass: "bg-amber-100 text-amber-800 border-amber-200" };
    case AuctionState.APPROVED:
      return { label: "Approved", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    case AuctionState.REJECTED:
      return { label: "Rejected", badgeClass: "bg-rose-100 text-rose-800 border-rose-200" };
    case AuctionState.PUBLISHED:
      return { label: "Published", badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200" };
    case AuctionState.LIVE:
      return { label: "Live Active", badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse" };
    case AuctionState.ENDED:
      return { label: "Ended", badgeClass: "bg-purple-100 text-purple-800 border-purple-200" };
    case AuctionState.SETTLED:
      return { label: "Settled", badgeClass: "bg-teal-100 text-teal-800 border-teal-200" };
    case AuctionState.CANCELLED:
      return { label: "Cancelled", badgeClass: "bg-gray-100 text-gray-800 border-gray-200" };
    case AuctionState.SUSPENDED:
      return { label: "Suspended", badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    case AuctionState.ARCHIVED:
      return { label: "Archived", badgeClass: "bg-stone-100 text-stone-800 border-stone-200" };
    default:
      return { label: String(state), badgeClass: "bg-slate-100 text-slate-800" };
  }
};
