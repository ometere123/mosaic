# Release validation fixture

This bounded fixture records the production-release validation target for MOSAIC.
It is documentation-only and does not change the contract, frontend authority,
network configuration, or payout policy.

## Validation target

- Repository: `ometere123/mosaic`
- Target ref: `main`
- Baseline: `12ef178f0c2bced6e43f710c344b763cbaaf7768`
- Objective: document the verified production lifecycle for the deployed
  Studionet release while keeping evidence within MOSAIC's bounded limits.

## Acceptance dimensions

1. The release record identifies the exact frozen contract, network, and
   deployed-source digest.
2. The release record distinguishes terminal objective status from claimant
   outcome and records only authoritative transaction results.

## Evidence boundary

This fixture is intentionally small: two acceptance dimensions, no generated
repository crawl, and no claim that a lifecycle step occurred without a real
transaction or public GitHub evidence record.
