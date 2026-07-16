export const calculateNextMinimumBid = (
  startingPrice: number,
  minimumIncrement: number,
  currentHighestBid?: number | null
): number => {
  if (currentHighestBid === undefined || currentHighestBid === null) {
    return startingPrice;
  }
  return currentHighestBid + minimumIncrement;
};

export const isValidBidAmount = (
  amount: number,
  startingPrice: number,
  minimumIncrement: number,
  currentHighestBid?: number | null
): boolean => {
  const minRequired = calculateNextMinimumBid(
    startingPrice,
    minimumIncrement,
    currentHighestBid
  );
  return amount >= minRequired;
};

export const formatCurrency = (amount: number, currencyCode: string = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
};
