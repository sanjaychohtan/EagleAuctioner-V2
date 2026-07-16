import { z } from "zod";
import { AuctionType, AuctionVisibility } from "../types/auction";

// Reusable date validator
const dateStringOrDate = z.union([
  z.string().datetime({ message: "Invalid date-time format" }),
  z.date()
]).transform(val => typeof val === "string" ? val : val.toISOString());

// Create and Update Auction Schema
export const auctionSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must not exceed 255 characters"),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  auctionType: z.nativeEnum(AuctionType),
  visibility: z.nativeEnum(AuctionVisibility),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .toUpperCase(),
  timezone: z
    .string()
    .min(1, "Timezone is required")
    .max(100, "Timezone must not exceed 100 characters"),
  registrationStart: dateStringOrDate,
  registrationEnd: dateStringOrDate,
  inspectionStart: dateStringOrDate.optional(),
  inspectionEnd: dateStringOrDate.optional(),
  auctionStart: dateStringOrDate,
  auctionEnd: dateStringOrDate,
  reservePriceEnabled: z.boolean().default(false),
  autoExtensionEnabled: z.boolean().default(false),
  extensionMinutes: z
    .number()
    .int("Extension minutes must be an integer")
    .positive("Extension minutes must be greater than 0")
    .optional()
    .nullable(),
}).superRefine((data, ctx) => {
  const regStart = new Date(data.registrationStart).getTime();
  const regEnd = new Date(data.registrationEnd).getTime();
  const aucStart = new Date(data.auctionStart).getTime();
  const aucEnd = new Date(data.auctionEnd).getTime();

  // 1. Registration start < Registration end
  if (regStart >= regEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Registration start must be before registration end",
      path: ["registrationStart"],
    });
  }

  // 2. Inspection Start < Inspection End (if both present)
  if (data.inspectionStart && data.inspectionEnd) {
    const inspStart = new Date(data.inspectionStart).getTime();
    const inspEnd = new Date(data.inspectionEnd).getTime();
    if (inspStart >= inspEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Inspection start must be before inspection end",
        path: ["inspectionStart"],
      });
    }
  }

  // 3. Auction start < Auction end
  if (aucStart >= aucEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Auction start must be before auction end",
      path: ["auctionStart"],
    });
  }

  // 4. Registration end <= Auction start
  if (regEnd > aucStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Registration end must be before or equal to auction start",
      path: ["registrationEnd"],
    });
  }

  // 5. If autoExtensionEnabled is true, extensionMinutes must be provided and > 0
  if (data.autoExtensionEnabled && (data.extensionMinutes === null || data.extensionMinutes === undefined || data.extensionMinutes <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Extension minutes must be greater than 0 when auto-extension is enabled",
      path: ["extensionMinutes"],
    });
  }
});

export type AuctionSchemaType = z.infer<typeof auctionSchema>;

// Update Settings Schema
export const updateSettingsSchema = z.object({
  anonymousBidding: z.boolean().optional(),
  allowAutoExtension: z.boolean().optional(),
  extensionMinutes: z.number().int().positive().optional().nullable(),
  maxExtensions: z.number().int().positive().optional(),
  bidIncrementType: z.string().max(50).optional(),
  minimumIncrement: z.number().positive().optional(),
  reservePriceEnabled: z.boolean().optional(),
  allowProxyBid: z.boolean().optional(),
  allowManualWinner: z.boolean().optional(),
  allowSellerApproval: z.boolean().optional(),
  allowBidWithdrawal: z.boolean().optional(),
  allowRankDisplay: z.boolean().optional(),
  showBidderNames: z.boolean().optional(),
  registrationRequired: z.boolean().optional(),
  emdRequired: z.boolean().optional(),
  timezone: z.string().max(100).optional(),
});

export type UpdateSettingsSchemaType = z.infer<typeof updateSettingsSchema>;

// Lot Schema
export const lotSchema = z.object({
  lotNumber: z
    .string()
    .min(1, "Lot number is required")
    .max(50, "Lot number must not exceed 50 characters"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must not exceed 255 characters"),
  description: z
    .string()
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  materialCategory: z
    .string()
    .min(1, "Material category is required")
    .max(100, "Material category must not exceed 100 characters"),
  quantity: z
    .number()
    .positive("Quantity must be greater than 0"),
  unitOfMeasure: z
    .string()
    .min(1, "Unit of measure is required")
    .max(20, "Unit of measure must not exceed 20 characters"),
  startingPrice: z
    .number()
    .nonnegative("Starting price must be 0 or greater"),
  reservePrice: z
    .number()
    .nonnegative("Reserve price must be 0 or greater")
    .optional()
    .nullable(),
  minimumIncrement: z
    .number()
    .positive("Minimum increment must be greater than 0"),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter ISO code")
    .toUpperCase(),
  displayOrder: z.number().int().optional(),
});

export type LotSchemaType = z.infer<typeof lotSchema>;
