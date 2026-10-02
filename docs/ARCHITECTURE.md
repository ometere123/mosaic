# Architecture

## Boundaries

MOSAIC is deliberately limited to a browser frontend and one GenLayer Intelligent Contract.

Canonical product state is contract state. Local browser storage keeps only non-authoritative transaction hashes so a refresh can resume monitoring a submitted write. GitHub browser previews are non-authoritative convenience reads.

## Mission lifecycle

Stored terminal states are `SETTLED` and `EXPIRED`. While a mission remains stored as `OPEN`, the frontend derives `CLOSED · UNRESOLVED` once chain time passes its closing timestamp. This avoids pretending a timer itself performed an on-chain transition.

Writes:

1. `open_mission` — payable; freezes repository, target branch, baseline, objective, criteria and deadline after consensus verifies that the baseline belongs to the public target branch.
2. `add_funding` — payable while open.
3. `seal_contribution` — verifies merged PR provenance and creates a consensus-sealed evidence capsule.
4. `resolve_mission` — permissionless after close; produces the substantive mission outcome and per-wallet impact role.
5. `expire_unresolved` — permissionless safety exit after the unresolved grace period.
6. `withdraw` — pull transfer for contributor allocations and sponsor residuals.

## Economic invariants

The full mission pool is accounted for exactly once.

- `ACHIEVED`: 100% released to positive-impact contributors.
- `MATERIAL_PROGRESS`: 40% released to positive-impact contributors; 60% sponsor residual.
- `NOT_ACHIEVED`: 0% contributor release; 100% sponsor residual.
- uncertainty: no state settlement and no GEN movement.

Contributor weights are applied only after validators fix the role labels. Rounding dust is assigned deterministically to the last positive-impact wallet in first-appearance order. Sponsor residual dust is likewise assigned deterministically to the final sponsor in first-funding order. Withdrawal order never changes entitlement.

## Evidence phases

Contribution sealing first establishes objective provenance from GitHub: exact base repository and target branch, PR, normalized author, proof comment, head SHA, merge timestamp, unique merge SHA and changed-file evidence. A successfully sealed contribution permanently binds that GitHub author to the submitting wallet, and that wallet to the author, for the mission. The seal stores a separate proof-authentication commitment, immutable source digest, and full semantic-evidence snapshot digest. Later edits or deletion of PR prose or the public proof comment cannot erase the consensus-authenticated on-chain proof; they also cannot rewrite the sealed capsule. Insufficient or invalid evidence does not reserve an identity. The semantic capsule is then produced via comparative validator judgment from that normalized bounded evidence.

Final resolution re-fetches every sealed PR's immutable repository/ref/head/merge/ancestry and bounded changed-file response under `strict_eq`. Resolution proceeds only when each immutable source digest exactly reproduces its sealed digest and each capsule and contribution commitment recomputes correctly. Mutable titles, bodies, and proof-comment text are intentionally outside this revalidation veto. Immutable-source unavailability or disagreement leaves the mission open and moves no GEN; the unresolved-grace recovery remains available.

Resolution also captures the first consensus-observed target-branch snapshot in that post-close resolution attempt: the frozen repository and target ref, terminal tip SHA, proof that tip descends from the frozen baseline, and a bounded normalized baseline-to-tip patch set. It is not represented as the exact branch state at `close_at`. A missing branch, force-push away from baseline, incomplete patch, or exceeded source budget fails closed with no GEN movement. The bounded snapshot uses two GitHub calls (branch and compare) and at most 30 changed files, 2,500 changes, and 24,000 patch characters.

Only after that revalidation does resolution group sealed capsules by wallet. The leader and every validator independently run the mission judgment over the same committed context, including the terminal snapshot. A custom validator requires exact agreement on the mission outcome and complete normalized wallet-to-role map; rationales may differ and are non-economic. Invalid schemas, omitted or extra wallets, and validator exceptions disagree. The application never asks the browser or a server to decide payout.

## Canonical commitment chain

All commitments use UTF-8 JSON with lexicographically sorted object keys and compact separators (`,` and `:`); hashes are lowercase SHA-256 hex.

1. `evidence_digest` commits to the normalized, bounded GitHub snapshot used to create a capsule, including descriptive metadata.
2. `immutable_source_digest` commits separately to repository/ref, PR author, head and merge identities, merge time, counts, and normalized file patches.
3. `proof_auth_digest` commits to the mission-scoped author/comment/wallet proof successfully authenticated at sealing.
4. `capsule_digest` commits to the exact validated capsule fields.
5. `contribution_commitment` commits to mission/repository/ref, PR and proof identifiers, author/wallet, head and merge SHAs, and all preceding digests.
6. `mission_evidence_root` commits to the exact ordered list of sealed contribution commitments used for resolution.
7. `ordered_contribution_root` commits to every ordered record, including `INSUFFICIENT_EVIDENCE` records when they are reported to the judgment.
8. `terminal_source_digest` commits to the bounded settlement-state target snapshot.
9. `resolution_evidence_root` commits to mission terms, the complete ordered contribution root, and terminal source digest.
10. `settlement_digest` commits to mission ID, evidence root, resolution evidence root, outcome, exact roles, released/residual amounts, exact contributor and sponsor allocations, and settlement timestamp. Expiry also commits its complete ordered contribution root so refunds retain their contribution audit trail.

Changing any consequential upstream identity or allocation changes its downstream commitment. Human-readable summaries never replace immutable source identity.

## Transaction truth

The frontend records a returned transaction hash immediately and monitors it independently of route navigation. Consensus status and execution result are separate. An Accepted receipt is provisional; a finalized execution error remains an error. Contract state is re-read after transaction updates rather than guessed from button completion.
