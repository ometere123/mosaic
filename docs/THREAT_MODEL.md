# Threat model

MOSAIC treats sponsors, contributors, GitHub text, proof comments, a dishonest leader, unavailable public APIs, and stale browser state as adversarial.

The contract is the authority for mission terms, evidence commitments, settlement and balances. The browser is an untrusted transaction client; GitHub previews are convenience only. No backend, server signer, GitHub App, webhook or centralized adjudicator exists.

Stable numeric GitHub account identity is bound to a wallet per mission. Proof markers, repository/ref, baseline ancestry, head/merge identities, immutable source digest and bounded patches are independently checked. Mutable title/body/comment prose remains historical context and cannot veto a previously authenticated proof.

Source failure, disagreement, malformed data and evidence beyond bounds fail closed: no GEN moves, retry remains possible, and unresolved missions can deterministically expire after grace.
