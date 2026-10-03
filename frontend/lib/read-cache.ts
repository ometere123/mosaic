import { NETWORK } from "./constants";
import { requireContractAddress } from "./deployment";

const VERSION = "v1";
const ACTIVE_SCOPE = "mosaic:read:active";

function storage(): Storage | null {
  try { return typeof window === "undefined" ? null : window.sessionStorage; }
  catch { return null; }
}

export function readCacheScope(contract: `0x${string}` = requireContractAddress()): string {
  return `${NETWORK.chainId}:${contract.toLowerCase()}:${VERSION}`;
}

function key(identity: string, contract?: `0x${string}`): string {
  return `mosaic:read:${VERSION}:${readCacheScope(contract)}:${identity}`;
}

export function ensureReadCacheScope(contract: `0x${string}` = requireContractAddress()): void {
  const target = storage();
  if (!target) return;
  const scope = readCacheScope(contract);
  if (target.getItem(ACTIVE_SCOPE) === scope) return;
  for (let i = target.length - 1; i >= 0; i--) {
    const item = target.key(i);
    if (item?.startsWith(`mosaic:read:${VERSION}:`)) target.removeItem(item);
  }
  target.setItem(ACTIVE_SCOPE, scope);
}

export function loadConfirmed<T>(identity: string, contract?: `0x${string}`): { value: T; confirmedAt: number } | null {
  const target = storage();
  if (!target) return null;
  ensureReadCacheScope(contract);
  try {
    const parsed = JSON.parse(target.getItem(key(identity, contract)) ?? "null");
    return parsed && typeof parsed.confirmedAt === "number" && "value" in parsed ? parsed : null;
  } catch { return null; }
}

export function saveConfirmed<T>(identity: string, value: T, contract?: `0x${string}`): number {
  const confirmedAt = Date.now();
  const target = storage();
  if (target) {
    ensureReadCacheScope(contract);
    try { target.setItem(key(identity, contract), JSON.stringify({ value, confirmedAt })); } catch { /* cache is optional */ }
  }
  return confirmedAt;
}
