import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/deployment", () => ({ requireContractAddress: () => "0x1111111111111111111111111111111111111111" }));

import { loadConfirmed, saveConfirmed } from "@/lib/read-cache";

describe("confirmed read cache", () => {
  beforeEach(() => sessionStorage.clear());

  it("round-trips last confirmed state", () => {
    saveConfirmed("missions", { ids: [1, 2] });
    expect(loadConfirmed<{ ids: number[] }>("missions")?.value).toEqual({ ids: [1, 2] });
  });

  it("invalidates snapshots when the contract address changes", () => {
    const first = "0x1111111111111111111111111111111111111111" as const;
    const second = "0x2222222222222222222222222222222222222222" as const;
    saveConfirmed("missions", { ids: [1] }, first);
    expect(loadConfirmed("missions", first)).not.toBeNull();
    expect(loadConfirmed("missions", second)).toBeNull();
    expect(loadConfirmed("missions", first)).toBeNull();
  });
});
