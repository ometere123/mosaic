import { NETWORK } from "./constants";

export type Eip1193Request = { method: string; params?: unknown[] | object };
export type Eip1193Provider = {
  request(args: Eip1193Request): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

declare global {
  interface Window { ethereum?: Eip1193Provider; }
}

export function injectedProvider(): Eip1193Provider | null {
  return typeof window === "undefined" ? null : window.ethereum ?? null;
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
    const code = (error as { code?: number })?.code;
    if (code !== 4902) throw error;
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
  }
  const after = await currentChainId(provider);
  if (after !== NETWORK.chainId) throw new Error("Wallet did not switch to Studionet 61999.");
}
