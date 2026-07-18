import express from "express";
import { createServer } from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

const app = express();
const httpServer = createServer(app);
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- IN-MEMORY DATABASE STATE ---
const users = [
  {
    id: "user-super-admin",
    username: "admin",
    email: "admin@eagle-auctioner.in",
    roles: ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"],
    kycStatus: "APPROVED",
    tenantId: "05f9024c-9f0e-4361-bd87-35ff5e019a2b",
  },
  {
    id: "user-seller",
    username: "seller",
    email: "seller@eagle-auctioner.in",
    roles: ["ROLE_SELLER"],
    kycStatus: "APPROVED",
    tenantId: "05f9024c-9f0e-4361-bd87-35ff5e019a2b",
  },
  {
    id: "user-buyer",
    username: "buyer",
    email: "buyer@eagle-auctioner.in",
    roles: ["ROLE_BUYER"],
    kycStatus: "APPROVED",
    tenantId: "05f9024c-9f0e-4361-bd87-35ff5e019a2b",
  },
  {
    id: "user-finance",
    username: "finance",
    email: "finance@eagle-auctioner.in",
    roles: ["ROLE_FINANCE"],
    kycStatus: "APPROVED",
    tenantId: "05f9024c-9f0e-4361-bd87-35ff5e019a2b",
  },
];

