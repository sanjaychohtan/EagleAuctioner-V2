import { apiClient } from "./client";
import { API_ENDPOINTS } from "../constants";

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  throw new Error("Secure crypto.randomUUID() is unavailable. Failing fast to prevent insecure UUID generation.");
}

export enum BidderState {
  DRAFT = "DRAFT",
  KYC_PENDING = "KYC_PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
  RETURNED_FOR_CORRECTION = "RETURNED_FOR_CORRECTION",
}

export interface OrganizationDto {
  id: string;
  organizationName: string;
  registrationNumber: string;
  gstin: string;
  registeredAddress: string;
}

export interface BankAccountDto {
  id: string;
  accountHolderName: string;
  maskedAccountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  isVerified: boolean;
  pennyDropTransactionId?: string;
  pennyDropStatus?: string;
}

export interface KycDocumentDto {
  id: string;
  documentType: string;
  storagePath: string;
  verificationStatus: string;
  rejectionReason?: string;
  mimeType: string;
  fileSize: number;
}

export interface BidderProfileResponse {
  id: string;
  userId: string;
  email: string;
  state: BidderState;
  bidderType: "INDIVIDUAL" | "CORPORATE";
  maskedPan: string;
  maskedAadhaar: string;
  panVerificationStatus: string;
  aadhaarVerificationStatus: string;
  organization?: OrganizationDto | null;
  bankAccount?: BankAccountDto | null;
  documents: KycDocumentDto[];
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedReviewer?: string | null;
  makerApproved?: boolean;
  makerNotes?: string | null;
  makerName?: string | null;
  checkerApproved?: boolean;
  checkerNotes?: string | null;
  checkerName?: string | null;
}

export interface BidderRegistrationRequest {
  bidderType: "INDIVIDUAL" | "CORPORATE";
  userRole: "ROLE_BUYER" | "ROLE_SELLER";
  panNumber: string;
  rawAadhaar: string;
  organizationName?: string;
  registrationNumber?: string;
  gstin?: string;
  registeredAddress?: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
}

export interface KycDocumentRequest {
  documentType: string;
  storagePath: string;
  documentHash: string;
  mimeType: string;
  fileSize: number;
}

export interface KycReviewRequest {
  decision: "APPROVED" | "REJECTED" | "RETURNED_FOR_CORRECTION";
  reviewNotes: string;
  reviewerName?: string;
  isMakerApproval?: boolean;
}

// Sandbox LocalStorage DB Helper for perfect full-stack simulation
const DB_KEY = "ea_onboarding_profiles_db";

