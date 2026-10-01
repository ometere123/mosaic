"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchTransaction } from "@/lib/transaction";
import type { TxRecord } from "@/lib/types";

const STORAGE_KEY = "mosaic:transactions:v1";
const ACTIVE = new Set(["submitted", "pending", "accepted", "finalized_unverified"]);

type TxContextValue = {
  transactions: TxRecord[];
  track: (hash: string, action: string, missionId?: number) => void;
  dismiss: (hash: string) => void;
};
const TxContext = createContext<TxContextValue | null>(null);

function load(): TxRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch { return []; }
}

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const transactionsRef = useRef<TxRecord[]>([]);
  useEffect(() => setTransactions(load()), []);
  useEffect(() => {
    transactionsRef.current = transactions;
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const active = transactionsRef.current.filter((tx) => ACTIVE.has(tx.stage));
      if (!active.length) return;
      const next = await Promise.all(active.map(fetchTransaction));
      if (cancelled) return;
      setTransactions((current) => {
        let changed = false;
        const merged = current.map((tx) => {
          const update = next.find((n) => n.hash === tx.hash);
          if (!update) return tx;
          if (update.stage !== tx.stage || update.statusName !== tx.statusName || update.executionName !== tx.executionName) changed = true;
          return update;
        });
        return changed ? merged : current;
      });
      window.dispatchEvent(new CustomEvent("mosaic:transaction-update"));
    };
    void poll();
    const id = window.setInterval(poll, 3500);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  const track = useCallback((hash: string, action: string, missionId?: number) => {
    setTransactions((current) => {
      if (current.some((tx) => tx.hash === hash)) return current;
      const created: TxRecord = { hash, action, missionId, submittedAt: Date.now(), stage: "submitted" };
      return [created, ...current].slice(0, 30);
    });
  }, []);
  const dismiss = useCallback((hash: string) => setTransactions((current) => current.filter((tx) => tx.hash !== hash)), []);
  const value = useMemo(() => ({ transactions, track, dismiss }), [transactions, track, dismiss]);
  return <TxContext.Provider value={value}>{children}</TxContext.Provider>;
}

export function useTransactions() {
  const value = useContext(TxContext);
  if (!value) throw new Error("useTransactions must be used inside TransactionProvider");
  return value;
}
