import { z } from "zod";

// Indian Validation Regex
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const aadhaarRegex = /^\d{4}-\d{4}-\d{4}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const bidderRegistrationSchema = z.object({
  country: z.string().optional(),
  bidderType: z.enum(["INDIVIDUAL", "CORPORATE"]),
  userRole: z.enum(["ROLE_BUYER", "ROLE_SELLER"]),
  panNumber: z.string().trim(),
  rawAadhaar: z.string().trim(),
  
  // Organization / Company Details (Conditional)
  organizationName: z.string().optional(),
  registrationNumber: z.string().optional(),
  gstin: z.string().optional(),
  registeredAddress: z.string().optional(),

  // Bank Details
  accountHolderName: z.string().min(2, "Account holder name is required"),
  accountNumber: z
    .string()
    .min(5, "Account number is too short")
    .max(34, "Account number is too long"),
  ifscCode: z.string().toUpperCase().trim(),
  bankName: z.string().min(2, "Bank name is required"),
  branchName: z.string().min(2, "Branch name is required"),
}).superRefine((data, ctx) => {
  const isIndia = data.country === "India" || !data.country;
  const isSingapore = data.country === "Singapore";
  const isUAE = data.country === "United Arab Emirates" || data.country === "UAE";
  const isUK = data.country === "United Kingdom" || data.country === "UK";

  // --- INDIA VALIDATION ---
  if (isIndia) {
    if (!data.panNumber || !panRegex.test(data.panNumber.toUpperCase().trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid PAN format. Must match standard Indian PAN (e.g. ABCDE1234F)",
        path: ["panNumber"],
      });
    }
    
    if (data.bidderType === "INDIVIDUAL") {
      if (!data.rawAadhaar || !aadhaarRegex.test(data.rawAadhaar.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid Aadhaar format. Must match XXXX-XXXX-XXXX",
          path: ["rawAadhaar"],
        });
      }
    }

    if (!data.ifscCode || !ifscRegex.test(data.ifscCode.toUpperCase().trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid IFSC code. E.g. SBIN0001234",
        path: ["ifscCode"],
      });
    }

    if (data.bidderType === "CORPORATE") {
      if (!data.organizationName || data.organizationName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Organization name is required for company onboarding",
          path: ["organizationName"],
        });
      }
      if (!data.registrationNumber || data.registrationNumber.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Company registration number is required",
          path: ["registrationNumber"],
        });
      }
      if (!data.gstin || data.gstin.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "GSTIN is required for company onboarding",
          path: ["gstin"],
        });
      } else if (!gstinRegex.test(data.gstin.toUpperCase().trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid GSTIN format (e.g. 27AAAAA1111A1Z1)",
          path: ["gstin"],
        });
      }
      if (!data.registeredAddress || data.registeredAddress.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Registered company address is required",
          path: ["registeredAddress"],
        });
      }
    }
  }

  // --- SINGAPORE VALIDATION ---
  else if (isSingapore) {
    if (data.bidderType === "CORPORATE") {
      const uenRegex = /^[0-9TF]{9}[A-Z]$|^[0-9]{9}[N]$/i;
      if (!data.panNumber || !uenRegex.test(data.panNumber.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid UEN format. Must be standard Singapore Unique Entity Number (e.g. 201234567N)",
          path: ["panNumber"],
        });
      }
      if (!data.organizationName || data.organizationName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Organization name is required",
          path: ["organizationName"],
        });
      }
    } else {
      const nricRegex = /^[STFGM][0-9]{7}[A-Z]$/i;
      if (!data.panNumber || !nricRegex.test(data.panNumber.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid NRIC/FIN format. Must be standard Singapore Identity number (e.g. S1234567A)",
          path: ["panNumber"],
        });
      }
    }

    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i;
    if (!data.ifscCode || !swiftRegex.test(data.ifscCode.toUpperCase().trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid SWIFT/BIC code. E.g. DBSSSGSGXXX",
        path: ["ifscCode"],
      });
    }
  }

  // --- UAE VALIDATION ---
  else if (isUAE) {
    if (data.bidderType === "CORPORATE") {
      const trnRegex = /^100[0-9]{12}$/;
      if (!data.panNumber || !trnRegex.test(data.panNumber.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid UAE TRN. Must be 15 digits starting with 100 (e.g. 100123456789012)",
          path: ["panNumber"],
        });
      }
      if (!data.organizationName || data.organizationName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Organization name is required",
          path: ["organizationName"],
        });
      }
    } else {
      const emiratesIdRegex = /^784-[0-9]{4}-[0-9]{7}-[0-9]$/;
      if (!data.rawAadhaar || !emiratesIdRegex.test(data.rawAadhaar.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid Emirates ID. Must match format 784-YYYY-XXXXXXX-Z",
          path: ["rawAadhaar"],
        });
      }
    }

    const uaeIbanRegex = /^AE[0-9]{21}$/i;
    if (!data.accountNumber || !uaeIbanRegex.test(data.accountNumber.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid UAE IBAN. Must start with AE followed by 21 digits",
        path: ["accountNumber"],
      });
    }
  }

  // --- UNITED KINGDOM VALIDATION ---
  else if (isUK) {
    if (data.bidderType === "CORPORATE") {
      const crnRegex = /^[0-9]{8}$|^[A-Z]{2}[0-9]{6}$/i;
      if (!data.panNumber || !crnRegex.test(data.panNumber.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid UK CRN. Must be standard UK Company House registration number (e.g. 12345678)",
          path: ["panNumber"],
        });
      }
      if (!data.organizationName || data.organizationName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Organization name is required",
          path: ["organizationName"],
        });
      }
    } else {
      const ninoRegex = /^[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z][0-9]{6}[A-D]$/i;
      if (!data.rawAadhaar || !ninoRegex.test(data.rawAadhaar.toUpperCase().trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid National Insurance Number (NINO) format. E.g. QQ123456C",
          path: ["rawAadhaar"],
        });
      }
    }

    const sortCodeRegex = /^[0-9]{6}$|^[0-9]{2}-[0-9]{2}-[0-9]{2}$/;
    if (!data.ifscCode || !sortCodeRegex.test(data.ifscCode.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid UK Sort Code. Must be 6 digits (e.g. 204514 or 20-45-14)",
        path: ["ifscCode"],
      });
    }
  }
});

export type BidderRegistrationSchemaType = z.infer<typeof bidderRegistrationSchema>;

export const kycDocumentSubmitSchema = z.object({
  documentType: z.enum([
    "PAN_CARD",
    "AADHAAR_CARD",
    "GST_CERTIFICATE",
    "COMPANY_INCORPORATION",
    "ADDRESS_PROOF",
    "CANCELLED_CHEQUE",
    "UEN_PROOF",
    "NRIC_PROOF",
    "TRN_PROOF",
    "EMIRATES_ID_PROOF",
    "CRN_PROOF",
    "NINO_PROOF",
  ]),
  storagePath: z.string().nonempty("File path is required"),
  documentHash: z.string().nonempty("File digest hash is required"),
  mimeType: z.string().nonempty("Mime type is required"),
  fileSize: z.number().positive("File size must be positive"),
});

export type KycDocumentSubmitSchemaType = z.infer<typeof kycDocumentSubmitSchema>;

export const kycReviewSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "RETURNED_FOR_CORRECTION"]),
  reviewNotes: z
    .string()
    .min(10, "Review remarks must be between 10 and 1000 characters")
    .max(1000, "Review remarks must be between 10 and 1000 characters"),
});

export type KycReviewSchemaType = z.infer<typeof kycReviewSchema>;
