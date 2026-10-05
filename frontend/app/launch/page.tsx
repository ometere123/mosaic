"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { useTransactions } from "@/hooks/use-transactions";
import { openMission } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/deployment";
import { ensureStudionet } from "@/lib/eip1193";
import { genToWei } from "@/lib/format";
import { MIN_FUND_GEN } from "@/lib/constants";
import { validateLaunchDuration } from "@/lib/launch-validation";
import type { Criterion } from "@/lib/types";

const initialCriteria: Criterion[] = [{ text: "", evidence_kind: "SOURCE" }, { text: "", evidence_kind: "SOURCE" }];

export default function LaunchPage() {
  const router = useRouter(); const wallet = useWallet(); const { track } = useTransactions();
  const [repo, setRepo] = useState(""); const [targetRef, setTargetRef] = useState("main"); const [baseline, setBaseline] = useState("");
  const [title, setTitle] = useState(""); const [objective, setObjective] = useState(""); const [criteria, setCriteria] = useState<Criterion[]>(initialCriteria);
  const [freezeAt, setFreezeAt] = useState(""); const [funding, setFunding] = useState("10"); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState<string | null>(null);
  const updateCriterion = (index: number, patch: Partial<Criterion>) => setCriteria((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault(); setError(null);
    if (!CONTRACT_ADDRESS) { setError("Contract deployment is not configured."); return; }
    if (!wallet.provider || !wallet.address) { await wallet.connect(); return; }
    if (!repo.match(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/)) { setError("Repository must be owner/repo."); return; }
    if (!/^[A-Za-z0-9._/-]{1,120}$/.test(targetRef.trim()) || targetRef.includes("..") || targetRef.startsWith("/") || targetRef.endsWith("/")) { setError("Target branch must be valid."); return; }
    if (!/^[0-9a-fA-F]{40}$/.test(baseline.trim())) { setError("Baseline must be a 40-character commit SHA."); return; }
    if (!title.trim() || title.trim().length > 120) { setError("Title is required and must be 120 characters or fewer."); return; }
    if (!objective.trim() || objective.trim().length > 1200) { setError("Objective is required and must be 1,200 characters or fewer."); return; }
    if (criteria.length < 1 || criteria.length > 5 || criteria.some((c) => !c.text.trim() || c.text.trim().length > 320)) { setError("Use 1 to 5 acceptance dimensions, each 320 characters or fewer."); return; }
    if (criteria.some((c) => c.evidence_kind === "GITHUB_CHECK" && (!c.check_name?.trim() || !c.check_app_slug?.trim()))) { setError("Each GitHub check criterion requires an exact check name and app slug."); return; }
    const freezeMs = Date.parse(freezeAt); if (!Number.isFinite(freezeMs)) { setError("Choose the earliest terminal-freeze time."); return; }
    const freezeUnix = Math.floor(freezeMs / 1000); const durationError = validateLaunchDuration(freezeUnix); if (durationError) { setError(durationError); return; }
    let value: bigint; try { value = genToWei(funding); } catch (e) { setError(e instanceof Error ? e.message : "Enter a valid GEN amount."); return; }
    if (value < BigInt(MIN_FUND_GEN) * 10n ** 18n) { setError(`Initial funding must be at least ${MIN_FUND_GEN} GEN.`); return; }
    try { setSubmitting(true); await ensureStudionet(wallet.provider); const tx = await openMission(wallet.provider, wallet.address, { repo: repo.trim(), targetRef: targetRef.trim(), baseline: baseline.trim().toLowerCase(), title: title.trim(), objective: objective.trim(), criteria: criteria.map((c) => ({ text: c.text.trim(), evidence_kind: c.evidence_kind, ...(c.evidence_kind === "GITHUB_CHECK" ? { check_name: c.check_name?.trim(), check_app_slug: c.check_app_slug?.trim() } : {}) })), closeAt: freezeUnix, value }); const hash = typeof tx === "string" ? tx : String((tx as { hash?: string; transactionHash?: string }).hash ?? (tx as { transactionHash?: string }).transactionHash ?? ""); if (!hash) throw new Error("Wallet submission returned no transaction hash."); track(hash, "Open mission"); router.push("/"); }
    catch (e) { setError(e instanceof Error ? e.message : "Mission submission failed."); } finally { setSubmitting(false); }
  };
  return <main className="page narrow-page"><div className="page-heading"><span className="eyebrow">Launch mission</span><h1>Define what the pool is trying to change.</h1><p>The typed verification plan and earliest freeze time become immutable when the transaction succeeds.</p></div><form className="composer" onSubmit={onSubmit}>
    <section className="composer-section"><div className="composer-label"><span>01</span><div><strong>Source boundary</strong><p>Public GitHub only.</p></div></div><div className="field-grid"><label>Repository<input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/repository" /></label><label>Target branch<input value={targetRef} maxLength={120} onChange={(e) => setTargetRef(e.target.value)} placeholder="main" /></label><label>Baseline commit SHA<input className="mono" value={baseline} onChange={(e) => setBaseline(e.target.value)} placeholder="40-character SHA" /></label></div></section>
    <section className="composer-section"><div className="composer-label"><span>02</span><div><strong>Funded outcome</strong><p>Describe the engineering result.</p></div></div><label>Mission title<input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></label><label>Objective<textarea value={objective} maxLength={1200} onChange={(e) => setObjective(e.target.value)} rows={5} /></label></section>
    <section className="composer-section"><div className="composer-label"><span>03</span><div><strong>Typed verification plan</strong><p>Choose source judgment or a named terminal-commit GitHub check.</p></div></div><div className="criteria-stack">{criteria.map((criterion, index) => <div className="criterion-input" key={index}><span>{String(index + 1).padStart(2, "0")}</span><div className="criterion-fields"><select aria-label={`Evidence type ${index + 1}`} value={criterion.evidence_kind} onChange={(e) => updateCriterion(index, { evidence_kind: e.target.value as Criterion["evidence_kind"], check_name: undefined, check_app_slug: undefined })}><option value="SOURCE">Source judgment</option><option value="GITHUB_CHECK">GitHub check</option></select><input value={criterion.text} maxLength={320} onChange={(e) => updateCriterion(index, { text: e.target.value })} placeholder="Criterion" />{criterion.evidence_kind === "GITHUB_CHECK" && <><input value={criterion.check_name ?? ""} maxLength={120} onChange={(e) => updateCriterion(index, { check_name: e.target.value })} placeholder="Exact check name" /><input value={criterion.check_app_slug ?? ""} maxLength={80} onChange={(e) => updateCriterion(index, { check_app_slug: e.target.value })} placeholder="GitHub app slug" /></>}</div>{criteria.length > 1 && <button type="button" className="text-button" onClick={() => setCriteria((c) => c.filter((_, i) => i !== index))}>Remove</button>}</div>)}{criteria.length < 5 && <button type="button" className="outline-button" onClick={() => setCriteria((c) => [...c, { text: "", evidence_kind: "SOURCE" }])}>+ Add criterion</button>}</div></section>
    <section className="composer-section"><div className="composer-label"><span>04</span><div><strong>Freeze eligibility and GEN</strong><p>The mission remains OPEN until a successful permissionless terminal freeze.</p></div></div><div className="field-grid"><label>Earliest terminal freeze<input aria-label="Earliest terminal freeze" type="datetime-local" value={freezeAt} onChange={(e) => setFreezeAt(e.target.value)} /></label><label>Initial funding (GEN)<input inputMode="decimal" value={funding} onChange={(e) => setFunding(e.target.value)} /></label></div></section>
    {error && <div className="notice bad"><strong>Cannot submit.</strong><span>{error}</span></div>}<div className="composer-submit"><div><strong>Consensus starts at creation.</strong></div><button className="button large" type="submit" disabled={submitting}>{submitting ? "Awaiting wallet…" : wallet.connected ? "Lock GEN & launch" : "Connect to launch"}</button></div>
  </form></main>;
}
