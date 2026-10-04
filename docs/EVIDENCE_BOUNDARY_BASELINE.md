# Evidence-boundary upgrade baseline

This document records the starting implementation, not completion of the upgrade.

## Immutable starting anchors

- Source/repository commit: `1fc5988bd017c14c3936953bf2e03f68874abcba`.
- Historical baseline contract SHA-256: `1563468f5616bf91f910282bf939d254ae1ff6e72052108dee3ee99a7be7cbde`.
- Starting main CI: GitHub Actions run `37137106670`, successful.
- Historical deployment: `0xE8CB904b47e97C0a09bF679525C5BF8b722fF1bD`, Studionet 61999. The upgraded source is now deployed separately at `0x9F8d9eA8366948A91ADf34cBf5250a54f85f1eD5` and is covered by the release manifest.
- Development branch: `hardening/reviewer-evidence-boundary`.

## Reproduced baseline

Direct Mode: 129 passed under WSL using the pinned environment and the authoritative Windows checkout. Native Windows execution failed before contract evaluation in the test SDK's temporary-file unlink operation (`WinError 32`); no contract workaround was introduced.

Frontend: 137 passed. An initial SDK-import test exceeded its five-second timeout; the unchanged complete suite passed on rerun. Lint, explicit TypeScript checking and production build passed. CLI, network, architecture, repository integrity, comparator and predeployment-manifest guards passed.

Both complete mutation controls and runners passed: contract 82 unique / 82 killed / 0 surviving / 0 invalid syntax; frontend 35 unique / 35 killed / 0 surviving / 0 invalid. Baseline checkpoint `5691aacceadf858ef4d7793a010e96d54330994b` passed all four CI jobs in run `37224221395`, including GenVM lint, Ubuntu verification, Windows portable verification and both mutation jobs. Local SDK validation initially lacked the pinned runner archive; downloading v0.2.12 restored that prerequisite without changing the contract dependency header.

## Existing evidence flow

The existing state machine stores OPEN until settlement or unresolved expiry, but funding and contribution eligibility end at `close_at`. `resolve_mission` subsequently fetches the target branch through `_fetch_terminal_state`. Consequently the first successful post-close resolution chooses the economically decisive target snapshot. No earlier immutable terminal-freeze phase exists.

Exact baseline identity, PR/proof facts, terminal source, immutable PR revalidation and merge-to-terminal lineage use `strict_eq`. Contribution capsules use `prompt_comparative`. The final custom `run_nondet_unsafe` independently compares terminal status, claimant outcome and the full role map; deterministic code allocates funds. Rationale is non-economic.

Resolution fetches two terminal-source reads and up to four reads for each of twelve sealed records (immutable PR revalidation plus lineage): fifty public GitHub reads in the documented maximum case. Its terminal evidence is bounded source/patch information, not proof of test execution, runtime measurements or deployment behavior. Existing final judgment validation checks schemas and categorical compatibility, but does not require criterion-level references to committed evidence objects.

## Upgrade obligations

1. Make successful permissionless terminal freeze the atomic economic close. Use `freeze_not_before` for scheduled eligibility and `closed_at` for actual closure; failed acquisition must not partially close eligibility.
2. Persist all decisive terminal, verification and claimant-lineage evidence at freeze. Resolution must consume that immutable context without discovering a replacement target or check result.
3. Freeze typed SOURCE and named public GITHUB_CHECK criteria at creation. Verify public endpoint accessibility, check provenance, exact SHA binding, bounded completeness and ambiguity handling before relying on them.
4. Construct a deterministic bounded evidence-object namespace. Validate criterion completeness, reference membership, claimant ownership and machine-result constraints before deriving top-level outcomes.
5. Keep independent semantic consensus essential for source satisfaction and causal attribution. Evidence membership constrains judgment; it does not itself prove a semantic interpretation correct. Instruct judgments to consider committed counterevidence as well as support.
6. Complement controlled Direct Mode with pinned real-public-evidence integration, mutation/invariant proof and an updated freeze/check/criterion frontend.

The existing deployment remains unchanged during development. Fresh deployment requires a green canonical-source freeze in main history. A new live lifecycle additionally requires the user's explicit multi-contributor plan after deployment; it is not authorized merely by reaching that checkpoint.