let auctions = [
  {
    id: "auc-1",
    auctionNumber: "AUC-2026-0001",
    title: "National Highway Scrap Iron Core",
    description: "Forward salvage auction for industrial-grade scrap iron structures on NH-12 bypass route.",
    sellerProfileId: "user-seller",
    sellerCompanyName: "National Highway Authority",
    state: "LIVE",
    auctionType: "FORWARD",
    visibility: "PUBLIC",
    currency: "INR",
    timezone: "IST",
    registrationStart: new Date().toISOString(),
    registrationEnd: new Date(Date.now() + 86400000).toISOString(),
    auctionStart: new Date().toISOString(),
    auctionEnd: new Date(Date.now() + 3600000 * 2).toISOString(), // 2 hours from now
    reservePriceEnabled: true,
    autoExtensionEnabled: true,
    extensionMinutes: 5,
    settings: {
      id: "settings-1",
      anonymousBidding: false,
      allowAutoExtension: true,
      extensionMinutes: 5,
      maxExtensions: 10,
      bidIncrementType: "ABSOLUTE",
      minimumIncrement: 500,
      reservePriceEnabled: true,
      allowProxyBid: true,
      allowManualWinner: false,
      allowSellerApproval: true,
      allowBidWithdrawal: false,
      allowRankDisplay: true,
      showBidderNames: false,
      registrationRequired: true,
      emdRequired: true,
      timezone: "IST",
    },
    lots: [
      {
        id: "lot-1",
        auctionId: "auc-1",
        lotNumber: "LOT-01",
        title: "Heavy Scrap Beam Steel (50 Tons)",
        description: "Standard structural scrap columns recovered from elevated bridges.",
        materialCategory: "Iron & Steel",
        quantity: 50,
        unitOfMeasure: "Metric Tons",
        startingPrice: 150000,
        reservePrice: 200000,
        currentHighestBid: 165000,
        minimumIncrement: 500,
        currency: "INR",
        lotStatus: "LIVE",
        displayOrder: 1,
      },
      {
        id: "lot-2",
        auctionId: "auc-1",
        lotNumber: "LOT-02",
        title: "Reinforcement Bars Scrap (12 Tons)",
        description: "Bundled deformed concrete reinforcement bars.",
        materialCategory: "Iron & Steel",
        quantity: 12,
        unitOfMeasure: "Metric Tons",
        startingPrice: 40000,
        reservePrice: 50000,
        currentHighestBid: 42000,
        minimumIncrement: 500,
        currency: "INR",
        lotStatus: "LIVE",
        displayOrder: 2,
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "auc-2",
    auctionNumber: "AUC-2026-0002",
    title: "Premium Copper Cable Consignment",
    description: "High-integrity electrical cables scrap with pure copper conductor structures.",
    sellerProfileId: "user-seller",
    sellerCompanyName: "Apex Telecom Corp",
    state: "APPROVED",
    auctionType: "FORWARD",
    visibility: "PUBLIC",
    currency: "INR",
    timezone: "IST",
    registrationStart: new Date().toISOString(),
    registrationEnd: new Date(Date.now() + 172800000).toISOString(),
    auctionStart: new Date(Date.now() + 172800000).toISOString(),
    auctionEnd: new Date(Date.now() + 172800000 + 3600000 * 4).toISOString(),
    reservePriceEnabled: false,
    autoExtensionEnabled: true,
    extensionMinutes: 3,
    settings: {
      id: "settings-2",
      anonymousBidding: true,
      allowAutoExtension: true,
      extensionMinutes: 3,
      maxExtensions: 5,
      bidIncrementType: "ABSOLUTE",
      minimumIncrement: 1000,
      reservePriceEnabled: false,
      allowProxyBid: false,
      allowManualWinner: false,
      allowSellerApproval: false,
      allowBidWithdrawal: false,
      allowRankDisplay: false,
      showBidderNames: false,
      registrationRequired: true,
      emdRequired: false,
      timezone: "IST",
    },
    lots: [
      {
        id: "lot-3",
        auctionId: "auc-2",
        lotNumber: "LOT-01",
        title: "Insulated Copper Wire Rolls (3 Tons)",
        description: "Thick core communication cables.",
        materialCategory: "Copper & Brass",
        quantity: 3,
        unitOfMeasure: "Metric Tons",
        startingPrice: 240000,
        reservePrice: 240000,
        minimumIncrement: 1000,
        currency: "INR",
        lotStatus: "READY",
        displayOrder: 1,
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

let bidHistories: Record<string, Array<{
  id: string;
  lotId: string;
  bidderId: string;
  bidderUsername: string;
  amount: number;
  currency: string;
  status: "ACTIVE" | "OUTBID" | "WINNER" | "WITHDRAWN";
  timestamp: string;
  isAutoBid: boolean;
}>> = {
  "lot-1": [
    {
      id: "bid-1",
      lotId: "lot-1",
      bidderId: "user-buyer",
      bidderUsername: "buyer",
      amount: 155000,
      currency: "INR",
      status: "OUTBID",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isAutoBid: false,
    },
    {
      id: "bid-2",
      lotId: "lot-1",
      bidderId: "user-super-admin",
      bidderUsername: "admin",
      amount: 165000,
      currency: "INR",
      status: "ACTIVE",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      isAutoBid: false,
    }
  ],
  "lot-2": [
    {
      id: "bid-3",
      lotId: "lot-2",
      bidderId: "user-buyer",
      bidderUsername: "buyer",
      amount: 42000,
      currency: "INR",
      status: "ACTIVE",
      timestamp: new Date(Date.now() - 900000).toISOString(),
      isAutoBid: false,
    }
  ]
};

let settlements = [
  {
    settlementId: "set-1",
    referenceNo: "SET-2026-8801",
    auctionId: "auc-1",
    lotId: "lot-1",
    sellerId: "user-seller",
    buyerId: "user-buyer",
    grossAmount: 165000,
    platformFee: 3300,
    taxAmount: 594,
    netAmount: 161106,
    currency: "INR",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

let invoices = [
  {
    invoiceId: "inv-1",
    invoiceNumber: "INV-2026-9041",
    type: "FEE_INVOICE",
    amount: 3300,
    taxAmount: 594,
    totalAmount: 3894,
    currency: "INR",
    status: "UNPAID",
    issuedTo: "user-seller",
    issuedDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
  }
];

let ledgerEntries = [
  {
    ledgerId: "led-1",
    transactionId: "TXN-9021-3312",
    accountId: "ACC-REVENUE-MAIN",
    accountType: "PLATFORM_REVENUE",
    entryType: "CREDIT",
    amount: 3300,
    currency: "INR",
    description: "Platform system onboarding clearance fee under SLA audit log.",
    timestamp: new Date().toISOString(),
  }
];

interface Refund {
  refundId: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  requestedBy: string;
  requestedAt: string;
  processedAt?: string;
}

let refunds: Refund[] = [
  {
    refundId: "ref-1",
    paymentId: "pay-1",
    amount: 15000,
    reason: "Excess deposit balance on SBI NetBanking gateway.",
    status: "PENDING",
    requestedBy: "user-buyer",
    requestedAt: new Date().toISOString(),
  }
];

let payments = [
  {
    paymentId: "pay-1",
    referenceNo: "PAY-REF-44123",
    amount: 15000,
    currency: "INR",
    paymentMethod: "SBI Cash Gateway",
    status: "PENDING",
    userId: "user-buyer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

let wallet = {
  walletId: "wal-9912",
  userId: "user-buyer",
  availableBalance: 4500000,
  lockedBalance: 500000,
  currency: "INR",
  lastUpdated: new Date().toISOString(),
};

// --- REST API ENDPOINTS ---

// 1. JWT Authentication Routes
app.post("/api/auth/login", (req, res) => {
  const { username } = req.body;
  console.log(`[Mock Backend] Logging in user: ${username}`);
  
  // Find standard user or generate dynamic user profile mapping the requested role
  let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (!user) {
    // Dynamically grant standard capabilities based on username keyword or default to Admin
    let roles = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"];
    if (username.includes("seller")) roles = ["ROLE_SELLER"];
    else if (username.includes("buyer")) roles = ["ROLE_BUYER"];
    else if (username.includes("finance")) roles = ["ROLE_FINANCE"];
    else if (username.includes("compliance")) roles = ["ROLE_COMPLIANCE"];
    else if (username.includes("operations")) roles = ["ROLE_OPERATIONS"];
    
    user = {
      id: `user-${username}-${Math.random().toString(36).substring(2, 6)}`,
      username,
      email: `${username}@eagle-auctioner.in`,
      roles: roles as any[],
      kycStatus: "APPROVED",
      tenantId: "05f9024c-9f0e-4361-bd87-35ff5e019a2b",
    };
  }

  res.json({
    accessToken: `mock-jwt-access-${user.id}-${Date.now()}`,
    refreshToken: `mock-jwt-refresh-${user.id}-${Date.now()}`,
    user,
  });
});

app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

app.post("/api/auth/refresh", (req, res) => {
  res.json({
    accessToken: `mock-jwt-access-refreshed-${Date.now()}`,
    refreshToken: `mock-jwt-refresh-refreshed-${Date.now()}`,
  });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/Bearer mock-jwt-access-([^-]+)/);
  const userId = match ? match[1] : "user-super-admin";
  
  let user = users.find(u => u.id === userId);
  if (!user) {
    user = users[0]; // fallback
  }
  res.json(user);
});

app.post("/api/auth/forgot-password", (req, res) => {
  res.json({ success: true, message: "Recovery credentials dispatched." });
});

app.post("/api/auth/reset-password", (req, res) => {
  res.json({ success: true, message: "Security passphrase synchronized." });
});

app.post("/api/auth/sessions/:id/revoke", (req, res) => {
  res.json({ success: true, message: "Session revoked." });
});

app.post("/api/auth/change-password", (req, res) => {
  res.json({ success: true, message: "Password updated successfully." });
});

// 2. KYC Onboarding
app.post("/api/onboarding/register", (req, res) => {
  res.json({
    id: `onb-${Math.random().toString(36).substring(2, 9)}`,
    userId: "user-super-admin",
    email: "admin@eagle-auctioner.in",
    state: "APPROVED",
    bidderType: req.body.bidderType || "INDIVIDUAL",
    maskedPan: "AAXXXXX42C",
    maskedAadhaar: "XXXX-XXXX-9021",
    panVerificationStatus: "VERIFIED",
    aadhaarVerificationStatus: "VERIFIED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
});

app.get("/api/kyc/status", (req, res) => {
  res.json({ kycStatus: "APPROVED" });
});

// 3. Auctions
app.get("/api/v1/auctions", (req, res) => {
  const summaries = auctions.map(a => ({
    id: a.id,
    auctionNumber: a.auctionNumber,
    title: a.title,
    state: a.state,
    auctionType: a.auctionType,
    visibility: a.visibility,
    auctionStart: a.auctionStart,
    auctionEnd: a.auctionEnd,
    lotCount: a.lots.length,
  }));
  res.json({ success: true, data: summaries });
});

app.post("/api/v1/auctions", (req, res) => {
  const id = `auc-${Math.random().toString(36).substring(2, 9)}`;
  const num = `AUC-2026-00${Math.floor(1000 + Math.random() * 9000)}`;
  const newAuc = {
    id,
    auctionNumber: num,
    title: req.body.title || "Untitled Draft Auction",
    description: req.body.description || "",
    sellerProfileId: "user-seller",
    sellerCompanyName: "Sandbox Operations Team",
    state: "DRAFT",
    auctionType: req.body.auctionType || "FORWARD",
    visibility: req.body.visibility || "PUBLIC",
    currency: req.body.currency || "INR",
    timezone: req.body.timezone || "IST",
    registrationStart: req.body.registrationStart || new Date().toISOString(),
    registrationEnd: req.body.registrationEnd || new Date(Date.now() + 86400000).toISOString(),
    auctionStart: req.body.auctionStart || new Date().toISOString(),
    auctionEnd: req.body.auctionEnd || new Date(Date.now() + 3600000).toISOString(),
    reservePriceEnabled: req.body.reservePriceEnabled || false,
    autoExtensionEnabled: req.body.autoExtensionEnabled || false,
    extensionMinutes: req.body.extensionMinutes || 5,
    settings: {
      id: `settings-${id}`,
      anonymousBidding: false,
      allowAutoExtension: req.body.autoExtensionEnabled || false,
      extensionMinutes: req.body.extensionMinutes || 5,
      maxExtensions: 10,
      bidIncrementType: "ABSOLUTE",
      minimumIncrement: 100,
      reservePriceEnabled: req.body.reservePriceEnabled || false,
      allowProxyBid: false,
      allowManualWinner: false,
      allowSellerApproval: false,
      allowBidWithdrawal: false,
      allowRankDisplay: true,
      showBidderNames: false,
      registrationRequired: true,
      emdRequired: false,
      timezone: "IST",
    },
    lots: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  auctions.push(newAuc);
  res.json({ success: true, data: newAuc });
});

app.get("/api/v1/auctions/:id", (req, res) => {
  const auc = auctions.find(a => a.id === req.params.id);
  if (!auc) return res.status(404).json({ success: false, message: "Auction not found" });
  res.json({ success: true, data: auc });
});

app.put("/api/v1/auctions/:id", (req, res) => {
  const idx = auctions.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Auction not found" });
  
  auctions[idx] = {
    ...auctions[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  res.json({ success: true, data: auctions[idx] });
});

app.put("/api/v1/auctions/:id/settings", (req, res) => {
  const idx = auctions.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Auction not found" });
  
  auctions[idx].settings = {
    ...auctions[idx].settings,
    ...req.body,
  };
  res.json({ success: true, data: auctions[idx] });
});

app.post("/api/v1/auctions/:id/submit-review", (req, res) => {
  const idx = auctions.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Auction not found" });
  auctions[idx].state = "UNDER_REVIEW";
  res.json({ success: true, data: auctions[idx] });
});

app.post("/api/v1/auctions/:id/approve", (req, res) => {
  const idx = auctions.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Auction not found" });
  auctions[idx].state = "APPROVED";
  res.json({ success: true, data: auctions[idx] });
});

app.post("/api/v1/auctions/:id/reject", (req, res) => {
  const idx = auctions.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Auction not found" });
  auctions[idx].state = "REJECTED";
  res.json({ success: true, data: auctions[idx] });
});

app.post("/api/v1/auctions/:id/publish", (req, res) => {
  const idx = auctions.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Auction not found" });
  auctions[idx].state = "LIVE";
  res.json({ success: true, data: auctions[idx] });
});

app.post("/api/v1/auctions/:id/cancel", (req, res) => {
  const idx = auctions.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Auction not found" });
  auctions[idx].state = "CANCELLED";
  res.json({ success: true, data: auctions[idx] });
});

app.post("/api/v1/auctions/:id/archive", (req, res) => {
  const idx = auctions.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Auction not found" });
  auctions[idx].state = "ARCHIVED";
  res.json({ success: true, data: auctions[idx] });
});

// 4. Lots
app.post("/api/v1/lots/auctions/:auctionId", (req, res) => {
  const auc = auctions.find(a => a.id === req.params.auctionId);
  if (!auc) return res.status(404).json({ success: false, message: "Auction not found" });
  
  const lotId = `lot-${Math.random().toString(36).substring(2, 9)}`;
  const newLot = {
    id: lotId,
    auctionId: req.params.auctionId,
    lotNumber: req.body.lotNumber || `LOT-0${auc.lots.length + 1}`,
    title: req.body.title || "New Structural Lot Asset",
    description: req.body.description || "",
    materialCategory: req.body.materialCategory || "Other",
    quantity: req.body.quantity || 1,
    unitOfMeasure: req.body.unitOfMeasure || "Units",
    startingPrice: req.body.startingPrice || 1000,
    reservePrice: req.body.reservePrice,
    minimumIncrement: req.body.minimumIncrement || 100,
    currency: req.body.currency || "INR",
    lotStatus: "DRAFT",
    displayOrder: auc.lots.length + 1,
  };
  auc.lots.push(newLot as any);
  bidHistories[lotId] = [];
  res.json({ success: true, data: newLot });
});

app.put("/api/v1/lots/:lotId", (req, res) => {
  let foundLot: any = null;
  auctions.forEach(a => {
    const l = a.lots.find(lot => lot.id === req.params.lotId);
    if (l) foundLot = l;
  });
  if (!foundLot) return res.status(404).json({ success: false, message: "Lot not found" });
  
  Object.assign(foundLot, req.body);
  res.json({ success: true, data: foundLot });
});

app.delete("/api/v1/lots/:lotId", (req, res) => {
  let deleted = false;
  auctions.forEach(a => {
    const idx = a.lots.findIndex(lot => lot.id === req.params.lotId);
    if (idx !== -1) {
      a.lots.splice(idx, 1);
      deleted = true;
    }
  });
  if (!deleted) return res.status(404).json({ success: false, message: "Lot not found" });
  res.json({ success: true, message: "Lot deleted successfully" });
});

app.post("/api/v1/lots/:lotId/publish", (req, res) => {
  let foundLot: any = null;
  auctions.forEach(a => {
    const l = a.lots.find(lot => lot.id === req.params.lotId);
    if (l) foundLot = l;
  });
  if (!foundLot) return res.status(404).json({ success: false, message: "Lot not found" });
  foundLot.lotStatus = "READY";
  res.json({ success: true, data: foundLot });
});

app.post("/api/v1/lots/auctions/:auctionId/sort", (req, res) => {
  const auc = auctions.find(a => a.id === req.params.auctionId);
  if (!auc) return res.status(404).json({ success: false, message: "Auction not found" });
  
  const { sortedLotIds } = req.body;
  if (sortedLotIds) {
    auc.lots.sort((a, b) => sortedLotIds.indexOf(a.id) - sortedLotIds.indexOf(b.id));
    auc.lots.forEach((l, i) => l.displayOrder = i + 1);
  }
  res.json({ success: true });
});

// 5. Bidding & Live WS Triggering
app.post("/api/v1/lots/:lotId/bid", (req, res) => {
  const { lotId } = req.params;
  const { amount } = req.body;
  
  let targetLot: any = null;
  let targetAuc: any = null;
  
  auctions.forEach(a => {
    const l = a.lots.find(lot => lot.id === lotId);
    if (l) {
      targetLot = l;
      targetAuc = a;
    }
  });
  
  if (!targetLot) return res.status(404).json({ success: false, message: "Lot not found" });
  
  const minIncrement = targetLot.minimumIncrement || 100;
  const currentHighest = targetLot.currentHighestBid || targetLot.startingPrice;
  const threshold = currentHighest + minIncrement;
  
  if (amount < threshold) {
    return res.status(400).json({
      success: false,
      message: `Invalid bid amount. Your bid must be at least ₹${threshold.toLocaleString()}`
    });
  }

  // Record Bid
  targetLot.currentHighestBid = amount;
  const bidId = `bid-${Math.random().toString(36).substring(2, 9)}`;
  const newBid = {
    id: bidId,
    lotId,
    bidderId: "user-super-admin",
    bidderUsername: "admin",
    amount,
    currency: targetLot.currency,
    status: "ACTIVE" as const,
    timestamp: new Date().toISOString(),
    isAutoBid: false,
  };
  
  if (!bidHistories[lotId]) bidHistories[lotId] = [];
  // Update other bids to outbid
  bidHistories[lotId].forEach(b => {
    if (b.status === "ACTIVE") b.status = "OUTBID";
  });
  bidHistories[lotId].push(newBid);

  // Auto-Extension Logic
  let autoExtended = false;
  if (targetAuc.autoExtensionEnabled) {
    const now = Date.now();
    const end = new Date(targetAuc.auctionEnd).getTime();
    const delta = end - now;
    if (delta > 0 && delta <= 120000) { // last 2 minutes
      const extensionMinutes = targetAuc.extensionMinutes || 5;
      const newEndTime = new Date(end + extensionMinutes * 60000).toISOString();
      targetAuc.auctionEnd = newEndTime;
      autoExtended = true;
      console.log(`[Mock Backend] Auto Extension triggered! Extended auction end to ${newEndTime}`);
    }
  }

  // Broadcaster integration
  const websocketEvent = {
    lotId,
    auctionId: targetAuc.id,
    currentHighestBid: amount,
    bidHistory: bidHistories[lotId],
    auctionEnd: targetAuc.auctionEnd,
    autoExtended,
  };
  
  // Trigger STOMP WebSockets pushes
  broadcastToTopic(`/topic/lot/${lotId}`, websocketEvent);
  broadcastToTopic(`/topic/auction/${targetAuc.id}`, websocketEvent);
  broadcastToTopic(`/topic/notifications`, {
    message: `New bid placed on ${targetLot.title}: ₹${amount.toLocaleString()}`,
    type: "info",
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    data: {
      bidId,
      status: "SUCCESS",
      lotId,
      amount,
      timestamp: new Date().toISOString()
    }
  });
});

app.post("/api/v1/lots/:lotId/bid/sealed", (req, res) => {
  res.json({ success: true, message: "Sealed bid registered." });
});

app.get("/api/v1/lots/:lotId/history", (req, res) => {
  res.json({ success: true, data: bidHistories[req.params.lotId] || [] });
});

app.get("/api/v1/lots/:lotId/highest", (req, res) => {
  const history = bidHistories[req.params.lotId] || [];
  const highest = history.find(b => b.status === "ACTIVE") || null;
  res.json({ success: true, data: highest });
});

app.get("/api/v1/lots/:lotId/rank", (req, res) => {
  res.json({ success: true, data: { rank: 1, isHighest: true } });
});

app.post("/api/v1/lots/:lotId/sealed/open", (req, res) => {
  res.json({ success: true, message: "Sealed bid opened." });
});

// 6. Finance
app.get("/api/finance/settlements", (req, res) => {
  res.json({ success: true, data: settlements });
});

app.get("/api/finance/settlements/:id", (req, res) => {
  const set = settlements.find(s => s.settlementId === req.params.id);
  res.json({ success: true, data: set });
});

app.post("/api/finance/settlements/:id/release", (req, res) => {
  const set = settlements.find(s => s.settlementId === req.params.id);
  if (set) {
    set.status = "COMPLETED";
    set.updatedAt = new Date().toISOString();
  }
  res.json({ success: true, data: set });
});

app.get("/api/finance/invoices", (req, res) => {
  res.json({ success: true, data: invoices });
});

app.get("/api/finance/invoices/:id", (req, res) => {
  const inv = invoices.find(i => i.invoiceId === req.params.id);
  res.json({ success: true, data: inv });
});

app.get("/api/finance/wallet", (req, res) => {
  res.json({ success: true, data: wallet });
});

app.get("/api/finance/ledger", (req, res) => {
  res.json({ success: true, data: ledgerEntries });
});

app.post("/api/finance/ledger", (req, res) => {
  const newEntry = {
    ledgerId: `led-${Math.random().toString(36).substring(2, 9)}`,
    transactionId: `TXN-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    accountId: req.body.accountId || "ACC-MOCK-LEDGER",
    accountType: req.body.accountType || "PLATFORM_REVENUE",
    entryType: req.body.entryType || "DEBIT",
    amount: req.body.amount || 0,
    currency: req.body.currency || "INR",
    description: req.body.description || "Double-entry operational manual ledger adjustment.",
    timestamp: new Date().toISOString(),
  };
  ledgerEntries.push(newEntry as any);
  res.json({ success: true, data: newEntry });
});

app.get("/api/finance/refunds", (req, res) => {
  res.json({ success: true, data: refunds });
});

app.post("/api/finance/refunds", (req, res) => {
  const newRef = {
    refundId: `ref-${Math.random().toString(36).substring(2, 9)}`,
    paymentId: req.body.paymentId || "pay-1",
    amount: req.body.amount || 0,
    reason: req.body.reason || "Manual system refund request",
    status: "PENDING" as const,
    requestedBy: "user-super-admin",
    requestedAt: new Date().toISOString(),
  };
  refunds.push(newRef);
  res.json({ success: true, data: newRef });
});

app.post("/api/finance/refunds/:id/approve", (req, res) => {
  const ref = refunds.find(r => r.refundId === req.params.id);
  if (ref) {
    ref.status = "APPROVED";
    ref.processedAt = new Date().toISOString();
  }
  res.json({ success: true, data: ref });
});

app.post("/api/finance/refunds/:id/reject", (req, res) => {
  const ref = refunds.find(r => r.refundId === req.params.id);
  if (ref) {
    ref.status = "REJECTED";
    ref.processedAt = new Date().toISOString();
  }
  res.json({ success: true, data: ref });
});

app.get("/api/finance/payments", (req, res) => {
  res.json({ success: true, data: payments });
});

app.post("/api/finance/payments/:id/approve", (req, res) => {
  const pay = payments.find(p => p.paymentId === req.params.id);
  if (pay) pay.status = "COMPLETED";
  res.json({ success: true });
});

app.post("/api/finance/payments/:id/reject", (req, res) => {
  const pay = payments.find(p => p.paymentId === req.params.id);
  if (pay) pay.status = "FAILED";
  res.json({ success: true });
});

app.post("/api/finance/reconciliation", (req, res) => {
  res.json({ success: true, message: "SBI PG Cash Gateway reconciled." });
});

// --- STOMP WS GATEWAY SERVER ---
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws: any) => {
  console.log("[STOMP Gateway] Client connection established.");
  ws.subscriptions = new Map();
  let buffer = "";

  ws.on("message", (message: any) => {
    buffer += message.toString();
    while (true) {
      const nullIdx = buffer.indexOf("\x00");
      if (nullIdx === -1) {
        if (buffer.trim() === "") {
          buffer = "";
        }
        break;
      }
      const frameStr = buffer.slice(0, nullIdx);
      buffer = buffer.slice(nullIdx + 1);
      parseStompFrame(frameStr, ws);
    }
  });

  ws.on("close", () => {
    console.log("[STOMP Gateway] Client closed connection.");
  });
});

function parseStompFrame(frameStr: string, ws: any) {
  const lines = frameStr.split(/\r?\n/);
  const command = lines[0].trim();
  if (!command) return;

  const headers: Record<string, string> = {};
  let i = 1;
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") {
      break;
    }
    const colonIdx = line.indexOf(":");
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      headers[key] = val;
    }
  }

  if (command === "CONNECT" || command === "STOMP") {
    console.log("[STOMP Gateway] Frame: CONNECT. Synchronizing heartbeat.");
    const connectedFrame = `CONNECTED
version:1.2
heart-beat:4000,4000

\x00`;
    ws.send(connectedFrame);
  } else if (command === "SUBSCRIBE") {
    const dest = headers["destination"];
    const id = headers["id"];
    if (dest && id) {
      console.log(`[STOMP Gateway] Frame: SUBSCRIBE to ${dest} (ID: ${id})`);
      ws.subscriptions.set(id, dest);
    }
  } else if (command === "UNSUBSCRIBE") {
    const id = headers["id"];
    if (id) {
      console.log(`[STOMP Gateway] Frame: UNSUBSCRIBE from ID: ${id}`);
      ws.subscriptions.delete(id);
    }
  } else if (command === "DISCONNECT") {
    console.log("[STOMP Gateway] Frame: DISCONNECT received.");
  }
}

function broadcastToTopic(destination: string, payload: any) {
  wss.clients.forEach((client: any) => {
    if (client.readyState === WebSocket.OPEN && client.subscriptions) {
      for (const [subId, dest] of client.subscriptions.entries()) {
        if (dest === destination) {
          const messageFrame = `MESSAGE
destination:${destination}
subscription:${subId}
message-id:msg-${Math.random().toString(36).substring(2, 11)}
content-type:application/json

${JSON.stringify(payload)}\x00`;
          client.send(messageFrame);
        }
      }
    }
  });
}

// Attach websocket to the http server upgrade request
httpServer.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
  if (pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Mock Server] Standard server listening on http://localhost:${PORT}`);
  });
}

startServer();
