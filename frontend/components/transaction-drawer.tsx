"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { explorerTx } from "@/lib/genlayer";
import { shortHex } from "@/lib/format";

const copy: Record<string, string> = {
  submitted: "Submitted",
  pending: "Consensus in progress",
  accepted: "Accepted · awaiting finality",
  finalized: "Finalized · execution succeeded",
  finalized_unverified: "Finalized · execution unverified",
  failed: "Execution failed",
  undetermined: "Consensus undetermined",
  canceled: "Canceled",
  timeout: "Consensus timeout",
};

export function TransactionDrawer() {
  const [open, setOpen] = useState(false);
  const { transactions, dismiss } = useTransactions();
  const active = transactions.filter((t) => ["submitted", "pending", "accepted"].includes(t.stage)).length;
  return (
    <>
      <button className="activity-button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>Activity {active ? `· ${active}` : ""}</button>
      {open && <aside className="tx-drawer" aria-label="Transaction activity">
        <div className="drawer-heading"><div><span className="eyebrow">Protocol activity</span><h2>Transactions</h2></div><button className="text-button" onClick={() => setOpen(false)}>Close</button></div>
        {!transactions.length && <p className="empty-copy">No submitted transactions in this browser yet.</p>}
        <div className="tx-list">
          {transactions.map((tx) => <article className="tx-row" key={tx.hash}>
            <div className="tx-row-top"><strong>{tx.action}</strong><span className={`tx-stage ${tx.stage}`}>{copy[tx.stage] ?? tx.stage}</span></div>
            <div className="tx-meta"><a href={explorerTx(tx.hash)} target="_blank" rel="noreferrer">{shortHex(tx.hash, 8, 6)} ↗</a>{tx.statusName && <span>{tx.statusName}</span>}{tx.executionName && <span>{tx.executionName}</span>}</div>
            {tx.stage === "accepted" && <p className="tx-note">Consensus accepted a receipt. MOSAIC does not treat this as durable completion until finality and execution are both checked.</p>}
            {!["submitted", "pending", "accepted"].includes(tx.stage) && <button className="text-button small" onClick={() => dismiss(tx.hash)}>Dismiss</button>}
          </article>)}
        </div>
      </aside>}
    </>
  );
}
