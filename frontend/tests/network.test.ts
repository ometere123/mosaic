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
  it("adds Studionet when the wallet reports an unknown chain", async () => {
    const calls: string[] = [];
    const request = vi.fn(async ({ method }: { method: string }) => {
      calls.push(method);
      if (method === "eth_chainId") return calls.length === 1 ? "0x999" : NETWORK.chainIdHex;
      if (method === "wallet_switchEthereumChain") {
        if (calls.filter((item) => item === "wallet_switchEthereumChain").length === 1) throw Object.assign(new Error("unknown"), { code: 4902 });
        return null;
      }
      return null;
    });
    await ensureStudionet({ request });
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ method: "wallet_addEthereumChain" }));
  });
  it("propagates a wallet rejection instead of hiding it", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => method === "eth_chainId" ? "0x1" : Promise.reject(Object.assign(new Error("rejected"), { code: 4001 })));
    await expect(ensureStudionet({ request })).rejects.toThrow("rejected");
  });
  it("does not add a chain when switching is rejected for a non-unknown error", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_chainId") return "0x1";
      throw Object.assign(new Error("user rejected"), { code: 4001 });
    });
    await expect(ensureStudionet({ request })).rejects.toThrow("user rejected");
    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ method: "wallet_addEthereumChain" }));
  });
  it("rejects when switching does not reach Studionet", async () => {
    const request = vi.fn(async ({ method }: { method: string }) => method === "eth_chainId" ? "0x1" : null);
    await expect(ensureStudionet({ request })).rejects.toThrow("did not switch");
  });
  it.each(["0xF22F", "0xf22f"]) ("reads chain response %s", async (chain) => {
    const request = vi.fn(async () => chain);
    await expect(ensureStudionet({ request })).resolves.toBeUndefined();
  });
});
