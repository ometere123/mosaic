"use client";

import { TransactionHashVariant, type CalldataEncodable } from "genlayer-js/types";
import { readClient, walletClient } from "./genlayer";
import { requireContractAddress } from "./deployment";
import { readWithRetry } from "./read-resilience";
import type { Contribution, Mission } from "./types";
import type { Eip1193Provider } from "./eip1193";

function parse<T>(raw: unknown): T | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

async function authoritativeRead(functionName: string, args: CalldataEncodable[]) {
  const address = requireContractAddress();
  const identity = `${address.toLowerCase()}:${functionName}:${JSON.stringify(args, (_, value) => typeof value === "bigint" ? value.toString() : value)}`;
  return readWithRetry(identity, () => readClient().readContract({
    address,
    functionName,
    args,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  }));
}

export async function getNextMissionId(): Promise<number> {
  const raw = await authoritativeRead("get_next_mission_id", []);
  return Number(raw ?? 0);
}

export async function getMission(id: number): Promise<Mission | null> {
  const raw = await authoritativeRead("get_mission", [BigInt(id)]);
  return parse<Mission>(raw);
}

export async function getContribution(missionId: number, index: number): Promise<Contribution | null> {
  const raw = await authoritativeRead("get_contribution", [BigInt(missionId), index]);
  return parse<Contribution>(raw);
}

export async function getBalance(wallet: string): Promise<bigint> {
  const raw = await authoritativeRead("get_balance", [wallet.toLowerCase()]);
  return BigInt(String(raw || "0"));
}

export async function getSponsorTotal(missionId: number, wallet: string): Promise<bigint> {
  const raw = await authoritativeRead("get_sponsor_total", [BigInt(missionId), wallet.toLowerCase()]);
  return BigInt(String(raw || "0"));
}

export async function getAuthorWallet(missionId: number, accountId: string): Promise<string> {
  return String(await authoritativeRead("get_author_wallet", [BigInt(missionId), accountId]) || "");
}

export async function getWalletAuthor(missionId: number, wallet: string): Promise<string> {
  return String(await authoritativeRead("get_wallet_author", [BigInt(missionId), wallet.toLowerCase()]) || "");
}

function writer(provider: Eip1193Provider, account: `0x${string}`) {
  // Network switching is handled through the injected EIP-1193 provider before
  // this point. genlayer-js connect() is a MetaMask Snap flow and must not run.
  return walletClient(provider, account);
}

export async function openMission(provider: Eip1193Provider, account: `0x${string}`, input: {
  repo: string; targetRef: string; baseline: string; title: string; objective: string; criteria: Array<{ text: string; evidence_kind: "SOURCE" | "GITHUB_CHECK"; check_name?: string; check_app_slug?: string }>; closeAt: number; value: bigint;
}) {
  const client = writer(provider, account);
  return client.writeContract({
    address: requireContractAddress(), functionName: "open_mission",
    args: [input.repo, input.targetRef, input.baseline, input.title, input.objective, JSON.stringify(input.criteria), input.closeAt], value: input.value,
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

export async function freezeTerminal(provider: Eip1193Provider, account: `0x${string}`, missionId: number) {
  const client = writer(provider, account);
  return client.writeContract({ address: requireContractAddress(), functionName: "freeze_terminal", args: [BigInt(missionId)], value: 0n });
}

export async function expireMission(provider: Eip1193Provider, account: `0x${string}`, missionId: number) {
  const client = writer(provider, account);
  return client.writeContract({ address: requireContractAddress(), functionName: "expire_unresolved", args: [BigInt(missionId)], value: 0n });
}

export async function withdraw(provider: Eip1193Provider, account: `0x${string}`) {
  const client = writer(provider, account);
  return client.writeContract({ address: requireContractAddress(), functionName: "withdraw", args: [], value: 0n });
}

export async function withdrawFor(provider: Eip1193Provider, account: `0x${string}`, beneficiary: `0x${string}`) {
  const client = writer(provider, account);
  return client.writeContract({ address: requireContractAddress(), functionName: "withdraw_for", args: [beneficiary], value: 0n });
}
