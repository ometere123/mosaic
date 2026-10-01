"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { currentChainId, ensureStudionet, injectedProvider, type Eip1193Provider } from "@/lib/eip1193";
import { NETWORK } from "@/lib/constants";

export type WalletState = {
  provider: Eip1193Provider | null;
  available: boolean;
  connected: boolean;
  address: `0x${string}` | null;
  chainId: number | null;
  correctNetwork: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (p: Eip1193Provider, requestAccounts = false) => {
    const method = requestAccounts ? "eth_requestAccounts" : "eth_accounts";
    const accounts = (await p.request({ method })) as string[];
    const next = accounts?.[0];
    setAddress(next && /^0x[0-9a-fA-F]{40}$/.test(next) ? (next as `0x${string}`) : null);
    setChainId(await currentChainId(p));
  }, []);

  useEffect(() => {
    const p = injectedProvider();
    setProvider(p);
    if (!p) return;
    void refresh(p, false).catch(() => undefined);
    const onAccounts = (...args: unknown[]) => {
      const accounts = (args[0] ?? []) as string[];
      const next = accounts?.[0];
      setAddress(next && /^0x[0-9a-fA-F]{40}$/.test(next) ? (next as `0x${string}`) : null);
    };
    const onChain = (...args: unknown[]) => setChainId(Number.parseInt(String(args[0]), 16));
    p.on?.("accountsChanged", onAccounts);
    p.on?.("chainChanged", onChain);
    return () => {
      p.removeListener?.("accountsChanged", onAccounts);
      p.removeListener?.("chainChanged", onChain);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!provider) { setError("No injected EVM wallet detected. Install MetaMask, Rabby, or another EIP-1193 wallet."); return; }
    setConnecting(true); setError(null);
    try { await refresh(provider, true); }
    catch (e) { setError(e instanceof Error ? e.message : "Wallet connection was rejected."); }
    finally { setConnecting(false); }
  }, [provider, refresh]);

  const disconnect = useCallback(async () => {
    setError(null);
    if (provider) {
      try { await provider.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] }); } catch { /* not universally supported */ }
    }
    setAddress(null);
  }, [provider]);

  const switchNetwork = useCallback(async () => {
    if (!provider) return;
    setError(null);
    try { await ensureStudionet(provider); setChainId(NETWORK.chainId); }
    catch (e) { setError(e instanceof Error ? e.message : "Network switch was rejected."); }
  }, [provider]);

  const value = useMemo<WalletState>(() => ({
    provider, available: !!provider, connected: !!address, address, chainId,
    correctNetwork: chainId === NETWORK.chainId, connecting, error,
    connect, disconnect, switchNetwork,
  }), [provider, address, chainId, connecting, error, connect, disconnect, switchNetwork]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider");
  return value;
}