const getSandboxDB = (): BidderProfileResponse[] => {
  try {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveSandboxDB = (data: BidderProfileResponse[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

export const OnboardingService = {
  /**
   * Registers a new bidder/seller profile in the system.
   */
  async registerBidder(request: BidderRegistrationRequest): Promise<BidderProfileResponse> {
    console.log("[OnboardingService] Registering bidder profile", request);
    
    // 1. Attempt real API request
    let apiResponse: BidderProfileResponse | null = null;
    try {
      const res = await apiClient.post<BidderProfileResponse>(API_ENDPOINTS.ONBOARDING.BIDDER_REGISTER, request);
      apiResponse = res.data;
    } catch (err) {
      console.warn("[OnboardingService] Real API endpoint not available. Falling back to Sandbox Local DB.", err);
    }

    // 2. Perform Sandbox Persistence
    const currentUserStr = localStorage.getItem("ea_user_profile");
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const userId = currentUser?.id || "3c91b402-29ac-4029-9182-e3a1f9a2d3b4";
    const email = currentUser?.email || "sandbox-operator@eagle-auctioner.in";

    // Standard masks for security
    const maskedPan = request.panNumber.substring(0, 2) + "XXXXX" + request.panNumber.substring(request.panNumber.length - 3);
    const cleanAadhaar = request.rawAadhaar.replace(/-/g, "");
    const maskedAadhaar = "XXXX-XXXX-" + cleanAadhaar.substring(cleanAadhaar.length - 4);
    const maskedAccount = "XXXX-XXXX-" + request.accountNumber.substring(request.accountNumber.length - 4);

    const profileId = apiResponse?.id || generateUUID();

    const newProfile: BidderProfileResponse = {
      id: profileId,
      userId,
      email,
      state: BidderState.DRAFT, // Initial state is DRAFT
      bidderType: request.bidderType,
      maskedPan,
      maskedAadhaar,
      panVerificationStatus: "PENDING",
      aadhaarVerificationStatus: "PENDING",
      organization: request.bidderType === "CORPORATE" ? {
        id: generateUUID(),
        organizationName: request.organizationName || "",
        registrationNumber: request.registrationNumber || "",
        gstin: request.gstin || "",
        registeredAddress: request.registeredAddress || "",
      } : null,
      bankAccount: {
        id: generateUUID(),
        accountHolderName: request.accountHolderName,
        maskedAccountNumber: maskedAccount,
        ifscCode: request.ifscCode,
        bankName: request.bankName,
        branchName: request.branchName,
        isVerified: false,
      },
      documents: [],
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update active user profile state (simulate dynamic KYC Status update)
    if (currentUser) {
      currentUser.kycStatus = "PENDING";
      // Update role if selected
      if (request.userRole && (!currentUser.roles || !currentUser.roles.includes(request.userRole))) {
        currentUser.roles = [request.userRole];
      }
      localStorage.setItem("ea_user_profile", JSON.stringify(currentUser));
      window.dispatchEvent(new Event("storage"));
    }

    const db = getSandboxDB();
    const updatedDb = db.filter((p) => p.userId !== userId);
    updatedDb.push(newProfile);
    saveSandboxDB(updatedDb);

    return apiResponse || newProfile;
  },

  /**
   * Submits supporting KYC documents. Enforces state transition to UNDER_REVIEW.
   */
  async submitDocuments(profileId: string, documentRequests: KycDocumentRequest[]): Promise<void> {
    console.log(`[OnboardingService] Submitting documents for profile ${profileId}`, documentRequests);
    
    // 1. Attempt real API request
    try {
      await apiClient.post(API_ENDPOINTS.ONBOARDING.BIDDER_DOCUMENTS(profileId), documentRequests);
    } catch (err) {
      console.warn(`[OnboardingService] Real API endpoint not available. Falling back to Sandbox Local DB.`, err);
    }

    // 2. Perform Sandbox Persistence
    const db = getSandboxDB();
    const idx = db.findIndex((p) => p.id === profileId);
    if (idx !== -1) {
      const profile = db[idx];
      // Map to full document DTO
      const uploadedDocs: KycDocumentDto[] = documentRequests.map((doc) => ({
        id: generateUUID(),
        documentType: doc.documentType,
        storagePath: doc.storagePath,
        verificationStatus: "PENDING",
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
      }));

      profile.documents = uploadedDocs;
      profile.state = BidderState.UNDER_REVIEW; // Transition to review phase
      profile.updatedAt = new Date().toISOString();
      db[idx] = profile;
      saveSandboxDB(db);
    }
  },

  /**
   * Trigger penny drop bank verification for the linked bank account.
   */
  async verifyBankAccount(profileId: string): Promise<void> {
    console.log(`[OnboardingService] Verifying bank account for profile ${profileId}`);

    // 1. Attempt real API request
    try {
      await apiClient.post(API_ENDPOINTS.ONBOARDING.BIDDER_BANK_VERIFY(profileId));
    } catch (err) {
      console.warn(`[OnboardingService] Real API endpoint not available. Falling back to Sandbox Local DB.`, err);
    }

    // 2. Perform Sandbox Persistence
    const db = getSandboxDB();
    const idx = db.findIndex((p) => p.id === profileId);
    if (idx !== -1) {
      const profile = db[idx];
      if (profile.bankAccount) {
        profile.bankAccount.isVerified = true;
        profile.bankAccount.pennyDropTransactionId = "TXN-DROP-" + Math.floor(Math.random() * 900000 + 100000);
        profile.bankAccount.pennyDropStatus = "COMPLETED";
      }
      profile.updatedAt = new Date().toISOString();
      db[idx] = profile;
      saveSandboxDB(db);
    }
  },

  /**
   * Assign a reviewer to a pending KYC dossier (Reviewer Assignment)
   */
  async assignReviewer(profileId: string, reviewerName: string): Promise<void> {
    console.log(`[OnboardingService] Assigning reviewer ${reviewerName} to profile ${profileId}`);
    try {
      await apiClient.post(`/onboarding/admin/${profileId}/assign`, { reviewer: reviewerName });
    } catch (err) {
      console.warn(`[OnboardingService] Real API endpoint not available. Falling back to Sandbox Local DB.`, err);
    }

    const db = getSandboxDB();
    const idx = db.findIndex((p) => p.id === profileId);
    if (idx !== -1) {
      const profile = db[idx];
      profile.assignedReviewer = reviewerName;
      profile.updatedAt = new Date().toISOString();
      db[idx] = profile;
      saveSandboxDB(db);

      // Log to audit trail
      const auditTrail = getAuditTrail(profileId);
      auditTrail.push({
        id: generateUUID(),
        reviewer: reviewerName,
        decision: "ASSIGNED" as any,
        notes: `Assigned review officer: ${reviewerName}`,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(`ea_audit_trail_${profileId}`, JSON.stringify(auditTrail));
    }
  },

  /**
   * Admin review workflow for KYC approvals/rejections and corrections.
   */
  async reviewKyc(profileId: string, request: KycReviewRequest): Promise<void> {
    console.log(`[OnboardingService] Submitting admin review for profile ${profileId}`, request);

    // 1. Attempt real API request
    try {
      await apiClient.post(API_ENDPOINTS.ONBOARDING.BIDDER_ADMIN_REVIEW(profileId), request);
    } catch (err) {
      console.warn(`[OnboardingService] Real API endpoint not available. Falling back to Sandbox Local DB.`, err);
    }

    // 2. Perform Sandbox Persistence
    const db = getSandboxDB();
    const idx = db.findIndex((p) => p.id === profileId);
    if (idx !== -1) {
      const profile = db[idx];
      const reviewerName = request.reviewerName || "System Compliance Admin";

      if (request.isMakerApproval) {
        // MAKER PASS
        profile.makerApproved = true;
        profile.makerName = reviewerName;
        profile.makerNotes = request.reviewNotes;
        profile.assignedReviewer = reviewerName; // Auto-assign as maker
        profile.state = BidderState.UNDER_REVIEW;
      } else {
        // CHECKER PASS OR STANDARD OVERRIDE
        if (request.decision === "APPROVED") {
          profile.state = BidderState.APPROVED;
          profile.checkerApproved = true;
          profile.checkerName = reviewerName;
          profile.checkerNotes = request.reviewNotes;
          profile.rejectionReason = null;
          profile.panVerificationStatus = "VERIFIED";
          profile.aadhaarVerificationStatus = "VERIFIED";
          if (profile.bankAccount) {
            profile.bankAccount.isVerified = true;
            profile.bankAccount.pennyDropStatus = "COMPLETED";
          }
        } else if (request.decision === "REJECTED") {
          profile.state = BidderState.REJECTED;
          profile.checkerApproved = false;
          profile.checkerName = reviewerName;
          profile.checkerNotes = request.reviewNotes;
          profile.rejectionReason = request.reviewNotes;
          profile.panVerificationStatus = "REJECTED";
          profile.aadhaarVerificationStatus = "REJECTED";
        } else if (request.decision === "RETURNED_FOR_CORRECTION") {
          profile.state = BidderState.RETURNED_FOR_CORRECTION;
          profile.makerApproved = false;
          profile.checkerApproved = false;
          profile.rejectionReason = request.reviewNotes;
          profile.panVerificationStatus = "PENDING";
          profile.aadhaarVerificationStatus = "PENDING";
        }
      }

      profile.updatedAt = new Date().toISOString();
      db[idx] = profile;
      saveSandboxDB(db);

      // Log audit trail
      const auditTrail = getAuditTrail(profileId);
      auditTrail.push({
        id: generateUUID(),
        reviewer: reviewerName,
        decision: request.isMakerApproval ? "MAKER_REVIEWED" : request.decision,
        notes: request.reviewNotes,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(`ea_audit_trail_${profileId}`, JSON.stringify(auditTrail));

      // Synchronize back to the active user's own session state if reviewing themselves
      const currentUserStr = localStorage.getItem("ea_user_profile");
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      if (currentUser && currentUser.id === profile.userId) {
        if (profile.state === BidderState.APPROVED) {
          currentUser.kycStatus = "APPROVED";
        } else if (profile.state === BidderState.REJECTED) {
          currentUser.kycStatus = "REJECTED";
        } else if (profile.state === BidderState.RETURNED_FOR_CORRECTION) {
          currentUser.kycStatus = "PENDING"; // User can fix it
        } else {
          currentUser.kycStatus = "PENDING";
        }
        localStorage.setItem("ea_user_profile", JSON.stringify(currentUser));
        window.dispatchEvent(new Event("storage"));
      }
    }
  },

  /**
   * Fetches the current authenticated user's onboarding profile.
   */
  async getMyProfile(): Promise<BidderProfileResponse | null> {
    const currentUserStr = localStorage.getItem("ea_user_profile");
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    if (!currentUser) return null;

    const db = getSandboxDB();
    const profile = db.find((p) => p.userId === currentUser.id);
    return profile || null;
  },

  async getAdminPendingQueue(): Promise<BidderProfileResponse[]> {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.ONBOARDING.SELLER_SEARCH);
      return res.data?.data || res.data || [];
    } catch (err) {
      console.warn("[OnboardingService] Failed to fetch live admin pending queue", err);
      return [];
    }
  },

  /**
   * Seed the database with high-quality demo requests for rapid review queue demonstration.
   */
  seedDemoProfiles(): void {
    const db = getSandboxDB();
    if (db.length > 0) return; // Already seeded

    const seed: BidderProfileResponse[] = [
      {
        id: "d9e84b1a-2938-4e81-bd8d-f5e93c12a4b5",
        userId: "91b8d7c2-3e2b-4029-912b-cb9812a3d4ef",
        email: "onboarding-candidate-1@mumbai.com",
        state: BidderState.UNDER_REVIEW,
        bidderType: "CORPORATE",
        maskedPan: "AAXXXX7890C",
        maskedAadhaar: "XXXX-XXXX-9912",
        panVerificationStatus: "PENDING",
        aadhaarVerificationStatus: "PENDING",
        organization: {
          id: generateUUID(),
          organizationName: "Tata Steel Logistics Ltd",
          registrationNumber: "U27100MH1907PLC000260",
          gstin: "27AAACT1234A1Z5",
          registeredAddress: "Bombay House, Homi Mody Street, Fort, Mumbai 400001",
        },
        bankAccount: {
          id: generateUUID(),
          accountHolderName: "Tata Steel Logistics Private Limited",
          maskedAccountNumber: "XXXX-XXXX-3829",
          ifscCode: "SBIN0000300",
          bankName: "State Bank of India",
          branchName: "Mumbai Main Branch",
          isVerified: true,
          pennyDropTransactionId: "TXN-DROP-481920",
        },
        documents: [
          {
            id: generateUUID(),
            documentType: "PAN_CARD",
            storagePath: "/uploads/documents/pan_tata_logistics.pdf",
            verificationStatus: "PENDING",
            mimeType: "application/pdf",
            fileSize: 412050,
          },
          {
            id: generateUUID(),
            documentType: "GST_CERTIFICATE",
            storagePath: "/uploads/documents/gstin_tata.png",
            verificationStatus: "PENDING",
            mimeType: "image/png",
            fileSize: 1042300,
          },
          {
            id: generateUUID(),
            documentType: "COMPANY_INCORPORATION",
            storagePath: "/uploads/documents/incorporation_tata.pdf",
            verificationStatus: "PENDING",
            mimeType: "application/pdf",
            fileSize: 2409110,
          },
        ],
        createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      },
      {
        id: "a3b4c5d6-e7f8-9a0b-1c2d-3e4f5a6b7c8d",
        userId: "b2d3c4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
        email: "individual.trader@bengaluru.in",
        state: BidderState.UNDER_REVIEW,
        bidderType: "INDIVIDUAL",
        maskedPan: "CHXXXX5512M",
        maskedAadhaar: "XXXX-XXXX-4812",
        panVerificationStatus: "PENDING",
        aadhaarVerificationStatus: "PENDING",
        organization: null,
        bankAccount: {
          id: generateUUID(),
          accountHolderName: "Siddharth Ramesh",
          maskedAccountNumber: "XXXX-XXXX-9901",
          ifscCode: "HDFC0000140",
          bankName: "HDFC Bank Ltd",
          branchName: "Koramangala 8th Block Branch",
          isVerified: false,
        },
        documents: [
          {
            id: generateUUID(),
            documentType: "PAN_CARD",
            storagePath: "/uploads/documents/pan_siddharth.jpg",
            verificationStatus: "PENDING",
            mimeType: "image/jpeg",
            fileSize: 201020,
          },
          {
            id: generateUUID(),
            documentType: "AADHAAR_CARD",
            storagePath: "/uploads/documents/aadhaar_siddharth.pdf",
            verificationStatus: "PENDING",
            mimeType: "application/pdf",
            fileSize: 852930,
          },
          {
            id: generateUUID(),
            documentType: "CANCELLED_CHEQUE",
            storagePath: "/uploads/documents/cancelled_cheque_siddharth.jpg",
            verificationStatus: "PENDING",
            mimeType: "image/jpeg",
            fileSize: 110480,
          },
        ],
        createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      }
    ];

    saveSandboxDB(seed);
  },
};

export interface AuditTrailLog {
  id: string;
  reviewer: string;
  decision: string;
  notes: string;
  timestamp: string;
}

export const getAuditTrail = (profileId: string): AuditTrailLog[] => {
  try {
    const data = localStorage.getItem(`ea_audit_trail_${profileId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};
