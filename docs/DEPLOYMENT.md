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
- Contract address: `0xCd019C05232F6b67BB9d75FEB8D96f48AAe57921`
- Deployment transaction: [`0x366fb0e0c34daa1b743af8f51de94e1b727b28ef84de8d4157255b411274fcd8`](https://explorer-studio.genlayer.com/tx/0x366fb0e0c34daa1b743af8f51de94e1b727b28ef84de8d4157255b411274fcd8)
- Receipt: `FINALIZED`, consensus `MAJORITY_AGREE`, leader execution `SUCCESS`
- Created: `2026-10-02T18:00:08.882654+00:00`
- Retrieved deployed source, canonicalized to LF, matches the frozen repository bytes and exact SHA-256.

## Production frontend

- Vercel project: `mosaic` (`prj_YuwUxgdIrmVoKwkl9LaGQv4i2ftX`)
- Root directory: `frontend`
- Deployment: `dpl_6yRjJnueWDQdf5W5F83vQeAsRVDc`
- Production URL: [themosaic.vercel.app](https://themosaic.vercel.app)
- Production environment points to the canonical contract address above.
- Deployment status: `READY`; build completed with Next.js `16.3.8`.
- Release commit: `4e7edca45e44f7a0160b526e7f0d87b7b3a65423`.

## Historical addresses

- `0x70361A9e742A1386B3EEe21ecA9bC17A1a9CB32b`: **OBSOLETE** pre-hardening deployment.
- `0x8966Da098d86D0E6D2769e59912C6EC5D951c74B`: **SUPERSEDED** first hardened deployment; not configured by the final frontend.

The canonical external-repository economic lifecycle is still pending real GitHub and wallet actions. No lifecycle result is inferred from deployment success.
