"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { useTransactions } from "@/hooks/use-transactions";
import { getBalance, getContribution, getMission, getNextMissionId, getSponsorTotal, withdraw } from "@/lib/contract";
import { ensureStudionet } from "@/lib/eip1193";
import { weiToGen } from "@/lib/format";
import type { Contribution, Mission } from "@/lib/types";
import { loadConfirmed, saveConfirmed } from "@/lib/read-cache";
import { mapWithConcurrency } from "@/lib/read-resilience";
import { useReadRevalidation } from "@/hooks/use-read-revalidation";

type Activity = { mission: Mission; sponsored: bigint; contributions: Contribution[] };
type CachedProfile = { balance: string; activity: Array<{ mission: Mission; sponsored: string; contributions: Contribution[] }> };

export default function ProfilePage() {
  const wallet = useWallet();
  const { transactions, track } = useTransactions();
  const [balance, setBalance] = useState<bigint>(0n);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [delayed, setDelayed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!wallet.address) { setBalance(0n); setActivity([]); setConfirmed(false); setDelayed(false); return; }
    const cacheKey = `profile:${wallet.address.toLowerCase()}`;
    const cached = loadConfirmed<CachedProfile>(cacheKey);
    if (cached) {
      setBalance(BigInt(cached.value.balance));
      setActivity(cached.value.activity.map((item) => ({ ...item, sponsored: BigInt(item.sponsored) })));
      setConfirmed(true);
    }
    setLoading(true);
    try {
      const [nextResult, balanceResult] = await Promise.allSettled([getNextMissionId(), getBalance(wallet.address)]);
      if (balanceResult.status === "fulfilled") { setBalance(balanceResult.value); setConfirmed(true); }
      if (nextResult.status === "rejected") throw nextResult.reason;
      const next = nextResult.value;
      const ids = Array.from({ length: Math.min(next, 24) }, (_, i) => next - 1 - i);
      const missionResults = await mapWithConcurrency(ids, async (missionId) => {
        try { return await getMission(missionId); } catch { return null; }
      });
      const missions = missionResults.filter((m): m is Mission => !!m);
      const rows = (await mapWithConcurrency(missions, async (mission): Promise<Activity | null> => {
        try {
          const isSponsor = mission.sponsor_wallets.some((w) => w.toLowerCase() === wallet.address!.toLowerCase());
          const isContributor = mission.contributor_wallets.some((w) => w.toLowerCase() === wallet.address!.toLowerCase());
          const sponsored = isSponsor ? await getSponsorTotal(mission.id, wallet.address!) : 0n;
          const items = isContributor
            ? await mapWithConcurrency(Array.from({ length: Math.min(mission.contribution_count, 12) }, (_, i) => i), (index) => getContribution(mission.id, index))
            : [];
          const contributions = items.filter((item): item is Contribution => !!item && item.wallet.toLowerCase() === wallet.address!.toLowerCase());
          return sponsored > 0n || contributions.length ? { mission, sponsored, contributions } : null;
        } catch { return null; }
      })).filter((row): row is Activity => !!row);
      setActivity(rows); setConfirmed(true); setDelayed(balanceResult.status === "rejected" || missions.length !== ids.length);
      const confirmedBalance = balanceResult.status === "fulfilled" ? balanceResult.value.toString() : cached?.value.balance ?? "0";
      saveConfirmed<CachedProfile>(cacheKey, { balance: confirmedBalance, activity: rows.map((item) => ({ ...item, sponsored: item.sponsored.toString() })) });
    } catch { setDelayed(true); }
    finally { setLoading(false); }
  }, [wallet.address]);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { const handler = () => void refresh(); window.addEventListener("mosaic:transaction-update", handler); return () => window.removeEventListener("mosaic:transaction-update", handler); }, [refresh]);
  useReadRevalidation(() => void refresh(), delayed);

  const onWithdraw = async () => {
    if (!wallet.provider || !wallet.address) { await wallet.connect(); return; }
    setWithdrawing(true); setActionError(null);
    try {
      await ensureStudionet(wallet.provider);
      const tx = await withdraw(wallet.provider, wallet.address);
      const hash = typeof tx === "string" ? tx : String((tx as { hash?: string; transactionHash?: string }).hash ?? (tx as { transactionHash?: string }).transactionHash ?? "");
      if (!hash) throw new Error("No transaction hash returned.");
      track(hash, "Withdraw GEN");
    } catch (e) { setActionError(e instanceof Error ? e.message : "Withdrawal submission failed."); }
    finally { setWithdrawing(false); }
  };

  return <main className="page profile-page">
    <section className="page-heading"><span className="eyebrow">Wallet profile</span><h1>Your MOSAIC relationship, read from chain.</h1><p>On-chain participation is reconstructed from bounded contract reads. Browser transaction tracking is shown separately and is not protocol history.</p></section>
    {!wallet.connected ? <section className="earnings-gate"><span className="eyebrow">Wallet required</span><h2>Connect to inspect participation and earnings.</h2><button className="button" onClick={() => void wallet.connect()}>Connect wallet</button></section> : <>
      <section className="profile-summary"><div><span>Connected wallet</span><strong>{wallet.address}</strong></div><div><span>Withdrawable GEN</span><strong>{loading ? "…" : `${weiToGen(balance, 4)} GEN`}</strong></div><div><span>Protocol activity</span><strong>{activity.length} mission{activity.length === 1 ? "" : "s"}</strong></div></section>
      <section className="balance-ledger"><div className="balance-figure"><span>Contract balance available to withdraw</span><strong>{loading ? "…" : `${weiToGen(balance, 4)} GEN`}</strong><small>Contributor allocations and sponsor residuals share this pull balance.</small></div><div className="balance-actions"><button className="button large" disabled={withdrawing || balance === 0n} onClick={() => void onWithdraw()}>{withdrawing ? "Awaiting wallet…" : "Withdraw GEN"}</button><button className="text-button" onClick={() => void refresh()}>Refresh on-chain profile</button></div></section>
    </>}
    {delayed && <div className="notice warn"><strong>Live refresh delayed.</strong><span>{confirmed ? "Studionet is temporarily unreachable. Showing the last confirmed state." : "Studionet is temporarily unreachable. MOSAIC will retry automatically."}</span></div>}
    {actionError && <div className="notice bad"><strong>Withdrawal submission failed.</strong><span>{actionError}</span></div>}
    <section className="profile-section"><div className="section-heading"><div><span className="eyebrow">On-chain participation</span><h2>Authoritative protocol activity</h2></div></div>{wallet.connected && !loading && confirmed && !delayed && activity.length === 0 && <div className="empty-state"><h3>No participation found for this wallet.</h3><p>Launch or contribute to a mission and refresh this view. The bounded explorer does not claim to be a global event index.</p></div>}<div className="profile-activity">{activity.map(({ mission, sponsored, contributions }) => <article className="profile-activity-card" key={mission.id}><div><span className="eyebrow">Mission #{mission.id}</span><h3><Link href={`/mission/${mission.id}`}>{mission.title}</Link></h3><p>{mission.repo} · {mission.target_ref}</p></div><div><span>Sponsored</span><strong>{weiToGen(sponsored, 4)} GEN</strong></div><div><span>Sealed contributions</span><strong>{contributions.length}</strong>{contributions.map((c) => <small key={c.index}>PR #{c.pr_number} · {c.status}{mission.settlement?.roles?.[wallet.address!.toLowerCase()] ? ` · ${mission.settlement.roles[wallet.address!.toLowerCase()]}` : ""}</small>)}</div></article>)}</div></section>
    <section className="profile-section"><div className="section-heading"><div><span className="eyebrow">Stored locally in this browser</span><h2>Recent transactions</h2></div></div><p className="muted-copy">These are execution records saved by this browser, not a complete on-chain history.</p>{transactions.length === 0 ? <div className="empty-state"><h3>No stored transactions.</h3><p>New writes will appear here while this browser tracks them.</p></div> : <div className="profile-tx-list">{transactions.map((tx) => <div className="profile-tx" key={tx.hash}><strong>{tx.action}</strong><span>{tx.stage}</span><code>{tx.hash.slice(0, 10)}…{tx.hash.slice(-8)}</code></div>)}</div>}</section>
  </main>;
}
