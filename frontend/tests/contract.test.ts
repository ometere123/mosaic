import { beforeEach, describe, expect, it, vi } from "vitest";

const { writeContract, readContract, connect, walletClient } = vi.hoisted(() => {
  const write = vi.fn();
  const read = vi.fn();
  const snapConnect = vi.fn();
  return {
    writeContract: write,
    readContract: read,
    connect: snapConnect,
    walletClient: vi.fn(() => ({ writeContract: write, connect: snapConnect })),
  };
});

vi.mock("@/lib/genlayer", () => ({
  readClient: vi.fn(() => ({ readContract })),
  resetReadClient: vi.fn(),
  walletClient,
}));

vi.mock("@/lib/deployment", () => ({
  requireContractAddress: () => "0x1111111111111111111111111111111111111111",
}));

import { addFunding, expireMission, getBalance, getMission, getNextMissionId, openMission, resolveMission, sealContribution, withdraw } from "@/lib/contract";

describe("injected-wallet writes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeContract.mockResolvedValue("0xabc");
    readContract.mockResolvedValue("0");
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
      criteria: [{ text: "Recovery works", evidence_kind: "SOURCE" }],
      closeAt: 1_800_000_000,
      value: 10n ** 18n,
    });

    expect(writeContract).toHaveBeenCalledWith({
      address: "0x1111111111111111111111111111111111111111",
      functionName: "open_mission",
      args: ["acme/widget", "release/v2", "a".repeat(40), "Release reliability", "Harden the release line.", '[{"text":"Recovery works","evidence_kind":"SOURCE"}]', 1_800_000_000],
      value: 10n ** 18n,
    });
    expect(connect).not.toHaveBeenCalled();
  });
  it("writes contribution proof identifiers with zero GEN", async () => {
    await sealContribution({ request: vi.fn() }, "0x2222222222222222222222222222222222222222", 7, 8, 9);
    expect(writeContract).toHaveBeenCalledWith({ address: expect.any(String), functionName: "seal_contribution", args: [7n, 8, 9], value: 0n });
  });
  it.each([[resolveMission, "resolve_mission"], [expireMission, "expire_unresolved"]] as const)("writes %s as a zero-value permissionless action", async (writer, functionName) => {
    await writer({ request: vi.fn() }, "0x2222222222222222222222222222222222222222", 7);
    expect(writeContract).toHaveBeenCalledWith({ address: expect.any(String), functionName, args: [7n], value: 0n });
  });
  it("writes withdrawal with no arguments or value", async () => {
    await withdraw({ request: vi.fn() }, "0x2222222222222222222222222222222222222222");
    expect(writeContract).toHaveBeenCalledWith({ address: expect.any(String), functionName: "withdraw", args: [], value: 0n });
  });

  it("requests latest-final state for every authoritative read", async () => {
    readContract.mockResolvedValueOnce("2").mockResolvedValueOnce("null").mockResolvedValueOnce("7");
    await getNextMissionId();
    await getMission(1);
    await getBalance("0x2222222222222222222222222222222222222222");
    expect(readContract).toHaveBeenCalledTimes(3);
    for (const [request] of readContract.mock.calls) expect(request.transactionHashVariant).toBe("latest-final");
  });
});
