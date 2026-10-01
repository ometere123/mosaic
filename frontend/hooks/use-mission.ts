"use client";

import { useCallback, useEffect, useState } from "react";
import { getContribution, getMission } from "@/lib/contract";
import type { Contribution, Mission } from "@/lib/types";

export function useMission(id: number | null) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (id === null || !Number.isInteger(id) || id < 0) return;
    setError(null);
    try {
      const next = await getMission(id);
      setMission(next);
      if (!next) { setContributions([]); return; }
      const items = await Promise.all(Array.from({ length: next.contribution_count }, (_, i) => getContribution(id, i)));
      setContributions(items.filter((x): x is Contribution => !!x));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to read mission state."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const handler = () => void refresh();
    window.addEventListener("mosaic:transaction-update", handler);
    return () => window.removeEventListener("mosaic:transaction-update", handler);
  }, [refresh]);

  return { mission, contributions, loading, error, refresh };
}
