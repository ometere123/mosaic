# Final Release Audit

## Historical baseline

- Main commit `9cf19e3fc81d19dccc919c699b9ad16f7d830979` passed CI run `37100949762` on Ubuntu and Windows, including Direct Mode, contract mutation, frontend mutation, lint, typecheck, tests and build.
- Frozen contract source, Git blob and retrieved Studionet source all match SHA-256 `96ceea3e7d71fd2c0e36461c4b4ca0d425f10fa9c013ff09ad895b8610acf8f5`.
- The deployment at `0x05fd77aB1f916e36C718E6b55CBdf5F726216d4a` finalized with transaction `0x7def22417f48e35caff481815a7665d0dce26841bd025f5035a707da1791e167` but is **SUPERSEDED** after live withdrawal delivery exposed an EOA transfer-interface defect.
- Existing Vercel project `mosaic` is READY at https://themosaic.vercel.app with deployment `dpl_DBCDnShzbLd8BD1YVqZSjoh3Pja9` and root directory `frontend`, built from `9cf19e3fc81d19dccc919c699b9ad16f7d830979`.
- Production routes `/`, `/missions`, `/docs` and `/profile` returned rendered HTML through Vercel’s protected curl verification.
- The frontend now distinguishes the product homepage, mission explorer, documentation and wallet-centred profile; `/earnings` redirects to `/profile`.

## Superseded deployment finding

Mission `0` uses age-qualified external repository `ometere123/backfill`, a genuinely causal merged PR, a real proof comment and a finalized successful seal. Its real post-close resolution produced terminal `ACHIEVED`, claimant `ACHIEVED`, role `CORE`, and a conserved `1 GEN` contributor allocation. Mission `1` independently produced terminal and claimant `NOT_ACHIEVED`, an empty role map, `0 GEN` contributor release, and a conserved `3 GEN` sponsor residual. Those settlements are valid evidence; payout delivery is not. The contributor child transfer `0xd544e8229bbfe2bd44e1c27c3b884368c57cacedcb11a14be86946ff8bba30d2` and sponsor child transfer `0x46a710098c11b9c17ec0e0b80cb7e2ed0b69be760cbf98ef86963c9458d8a5d9` both finalized `ERROR` with `contract_not_found` after their parent withdrawals zeroed contract balances. A replacement deployment and fresh withdrawal proof are required.

Three distinct live fail-closed behaviours have been observed: duplicate PR execution rejection, below-minimum funding rejection before wallet submission, and a real wallet rejection with no state transition. Final completion still requires the remaining browser/wallet QA matrix, evidence reconciliation to the final commit and CI run, and a fresh hostile audit.

## Final canonical release audit

- Repository source `contract/contracts/mosaic.py` and retrieved source from `0xE8CB904b47e97C0a09bF679525C5BF8b722fF1bD` match SHA-256 `1563468f5616bf91f910282bf939d254ae1ff6e72052108dee3ee99a7be7cbde` under the documented LF canonicalization.
- The production frontend at https://themosaic.vercel.app is bound to that canonical contract on Studionet `61999`; the superseded addresses remain historical only.
- The canonical external mission is Backfill mission `0`, baseline `987fca62be4eaba1741195910e4d2079402e419d`, PR #4, merge `73ad12c5534d713c8fa01efc8c3bdce2f06f2e1c`, and proof comment `5970233201` by the matching stable GitHub account.
- The seal and resolution both finalized with `MAJORITY_AGREE` and successful leader execution. The settlement was terminal `ACHIEVED`, claimant `ACHIEVED`, and the complete registered role map assigned the sole claimant `CORE`.
- Accounting was verified as `1000000000000000000 = 1000000000000000000 + 0` wei. The parent withdrawal finalized successfully, zeroed `get_balance`, and emitted a finalized EOA transfer to the claimant for 1 GEN with `value_credited: true`.
- The duplicate same-mission PR attempt finalized with `pr_already_sealed`; it did not add a record or move GEN. The deployed frontend distinguishes accepted, finalized-unverified, success and failure states, and durable UI state is reread from contract state.
- The architecture retains no application backend, database authority, server signer, central payout selector or privileged GitHub proxy. Public GitHub and public RPC failures remain bounded, retryable dependencies; uncertainty moves no GEN.

## Audit close-out

The final documentation and release-evidence reconciliation was committed and CI run `37135654460` completed green. Canonical contract/source correspondence remains verified; the canonical live lifecycle, including the credited EOA payout, is complete; and the Vercel/Git status is green.

At this release checkpoint, no remaining material blocker was identified by the final hostile audit. `RELEASE_MANIFEST.json` contains the exact live transaction references used by this audit.
