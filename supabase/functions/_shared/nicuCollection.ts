export const NICU_CAMPAIGN = "nicu-christmas-2026";
export const NICU_BAUBLE_PRICE = 500;
export const NICU_KEYRING_PRICE = 250;

export function nicuAnonymousPreference(value: unknown): boolean {
  // Missing or malformed preferences must never publish a donor's name.
  return value !== false;
}

export function validateNicuDonation(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 100000) {
    throw new Error("Please enter a donation between £1 and £1,000, or choose no donation.");
  }
  if (value > 0 && value < 100) throw new Error("The minimum money donation is £1.");
  return value;
}

export function nicuTotal(baubles: number, keyrings: number, donation: number): number {
  for (const quantity of [baubles, keyrings]) {
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 20) throw new Error("Choose between 0 and 20 of each item.");
  }
  return baubles * NICU_BAUBLE_PRICE + keyrings * NICU_KEYRING_PRICE + validateNicuDonation(donation);
}