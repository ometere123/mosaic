# Economic and safety invariants

- `CORE`, `MAJOR`, `SUPPORTING`, `NO_CREDIT` weights are exactly `5/3/1/0`.
- Claimant `ACHIEVED`, `MATERIAL_PROGRESS`, and `NOT_ACHIEVED` release exactly `100%`, `40%`, and `0%` of the funded pool respectively.
- Positive release requires at least one positive-impact eligible wallet.
- Contributor allocations plus sponsor residual allocations equal the pool exactly, including deterministic remainder assignment.
- A wallet cannot be rebound to another stable GitHub account in one mission, and an account cannot be rebound to another wallet.
- PR and merge replay protection is mission-scoped; the same public PR may qualify independently in another mission.
- Settlement and expiry are one-way; withdrawal cannot pay twice.
- Uncertainty never moves GEN.
- Economic close is the successful terminal freeze: `freeze_not_before` only schedules eligibility, while `closed_at` is recorded atomically with the immutable terminal snapshot.
- Resolution cannot discover or substitute a later target state; it consumes only frozen terminal, check, lineage and contribution evidence.
- Economic judgment is matrix-only. Top-level terminal and claimant outcomes are derived deterministically from validated criterion rows; rationale cannot override them.
- Positive SOURCE rows require SOURCE evidence, positive claimant rows require eligible CONTRIBUTION evidence, and positive roles require contribution evidence owned by that wallet.
- A claimant cannot be positive for a terminally unsatisfied or unverifiable criterion; failed or pending machine checks cannot be reinterpreted as semantic success.
- Typed evidence references are membership- and kind-checked, criterion-bound for checks, and committed in the settlement matrix and role evidence.
