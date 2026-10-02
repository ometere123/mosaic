# Frontend truth model

The Next.js client is a wallet-facing presentation and transaction-observation layer. It uses an injected EIP-1193 provider and the pinned `genlayer-js` 1.1.8 client; it has no server authority, signer, database, or GitHub proxy.

Writes are followed by an authoritative contract reread. `ACCEPTED` means the transaction was accepted for processing, not that execution succeeded. `FINALIZED` is also not success by itself: the client requires a supported execution result, including the pinned SDK's leader-receipt representation when the normalized top-level field is absent. Arbitrary validator receipts are ignored.

GitHub proof-comment discovery is a convenience read. It can prefill a matching comment ID, but the contract independently authenticates repository, PR, author identity, marker, and wallet binding. Errors, rate limits, malformed responses, and no-match results retain a manual-ID fallback.

The UI distinguishes terminal objective status from claimant outcome. The former describes the actual target product; the latter controls eligibility for MOSAIC payout. Sponsor residuals and claimable balances are displayed from contract state.
