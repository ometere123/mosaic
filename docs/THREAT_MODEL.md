# Threat model

MOSAIC treats sponsors, contributors, GitHub text, proof comments, a dishonest leader, unavailable public APIs, and stale browser state as adversarial.

The contract is the authority for mission terms, evidence commitments, settlement and balances. The browser is an untrusted transaction client; GitHub previews are convenience only. No backend, server signer, GitHub App, webhook or centralized adjudicator exists.

Stable numeric GitHub account identity is bound to a wallet per mission. Proof markers, repository/ref, baseline ancestry, head/merge identities, immutable source digest and bounded patches are independently checked. Mutable title/body/comment prose remains historical context and cannot veto a previously authenticated proof.

Source failure, disagreement, malformed data and evidence beyond bounds fail closed: no GEN moves, retry remains possible, and unresolved missions can deterministically expire after grace.

MOSAIC deliberately uses settlement-state semantics with an atomic terminal freeze rather than resolution-time substitution. `freeze_not_before` is the earliest eligible time; only a successful permissionless `freeze_terminal` ends eligibility, records `closed_at`, and commits the target tip, bounded source, lineage and required check evidence. `resolve_mission` cannot fetch a replacement branch state, so post-freeze maintainer changes cannot alter decisive evidence. The first successful freeze determines the adjudicated snapshot; unavailable or contradictory source remains retryable without moving GEN. A merged-then-reverted contribution remains visible to causal judgment without retaining automatic economic entitlement.

Replay protection is scoped to one mission. A global public-PR consumption lock would let one sponsor's mission block another independently funded objective. The same work may therefore receive value from separate missions only when each mission's independently frozen terms and judgment support it; duplicate use inside one mission remains rejected.
