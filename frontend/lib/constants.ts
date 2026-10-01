export const NETWORK = {
  name: "GenLayer Studionet",
  shortName: "Studionet",
  chainId: 61999,
  chainIdHex: "0xf22f",
  rpcUrl: "https://studio.genlayer.com/api",
  explorerUrl: "https://explorer-studio.genlayer.com",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
} as const;

export const MIN_FUND_GEN = 1;
export const MIN_MISSION_SECONDS = 60 * 60;
export const MAX_MISSION_SECONDS = 90 * 24 * 60 * 60;
export const MAX_CONTRIBUTIONS = 12;
export const MAX_CONTRIBUTORS = 8;
export const UNRESOLVED_GRACE_SECONDS = 30 * 24 * 60 * 60;
