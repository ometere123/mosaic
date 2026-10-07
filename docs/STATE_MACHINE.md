# Mission state machine

`OPEN` accepts funding and contribution seals until a permissionless `freeze_terminal` succeeds at or after `freeze_not_before`. That one successful transaction is the economic close: it verifies and permanently stores the terminal target snapshot, required machine-check evidence, lineage and evidence commitments, records `closed_at`, and moves the mission to `TERMINAL_FROZEN`. A failed or unavailable freeze stores no partial snapshot and leaves the mission open for retry. `resolve_mission` is only a judgment over this immutable frozen evidence; waiting after freeze cannot replace the terminal tip or checks. Successful resolution becomes final `SETTLED`; insufficient evidence during judgment leaves the frozen mission retryable. After the unresolved grace period, `expire_unresolved` becomes `EXPIRED` and refunds sponsors pro-rata.

`withdraw` is pull-based and can be called repeatedly; the balance is zeroed before transfer. Funding, sealing, freezing, resolution and expiry reject incompatible states. The frontend distinguishes scheduled freeze eligibility from the authoritative `TERMINAL_FROZEN` state; a timer never pretends that a write already occurred.

Terminal status and claimant outcome are separate categorical fields. Resolution may truthfully record a successful terminal product with `NOT_ACHIEVED` claimant outcome when registered portfolios did not cause it.
# V5 hard-close and checkpoint semantics

New V5 missions record an immutable `close_at` at launch. Funding and sealing
are rejected once that time is reached, regardless of whether a freeze call has
occurred. Before the deadline, anyone may submit one bounded latest terminal
checkpoint. A checkpoint must be fresh at closure and must not predate the most
recent sealed contribution. Freeze selects that stored checkpoint; it never
discovers a mutable branch tip after the deadline.

The frozen checkpoint is bound to a terminal verification receipt. Subsequent
component adjudication, finalization, and settlement read that receipt and
frozen evidence only. If no valid checkpoint exists, the mission fails closed
and follows the unresolved-expiry path.
