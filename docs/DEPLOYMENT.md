# Deployment Evidence

## Final canonical release deployment

- Network: GenLayer Studionet, chain `61999` (`0xF22F`)
- RPC: https://studio.genlayer.com/api
- Explorer: https://explorer-studio.genlayer.com
- Repository-local CLI: `0.39.1`
- Frozen source commit: `4c969d9d0ac1bd147298f298e7fe6ed70121e7c9`
- Frozen source tree: `93003cb2fd069302cdce0af5d10100376d20d235`
- Contract source: `contract/contracts/mosaic.py`
- Canonical source SHA-256: `96ceea3e7d71fd2c0e36461c4b4ca0d425f10fa9c013ff09ad895b8610acf8f5`
- Superseded contract address: `0x05fd77aB1f916e36C718E6b55CBdf5F726216d4a`
- Deployment transaction: [`0x7def22417f48e35caff481815a7665d0dce26841bd025f5035a707da1791e167`](https://explorer-studio.genlayer.com/tx/0x7def22417f48e35caff481815a7665d0dce26841bd025f5035a707da1791e167)
- Receipt: `FINALIZED`, consensus `MAJORITY_AGREE`, leader execution `SUCCESS`
- Created: `2026-10-03T01:25:58.09712+01:00`
- Retrieved deployed source, canonicalized to LF, matches the frozen repository bytes and exact SHA-256.

## Production frontend

- Vercel project: `mosaic` (`prj_YuwUxgdIrmVoKwkl9LaGQv4i2ftX`)
- Root directory: `frontend`
- Deployment: `dpl_DBCDnShzbLd8BD1YVqZSjoh3Pja9`
- Production URL: [themosaic.vercel.app](https://themosaic.vercel.app)
- Production environment points to the canonical contract address above.
- Deployment status: `READY`; build completed with Next.js `16.3.8`.
- Release commit: `9cf19e3fc81d19dccc919c699b9ad16f7d830979`.

## Historical addresses

- `0x70361A9e742A1386B3EEe21ecA9bC17A1a9CB32b`: **OBSOLETE** pre-hardening deployment.
- `0x8966Da098d86D0E6D2769e59912C6EC5D951c74B`: **SUPERSEDED** first hardened deployment; not configured by the final frontend.
- `0xCd019C05232F6b67BB9d75FEB8D96f48AAe57921`: **SUPERSEDED** prior release-candidate deployment; a stale already-open browser bundle submitted one launch there before the final browser was hard-reloaded.

Canonical external-repository mission `0` settled `ACHIEVED`/`ACHIEVED` after final consensus. Economic-negative mission `1` settled `NOT_ACHIEVED`/`NOT_ACHIEVED`. The deployment is now **SUPERSEDED**: both parent `withdraw` calls finalized and zeroed their pull balances, but the spawned value transfers treated the EOA recipient as a GenLayer contract and finalized with `contract_not_found`. The narrow EVM-recipient transfer fix must be frozen, redeployed, and live-verified before this release can be canonical.
