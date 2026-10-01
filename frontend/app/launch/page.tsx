"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { useTransactions } from "@/hooks/use-transactions";
import { openMission } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/deployment";
import { ensureStudionet } from "@/lib/eip1193";
import { genToWei } from "@/lib/format";
import { MAX_MISSION_SECONDS, MIN_FUND_GEN, MIN_MISSION_SECONDS } from "@/lib/constants";

const initialCriteria = ["", ""];

export default function LaunchPage() {
  const router = useRouter();
  const wallet = useWallet();
  const { track } = useTransactions();
  const [repo, setRepo] = useState("");
  const [targetRef, setTargetRef] = useState("main");
  const [baseline, setBaseline] = useState("");
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [criteria, setCriteria] = useState(initialCriteria);
  const [closeAt, setCloseAt] = useState("");
  const [funding, setFunding] = useState("10");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanedCriteria = useMemo(() => criteria.map((x) => x.trim()).filter(Boolean), [criteria]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault(); setError(null);
    if (!CONTRACT_ADDRESS) { setError("Contract deployment is not configured."); return; }
    if (!wallet.provider || !wallet.address) { await wallet.connect(); return; }
    if (!repo.match(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/)) { setError("Repository must be owner/repo."); return; }
    if (!/^[A-Za-z0-9._/-]{1,120}$/.test(targetRef.trim()) || targetRef.includes("..") || targetRef.startsWith("/") || targetRef.endsWith("/")) { setError("Target branch must be a valid Git branch name of 120 characters or fewer."); return; }
    if (!/^[0-9a-fA-F]{40}$/.test(baseline.trim())) { setError("Baseline must be a 40-character commit SHA."); return; }
    if (!title.trim() || title.trim().length > 120) { setError("Title is required and must be 120 characters or fewer."); return; }
    if (!objective.trim() || objective.trim().length > 1200) { setError("Objective is required and must be 1,200 characters or fewer."); return; }
    if (cleanedCriteria.length < 1 || cleanedCriteria.length > 5 || cleanedCriteria.some((c) => c.length > 320)) { setError("Use 1 to 5 acceptance dimensions, each 320 characters or fewer."); return; }
    const closeMs = Date.parse(closeAt);
    if (!Number.isFinite(closeMs)) { setError("Choose a closing date and time."); return; }
    const closeAtUnix = Math.floor(closeMs / 1000);
    const duration = closeAtUnix - Math.floor(Date.now() / 1000);
    if (duration < MIN_MISSION_SECONDS || duration > MAX_MISSION_SECONDS) { setError("Closing time must be between 1 hour and 90 days from now."); return; }
    let value: bigint;
    try { value = genToWei(funding); }
    catch (e) { setError(e instanceof Error ? e.message : "Enter a valid GEN amount."); return; }
    if (value < BigInt(MIN_FUND_GEN) * 10n ** 18n) { setError(`Initial funding must be at least ${MIN_FUND_GEN} GEN.`); return; }
    try {
      setSubmitting(true);
      await ensureStudionet(wallet.provider);
      const tx = await openMission(wallet.provider, wallet.address, {
        repo: repo.trim(), targetRef: targetRef.trim(), baseline: baseline.trim().toLowerCase(), title: title.trim(), objective: objective.trim(), criteria: cleanedCriteria,
        closeAt: closeAtUnix, value,
      });
      const hash = typeof tx === "string" ? tx : String((tx as { hash?: string; transactionHash?: string }).hash ?? (tx as { transactionHash?: string }).transactionHash ?? "");
      if (!hash) throw new Error("Wallet submission returned no transaction hash.");
      track(hash, "Open mission");
      router.push("/");
    } catch (e) { setError(e instanceof Error ? e.message : "Mission submission failed before a transaction hash was returned."); }
    finally { setSubmitting(false); }
  };

  const updateCriterion = (index: number, value: string) => setCriteria((current) => current.map((item, i) => i === index ? value : item));

  return (
    <main className="page narrow-page">
      <div className="page-heading"><span className="eyebrow">Launch mission</span><h1>Define what the pool is trying to change.</h1><p>The repository, baseline, objective, criteria and closing time become immutable when the transaction succeeds.</p></div>
      <form className="composer" onSubmit={onSubmit}>
        <section className="composer-section"><div className="composer-label"><span>01</span><div><strong>Source boundary</strong><p>Public GitHub only. Validators freeze the target branch and verify its baseline plus merged PR evidence.</p></div></div><div className="field-grid"><label>Repository<input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/repository" /></label><label>Target branch<input value={targetRef} maxLength={120} onChange={(e) => setTargetRef(e.target.value)} placeholder="main" /></label><label>Baseline commit SHA<input className="mono" value={baseline} onChange={(e) => setBaseline(e.target.value)} placeholder="40-character SHA" /></label></div></section>
        <section className="composer-section"><div className="composer-label"><span>02</span><div><strong>Funded outcome</strong><p>Describe the engineering result, not a list of people or a desired score.</p></div></div><label>Mission title<input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Browser wallet reliability pass" /></label><label>Objective<textarea value={objective} maxLength={1200} onChange={(e) => setObjective(e.target.value)} rows={5} placeholder="Make injected-wallet connection, account switching and rejected-signature recovery materially more reliable…" /></label></section>
        <section className="composer-section"><div className="composer-label"><span>03</span><div><strong>Acceptance dimensions</strong><p>Keep these specific enough that independent validators can reason over actual merged evidence.</p></div></div><div className="criteria-stack">{criteria.map((criterion, index) => <div className="criterion-input" key={index}><span>{String(index + 1).padStart(2, "0")}</span><input value={criterion} maxLength={320} onChange={(e) => updateCriterion(index, e.target.value)} placeholder="A concrete quality or outcome dimension" />{criteria.length > 1 && <button type="button" className="text-button" onClick={() => setCriteria((c) => c.filter((_, i) => i !== index))}>Remove</button>}</div>)}{criteria.length < 5 && <button type="button" className="outline-button" onClick={() => setCriteria((c) => [...c, ""])}>+ Add dimension</button>}</div></section>
        <section className="composer-section"><div className="composer-label"><span>04</span><div><strong>Time and GEN</strong><p>At close, no new contributions can be sealed. Settlement may then be triggered permissionlessly.</p></div></div><div className="field-grid"><label>Closing date and time<input type="datetime-local" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} /></label><label>Initial funding (GEN)<input inputMode="decimal" value={funding} onChange={(e) => setFunding(e.target.value)} /></label></div></section>
        {error && <div className="notice bad"><strong>Cannot submit.</strong><span>{error}</span></div>}
        <div className="composer-submit"><div><strong>Consensus starts at creation.</strong><p>The contract verifies the public baseline before it accepts the funded mission.</p></div><button className="button large" type="submit" disabled={submitting}>{submitting ? "Awaiting wallet…" : wallet.connected ? "Lock GEN & launch" : "Connect to launch"}</button></div>
      </form>
    </main>
  );
}
