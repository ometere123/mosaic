# V4 recovery record

## Scope

V4/V4.3 added typed legacy import, frozen-evidence context, and component
adjudication. Those changes are preserved as historical work; they are not
treated as proof that V4 was a complete canonical release.

## What V4 completed

- typed V2 reads and an unfunded legacy import path;
- frozen-evidence context for component prompts;
- criterion and role adjudication entry points;
- deterministic finalization and beneficiary-safe withdrawal support;
- CI, mutation, and public-evidence checks for the implemented code.

## What remained incomplete

- release documentation and deployed-address records were not fully reconciled;
- the frontend still exposed the monolithic resolver as the primary lifecycle;
- the monolithic and componentized adjudication paths could both settle;
- validator agreement did not cover the complete normalized material evidence;
- historical V1/V2 migration authority remained embedded in the canonical
  contract;
- V4 did not provide a hard close deadline and pre-deadline terminal checkpoint
  that insulated settlement from post-close branch changes.

The V4.3 Mission 0 component run also stopped at criterion 2 with
`MAJORITY_DISAGREE`; it remains historical, unfunded, and unsettled.

## V5 remediation

V5 addresses these gaps as one protocol milestone: one canonical componentized
adjudication path, one frozen verification authority, hard close/checkpoint
semantics, typed machine-verification profiles, complete material-evidence
consensus, deterministic causal settlement, and a reconciled release record.

No V4 deployment is retroactively rewritten or presented as V5 evidence.
