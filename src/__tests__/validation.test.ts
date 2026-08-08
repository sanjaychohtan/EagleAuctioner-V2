import { bidderRegistrationSchema } from "../validation/kycSchema";

export function runValidationSelfTest(): boolean {
  const validData = {
    country: "IN",
    bidderType: "INDIVIDUAL" as const,
    userRole: "ROLE_BUYER" as const,
    panNumber: "ABCDE1234F",
    rawAadhaar: "1234-5678-9012",
    accountHolderName: "John Doe",
    accountNumber: "12345678901",
    ifscCode: "SBIN0001234",
    bankName: "State Bank of India",
    branchName: "Main Branch",
  };

  const validResult = bidderRegistrationSchema.safeParse(validData);
  if (!validResult.success) {
    throw new Error("Valid bidder schema failed verification");
  }

  const invalidData = {
    country: "IN",
    bidderType: "INDIVIDUAL" as const,
    userRole: "ROLE_BUYER" as const,
    panNumber: "INVALIDPAN",
    rawAadhaar: "1234-5678-9012",
    accountHolderName: "John Doe",
    accountNumber: "12345678901",
    ifscCode: "SBIN0001234",
    bankName: "State Bank of India",
    branchName: "Main Branch",
  };

  const invalidResult = bidderRegistrationSchema.safeParse(invalidData);
  if (invalidResult.success) {
    throw new Error("Invalid PAN passed schema verification incorrectly");
  }

  return true;
}
