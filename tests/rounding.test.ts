import { describe, it, expect } from "vitest";
import { roundHalfUp, toCents } from "../src/core/rounding";

describe("roundHalfUp", () => {
  it("rounds half cents up despite binary float noise", () => {
    // 402.50 × 19% = 76.475, but 76.475 * 100 is 7647.499999999999.
    expect(roundHalfUp((402.5 * 19) / 100)).toBe(76.48);
    expect(roundHalfUp(1.005)).toBe(1.01);
    expect(roundHalfUp(0.335 * 3)).toBe(1.01);
  });

  it("rounds half up, not half to even", () => {
    expect(roundHalfUp(76.465)).toBe(76.47);
    expect(roundHalfUp(0.125)).toBe(0.13);
  });

  it("rounds negative amounts away from zero", () => {
    expect(roundHalfUp(-76.475)).toBe(-76.48);
  });

  it("leaves values below the half cent alone", () => {
    expect(roundHalfUp(76.4749)).toBe(76.47);
    expect(roundHalfUp(0.1 + 0.2)).toBe(0.3);
  });
});

describe("toCents", () => {
  it("returns integer cents", () => {
    expect(toCents(76.475)).toBe(7648);
    expect(toCents(999999999.995)).toBe(100000000000);
  });
});
