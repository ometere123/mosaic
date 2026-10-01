import { describe, expect, it, vi } from "vitest";
import { ensureStudionet } from "@/lib/eip1193";
import { NETWORK } from "@/lib/constants";

describe("wallet network guard", () => {
  it("does not switch an already-correct wallet", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => method === "eth_chainId" ? NETWORK.chainIdHex : null);
    await ensureStudionet({ request });
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("requests the exact Studionet chain when wrong", async () => {
    let chain = "0x1";
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_chainId") return chain;
      if (method === "wallet_switchEthereumChain") { chain = NETWORK.chainIdHex; return null; }
      return null;
    });
    await ensureStudionet({ request });
    expect(request).toHaveBeenCalledWith({ method: "wallet_switchEthereumChain", params: [{ chainId: NETWORK.chainIdHex }] });
  });
});
