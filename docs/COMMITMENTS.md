# Commitment chain

Canonical digests are lowercase SHA-256 over UTF-8 JSON with sorted keys and compact separators.

Sealing stores separate evidence, immutable-source, proof-authentication, capsule, and contribution commitments. Resolution builds an ordered contribution root containing sealed and economically relevant insufficient records, a terminal source digest, bounded per-contribution lineage records, and a resolution evidence root containing mission terms and all judgment inputs. The final settlement digest commits both economic status fields, the exact role map, allocations and upstream roots. Expiry commits the ordered contribution root directly and does not impersonate a semantic resolution root.

Every field capable of changing outcome, role, payout, or sponsor residual must be represented in this chain. The Direct Mode commitment tests reconstruct roots and mutate individual inputs to prove sensitivity.
