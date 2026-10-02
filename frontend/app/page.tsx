"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CONTRACT_ADDRESS } from "@/lib/deployment";
import { getMission, getNextMissionId } from "@/lib/contract";
import type { Mission } from "@/lib/types";
import { MissionCard } from "@/components/mission-card";

export default function HomePage() {
  const [recent, setRecent] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const loadRecent = useCallback(async () => {
    if (!CONTRACT_ADDRESS) { setLoading(false); return; }
    try {
      const next = await getNextMissionId();
      const ids = Array.from({ length: Math.min(next, 2) }, (_, i) => next - 1 - i);
      setRecent((await Promise.all(ids.map(getMission))).filter((m): m is Mission => !!m));
    } catch { setRecent([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadRecent(); }, [loadRecent]);
  useEffect(() => { const handler = () => void loadRecent(); window.addEventListener("mosaic:transaction-update", handler); return () => window.removeEventListener("mosaic:transaction-update", handler); }, [loadRecent]);
  return (
    <main className="page">
      <section className="entry-grid">
        <div>
          <span className="eyebrow">Public software funding · consensus allocation</span>
          <h1 className="entry-title">Fund the outcome.<br />Credit the work that caused it.</h1>
        </div>
        <div className="entry-copy">
          <p>MOSAIC turns a public engineering objective into a funded mission. Contributors merge real work, GenLayer validators inspect sealed evidence, and the contract allocates GEN by demonstrated impact.</p>
          <div className="entry-actions"><Link className="button" href="/launch">Launch a mission</Link><Link className="text-link" href="/missions">Explore missions →</Link></div>
        </div>
      </section>

      <section className="principle-strip" aria-label="Product principles">
        <div><span>01</span><strong>Outcome-bound funding</strong><p>GEN is attached to a frozen software objective, not generic repository activity.</p></div>
        <div><span>02</span><strong>Public evidence</strong><p>Merged PRs are bound to immutable merge SHAs and wallet proofs.</p></div>
        <div><span>03</span><strong>Consensus controls money</strong><p>No maintainer, server, or hidden operator selects the payout.</p></div>
      </section>
      <section className="flow-section" aria-labelledby="flow-heading">
        <div className="section-heading"><div><span className="eyebrow">The MOSAIC loop</span><h2 id="flow-heading">A funded outcome, traced to the work that caused it.</h2></div><Link className="text-link" href="/docs#lifecycle">Read the protocol →</Link></div>
        <div className="flow-grid">{[["FUND", "Sponsors define and fund a bounded software objective."], ["BUILD", "Contributors merge real work against the frozen target."], ["PROVE", "Public GitHub evidence binds identity, source and proof."], ["JUDGE", "GenLayer validators inspect the terminal product state."], ["SPLIT", "Deterministic contract code allocates GEN." ]].map(([label, text], i) => <div className="flow-card" key={label}><span>0{i + 1}</span><strong>{label}</strong><p>{text}</p></div>)}</div>
      </section>
      <section className="principle-strip" aria-label="Settlement distinction">
        <div><span>TERMINAL OBJECTIVE STATUS</span><strong>What the final software achieved</strong><p>The actual settlement-state target product may succeed, fail, or remain unresolved.</p></div>
        <div><span>CLAIMANT OUTCOME</span><strong>What eligible claimants caused</strong><p>Registered MOSAIC portfolios receive credit only for materially causing the surviving result.</p></div>
        <div><span>DETERMINISTIC SETTLEMENT</span><strong>Consensus decides; code allocates</strong><p>Rationale is explanatory. Roles, outcomes and payouts are bound and conserved on-chain.</p></div>
      </section>
      <section className="recent-section" aria-labelledby="recent-heading">
        <div className="section-heading"><div><span className="eyebrow">Recent missions</span><h2 id="recent-heading">The latest funded outcomes.</h2></div><Link className="text-link" href="/missions">View all missions →</Link></div>
        {loading ? <div className="loading-ledger"><span /><span /><span /></div> : recent.length === 0 ? <div className="empty-state"><h3>No missions yet.</h3><p>Be the first sponsor to define a public software outcome.</p><Link className="button" href="/launch">Launch a mission</Link></div> : <div className="mission-list">{recent.slice(0, 2).map((mission) => <MissionCard mission={mission} key={mission.id} />)}</div>}
      </section>
    </main>
  );
}
