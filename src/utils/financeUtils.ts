import { Ledger, LedgerEntryType } from "../types/finance";

export const calculateGST = (amount: number, rate: number = 18): number => {
  if (amount <= 0 || rate < 0) return 0;
  return Math.round((amount * rate) / 100);
};

export const calculateTDS = (amount: number, rate: number = 1): number => {
  if (amount <= 0 || rate < 0) return 0;
  return Math.round((amount * rate) / 100);
};

export const calculateNetSettlement = (
  grossAmount: number,
  platformFee: number,
  taxAmount: number,
  otherDeductions: number = 0
): number => {
  if (grossAmount <= 0) return 0;
  const net = grossAmount - platformFee - taxAmount - otherDeductions;
  return net > 0 ? net : 0;
};

export const calculateLedgerBalance = (entries: Ledger[]): number => {
  if (!entries || entries.length === 0) return 0;
  
  return entries.reduce((balance, entry) => {
    if (entry.entryType === LedgerEntryType.CREDIT) {
      return balance + entry.amount;
    } else if (entry.entryType === LedgerEntryType.DEBIT) {
      return balance - entry.amount;
    }
    return balance;
  }, 0);
};
