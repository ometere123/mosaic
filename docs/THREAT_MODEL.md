# Threat model

MOSAIC treats sponsors, contributors, GitHub text, proof comments, a dishonest leader, unavailable public APIs, and stale browser state as adversarial.

The contract is the authority for mission terms, evidence commitments, settlement and balances. The browser is an untrusted transaction client; GitHub previews are convenience only. No backend, server signer, GitHub App, webhook or centralized adjudicator exists.

Stable numeric GitHub account identity is bound to a wallet per mission. Proof markers, repository/ref, baseline ancestry, head/merge identities, immutable source digest and bounded patches are independently checked. Mutable title/body/comment prose remains historical context and cannot veto a previously authenticated proof.

Source failure, disagreement, malformed data and evidence beyond bounds fail closed: no GEN moves, retry remains possible, and unresolved missions can deterministically expire after grace.

MOSAIC deliberately uses settlement-state rather than close-time snapshot semantics. GitHub is not treated as a historical branch-tip oracle for `close_at`. The close time ends eligibility, while resolution checks whether claimant work survives in the first successfully consensus-observed post-close target state. This prevents a merged-then-reverted contribution from retaining automatic economic entitlement. It also means resolution timing can affect which post-close snapshot is adjudicated; the first successful settlement is final, and unavailable or contradictory source remains retryable without moving GEN.

Replay protection is scoped to one mission. A global public-PR consumption lock would let one sponsor's mission block another independently funded objective. The same work may therefore receive value from separate missions only when each mission's independently frozen terms and judgment support it; duplicate use inside one mission remains rejected.
