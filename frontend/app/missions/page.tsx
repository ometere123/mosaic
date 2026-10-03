"use client";

import { useCallback, useEffect, useState } from "react";
import { CONTRACT_ADDRESS } from "@/lib/deployment";
import { getMission, getNextMissionId } from "@/lib/contract";
import type { Mission } from "@/lib/types";
import { MissionCard } from "@/components/mission-card";
import { loadConfirmed, saveConfirmed } from "@/lib/read-cache";
import { mapWithConcurrency } from "@/lib/read-resilience";
import { useReadRevalidation } from "@/hooks/use-read-revalidation";

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmedCount, setConfirmedCount] = useState<number | null>(null);
  const [delayed, setDelayed] = useState(false);
  const load = useCallback(async () => {
    if (!CONTRACT_ADDRESS) { setLoading(false); return; }
    const cached = loadConfirmed<{ missions: Mission[]; next: number }>("missions");
    if (cached) { setMissions((current) => current.length ? current : cached.value.missions); setConfirmedCount((current) => current ?? cached.value.next); setLoading(false); }
    try {
      const next = await getNextMissionId();
      const ids = Array.from({ length: Math.min(next, 24) }, (_, i) => next - 1 - i);
      const rows = (await mapWithConcurrency(ids, getMission)).filter((x): x is Mission => !!x);
      setMissions(rows); setConfirmedCount(next); setDelayed(false); saveConfirmed("missions", { missions: rows, next });
    } catch { setDelayed(true); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const handler = () => void load(); window.addEventListener("mosaic:transaction-update", handler); return () => window.removeEventListener("mosaic:transaction-update", handler); }, [load]);
  useReadRevalidation(() => void load(), delayed);
  return <main className="page"><section className="page-heading"><span className="eyebrow">Public mission explorer</span><h1>Funded engineering objectives.</h1><p>Browse the bounded ledger directly from the MOSAIC contract. Every row is an authoritative read, not an indexer projection.</p></section><section className="mission-board"><div className="section-heading"><div><span className="eyebrow">All missions</span><h2>Mission ledger</h2></div><button className="text-button" onClick={() => void load()}>Refresh</button></div>{!CONTRACT_ADDRESS && <div className="notice warn"><strong>Deployment not configured.</strong><span>Live reads and writes begin when the release contract is configured.</span></div>}{delayed && <div className="notice warn"><strong>Live refresh delayed.</strong><span>{confirmedCount === null ? "Studionet is temporarily unreachable. MOSAIC will retry automatically." : "Showing the last confirmed state while MOSAIC retries."}</span></div>}{loading && confirmedCount === null && <div className="loading-ledger"><span /><span /><span /></div>}{!loading && CONTRACT_ADDRESS && confirmedCount === 0 && <div className="empty-state"><span className="eyebrow">No missions yet</span><h3>The ledger is empty.</h3><p>Create the first funded software objective.</p></div>}<div className="mission-list">{missions.map((mission) => <MissionCard key={mission.id} mission={mission} />)}</div></section></main>;
}
