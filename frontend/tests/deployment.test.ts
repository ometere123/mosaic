import { describe, expect, it, vi } from "vitest";

describe("deployment configuration", () => {
  it("does not invent an address when configuration is missing", async () => {
    vi.resetModules();
    const deployment = await import("@/lib/deployment");
    expect(deployment.CONTRACT_ADDRESS).toBeNull();
    expect(() => deployment.requireContractAddress()).toThrow("not configured");
  });
  it("rejects malformed configured addresses", async () => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_MOSAIC_CONTRACT_ADDRESS = "0x1234";
    const deployment = await import("@/lib/deployment");
    expect(deployment.CONTRACT_ADDRESS).toBeNull();
    delete process.env.NEXT_PUBLIC_MOSAIC_CONTRACT_ADDRESS;
  });
});
