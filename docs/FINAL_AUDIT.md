# Final Release Audit

## Verified now

- Main commit `9cf19e3fc81d19dccc919c699b9ad16f7d830979` passed CI run `37100949762` on Ubuntu and Windows, including Direct Mode, contract mutation, frontend mutation, lint, typecheck, tests and build.
- Frozen contract source, Git blob and retrieved Studionet source all match SHA-256 `96ceea3e7d71fd2c0e36461c4b4ca0d425f10fa9c013ff09ad895b8610acf8f5`.
- The deployment at `0x05fd77aB1f916e36C718E6b55CBdf5F726216d4a` finalized with transaction `0x7def22417f48e35caff481815a7665d0dce26841bd025f5035a707da1791e167` but is **SUPERSEDED** after live withdrawal delivery exposed an EOA transfer-interface defect.
- Existing Vercel project `mosaic` is READY at https://themosaic.vercel.app with deployment `dpl_DBCDnShzbLd8BD1YVqZSjoh3Pja9` and root directory `frontend`, built from `9cf19e3fc81d19dccc919c699b9ad16f7d830979`.
- Production routes `/`, `/missions`, `/docs` and `/profile` returned rendered HTML through Vercel’s protected curl verification.
- The frontend now distinguishes the product homepage, mission explorer, documentation and wallet-centred profile; `/earnings` redirects to `/profile`.

## Canonical live proof status

Mission `0` uses age-qualified external repository `ometere123/backfill`, a genuinely causal merged PR, a real proof comment and a finalized successful seal. Its real post-close resolution produced terminal `ACHIEVED`, claimant `ACHIEVED`, role `CORE`, and a conserved `1 GEN` contributor allocation. Mission `1` independently produced terminal and claimant `NOT_ACHIEVED`, an empty role map, `0 GEN` contributor release, and a conserved `3 GEN` sponsor residual. Those settlements are valid evidence; payout delivery is not. The contributor child transfer `0xd544e8229bbfe2bd44e1c27c3b884368c57cacedcb11a14be86946ff8bba30d2` and sponsor child transfer `0x46a710098c11b9c17ec0e0b80cb7e2ed0b69be760cbf98ef86963c9458d8a5d9` both finalized `ERROR` with `contract_not_found` after their parent withdrawals zeroed contract balances. A replacement deployment and fresh withdrawal proof are required.

Three distinct live fail-closed behaviours have been observed: duplicate PR execution rejection, below-minimum funding rejection before wallet submission, and a real wallet rejection with no state transition. Final completion still requires the remaining browser/wallet QA matrix, evidence reconciliation to the final commit and CI run, and a fresh hostile audit.

The final hostile audit must be rerun after that evidence exists and must verify source correspondence, exact contract configuration, wallet truth, causal lineage, conservation and truthful documentation.
