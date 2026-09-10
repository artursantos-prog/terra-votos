import { describe, expect, it } from "vitest";
import { isOutsideDisputeVisible, OUTSIDE_DISPUTE_VISIBILITY_KEY } from "./siteVisibility";

describe("outside dispute visibility", () => {
  it("keeps the page hidden unless the setting is explicitly enabled", () => {
    expect(isOutsideDisputeVisible(undefined)).toBe(false);
    expect(isOutsideDisputeVisible(null)).toBe(false);
    expect(isOutsideDisputeVisible(false)).toBe(false);
    expect(isOutsideDisputeVisible(true)).toBe(true);
  });

  it("uses the stable administrative setting key", () => {
    expect(OUTSIDE_DISPUTE_VISIBILITY_KEY).toBe("fora_da_disputa_visible");
  });
});
