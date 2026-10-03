# Final Release Audit

## Verified now

- Main commit `9cf19e3fc81d19dccc919c699b9ad16f7d830979` passed CI run `37100949762` on Ubuntu and Windows, including Direct Mode, contract mutation, frontend mutation, lint, typecheck, tests and build.
- Frozen contract source, Git blob and retrieved Studionet source all match SHA-256 `96ceea3e7d71fd2c0e36461c4b4ca0d425f10fa9c013ff09ad895b8610acf8f5`.
- Final contract deployment is finalized at `0x05fd77aB1f916e36C718E6b55CBdf5F726216d4a` with transaction `0x7def22417f48e35caff481815a7665d0dce26841bd025f5035a707da1791e167`.
- Existing Vercel project `mosaic` is READY at https://themosaic.vercel.app with deployment `dpl_DBCDnShzbLd8BD1YVqZSjoh3Pja9` and root directory `frontend`, built from `9cf19e3fc81d19dccc919c699b9ad16f7d830979`.
- Production routes `/`, `/missions`, `/docs` and `/profile` returned rendered HTML through Vercel’s protected curl verification.
- The frontend now distinguishes the product homepage, mission explorer, documentation and wallet-centred profile; `/earnings` redirects to `/profile`.

## Canonical live proof status

Mission `0` uses age-qualified external repository `ometere123/backfill`, a genuinely causal merged PR, a real proof comment and a finalized successful seal. Three distinct live fail-closed behaviours have been observed: duplicate PR execution rejection, below-minimum funding rejection before wallet submission, and a real wallet rejection with no state transition. Settlement, allocation and withdrawal remain deliberately unclaimed until the mission's legitimate close and consensus resolution.

The final hostile audit must be rerun after that evidence exists and must verify source correspondence, exact contract configuration, wallet truth, causal lineage, conservation and truthful documentation.
