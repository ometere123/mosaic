"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { NETWORK } from "./constants";
import type { Eip1193Provider } from "./eip1193";

if (Number((studionet as { id?: number }).id) !== NETWORK.chainId) {
  throw new Error("Installed genlayer-js studionet chain definition does not match chain 61999.");
}

let publicClient: ReturnType<typeof createClient> | null = null;

export function readClient() {
  if (!publicClient) publicClient = createClient({ chain: studionet });
  return publicClient;
}

export function resetReadClient() {
  publicClient = null;
}

export function walletClient(provider: Eip1193Provider, account: `0x${string}`) {
  return createClient({ chain: studionet, account, provider: provider as never });
}

export function explorerTx(hash: string) {
  return `${NETWORK.explorerUrl}/tx/${hash}`;
}

export function explorerAddress(address: string) {
  return `${NETWORK.explorerUrl}/address/${address}`;
}
