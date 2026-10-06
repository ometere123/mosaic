import { NETWORK } from "./constants";

export type Eip1193Request = { method: string; params?: unknown[] | object };
export type Eip1193Provider = {
  request(args: Eip1193Request): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

declare global {
  interface Window { ethereum?: Eip1193Provider & { providers?: Eip1193Provider[] }; }
}

export function injectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined" || !window.ethereum) return null;
  const providers = window.ethereum.providers;
  return providers?.length ? providers[0] : window.ethereum;
}

function providerCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value = error as { code?: unknown; data?: unknown; cause?: unknown };
  if (typeof value.code === "number") return value.code;
  if (value.data && typeof value.data === "object") {
    const code = (value.data as { code?: unknown }).code;
    if (typeof code === "number") return code;
  }
  return providerCode(value.cause);
}

export async function currentChainId(provider: Eip1193Provider): Promise<number> {
  const hex = await provider.request({ method: "eth_chainId" });
  return Number.parseInt(String(hex), 16);
}

export async function ensureStudionet(provider: Eip1193Provider): Promise<void> {
  if ((await currentChainId(provider)) === NETWORK.chainId) return;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: NETWORK.chainIdHex }] });
  } catch (error) {
    if (providerCode(error) !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: NETWORK.chainIdHex,
        chainName: NETWORK.name,
        nativeCurrency: NETWORK.nativeCurrency,
        rpcUrls: [NETWORK.rpcUrl],
        blockExplorerUrls: [NETWORK.explorerUrl],
      }],
    });
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: NETWORK.chainIdHex }] });
  }
  const after = await currentChainId(provider);
  if (after !== NETWORK.chainId) throw new Error("Wallet did not switch to Studionet 61999.");
}
