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

import { addFunding } from "@/lib/contract";

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
});
