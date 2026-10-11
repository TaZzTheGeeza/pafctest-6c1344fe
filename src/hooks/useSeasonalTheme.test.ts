import { describe, expect, it } from "vitest";
import { parseSeasonalTheme } from "./useSeasonalTheme";

describe("seasonal theme settings", () => {
  it("accepts supported seasons", () => {
    expect(parseSeasonalTheme("halloween")).toBe("halloween");
    expect(parseSeasonalTheme("christmas")).toBe("christmas");
  });
  it("defaults missing or invalid settings to the standard club theme", () => {
    for (const value of [undefined, null, "off", "summer", true, ""]) {
      expect(parseSeasonalTheme(value)).toBe("off");
    }
  });
});