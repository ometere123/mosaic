"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMission } from "@/hooks/use-mission";
import { useWallet } from "@/hooks/use-wallet";
import { useTransactions } from "@/hooks/use-transactions";
import { addFunding, adjudicateCriterion, checkpointTerminal, expireMission, freezeTerminal, resolveMission } from "@/lib/contract";
import { genToWei, shortHex, dateTime, weiToGen } from "@/lib/format";
import { ensureStudionet } from "@/lib/eip1193";
import { missionPhase, outcomeTone, StatusStamp } from "@/components/status";
import { explorerAddress } from "@/lib/genlayer";
import { CONTRACT_ADDRESS } from "@/lib/deployment";
import { MIN_FUND_GEN, UNRESOLVED_GRACE_SECONDS } from "@/lib/constants";

export default function MissionPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { mission, contributions, loading, delayed, notFoundConfirmed, refresh } = useMission(Number.isInteger(id) ? id : null);
  const wallet = useWallet();
  const { track } = useTransactions();
  const [funding, setFunding] = useState("5");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const frozenTerminal = useMemo(() => {
    const raw = mission?.frozen_evidence?.terminal_state_json;
    if (typeof raw !== "string") return null;
    try { return JSON.parse(raw) as { required_checks?: Array<Record<string, unknown>>; evidence_objects?: Array<Record<string, unknown>> }; } catch { return null; }
  }, [mission?.frozen_evidence]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const submit = async (action: "fund" | "checkpoint" | "freeze" | "resolve" | "expire" | `criterion:${number}`) => {
    if (!mission || !wallet.provider || !wallet.address) { await wallet.connect(); return; }
    setActionError(null); setBusy(action);
    try {
      await ensureStudionet(wallet.provider);
      let value = 0n;
      if (action === "fund") {
        value = genToWei(funding);
        if (value < BigInt(MIN_FUND_GEN) * 10n ** 18n) throw new Error(`Funding must be at least ${MIN_FUND_GEN} GEN.`);
      }
      const tx = action === "fund" ? await addFunding(wallet.provider, wallet.address, mission.id, value) : action === "checkpoint" ? await checkpointTerminal(wallet.provider, wallet.address, mission.id) : action === "freeze" ? await freezeTerminal(wallet.provider, wallet.address, mission.id) : action === "resolve" ? await resolveMission(wallet.provider, wallet.address, mission.id) : action.startsWith("criterion:") ? await adjudicateCriterion(wallet.provider, wallet.address, mission.id, Number(action.split(":")[1])) : await expireMission(wallet.provider, wallet.address, mission.id);
      const hash = typeof tx === "string" ? tx : String((tx as { hash?: string; transactionHash?: string }).hash ?? (tx as { transactionHash?: string }).transactionHash ?? "");
      if (!hash) throw new Error("No transaction hash returned.");
      track(hash, action === "fund" ? "Add mission funding" : action === "checkpoint" ? "Checkpoint terminal evidence" : action === "freeze" ? "Freeze terminal evidence" : action === "resolve" ? "Resolve mission" : action.startsWith("criterion:") ? `Adjudicate criterion ${action.split(":")[1]}` : "Expire unresolved mission", mission.id);
      window.setTimeout(() => void refresh(), 2500);
    } catch (e) { setActionError(e instanceof Error ? e.message : "Transaction submission failed."); }
    finally { setBusy(null); }
  };

  if (loading && !mission) return <main className="page"><div className="loading-ledger"><span /><span /><span /></div></main>;
  if (!mission && delayed) return <main className="page"><div className="notice warn"><strong>Live refresh delayed.</strong><span>Studionet is temporarily unreachable. MOSAIC will retry automatically.</span></div></main>;
  if (!mission && notFoundConfirmed) return <main className="page"><div className="empty-state"><h1>Mission not found.</h1><Link className="text-link" href="/missions">Return to mission ledger</Link></div></main>;
  if (!mission) return <main className="page"><div className="loading-ledger"><span /><span /><span /></div></main>;

  const phase = missionPhase(mission, now);
  const freezeAt = mission.freeze_not_before ?? mission.close_at ?? 0;
  const closed = mission.status !== "OPEN";
  const graceElapsed = mission.status === "TERMINAL_FROZEN" && mission.closed_at !== undefined && now > mission.closed_at + UNRESOLVED_GRACE_SECONDS;
  const roles = mission.settlement?.roles ?? {};
  const checks = frozenTerminal?.required_checks ?? [];
  const evidenceObjects = frozenTerminal?.evidence_objects ?? [];

  return (
    <main className="page mission-page">
      {delayed && <div className="notice warn"><strong>Live refresh delayed.</strong><span>Showing the last confirmed mission state while MOSAIC retries.</span></div>}
      <div className="mission-header"><div><div className="mission-kicker"><span>Mission #{mission.id}</span><StatusStamp label={phase} tone={phase === "OPEN" ? "blue" : phase === "SETTLED" ? "good" : "warn"} />{mission.last_resolution && mission.status === "OPEN" && <StatusStamp label={mission.last_resolution} tone={outcomeTone(mission.last_resolution)} />}</div><h1>{mission.title}</h1><p>{mission.objective}</p></div><div className="pool-figure"><span>Mission pool</span><strong>{weiToGen(mission.status === "OPEN" ? mission.pool_wei : mission.total_funded_wei, 2)} GEN</strong>{mission.status === "SETTLED" && <small>{weiToGen(mission.released_wei, 2)} released · {weiToGen(mission.residual_wei, 2)} residual</small>}</div></div>

      <div className="mission-layout">
        <aside className="mission-context">
          <section><span className="eyebrow">Source</span><a className="source-link" target="_blank" rel="noreferrer" href={`https://github.com/${mission.repo}/tree/${encodeURIComponent(mission.target_ref)}`}>{mission.repo} ↗</a><dl className="data-list"><div><dt>Target branch</dt><dd className="mono">{mission.target_ref}</dd></div><div><dt>Baseline</dt><dd className="mono">{shortHex(mission.baseline_sha, 8, 7)}</dd></div><div><dt>Opened</dt><dd>{dateTime(mission.created_at)}</dd></div><div><dt>Freeze eligible</dt><dd>{dateTime(freezeAt)}</dd></div><div><dt>Closed at</dt><dd>{mission.closed_at ? dateTime(mission.closed_at) : "Not frozen"}</dd></div><div><dt>Sponsors</dt><dd>{mission.sponsor_wallets.length}</dd></div><div><dt>Contributors</dt><dd>{mission.contributor_wallets.length}</dd></div></dl></section>
          <section><span className="eyebrow">Acceptance dimensions</span><ol className="dimension-list">{mission.criteria.map((c, i) => { const criterion = typeof c === "string" ? { text: c, evidence_kind: "SOURCE" as const } : c; return <li key={i}><span>{String(i + 1).padStart(2, "0")}</span><p>{criterion.text}<small className="criterion-kind">{criterion.evidence_kind === "GITHUB_CHECK" ? ` · check ${criterion.check_name} (${criterion.check_app_slug})` : " · source evidence"}</small></p></li>; })}</ol></section>
          {CONTRACT_ADDRESS && <section><span className="eyebrow">Contract</span><a className="text-link mono" href={explorerAddress(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer">{shortHex(CONTRACT_ADDRESS, 8, 6)} ↗</a></section>}
        </aside>

        <section className="impact-workspace">
          <div className="workspace-heading"><div><span className="eyebrow">Impact map</span><h2>Sealed contribution evidence</h2></div>{mission.status === "OPEN" && <Link className="button compact" href={`/mission/${mission.id}/contribute`}>Prove merged work</Link>}</div>
          {!contributions.length && <div className="workspace-empty"><div className="empty-node" /><h3>No contribution evidence sealed yet.</h3><p>Merged work appears here only after the contract verifies GitHub provenance and validator consensus produces an evidence capsule.</p></div>}
          <div className="impact-stack">{contributions.map((item) => {
            const role = roles[item.wallet];
            return <article key={item.index} className={`impact-block ${role ? role.toLowerCase().replace("_", "-") : ""}`}><div className="impact-top"><div><span className="mono">PR #{item.pr_number}</span><strong>{item.capsule?.summary ?? item.reason}</strong></div><div className="impact-role">{role ?? item.status}</div></div>{item.capsule && <><p className="impact-relevance">{item.capsule.relevance}</p><ul>{item.capsule.substantive_changes.map((change, i) => <li key={i}>{change}</li>)}</ul>{item.capsule.risk_flags.length > 0 && <div className="risk-strip">{item.capsule.risk_flags.join(" · ")}</div>}</>}<div className="evidence-footer"><span>@{item.author || "unresolved"}</span>{item.merge_sha && <span className="mono">merge {shortHex(item.merge_sha, 7, 6)}</span>}{item.evidence_digest && <span className="mono">evidence {shortHex(item.evidence_digest, 7, 6)}</span>}</div></article>;
          })}</div>
          {(mission.status !== "OPEN" || mission.frozen_evidence) && <section className="resolution-panel"><div><span className="eyebrow">{mission.settlement ? "Final settlement" : "Frozen terminal evidence"}</span>{mission.settlement && <StatusStamp label={mission.settlement.settlement_type === "EXPIRED" ? "EXPIRED" : mission.settlement.claimant_outcome} tone={outcomeTone(mission.settlement.settlement_type === "EXPIRED" ? "EXPIRED" : mission.settlement.claimant_outcome)} />}</div>{mission.settlement && <><p>{mission.settlement.rationale}</p><div className="resolution-metrics">{mission.settlement.settlement_type === "RESOLVED" && <><div><span>Terminal product</span><strong>{mission.settlement.terminal_objective_status}</strong></div><div><span>Claimant outcome</span><strong>{mission.settlement.claimant_outcome}</strong></div></>}<div><span>Released</span><strong>{weiToGen(mission.released_wei, 2)} GEN</strong></div><div><span>Sponsor residual</span><strong>{weiToGen(mission.residual_wei, 2)} GEN</strong></div></div></>}{<details className="evidence-details" open={mission.status === "TERMINAL_FROZEN"}><summary>Technical evidence</summary><dl className="data-list"><div><dt>Frozen terminal SHA</dt><dd className="mono">{mission.terminal_tip_sha ? shortHex(mission.terminal_tip_sha, 10, 8) : "—"}</dd></div><div><dt>Closed at</dt><dd>{mission.closed_at ? dateTime(mission.closed_at) : "—"}</dd></div><div><dt>Terminal source digest</dt><dd className="mono">{mission.terminal_source_digest ? shortHex(mission.terminal_source_digest, 10, 8) : "—"}</dd></div><div><dt>Settlement digest</dt><dd className="mono">{mission.settlement_digest ? shortHex(mission.settlement_digest, 10, 8) : "—"}</dd></div></dl>{checks.length > 0 && <div className="evidence-list"><strong>Frozen required checks</strong>{checks.map((check, index) => <p key={index} className="mono">criterion {String(check.criterion_index)} · {String(check.name)} · {String(check.app_slug)} · run {String(check.run_id)} · {String(check.status)} / {String(check.conclusion)} · head {shortHex(String(check.head_sha ?? ""), 8, 7)}</p>)}</div>}{mission.settlement?.criterion_matrix && <ol className="dimension-list">{mission.settlement.criterion_matrix.map((row, index) => <li key={index}><span>{String(Number(row.criterion_index ?? index) + 1).padStart(2, "0")}</span><p>Terminal: {String(row.terminal_status)} · Claimant: {String(row.claimant_status)}<small>{Array.isArray(row.evidence_refs) ? ` · refs: ${(row.evidence_refs as string[]).join(", ")}` : ""}</small></p></li>)}</ol>}{mission.settlement?.role_evidence && <div className="evidence-list"><strong>Role evidence</strong>{Object.entries(mission.settlement.role_evidence).map(([wallet, detail]) => <p key={wallet} className="mono">{wallet} · {String(detail.role)} · refs: {Array.isArray(detail.evidence_refs) ? (detail.evidence_refs as string[]).join(", ") : "—"}</p>)}</div>}{evidenceObjects.length > 0 && <div className="evidence-list"><strong>Frozen evidence objects</strong>{evidenceObjects.map((item, index) => <p key={index} className="mono">{String(item.id)} · {String(item.kind)}{item.criterion_index !== undefined ? ` · criterion ${String(item.criterion_index)}` : ""}</p>)}</div>}</details>}</section>}
        </section>

        <aside className="action-rail">
          <section><span className="eyebrow">Mission state</span><div className="rail-state"><strong>{phase}</strong><p>{mission.status === "OPEN" && now >= freezeAt ? "Freeze is eligible. Funding and merged contribution evidence remain accepted until a successful terminal freeze." : closed ? "This mission is terminal." : "Funding and merged contribution evidence are still accepted."}</p></div></section>
          {!closed && mission.status === "OPEN" && <section><span className="eyebrow">Add funding</span><label className="inline-field">GEN<input value={funding} inputMode="decimal" onChange={(e) => setFunding(e.target.value)} /></label><button className="button full" disabled={busy !== null} onClick={() => void submit("fund")}>{busy === "fund" ? "Awaiting wallet…" : "Add GEN"}</button></section>}
          {mission.status === "OPEN" && now < (mission.close_at ?? Number.MAX_SAFE_INTEGER) && <section><span className="eyebrow">Terminal checkpoint</span><p className="small-copy">Capture a bounded pre-deadline terminal snapshot before freezing.</p><button className="outline-button full" disabled={busy !== null} onClick={() => void submit("checkpoint")}>{busy === "checkpoint" ? "Awaiting wallet…" : "Checkpoint terminal"}</button></section>}
          {mission.status === "OPEN" && now >= freezeAt && <section><span className="eyebrow">Terminal evidence</span><p className="small-copy">Freeze the latest valid pre-deadline checkpoint. Post-close branch changes cannot replace it.</p><button className="button full" disabled={busy !== null} onClick={() => void submit("freeze")}>{busy === "freeze" ? "Awaiting wallet…" : "Freeze terminal evidence"}</button></section>}
          {mission.status === "TERMINAL_FROZEN" && <section><span className="eyebrow">Component adjudication</span><p className="small-copy">Adjudicate each frozen criterion independently; finalization derives settlement deterministically.</p>{mission.criteria.map((_, index) => <button key={index} className="outline-button full" disabled={busy !== null} onClick={() => void submit(`criterion:${index}`)}>{busy === `criterion:${index}` ? "Awaiting validators…" : `Adjudicate criterion ${index + 1}`}</button>)}{graceElapsed && <button className="outline-button full" disabled={busy !== null} onClick={() => void submit("expire")}>Refund after unresolved grace</button>}</section>}
          <section><span className="eyebrow">History</span><dl className="data-list"><div><dt>Evidence failures</dt><dd>{mission.evidence_failures}</dd></div><div><dt>Last evidence</dt><dd>{mission.last_evidence_status || "—"}</dd></div><div><dt>Resolution attempts</dt><dd>{mission.resolution_attempts}</dd></div><div><dt>Last result</dt><dd>{mission.last_resolution || "—"}</dd></div></dl></section>
          {actionError && <div className="notice bad"><strong>Action failed.</strong><span>{actionError}</span></div>}
          {wallet.error && <div className="notice warn"><strong>Wallet.</strong><span>{wallet.error}</span></div>}
        </aside>
      </div>
    </main>
  );
}
