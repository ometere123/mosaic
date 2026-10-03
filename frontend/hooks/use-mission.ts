"use client";

import { useCallback, useEffect, useState } from "react";
import { getContribution, getMission } from "@/lib/contract";
import type { Contribution, Mission } from "@/lib/types";
import { loadConfirmed, saveConfirmed } from "@/lib/read-cache";
import { mapWithConcurrency } from "@/lib/read-resilience";
import { useReadRevalidation } from "@/hooks/use-read-revalidation";

export function useMission(id: number | null) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [delayed, setDelayed] = useState(false);
  const [notFoundConfirmed, setNotFoundConfirmed] = useState(false);

  const refresh = useCallback(async () => {
    if (id === null || !Number.isInteger(id) || id < 0) return;
    const cacheKey = `mission:${id}`;
    const cached = loadConfirmed<{ mission: Mission; contributions: Contribution[] }>(cacheKey);
    if (cached) {
      setMission((current) => current ?? cached.value.mission);
      setContributions((current) => current.length ? current : cached.value.contributions);
      setLoading(false);
    }
    try {
      const next = await getMission(id);
      if (!next) {
        setMission(null); setContributions([]); setNotFoundConfirmed(true); setDelayed(false);
        return;
      }
      const items = await mapWithConcurrency(Array.from({ length: next.contribution_count }, (_, i) => i), (index) => getContribution(id, index));
      const confirmed = items.filter((x): x is Contribution => !!x);
      setMission(next); setContributions(confirmed); setNotFoundConfirmed(false); setDelayed(false);
      saveConfirmed(cacheKey, { mission: next, contributions: confirmed });
    } catch { setDelayed(true); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const handler = () => void refresh();
    window.addEventListener("mosaic:transaction-update", handler);
    return () => window.removeEventListener("mosaic:transaction-update", handler);
  }, [refresh]);
  useReadRevalidation(() => void refresh(), delayed);

  return { mission, contributions, loading, delayed, notFoundConfirmed, refresh };
}
