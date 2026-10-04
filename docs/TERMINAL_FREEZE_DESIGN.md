# Terminal-freeze design

Status: implementation design, not a claim about the existing deployment.

## Atomic close

`freeze_not_before` is an earliest permissionless freeze time, not an eligibility deadline. OPEN accepts funding and otherwise valid sealed contributions until a successful `freeze_terminal` transaction. A successful freeze obtains consensus on the target tip, bounded terminal source, immutable contribution revalidation, lineage and required check evidence, then stores the complete context and `closed_at` together with TERMINAL_FROZEN. No partial snapshot becomes authoritative.

An unavailable or incomplete acquisition leaves OPEN, with no GEN movement and no eligibility closure. Participants must understand that a delayed freeze allows additional work and funding. Maintainers can affect the branch before freeze, not after freeze. This removes resolution-time selection, not the disclosed influence of timing the permissionless freeze itself.

Resolution requires TERMINAL_FROZEN and consumes stored evidence only. It must not refresh GitHub facts, including check results or PR metadata. Frozen source, lineage, verification and contribution roots remain unchanged even after an unsuccessful semantic resolution. Expiry remains a deterministic sponsor-refund escape hatch for both unfrozen and frozen unresolved missions; its deadline must be anchored to immutable creation terms, not extended by retries or freeze calls. Expiry is cancellation/refund, not successful terminal adjudication.

## Verification plan and trust

Creation freezes a bounded typed criterion list. SOURCE means bounded static source satisfaction; empirical claims require supported machine evidence. GITHUB_CHECK binds an exact public check identity to the mission repository and terminal SHA. A presentation name alone is insufficient identity: matching must also constrain the producing GitHub app. Duplicate matches must not be silently selected by list order. Pagination or truncation must not manufacture a missing result.

Public check success proves the named producer reported success on that commit, not that its tests are sound or cover every objective. Semantic evaluation must still examine whether the committed evidence substantiates the criterion. The protocol cannot honestly guarantee arbitrary production behavior or measurements absent a supported signal. Unsupported claims remain unverifiable.

Pending or unavailable required checks prevent freezing a partially observed result. A complete response with a genuinely absent or failed required check may be frozen as explicit negative evidence; neither can support SATISFIED. Later reruns cannot change that frozen evidence. This trade-off must be visible before closing.

## Grounded judgment

Construct typed evidence IDs from canonical committed objects, not participant-provided labels or URLs. Source IDs bind the terminal SHA, path and bounded content; check IDs bind repository, SHA, producer, stable run ID and normalized result; contribution IDs bind index, wallet, PR/merge identity and sealed commitment. Every referenced ID must resolve in the frozen set.

Every criterion appears once with separate terminal and claimant status. Positive claimant evidence requires sealed claimant objects; positive roles require that wallet's own objects. Both independent judgments must agree on economic statuses, roles and normalized evidence references. Rationale remains non-economic. The prompt must examine counterevidence, missing implementation, supersession and reverts, not merely search for support.

Aggregation is deterministic and must be total: any required UNVERIFIABLE makes that layer insufficient; otherwise all SATISFIED means achieved; otherwise at least one SATISFIED or PARTIAL means material progress; otherwise not achieved. Compatibility constraints apply per criterion as well as to derived layers. No model-supplied top-level label may override this calculation. A zero-claimant portfolio cannot produce positive claimant causality, even when terminal criteria are satisfied.

Membership validation cannot prove a cited source interpretation is true. Independent semantic consensus remains responsible for SOURCE meaning, causal attribution and comparative roles. The deterministic layer rejects unsupported identities and contradictory machine facts; it must not be marketed as a proof of arbitrary semantic correctness.

## Verification obligations

Tests must observe the actual prompt context after changing the target branch and check results following freeze, and must prove resolution performs no public-source discovery. Exhaustive criterion combinations, wallet-owned reference checks, frozen commitment reproduction, failure/retry state and exact pool conservation complement mutation tests. Public integration must verify pinned real provenance/check fields separately from controlled Direct Mode responses.
