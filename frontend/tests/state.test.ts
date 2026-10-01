import { describe, expect, it } from "vitest";
import { missionPhase } from "@/components/status";
import type { Mission } from "@/lib/types";

const mission = { status: "OPEN", close_at: 100 } as Mission;
describe("mission derived state", () => {
  it("derives closed-unresolved without inventing a stored transition", () => {
    expect(missionPhase(mission, 101)).toBe("CLOSED · UNRESOLVED");
  });
  it("does not override terminal contract state", () => {
    expect(missionPhase({ ...mission, status: "SETTLED" }, 101)).toBe("SETTLED");
  });
});
