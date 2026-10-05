# Verification profiles

MOSAIC missions now freeze a typed verification plan at creation.

`SOURCE` criteria ask validators to assess bounded source evidence at the frozen terminal commit. A source diff can describe implementation and causal relevance, but cannot prove arbitrary tests, builds, runtime behavior, deployment behavior or performance. Such claims need a supported machine signal.

`GITHUB_CHECK` criteria bind a named public check to the frozen repository and terminal SHA. The required check name and producing app slug are frozen in the mission. At terminal freeze validators retrieve public check runs, normalize the stable run ID, producer, status, conclusion and head SHA, and commit them in the frozen terminal evidence. Missing, ambiguous, pending or unavailable check evidence cannot become a positive criterion. A completed failed check is retained as negative evidence.

The public check result establishes what the named producer reported; it does not establish that an arbitrary check is well designed. GenLayer semantic consensus remains necessary to judge whether bounded SOURCE evidence satisfies a criterion and whether claimant work materially caused the surviving product state.

Each terminal source object and normalized check object receives a bounded evidence ID and digest. Criterion judgments may cite only IDs in that frozen set. The validator output must contain exactly one row for every frozen criterion and exactly one role entry for every eligible claimant wallet. Deterministic code derives terminal and claimant outcomes from the criterion statuses, applies compatibility rules, then allocates GEN.

Legacy string criteria and legacy free-verdict settlement are not accepted by the hardened contract. Every new mission must freeze explicit typed objects, and every economic judgment must return the criterion matrix plus wallet-owned role evidence.
