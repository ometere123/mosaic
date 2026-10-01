import { describe, expect, it } from "vitest";
import { genToWei, weiToGen, timeLeft } from "@/lib/format";

describe("GEN formatting", () => {
  it("converts fractional GEN exactly", () => {
    expect(genToWei("1.25")).toBe(1_250_000_000_000_000_000n);
    expect(weiToGen(1_250_000_000_000_000_000n, 2)).toBe("1.25");
  });
  it("rejects excessive precision and malformed input", () => {
    expect(() => genToWei("1.0000000000000000001")).toThrow();
    expect(() => genToWei("1e3")).toThrow();
  });
  it("does not report time remaining after close", () => {
    expect(timeLeft(100, 101)).toBe("closed");
  });
});
