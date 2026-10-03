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
4. `resolve_mission` — permissionless after close; separately records the terminal-product status and registered-claimant outcome before deterministic allocation.
5. `expire_unresolved` — permissionless safety exit after the unresolved grace period.
6. `withdraw` — pull transfer for contributor allocations and sponsor residuals.

## Economic invariants

The full mission pool is accounted for exactly once.

- claimant `ACHIEVED`: 100% released to positive-impact contributors.
- claimant `MATERIAL_PROGRESS`: 40% released to positive-impact contributors; 60% sponsor residual.
- claimant `NOT_ACHIEVED`: 0% contributor release; 100% sponsor residual.
- uncertainty: no state settlement and no GEN movement.

Contributor weights are applied only after validators fix the role labels. `MATERIAL_PROGRESS = 40%` is explicit protocol policy: it rewards real material progress without treating incomplete delivery as full success, while preserving 60% of sponsor capital when eligible claimants did not complete the objective. `CORE / MAJOR / SUPPORTING / NO_CREDIT = 5 / 3 / 1 / 0` are deliberately coarse ordinal weights that distinguish primary, substantial, supporting, and no causal contribution without asking validators for falsely precise percentages. Neither policy is claimed to be mathematically optimal. Rounding dust is assigned deterministically to the last positive-impact wallet in first-appearance order. Sponsor residual dust is likewise assigned deterministically to the final sponsor in first-funding order. Withdrawal order never changes entitlement.

## Evidence phases

Contribution sealing first establishes objective provenance from GitHub: exact base repository and target branch, PR, stable numeric GitHub account ID, display login, proof comment, head SHA, merge timestamp, unique merge SHA and changed-file evidence. The PR author and proof-comment author must have the same stable account ID. A successfully sealed contribution permanently binds that account ID to the submitting wallet, and that wallet to the account ID, for the mission; the login is sealed only as human-readable metadata, so a later GitHub login rename does not alter attribution. The seal stores a separate proof-authentication commitment, immutable source digest, and full semantic-evidence snapshot digest. Later edits or deletion of PR prose or the public proof comment cannot erase the consensus-authenticated on-chain proof; they also cannot rewrite the sealed capsule. Insufficient or invalid evidence does not reserve an identity. The semantic capsule is then produced via comparative validator judgment from that normalized bounded evidence.

PR-number and merge-SHA replay protection is mission-scoped. The same public PR cannot be sealed twice for one mission, but may be independently evaluated in another mission with independently frozen terms, baseline, objective, criteria, evidence, funding, and economic judgment. Separate sponsors can fund overlapping objectives; a global first-claim lock would let one mission consume public work and prevent another independently funded objective from evaluating it. The explicit trade-off is that one piece of public work can receive value from multiple missions when it genuinely satisfies each separately frozen objective.

Final resolution re-fetches every sealed PR through a dedicated immutable-only path under `strict_eq`. That value contains only repository/ref, stable account ID, head/merge identities, merge time, baseline ancestry, bounded source/file identity, immutable digest, and deterministic status. Resolution proceeds only when each immutable source digest exactly reproduces its sealed digest and each capsule and contribution commitment recomputes correctly. Mutable titles, bodies, and proof-comment text are intentionally absent from this settlement comparison. Immutable-source unavailability or disagreement leaves the mission open and moves no GEN; the unresolved-grace recovery remains available.

Resolution uses **settlement-state semantics**, not close-time snapshot semantics. `close_at` ends funding and contribution eligibility; it does not claim that GitHub supplies a trustworthy historical branch-tip oracle for that exact second. Resolution captures the first successfully consensus-verified post-close target snapshot: the frozen repository and target ref, terminal tip SHA, proof that tip descends from the frozen baseline, and a bounded normalized baseline-to-tip patch set. This rewards contribution to the product state that actually survives to adjudication rather than creating permanent economic entitlement from historical merge alone. The trade-off is explicit: resolution timing determines which post-close target snapshot becomes the first successfully adjudicated terminal state. First successful settlement is final. A missing branch, force-push away from baseline, incomplete patch, or exceeded source budget fails closed with no GEN movement. The bounded snapshot uses two GitHub calls (branch and compare) and at most 30 changed files, 2,500 changes, and 24,000 patch characters.

For each sealed contribution, resolution also makes one bounded compare request from its merge SHA to the terminal tip (at most 12 additional calls). It commits whether that merge is in terminal ancestry. A non-ancestral merge is factual causal context for the final judgment rather than a historical payout entitlement; the terminal patch and sealed capsules let the judgment distinguish reverts, supersession, independent reimplementation, and overlap. A malformed or unavailable lineage comparison fails closed. The maximum resolution read budget is 50 public GitHub reads: two for the terminal snapshot plus, for each of at most 12 sealed records, three immutable PR reads and one lineage read. This bounded cost is deliberate; GitHub unavailability or rate limiting leaves the mission unresolved rather than introducing a privileged proxy.

Only after that revalidation does resolution group sealed capsules by wallet. The leader and every validator independently run the mission judgment over the same committed context, including the terminal snapshot. They agree exactly on (a) `terminal_objective_status`, the factual settlement-state target-product result, (b) `claimant_outcome`, the causal result attributable to eligible sealed MOSAIC portfolios, and (c) the complete normalized wallet-to-role map. Rationales may differ and are explicitly non-economic leader explanations. A terminal success caused by unregistered work therefore does not create a claimant payout. With no registered claimants, MOSAIC can record terminal success while setting claimant outcome to `NOT_ACHIEVED` and returning the pool to sponsors. Invalid schemas, omitted or extra wallets, impossible status combinations, and validator exceptions disagree. The application never asks the browser or a server to decide payout.

## Canonical commitment chain

All commitments use UTF-8 JSON with lexicographically sorted object keys and compact separators (`,` and `:`); hashes are lowercase SHA-256 hex.

1. `evidence_digest` commits to the normalized, bounded GitHub snapshot used to create a capsule, including descriptive metadata.
2. `immutable_source_digest` commits separately to repository/ref, stable GitHub account ID, head and merge identities, merge time, counts, and normalized file patches.
3. `proof_auth_digest` commits to the mission-scoped author/comment/wallet proof successfully authenticated at sealing.
4. `capsule_digest` commits to the exact validated capsule fields.
5. `contribution_commitment` commits to mission/repository/ref, PR and proof identifiers, author/wallet, head and merge SHAs, and all preceding digests.
6. `mission_evidence_root` commits to the exact ordered list of sealed contribution commitments used for resolution.
7. `ordered_contribution_root` commits to every ordered record, including `INSUFFICIENT_EVIDENCE` records when they are reported to the judgment. An expiry records this root directly for auditability without fabricating a semantic `mission_evidence_root` or `resolution_evidence_root`.
8. `terminal_source_digest` commits to the bounded settlement-state target snapshot.
9. `resolution_evidence_root` commits to mission terms, the complete ordered contribution root, and terminal source digest.
10. `settlement_digest` commits to mission ID, evidence root, resolution evidence root, terminal objective status, claimant outcome, exact roles, released/residual amounts, exact contributor and sponsor allocations, and settlement timestamp. Expiry also commits its complete ordered contribution root so refunds retain their contribution audit trail.

Changing any consequential upstream identity or allocation changes its downstream commitment. Human-readable summaries never replace immutable source identity.

## Transaction truth

The frontend records a returned transaction hash immediately and monitors it independently of route navigation. Consensus status and execution result are separate. An Accepted receipt is provisional; a finalized execution error remains an error. Contract state is re-read after transaction updates rather than guessed from button completion.
