"use client";

import { readClient, walletClient } from "./genlayer";
import { requireContractAddress } from "./deployment";
import type { Contribution, Mission } from "./types";
import type { Eip1193Provider } from "./eip1193";

function parse<T>(raw: unknown): T | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export async function getNextMissionId(): Promise<number> {
  const raw = await readClient().readContract({ address: requireContractAddress(), functionName: "get_next_mission_id", args: [] });
  return Number(raw ?? 0);
}

export async function getMission(id: number): Promise<Mission | null> {
  const raw = await readClient().readContract({ address: requireContractAddress(), functionName: "get_mission", args: [BigInt(id)] });
  return parse<Mission>(raw);
}

export async function getContribution(missionId: number, index: number): Promise<Contribution | null> {
  const raw = await readClient().readContract({ address: requireContractAddress(), functionName: "get_contribution", args: [BigInt(missionId), index] });
  return parse<Contribution>(raw);
}

export async function getBalance(wallet: string): Promise<bigint> {
  const raw = await readClient().readContract({ address: requireContractAddress(), functionName: "get_balance", args: [wallet.toLowerCase()] });
  return BigInt(String(raw || "0"));
}

export async function getSponsorTotal(missionId: number, wallet: string): Promise<bigint> {
  const raw = await readClient().readContract({ address: requireContractAddress(), functionName: "get_sponsor_total", args: [BigInt(missionId), wallet.toLowerCase()] });
  return BigInt(String(raw || "0"));
}

function writer(provider: Eip1193Provider, account: `0x${string}`) {
  // Network switching is handled through the injected EIP-1193 provider before
  // this point. genlayer-js connect() is a MetaMask Snap flow and must not run.
  return walletClient(provider, account);
}

export async function openMission(provider: Eip1193Provider, account: `0x${string}`, input: {
  repo: string; baseline: string; title: string; objective: string; criteria: string[]; closeAt: number; value: bigint;
}) {
  const client = writer(provider, account);
  return client.writeContract({
    address: requireContractAddress(), functionName: "open_mission",
    args: [input.repo, input.baseline, input.title, input.objective, JSON.stringify(input.criteria), input.closeAt], value: input.value,
  });
}

export async function addFunding(provider: Eip1193Provider, account: `0x${string}`, missionId: number, value: bigint) {
  const client = writer(provider, account);
  return client.writeContract({ address: requireContractAddress(), functionName: "add_funding", args: [BigInt(missionId)], value });
}

export async function sealContribution(provider: Eip1193Provider, account: `0x${string}`, missionId: number, pr: number, commentId: number) {
  const client = writer(provider, account);
  return client.writeContract({ address: requireContractAddress(), functionName: "seal_contribution", args: [BigInt(missionId), pr, commentId], value: 0n });
}

export async function resolveMission(provider: Eip1193Provider, account: `0x${string}`, missionId: number) {
  const client = writer(provider, account);
  return client.writeContract({ address: requireContractAddress(), functionName: "resolve_mission", args: [BigInt(missionId)], value: 0n });
}

export async function expireMission(provider: Eip1193Provider, account: `0x${string}`, missionId: number) {
  const client = writer(provider, account);
  return client.writeContract({ address: requireContractAddress(), functionName: "expire_unresolved", args: [BigInt(missionId)], value: 0n });
}

export async function withdraw(provider: Eip1193Provider, account: `0x${string}`) {
  const client = writer(provider, account);
  return client.writeContract({ address: requireContractAddress(), functionName: "withdraw", args: [], value: 0n });
}
