import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/genlayer", () => ({ resetReadClient: vi.fn() }));

import { isTransientReadError, mapWithConcurrency, readWithRetry } from "@/lib/read-resilience";

describe("authoritative read resilience", () => {
  const noWait = { sleep: async () => undefined, random: () => 0.5, reset: vi.fn() };

  it("returns an immediate success without retrying", async () => {
    const operation = vi.fn().mockResolvedValue("confirmed");
    await expect(readWithRetry("immediate", operation, noWait)).resolves.toBe("confirmed");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("recovers transparently after a Failed to fetch transport error", async () => {
    const operation = vi.fn().mockRejectedValueOnce(new Error("Failed to fetch")).mockResolvedValue("confirmed");
    await expect(readWithRetry("one-retry", operation, noWait)).resolves.toBe("confirmed");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("recovers after two transient failures", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("HTTP 503 temporarily unavailable"))
      .mockRejectedValueOnce(new Error("network request failed"))
      .mockResolvedValue({ id: 7 });
    await expect(readWithRetry("two-retries", operation, noWait)).resolves.toEqual({ id: 7 });
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("does not retry deterministic application failures", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("invalid contract method"));
    await expect(readWithRetry("deterministic", operation, noWait)).rejects.toThrow("invalid contract method");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("stops after four transient attempts", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    await expect(readWithRetry("exhausted", operation, noWait)).rejects.toThrow("Failed to fetch");
    expect(operation).toHaveBeenCalledTimes(4);
  });

  it("deduplicates simultaneous identical reads", async () => {
    let resolve!: (value: number) => void;
    const operation = vi.fn(() => new Promise<number>((done) => { resolve = done; }));
    const first = readWithRetry("shared", operation, noWait);
    const second = readWithRetry("shared", operation, noWait);
    resolve(9);
    await expect(Promise.all([first, second])).resolves.toEqual([9, 9]);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("limits concurrent public reads to four", async () => {
    let active = 0;
    let peak = 0;
    const values = await mapWithConcurrency(Array.from({ length: 17 }, (_, i) => i), async (value) => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
      return value * 2;
    });
    expect(peak).toBe(4);
    expect(values).toEqual(Array.from({ length: 17 }, (_, i) => i * 2));
  });

  it("classifies only transport-shaped failures as transient", () => {
    expect(isTransientReadError(new Error("An unknown RPC error occurred. Details: Failed to fetch Version: viem@2.57.2"))).toBe(true);
    expect(isTransientReadError(new Error("HTTP 429"))).toBe(true);
    expect(isTransientReadError(new Error("malformed authoritative return"))).toBe(false);
  });
});
