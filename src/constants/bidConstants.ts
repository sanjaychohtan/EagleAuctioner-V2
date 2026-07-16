export const STOMP_DESTINATIONS = {
  LOT_TOPIC: (lotId: string) => `/topic/lot/${lotId}`,
  AUCTION_TOPIC: (auctionId: string) => `/topic/auction/${auctionId}`,
  USER_NOTIFICATIONS: "/user/queue/notifications",
};

export const BID_PERMISSIONS = {
  PLACE_BID: ["ROLE_BUYER", "BIDDER"], // Map Spring role to FE role if needed
  VIEW_HIGHEST_BID: ["ROLE_SELLER", "SELLER", "ROLE_BUYER", "BIDDER", "ROLE_SUPER_ADMIN", "ADMIN"],
  VIEW_BID_HISTORY: ["ROLE_SELLER", "SELLER", "ROLE_BUYER", "BIDDER", "ROLE_SUPER_ADMIN", "ADMIN"],
};
