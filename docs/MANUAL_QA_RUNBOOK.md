# Manual QA runbook

This runbook records the repeatable browser and wallet checks used for a release. It does not itself authorize wallet transactions or protocol changes.

1. Confirm the configured chain is Studionet 61999 and that no obsolete address is present.
2. With no injected wallet, verify the disconnected state and disabled writes.
3. Connect, reject a signature, switch accounts, disconnect, and retry. Confirm displayed account and write sender follow the provider.
4. Use a wrong chain, exercise switch success and rejection, and confirm no write is sent on the wrong network.
5. Exercise launch, funding, mission detail, contribution, exact proof discovery, manual comment fallback, and seal. Confirm transaction hash persistence survives refresh.
6. Verify accepted, finalized-with-success, finalized-with-error, finalized-unverified, timeout, and RPC-not-found recovery states. Never accept a status-only success.
7. After contract settlement, verify terminal objective status, claimant outcome, roles, sponsor residual, earnings, withdrawal, and zero-balance behavior.
8. Check narrow/mobile layout, keyboard focus, labels, loading/error/empty states, and that no action claims success before the authoritative reread.

Record URLs, hashes, chain ID, wallet account, finality, and screenshots. Do not invent evidence when a public dependency is unavailable; record the unresolved state and retry/expiry behavior instead.
