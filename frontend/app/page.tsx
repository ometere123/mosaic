"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CONTRACT_ADDRESS } from "@/lib/deployment";
import { getMission, getNextMissionId } from "@/lib/contract";
import type { Mission } from "@/lib/types";
import { MissionCard } from "@/components/mission-card";

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!CONTRACT_ADDRESS) { setLoading(false); return; }
    setError(null);
    try {
      const next = await getNextMissionId();
      const ids = Array.from({ length: Math.min(next, 24) }, (_, i) => next - 1 - i);
      const rows = await Promise.all(ids.map(getMission));
      setMissions(rows.filter((x): x is Mission => !!x));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load contract state."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const handler = () => void load();
    window.addEventListener("mosaic:transaction-update", handler);
    return () => window.removeEventListener("mosaic:transaction-update", handler);
  }, [load]);

  return (
    <main className="page">
      <section className="entry-grid">
        <div>
          <span className="eyebrow">Public software funding · consensus allocation</span>
          <h1 className="entry-title">Fund the outcome.<br />Credit the work that caused it.</h1>
        </div>
        <div className="entry-copy">
          <p>MOSAIC turns a public engineering objective into a funded mission. Contributors merge real work, GenLayer validators inspect sealed evidence, and the contract allocates GEN by demonstrated impact.</p>
          <div className="entry-actions"><Link className="button" href="/launch">Launch mission</Link><a className="text-link" href="#missions">Browse missions ↓</a></div>
        </div>
      </section>

      <section className="principle-strip" aria-label="Product principles">
        <div><span>01</span><strong>Outcome-bound funding</strong><p>GEN is attached to a frozen software objective, not generic repository activity.</p></div>
        <div><span>02</span><strong>Public evidence</strong><p>Merged PRs are bound to immutable merge SHAs and wallet proofs.</p></div>
        <div><span>03</span><strong>Consensus controls money</strong><p>No maintainer, server, or hidden operator selects the payout.</p></div>
      </section>

      <section id="missions" className="mission-board">
        <div className="section-heading"><div><span className="eyebrow">Mission ledger</span><h2>Funded engineering objectives</h2></div><button className="text-button" onClick={() => void load()}>Refresh</button></div>
        {!CONTRACT_ADDRESS && <div className="notice warn"><strong>Deployment not configured.</strong><span>The source build is ready, but this frontend needs the final Studionet contract address before live reads and writes can begin.</span></div>}
        {error && <div className="notice bad"><strong>Read failed.</strong><span>{error}</span></div>}
        {loading && <div className="loading-ledger"><span /><span /><span /></div>}
        {!loading && CONTRACT_ADDRESS && missions.length === 0 && <div className="empty-state"><span className="eyebrow">No missions yet</span><h3>The ledger is empty.</h3><p>Create the first funded software objective on this deployment.</p><Link className="button" href="/launch">Launch first mission</Link></div>}
        <div className="mission-list">{missions.map((mission) => <MissionCard key={mission.id} mission={mission} />)}</div>
      </section>
    </main>
  );
}
