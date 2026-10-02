import { describe, expect, it } from "vitest";
import { WEI, genToWei, weiToGen, shortHex, timeLeft } from "@/lib/format";

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
  it.each([["0", 0n], ["1", 10n ** 18n], ["1.5", 15n * 10n ** 17n], ["0.000000000000000001", 1n]])("converts boundary amount %s", (input, expected) => {
    expect(genToWei(input)).toBe(expected);
  });
  it.each(["", ".5", "1.", "-1", "1.0000000000000000001", "abc", "1e2"]) ("rejects invalid amount %s", (input) => {
    expect(() => genToWei(input)).toThrow();
  });
  it.each([[0n, "0.00"], [10n ** 18n, "1.00"], [1500000000000000000n, "1.50"], [123456789n, "0.00"]])("formats %s deterministically", (input, expected) => {
    expect(weiToGen(input)).toBe(expected);
  });
  it("supports zero display decimals", () => expect(weiToGen(199n * WEI, 0)).toBe("199"));
  it("shortens long hashes while preserving ends", () => expect(shortHex("0x" + "a".repeat(64))).toBe("0xaaaaaa…aaaa"));
  it("leaves short hashes untouched", () => expect(shortHex("0xabcd")).toBe("0xabcd"));
  it.each([[0, "closed"], [3600, "1h left"], [86400, "1d left"]])("formats time boundary %s", (delta, expected) => {
    expect(timeLeft(1000 + delta, 1000)).toBe(expected);
  });
});
