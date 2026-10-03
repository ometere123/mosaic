"use client";

import { useEffect } from "react";

export function useReadRevalidation(refresh: () => void, delayed: boolean, staleMs = 30_000) {
  useEffect(() => {
    let last = Date.now();
    const run = () => { last = Date.now(); refresh(); };
    const visible = () => { if (document.visibilityState === "visible" && Date.now() - last >= staleMs) run(); };
    const focus = () => { if (Date.now() - last >= staleMs) run(); };
    window.addEventListener("online", run);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener("online", run);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh, staleMs]);

  useEffect(() => {
    if (!delayed) return;
    const id = window.setTimeout(refresh, 5_000);
    return () => window.clearTimeout(id);
  }, [delayed, refresh]);
}
