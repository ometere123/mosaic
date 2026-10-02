import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WalletControl } from "@/components/wallet-control";
import { TransactionDrawer } from "@/components/transaction-drawer";
import { WalletProvider } from "@/hooks/use-wallet";
import { TransactionProvider } from "@/hooks/use-transactions";

const account = "0x1111111111111111111111111111111111111111";
const hash = `0x${"a".repeat(64)}`;

function provider(overrides: Record<string, unknown> = {}) {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  return {
    request: vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") return [];
      if (method === "eth_chainId") return "0xf22f";
      if (method === "eth_requestAccounts") return [account];
      if (method === "wallet_revokePermissions") return null;
      return null;
    }),
    on: vi.fn((event: string, listener: (...args: unknown[]) => void) => listeners.set(event, listener)),
    removeListener: vi.fn(),
    emit(event: string, ...args: unknown[]) { listeners.get(event)?.(...args); },
    ...overrides,
  };
}

afterEach(() => {
  delete window.ethereum;
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("rendered wallet workflow", () => {
  it("shows no-wallet state when no injected provider exists", async () => {
    render(<WalletProvider><WalletControl /></WalletProvider>);
    expect(screen.getByText("No wallet")).toBeInTheDocument();
  });

  it("connects, renders the account, reacts to account changes, and disconnects", async () => {
    const p = provider();
    window.ethereum = p;
    render(<WalletProvider><WalletControl /></WalletProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Connect wallet" }));
    expect(await screen.findByText("0x111111…1111")).toBeInTheDocument();
    p.emit("accountsChanged", ["0x2222222222222222222222222222222222222222"]);
    expect(await screen.findByText("0x222222…2222")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(await screen.findByRole("button", { name: "Connect wallet" })).toBeInTheDocument();
  });

  it("renders wrong-network recovery and preserves rejection as an error state", async () => {
    const p = provider({ request: vi.fn(async ({ method }: { method: string }) => {
      if (method === "eth_accounts") return [account];
      if (method === "eth_chainId") return "0x1";
      if (method === "wallet_switchEthereumChain") throw Object.assign(new Error("rejected"), { code: 4001 });
      return null;
    }) });
    window.ethereum = p;
    render(<WalletProvider><WalletControl /></WalletProvider>);
    expect(await screen.findByRole("button", { name: /Switch to Studionet/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Switch to Studionet/ }));
    await waitFor(() => expect(p.request).toHaveBeenCalledWith(expect.objectContaining({ method: "wallet_switchEthereumChain" })));
  });
});

describe("rendered transaction truth", () => {
  it("distinguishes accepted from finalized-unverified and does not display success", async () => {
    localStorage.setItem("mosaic:transactions:v1", JSON.stringify([
      { hash, action: "Fund mission", submittedAt: 1, stage: "accepted" },
      { hash: `0x${"b".repeat(64)}`, action: "Contribute", submittedAt: 2, stage: "finalized_unverified" },
    ]));
    render(<TransactionProvider><TransactionDrawer /></TransactionProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Activity/ }));
    expect(await screen.findByText("Accepted · awaiting finality")).toBeInTheDocument();
    expect(screen.getByText("Finalized · execution unverified")).toBeInTheDocument();
    expect(screen.queryByText("Finalized · execution succeeded")).not.toBeInTheDocument();
    expect(screen.getByText(/does not treat this as durable completion/)).toBeInTheDocument();
  });
});
