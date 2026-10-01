"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { useTransactions } from "@/hooks/use-transactions";
import { getBalance, withdraw } from "@/lib/contract";
import { ensureStudionet } from "@/lib/eip1193";
import { weiToGen } from "@/lib/format";

export default function EarningsPage() {
  const wallet = useWallet();
  const { track } = useTransactions();
  const [balance, setBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!wallet.address) { setBalance(0n); return; }
    setLoading(true); setError(null);
    try { setBalance(await getBalance(wallet.address)); }
    catch (e) { setError(e instanceof Error ? e.message : "Balance read failed."); }
    finally { setLoading(false); }
  }, [wallet.address]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { const handler = () => void refresh(); window.addEventListener("mosaic:transaction-update", handler); return () => window.removeEventListener("mosaic:transaction-update", handler); }, [refresh]);

  const onWithdraw = async () => {
    if (!wallet.provider || !wallet.address) { await wallet.connect(); return; }
    setWithdrawing(true); setError(null);
    try {
      await ensureStudionet(wallet.provider);
      const tx = await withdraw(wallet.provider, wallet.address);
      const hash = typeof tx === "string" ? tx : String((tx as { hash?: string; transactionHash?: string }).hash ?? (tx as { transactionHash?: string }).transactionHash ?? "");
      if (!hash) throw new Error("No transaction hash returned.");
      track(hash, "Withdraw GEN");
    } catch (e) { setError(e instanceof Error ? e.message : "Withdrawal submission failed."); }
    finally { setWithdrawing(false); }
  };

  return (
    <main className="page narrow-page">
      <div className="page-heading"><span className="eyebrow">Earnings & residuals</span><h1>One balance. Two possible sources.</h1><p>Your withdrawable GEN can come from contributor allocation or a sponsor residual. The contract, not this browser, is the source of truth.</p></div>
      {!wallet.connected ? <div className="earnings-gate"><span className="eyebrow">Wallet required</span><h2>Connect the wallet that earned or funded.</h2><button className="button" onClick={() => void wallet.connect()}>Connect wallet</button></div> : <section className="balance-ledger"><div className="balance-figure"><span>Contract balance available to withdraw</span><strong>{loading ? "…" : `${weiToGen(balance, 4)} GEN`}</strong><small>{wallet.address}</small></div><div className="balance-actions"><button className="button large" disabled={withdrawing || balance === 0n} onClick={() => void onWithdraw()}>{withdrawing ? "Awaiting wallet…" : "Withdraw GEN"}</button><button className="text-button" onClick={() => void refresh()}>Refresh on-chain balance</button></div></section>}
      {error && <div className="notice bad"><strong>Balance action failed.</strong><span>{error}</span></div>}
      <section className="explanation-ledger"><div><span>Contributor allocation</span><p>Final settlement credits the wallet according to the mission result and consensus impact role.</p></div><div><span>Sponsor residual</span><p>Unreleased GEN is credited pro-rata to sponsors, independent of withdrawal order.</p></div><div><span>Withdrawal</span><p>The balance is zeroed before the contract emits the transfer, preventing repeat withdrawal.</p></div></section>
    </main>
  );
}
