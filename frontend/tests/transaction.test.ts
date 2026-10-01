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
});
