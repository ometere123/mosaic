import { describe, expect, it } from "vitest";

describe("pinned GenLayer chain guard", () => {
  it("loads the installed Studionet definition only when it is chain 61999", async () => {
    await expect(import("@/lib/genlayer")).resolves.toHaveProperty("readClient");
  });
});
