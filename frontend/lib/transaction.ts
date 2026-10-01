import { readClient } from "./genlayer";
import type { TxRecord, TxStage } from "./types";

const STATUS_BY_CODE: Record<number, string> = {
  0: "Uninitialized", 1: "Pending", 2: "Proposing", 3: "Committing", 4: "Revealing",
  5: "Accepted", 6: "Undetermined", 7: "Finalized", 8: "Canceled", 9: "AppealRevealing",
  10: "AppealCommitting", 11: "ValidatorsTimeout", 12: "LeaderTimeout", 13: "LeaderRevealing",
};

const EXECUTION_BY_CODE: Record<number, string> = {
  0: "NotVoted", 1: "FinishedWithReturn", 2: "FinishedWithError",
  3: "Timeout", 4: "NondetDisagree", 5: "DeterministicViolation",
};

function upper(value: unknown): string { return String(value ?? "").toUpperCase(); }

function findString(value: unknown, keys: string[], depth = 0): string {
  if (!value || typeof value !== "object" || depth > 5) return "";
  const object = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = object[key];
    if (typeof candidate === "string" && candidate) return candidate;
  }
  for (const child of Object.values(object)) {
    if (Array.isArray(child)) {
      for (const entry of child.slice(0, 8)) {
        const found = findString(entry, keys, depth + 1);
        if (found) return found;
      }
    } else if (child && typeof child === "object") {
      const found = findString(child, keys, depth + 1);
      if (found) return found;
    }
  }
  return "";
}

export function classifyTransaction(raw: unknown, previous: TxRecord): TxRecord {
  const tx = (raw ?? {}) as Record<string, unknown>;
  const numericStatus = Number(tx.status_code ?? tx.statusCode ?? (typeof tx.status === "number" ? tx.status : NaN));
  const explicitStatus = tx.status_name ?? tx.statusName ?? (typeof tx.status === "string" ? tx.status : "");
  const statusName = String(explicitStatus || (Number.isFinite(numericStatus) ? STATUS_BY_CODE[numericStatus] ?? "" : ""));
  const explicitExecution = findString(tx, [
    "tx_execution_result_name", "txExecutionResultName", "execution_result_name", "executionResultName",
  ]);
  const numericExecution = Number(tx.tx_execution_result ?? tx.txExecutionResult ?? NaN);
  const executionName = explicitExecution || (Number.isFinite(numericExecution) ? EXECUTION_BY_CODE[numericExecution] ?? "" : "");
  const status = upper(statusName);
  const exec = upper(executionName);
  const executionFailed = exec.includes("ERROR") || exec.includes("REVERT") || exec.includes("FAILED") || exec.includes("TIMEOUT") || exec.includes("NONDET") || exec.includes("VIOLATION");
  const executionSucceeded = exec.includes("FINISHED_WITH_RETURN") || exec.includes("FINISHEDWITHRETURN") || exec === "SUCCESS" || exec === "SUCCEEDED";
  let stage: TxStage = "pending";
  if (status.includes("UNDETERMINED")) stage = "undetermined";
  else if (status.includes("CANCEL")) stage = "canceled";
  else if (status.includes("TIMEOUT")) stage = "timeout";
  else if (status.includes("FINALIZED")) stage = executionFailed ? "failed" : executionSucceeded ? "finalized" : "finalized_unverified";
  else if (status.includes("ACCEPTED")) stage = executionFailed ? "failed" : "accepted";
  else if (status.includes("PENDING") || status.includes("PROPOS") || status.includes("COMMIT") || status.includes("REVEAL") || status.includes("APPEAL")) stage = "pending";
  return { ...previous, stage, statusName, executionName };
}

export async function fetchTransaction(record: TxRecord): Promise<TxRecord> {
  try {
    const client = readClient() as unknown as Record<string, unknown>;
    let primary: unknown = {};
    const getTransaction = client.getTransaction as ((args: { hash: never }) => Promise<unknown>) | undefined;
    const getTransactionData = client.getTransactionData as ((hash: string, now: number) => Promise<unknown>) | undefined;
    if (typeof getTransaction === "function") primary = await getTransaction.call(client, { hash: record.hash as never });
    else if (typeof getTransactionData === "function") primary = await getTransactionData.call(client, record.hash, Math.floor(Date.now() / 1000));

    let detail: unknown = {};
    const getAll = client.getTransactionAllData as ((arg: unknown) => Promise<unknown>) | undefined;
    if (typeof getAll === "function") {
      try { detail = await getAll.call(client, record.hash); }
      catch {
        try { detail = await getAll.call(client, { hash: record.hash }); }
        catch { /* execution remains explicitly unverified */ }
      }
    }
    return classifyTransaction({ ...(primary as object), ...(detail as object) }, record);
  } catch {
    return record.stage === "submitted" ? { ...record, stage: "pending" } : record;
  }
}
