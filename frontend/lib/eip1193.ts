import { NETWORK } from "./constants";

export type Eip1193Request = { method: string; params?: unknown[] | object };
export type Eip1193Provider = {
  request(args: Eip1193Request): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
  isOkxWallet?: boolean;
};

declare global {
  interface Window { ethereum?: Eip1193Provider & { providers?: Eip1193Provider[] }; }
}

export function injectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined" || !window.ethereum) return null;
  const providers = window.ethereum.providers?.length ? window.ethereum.providers : [window.ethereum];
  // Prefer the provider with the strongest stable wallet identity.  This keeps
  // the selection deterministic when extensions race to install window.ethereum.
  return providers.find((provider) => provider.isMetaMask)
    ?? providers.find((provider) => provider.isCoinbaseWallet)
    ?? providers.find((provider) => provider.isRabby)
    ?? providers.find((provider) => provider.isBraveWallet)
    ?? providers.find((provider) => provider.isOkxWallet)
    ?? providers[0]
    ?? null;
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
