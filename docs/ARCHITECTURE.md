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

Contribution sealing first establishes objective provenance from GitHub: exact base repository and target branch, PR, normalized author, proof comment, head SHA, merge timestamp, unique merge SHA and changed-file evidence. A successfully sealed contribution permanently binds that GitHub author to the submitting wallet, and that wallet to the author, for the mission. Insufficient or invalid evidence does not reserve an identity. The semantic capsule is then produced via comparative validator judgment from that normalized bounded evidence.

Final resolution re-fetches every sealed PR, proof comment, ancestry comparison and bounded changed-file response under `strict_eq`. Resolution proceeds only when each normalized evidence digest exactly reproduces its sealed digest and each capsule and contribution commitment recomputes correctly. Source unavailability or changed evidence leaves the mission open and moves no GEN; the unresolved-grace recovery remains available. The former repository-existence probe was removed because it did not authenticate the evidence used for judgment.

Only after that revalidation does resolution group sealed capsules by wallet. Validators decide mission outcome and impact roles. The application never asks the browser or a server to decide payout.

## Canonical commitment chain

All commitments use UTF-8 JSON with lexicographically sorted object keys and compact separators (`,` and `:`); hashes are lowercase SHA-256 hex.

1. `evidence_digest` commits to the normalized, bounded GitHub response used for a contribution.
2. `capsule_digest` commits to the exact validated capsule fields.
3. `contribution_commitment` commits to mission/repository/ref, PR and proof identifiers, author/wallet, head and merge SHAs, and both preceding digests.
4. `mission_evidence_root` commits to the exact ordered list of sealed contribution commitments used for resolution.
5. `settlement_digest` commits to mission ID, evidence root, outcome, exact roles, released/residual amounts, exact contributor and sponsor allocations, and settlement timestamp.

Changing any consequential upstream identity or allocation changes its downstream commitment. Human-readable summaries never replace immutable source identity.

## Transaction truth

The frontend records a returned transaction hash immediately and monitors it independently of route navigation. Consensus status and execution result are separate. An Accepted receipt is provisional; a finalized execution error remains an error. Contract state is re-read after transaction updates rather than guessed from button completion.
