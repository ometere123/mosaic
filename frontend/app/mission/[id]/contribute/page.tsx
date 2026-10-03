"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMission } from "@/hooks/use-mission";
import { useWallet } from "@/hooks/use-wallet";
import { useTransactions } from "@/hooks/use-transactions";
import { findProofComments, previewPullRequest, type ProofComment, type PullPreview } from "@/lib/github";
import { sealContribution } from "@/lib/contract";
import { ensureStudionet } from "@/lib/eip1193";
import { shortHex } from "@/lib/format";

export default function ContributionPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { mission, loading, delayed, notFoundConfirmed } = useMission(Number.isInteger(id) ? id : null);
  const wallet = useWallet();
  const { track } = useTransactions();
  const [pr, setPr] = useState("");
  const [commentId, setCommentId] = useState("");
  const [preview, setPreview] = useState<PullPreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [matches, setMatches] = useState<ProofComment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const marker = useMemo(() => wallet.address ? `mosaic:${id}:${wallet.address.toLowerCase()}` : `mosaic:${id}:<connect-wallet>`, [wallet.address, id]);

  useEffect(() => { setPreview(null); setMatches([]); }, [pr]);
  const check = async () => {
    if (!mission || !/^\d+$/.test(pr)) return;
    setChecking(true); setError(null);
    try { setPreview(await previewPullRequest(mission.repo, Number(pr))); }
    catch (e) { setError(e instanceof Error ? e.message : "GitHub preview failed."); }
    finally { setChecking(false); }
  };
  const discover = async () => {
    if (!mission || !/^\d+$/.test(pr) || !wallet.address) { setError("Connect your wallet and enter a pull-request number first."); return; }
    setDiscovering(true); setError(null); setMatches([]);
    try {
      const found = await findProofComments(mission.repo, Number(pr), marker);
      setMatches(found);
      if (found.length === 1) setCommentId(String(found[0].id));
      else if (found.length === 0) setError("No exact proof marker was found. Post it on the PR, then enter the comment ID manually.");
      else setError("Several exact proof markers were found. Choose the intended comment ID below; validators remain authoritative.");
    } catch (e) { setError(e instanceof Error ? e.message : "GitHub comment discovery failed. You can enter the ID manually."); }
    finally { setDiscovering(false); }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(null);
    if (!mission) return;
    if (!wallet.provider || !wallet.address) { await wallet.connect(); return; }
    if (!/^\d+$/.test(pr) || Number(pr) <= 0) { setError("Enter a valid pull-request number."); return; }
    if (!/^\d+$/.test(commentId) || Number(commentId) <= 0) { setError("Enter the numeric GitHub issue-comment ID that contains your proof marker."); return; }
    try {
      setSubmitting(true); await ensureStudionet(wallet.provider);
      const tx = await sealContribution(wallet.provider, wallet.address, mission.id, Number(pr), Number(commentId));
      const hash = typeof tx === "string" ? tx : String((tx as { hash?: string; transactionHash?: string }).hash ?? (tx as { transactionHash?: string }).transactionHash ?? "");
      if (!hash) throw new Error("No transaction hash returned.");
      track(hash, `Seal PR #${pr}`, mission.id);
      router.push(`/mission/${mission.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Contribution submission failed before a hash was returned."); }
    finally { setSubmitting(false); }
  };

  if (loading && !mission) return <main className="page"><div className="loading-ledger"><span /><span /><span /></div></main>;
  if (!mission && delayed) return <main className="page"><div className="notice warn"><strong>Live refresh delayed.</strong><span>Studionet is temporarily unreachable. MOSAIC will retry automatically.</span></div></main>;
  if (!mission && notFoundConfirmed) return <main className="page"><div className="empty-state"><h1>Mission not found.</h1></div></main>;
  if (!mission) return <main className="page"><div className="loading-ledger"><span /><span /><span /></div></main>;

  return (
    <main className="page narrow-page">
      {delayed && <div className="notice warn"><strong>Live refresh delayed.</strong><span>Showing the last confirmed mission state while MOSAIC retries.</span></div>}
      <div className="page-heading"><span className="eyebrow">Mission #{mission.id} · contribution proof</span><h1>Bind one merged PR to your wallet.</h1><p>This browser preview is only for you. The transaction does not trust it; validators independently retrieve the public PR, proof comment and changed-file evidence.</p></div>
      <form className="proof-flow" onSubmit={submit}>
        <section className="proof-step"><div className="step-number">01</div><div><h2>Identify the merged work</h2><p>Only PRs merged after the mission opened and before it closed are eligible.</p><div className="inline-action"><input value={pr} onChange={(e) => setPr(e.target.value)} inputMode="numeric" placeholder="Pull request number" /><button type="button" className="outline-button" onClick={() => void check()} disabled={checking}>{checking ? "Checking…" : "Preview"}</button></div>{preview && <div className="preview-panel"><div><span className="eyebrow">Non-authoritative preview</span><strong>PR #{preview.number} · {preview.title}</strong><p>@{preview.author} · {preview.mergedAt ? "merged" : "not merged"} · {preview.changedFiles} changed files</p></div>{preview.mergeSha && <span className="mono">{shortHex(preview.mergeSha, 8, 7)}</span>}</div>}</div></section>
        <section className="proof-step"><div className="step-number">02</div><div><h2>Publish the wallet marker</h2><p>Post this exact text as a normal comment on that PR from the same GitHub account that authored the PR.</p><div className="proof-marker"><code>{marker}</code><button type="button" className="text-button" onClick={() => void navigator.clipboard.writeText(marker)}>Copy</button></div><p className="small-copy">No permanent account is created. The public comment proves only this contribution-to-wallet relationship for this mission.</p></div></section>
        <section className="proof-step"><div className="step-number">03</div><div><h2>Find or enter the proof comment ID</h2><p>Search public PR comments for the exact marker, or enter the numeric ID from a URL ending in <span className="mono">#issuecomment-123456789</span>.</p><div className="inline-action"><button type="button" className="outline-button" onClick={() => void discover()} disabled={discovering || !wallet.connected}>{discovering ? "Finding…" : "Find my proof comment"}</button><input aria-label="Proof comment ID" value={commentId} onChange={(e) => setCommentId(e.target.value)} inputMode="numeric" placeholder="123456789" /></div>{matches.map((match) => <button className="text-button" type="button" key={match.id} onClick={() => setCommentId(String(match.id))}>Use #{match.id}{match.author ? ` by @${match.author}` : ""}</button>)}</div></section>
        <section className="proof-step final"><div className="step-number">04</div><div><h2>Seal the evidence</h2><p>Validators verify author, marker, mission window, merge SHA and bounded diff evidence, then produce a consensus-sealed contribution capsule.</p>{error && <div className="notice bad"><strong>Cannot seal.</strong><span>{error}</span></div>}<button className="button large" type="submit" disabled={submitting}>{submitting ? "Awaiting wallet…" : wallet.connected ? "Seal contribution" : "Connect to continue"}</button></div></section>
      </form>
    </main>
  );
}
