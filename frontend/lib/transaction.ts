import { readClient } from "./genlayer";
import type { TxRecord, TxStage } from "./types";

const STATUS_BY_CODE: Record<number, string> = {
  0: "Uninitialized", 1: "Pending", 2: "Proposing", 3: "Committing", 4: "Revealing",
  5: "Accepted", 6: "Undetermined", 7: "Finalized", 8: "Canceled", 9: "AppealRevealing",
  10: "AppealCommitting", 11: "ReadyToFinalize", 12: "ValidatorsTimeout", 13: "LeaderTimeout",
};

const EXECUTION_BY_CODE: Record<number, string> = {
  0: "NotVoted", 1: "FinishedWithReturn", 2: "FinishedWithError",
};

function upper(value: unknown): string { return String(value ?? "").toUpperCase(); }

function directString(object: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const candidate = object[key];
    if (typeof candidate === "string" && candidate) return candidate;
  }
  return "";
}

function authoritativeLeaderExecution(tx: Record<string, unknown>): string {
  const consensus = tx.consensus_data ?? tx.consensusData;
  if (!consensus || typeof consensus !== "object") return "";
  const leaderReceipts = (consensus as Record<string, unknown>).leader_receipt ?? (consensus as Record<string, unknown>).leaderReceipt;
  if (!Array.isArray(leaderReceipts) || leaderReceipts.length !== 1 || !leaderReceipts[0] || typeof leaderReceipts[0] !== "object") return "";
  const receipt = leaderReceipts[0] as Record<string, unknown>;
  const named = directString(receipt, ["execution_result_name", "executionResultName", "execution_result", "executionResult"]);
  if (named) return named;
  const numeric = Number(receipt.execution_result ?? receipt.executionResult ?? NaN);
  return Number.isFinite(numeric) ? EXECUTION_BY_CODE[numeric] ?? "" : "";
}

export function classifyTransaction(raw: unknown, previous: TxRecord): TxRecord {
  const tx = (raw ?? {}) as Record<string, unknown>;
  const numericStatus = Number(tx.status_code ?? tx.statusCode ?? (typeof tx.status === "number" ? tx.status : NaN));
  const explicitStatus = tx.status_name ?? tx.statusName ?? (typeof tx.status === "string" ? tx.status : "");
  const statusName = String(explicitStatus || (Number.isFinite(numericStatus) ? STATUS_BY_CODE[numericStatus] ?? "" : ""));
  const explicitExecution = directString(tx, [
    "tx_execution_result_name", "txExecutionResultName", "execution_result_name", "executionResultName",
  ]);
  const numericExecution = Number(tx.tx_execution_result ?? tx.txExecutionResult ?? NaN);
  const executionName = explicitExecution || (Number.isFinite(numericExecution) ? EXECUTION_BY_CODE[numericExecution] ?? "" : "") || authoritativeLeaderExecution(tx);
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
    const raw = await readClient().getTransaction({ hash: record.hash as never });
    return classifyTransaction(raw, record);
  } catch {
    return record.stage === "submitted" ? { ...record, stage: "pending" } : record;
  }
}
