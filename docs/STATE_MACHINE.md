# Mission state machine

`OPEN` accepts funding and contribution seals until the frozen close time. After close, `resolve_mission` is permissionless and observes the first consensus-observed terminal target snapshot for that attempt. Successful resolution becomes `SETTLED`; source failure or insufficient evidence leaves the mission `OPEN` for retry. After the unresolved grace period, `expire_unresolved` becomes `EXPIRED` and refunds sponsors pro-rata.

`withdraw` is pull-based and can be called repeatedly; the balance is zeroed before transfer. Funding, sealing, resolution and expiry reject incompatible states. The frontend derives `CLOSED · UNRESOLVED` from time while chain state remains `OPEN`; it does not pretend that a timer performed a write.

Terminal status and claimant outcome are separate categorical fields. Resolution may truthfully record a successful terminal product with `NOT_ACHIEVED` claimant outcome when registered portfolios did not cause it.
