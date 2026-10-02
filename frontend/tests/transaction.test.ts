import { describe, expect, it } from "vitest";
import { classifyTransaction } from "@/lib/transaction";
import type { TxRecord } from "@/lib/types";

const base: TxRecord = { hash: "0x1", action: "test", submittedAt: 1, stage: "submitted" };

describe("transaction truthfulness", () => {
  it("keeps accepted separate from finalized", () => {
    const result = classifyTransaction({ status_name: "ACCEPTED", tx_execution_result_name: "FINISHED_WITH_RETURN" }, base);
    expect(result.stage).toBe("accepted");
  });
  it("treats accepted execution error as failure", () => {
    const result = classifyTransaction({ status_name: "ACCEPTED", tx_execution_result_name: "FINISHED_WITH_ERROR" }, base);
    expect(result.stage).toBe("failed");
  });
  it("requires finalized successful execution for durable success surface", () => {
    const result = classifyTransaction({ status_name: "FINALIZED", tx_execution_result_name: "FINISHED_WITH_RETURN" }, base);
    expect(result.stage).toBe("finalized");
  });
  it("does not call finalized execution success when execution is unknown", () => {
    expect(classifyTransaction({ status_name: "FINALIZED" }, base).stage).toBe("finalized_unverified");
  });
  it("does not infer transaction success from one nested validator receipt", () => {
    const raw = {
      status_name: "FINALIZED",
      consensus_data: { validators: [{ txExecutionResultName: "FinishedWithReturn" }] },
    };
    expect(classifyTransaction(raw, base).stage).toBe("finalized_unverified");
  });
  it("uses the pinned SDK leader receipt fallback when top-level execution is absent", () => {
    const raw = { status_name: "FINALIZED", consensus_data: { leader_receipt: [{ execution_result: "FINISHED_WITH_RETURN" }] } };
    expect(classifyTransaction(raw, base).stage).toBe("finalized");
  });
  it("surfaces an authoritative leader execution error", () => {
    const raw = { status_name: "FINALIZED", consensus_data: { leader_receipt: [{ execution_result: "FINISHED_WITH_ERROR" }] } };
    expect(classifyTransaction(raw, base).stage).toBe("failed");
  });
  it("does not let a leader receipt override a conflicting top-level result", () => {
    const raw = { status_name: "FINALIZED", tx_execution_result_name: "FINISHED_WITH_ERROR", consensus_data: { leader_receipt: [{ execution_result: "FINISHED_WITH_RETURN" }] } };
    expect(classifyTransaction(raw, base).stage).toBe("failed");
  });
  it("surfaces undetermined consensus", () => {
    expect(classifyTransaction({ status_name: "UNDETERMINED" }, base).stage).toBe("undetermined");
  });
  it("understands the stored numeric finalized and execution codes", () => {
    const result = classifyTransaction({ status: 7, txExecutionResult: 1 }, base);
    expect(result.stage).toBe("finalized");
    expect(result.statusName).toBe("Finalized");
    expect(result.executionName).toBe("FinishedWithReturn");
  });
  it("does not hide protocol execution timeouts behind finality", () => {
    expect(classifyTransaction({ statusName: "Finalized", txExecutionResultName: "Timeout" }, base).stage).toBe("failed");
  });
  it("keeps ready-to-finalize pending and maps timeout codes correctly", () => {
    expect(classifyTransaction({ status: 11 }, base).stage).toBe("pending");
    expect(classifyTransaction({ status: 12 }, base).stage).toBe("timeout");
    expect(classifyTransaction({ status: 13 }, base).stage).toBe("timeout");
  });

  it.each([
    ["PENDING", "pending"], ["PROPOSING", "pending"], ["COMMITTING", "pending"],
    ["REVEALING", "pending"], ["APPEAL_REVEALING", "pending"], ["APPEAL_COMMITTING", "pending"],
    ["CANCELED", "canceled"], ["LEADER_TIMEOUT", "timeout"], ["VALIDATORS_TIMEOUT", "timeout"],
    ["UNDETERMINED", "undetermined"],
  ] as const)("maps status %s to a non-success stage", (status, stage) => {
    expect(classifyTransaction({ status_name: status }, base).stage).toBe(stage);
  });
  it.each([
    "REVERTED", "FAILED", "NONDET_VIOLATION", "EXECUTION_TIMEOUT", "FinishedWithError",
  ])("never presents execution %s as success", (execution) => {
    expect(classifyTransaction({ status_name: "FINALIZED", tx_execution_result_name: execution }, base).stage).toBe("failed");
  });
  it.each([
    "FINISHED_WITH_RETURN", "FinishedWithReturn", "SUCCESS", "SUCCEEDED",
  ])("accepts supported finalized execution %s", (execution) => {
    expect(classifyTransaction({ status_name: "FINALIZED", tx_execution_result_name: execution }, base).stage).toBe("finalized");
  });
  it.each([0, 1, 2, 3, 4, 5, 8, 9, 10])("does not confuse numeric status code %s with success", (status) => {
    expect(classifyTransaction({ status }, base).stage).not.toBe("finalized");
  });
  it.each([0, 99, -1])("does not infer success from unsupported execution code %s", (execution) => {
    expect(classifyTransaction({ status: 7, txExecutionResult: execution }, base).stage).toBe("finalized_unverified");
  });
  it("accepts camelCase leader receipt from the pinned response shape", () => {
    expect(classifyTransaction({ statusName: "Finalized", consensusData: { leaderReceipt: [{ executionResult: 1 }] } }, base).stage).toBe("finalized");
  });
  it("accepts the pinned multi-entry receipt when the leader is explicitly labeled", () => {
    expect(classifyTransaction({
      status: 7,
      result: 6,
      consensus_data: {
        leader_receipt: [
          { mode: "leader", execution_result: "SUCCESS" },
          { mode: "validator", execution_result: "ERROR" },
        ],
      },
    }, base).stage).toBe("finalized");
  });
  it("accepts the installed consensus-history leader representation", () => {
    expect(classifyTransaction({
      status_name: "FINALIZED",
      consensus_history: {
        consensus_results: [{
          leader_result: [
            { mode: "leader", execution_result: "SUCCESS" },
            { mode: "validator", execution_result: "ERROR" },
          ],
        }],
      },
    }, base).stage).toBe("finalized");
  });
  it("rejects multiple leader receipts as non-authoritative", () => {
    expect(classifyTransaction({ status_name: "FINALIZED", consensus_data: { leader_receipt: [{ execution_result: 1 }, { execution_result: 1 }] } }, base).stage).toBe("finalized_unverified");
  });
  it("preserves the prior transaction identity while classifying", () => {
    const record = { ...base, hash: "0xabc", action: "withdraw" };
    expect(classifyTransaction({ status_name: "FINALIZED", tx_execution_result_name: "FINISHED_WITH_RETURN" }, record)).toMatchObject({ hash: "0xabc", action: "withdraw", submittedAt: 1 });
  });
});
