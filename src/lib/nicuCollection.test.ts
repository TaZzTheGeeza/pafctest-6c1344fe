import { describe, expect, it } from "vitest";
import { nicuAnonymousPreference, nicuTotal, validateNicuDonation } from "../../supabase/functions/_shared/nicuCollection";

describe("NICU collection", () => {
  it("charges £5 per bauble", () => expect(nicuTotal(2, 0, 0)).toBe(1000));
  it("charges £2.50 per keyring", () => expect(nicuTotal(0, 3, 0)).toBe(750));
  it("adds the donation once to the item total", () => expect(nicuTotal(1, 2, 1000)).toBe(2000));
  it("rejects fractional pennies", () => expect(() => validateNicuDonation(100.5)).toThrow());
  it("rejects invalid quantities", () => expect(() => nicuTotal(-1, 0, 0)).toThrow());
  it("accepts no donation", () => expect(validateNicuDonation(0)).toBe(0));
  it("requires at least £1 when donating", () => expect(() => validateNicuDonation(99)).toThrow());
  it("keeps an anonymous donor's name private", () => expect(nicuAnonymousPreference(true)).toBe(true));
  it("allows a donor to publish their name", () => expect(nicuAnonymousPreference(false)).toBe(false));
  it("keeps older clients anonymous without an explicit preference", () => expect(nicuAnonymousPreference(undefined)).toBe(true));
  it("does not interpret a malformed preference as permission to publish", () => expect(nicuAnonymousPreference("false")).toBe(true));
});