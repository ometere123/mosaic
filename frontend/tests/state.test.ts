import { describe, expect, it } from "vitest";
import { missionPhase, outcomeTone } from "@/components/status";
import type { Mission } from "@/lib/types";

const mission = { status: "OPEN", close_at: 100 } as Mission;
describe("mission derived state", () => {
  it("derives closed-unresolved without inventing a stored transition", () => {
    expect(missionPhase(mission, 101)).toBe("CLOSED · UNRESOLVED");
  });
  it("does not override terminal contract state", () => {
    expect(missionPhase({ ...mission, status: "SETTLED" }, 101)).toBe("SETTLED");
  });
  it.each([["OPEN", "OPEN"], ["OPEN", "CLOSED · UNRESOLVED"], ["SETTLED", "SETTLED"], ["EXPIRED", "EXPIRED"]] as const)("preserves phase %s at the corresponding time/state", (status, expected) => {
    const closeAt = status === "OPEN" && expected === "OPEN" ? 1000 : 100;
    expect(missionPhase({ status, close_at: closeAt } as Mission, 101)).toBe(expected);
  });
  it.each([["ACHIEVED", "good"], ["MATERIAL_PROGRESS", "blue"], ["NOT_ACHIEVED", "bad"], ["EXPIRED", "bad"], ["INSUFFICIENT_EVIDENCE", "warn"], ["SOURCE_UNAVAILABLE", "warn"]] as const)("maps %s to a non-misleading tone", (outcome, tone) => {
    expect(outcomeTone(outcome)).toBe(tone);
  });
});
