const raw = (process.env.NEXT_PUBLIC_MOSAIC_CONTRACT_ADDRESS ?? "").trim();
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export const CONTRACT_ADDRESS: `0x${string}` | null = ADDRESS_RE.test(raw)
  ? (raw as `0x${string}`)
  : null;

export function requireContractAddress(): `0x${string}` {
  if (!CONTRACT_ADDRESS) throw new Error("MOSAIC contract address is not configured for this deployment.");
  return CONTRACT_ADDRESS;
}
