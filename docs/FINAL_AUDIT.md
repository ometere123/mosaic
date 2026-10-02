# Final release audit

The hardened source and production surfaces now have the following verified evidence:

- `main` is clean and remote `HEAD` equals local `HEAD`;
- repository, architecture, network, dependency-pin, canonical-source, lint, Direct Mode, invariant, frontend, and build gates are green on Ubuntu and Windows;
- every meaningful contract and frontend mutant is either killed with a specific regression or explicitly proven equivalent;
- the commitment chain covers mission terms, contribution records, terminal source and lineage, resolution context, economic categorical results, and settlement;
- source-unavailable paths move no GEN and remain retryable until deterministic expiry/refund;
- the predeployment manifest records exact source/tree hashes, toolchain, ABI, test and mutation evidence, CI run IDs, and known limitations;
- exact Studionet deployment is finalized at `0x8966Da098d86D0E6D2769e59912C6EC5D951c74B` with transaction `0xbc96f3d51a194d4d3fa876eafed2a31912d3e47441963e991e671d9f18796a72`;
- Vercel production deployment is ready at https://mosaic-five-rust.vercel.app and points to that address;
- route smoke verification passed for `/`, `/missions`, `/docs` and `/launch`.

The complete real-wallet positive lifecycle and at least three adverse live classes are still required before calling the release fully verified. They require actual wallet/GitHub actions and must not be inferred from unit tests or deployment success.

The final hostile review must recheck mutable GitHub metadata, stable account identity, target force-push, reverts and supersession, unregistered decisive work, malformed evidence, validator disagreement, rounding, replay, wrong wallet/network, refresh recovery, and withdrawal safety.
