# Testing evidence

The contract control suite runs in GenLayer Direct Mode against the actual contract. It covers terminal parsing and bounds, immutable revalidation, stable identity binding, source outages, lineage, prompt-injection text, validator disagreement, state transitions, collection limits, rounding, conservation and retry/expiry behavior.

The repository-local command is the pinned Direct Mode environment documented in `contract/requirements.txt`. Windows portable CI verifies source integrity and frontend gates; Ubuntu runs lint, Direct Mode and mutation control. The current suite is intentionally bounded and does not claim support for unbounded repository transformations.

Frontend tests cover parsers, transaction truth, wallet/network guards, GitHub discovery and state presentation. Component and browser-flow coverage remains an active hardening area until its evidence gate is complete.
