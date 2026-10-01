import { beforeEach, describe, expect, it, vi } from "vitest";

const { writeContract, connect, walletClient } = vi.hoisted(() => {
  const write = vi.fn();
  const snapConnect = vi.fn();
  return {
    writeContract: write,
    connect: snapConnect,
    walletClient: vi.fn(() => ({ writeContract: write, connect: snapConnect })),
  };
});

vi.mock("@/lib/genlayer", () => ({
  readClient: vi.fn(),
  walletClient,
}));

vi.mock("@/lib/deployment", () => ({
  requireContractAddress: () => "0x1111111111111111111111111111111111111111",
}));

import { addFunding, openMission } from "@/lib/contract";

describe("injected-wallet writes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeContract.mockResolvedValue("0xabc");
  });

  it("writes through the supplied EIP-1193 provider without invoking a Snap connection", async () => {
    const provider = { request: vi.fn() };
    const account = "0x2222222222222222222222222222222222222222" as const;

    await expect(addFunding(provider, account, 7, 5n)).resolves.toBe("0xabc");

    expect(walletClient).toHaveBeenCalledWith(provider, account);
    expect(connect).not.toHaveBeenCalled();
    expect(writeContract).toHaveBeenCalledWith({
      address: "0x1111111111111111111111111111111111111111",
      functionName: "add_funding",
      args: [7n],
      value: 5n,
    });
  });

  it("freezes the target branch between repository and baseline arguments", async () => {
    const provider = { request: vi.fn() };
    const account = "0x2222222222222222222222222222222222222222" as const;

    await openMission(provider, account, {
      repo: "acme/widget",
      targetRef: "release/v2",
      baseline: "a".repeat(40),
      title: "Release reliability",
      objective: "Harden the release line.",
      criteria: ["Recovery works"],
      closeAt: 1_800_000_000,
      value: 10n ** 18n,
    });

    expect(writeContract).toHaveBeenCalledWith({
      address: "0x1111111111111111111111111111111111111111",
      functionName: "open_mission",
      args: ["acme/widget", "release/v2", "a".repeat(40), "Release reliability", "Harden the release line.", '["Recovery works"]', 1_800_000_000],
      value: 10n ** 18n,
    });
    expect(connect).not.toHaveBeenCalled();
  });
});
