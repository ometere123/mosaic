# Economic and safety invariants

- `CORE`, `MAJOR`, `SUPPORTING`, `NO_CREDIT` weights are exactly `5/3/1/0`.
- Claimant `ACHIEVED`, `MATERIAL_PROGRESS`, and `NOT_ACHIEVED` release exactly `100%`, `40%`, and `0%` of the funded pool respectively.
- Positive release requires at least one positive-impact eligible wallet.
- Contributor allocations plus sponsor residual allocations equal the pool exactly, including deterministic remainder assignment.
- A wallet cannot be rebound to another stable GitHub account in one mission, and an account cannot be rebound to another wallet.
- PR and merge replay protection is mission-scoped; the same public PR may qualify independently in another mission.
- Settlement and expiry are one-way; withdrawal cannot pay twice.
- Uncertainty never moves GEN.
