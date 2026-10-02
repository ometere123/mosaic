# Testing evidence

The contract control suite runs in GenLayer Direct Mode against the actual contract. It covers terminal parsing and bounds, immutable revalidation, stable identity binding, source outages, lineage, prompt-injection text, validator disagreement, state transitions, collection limits, rounding, conservation and retry/expiry behavior.

The repository-local command is the pinned Direct Mode environment documented in `contract/requirements.txt`. Ubuntu CI separates verification, contract mutation, and frontend mutation jobs; Windows portable CI independently verifies source integrity and frontend gates. The manifest verifier checks the frozen source/tree and exact contract bytes. The current suite is intentionally bounded and does not claim support for unbounded repository transformations.

Frontend tests cover parsers, transaction truth, wallet/network guards, GitHub discovery, rendered wallet and transaction flows, mission presentation, and state presentation. Browser-side proof discovery remains a convenience only; contract verification is authoritative.
