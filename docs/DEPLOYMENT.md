# Deployment Evidence

## Final canonical release deployment

- Network: GenLayer Studionet, chain `61999` (`0xF22F`)
- RPC: https://studio.genlayer.com/api
- Explorer: https://explorer-studio.genlayer.com
- Repository-local CLI: `0.39.1`
- Frozen source commit: `63f8f920348f0f0831b68e777e634a8f4ae38a53`
- Frozen source tree: `05130a97b0ab4f7f78d4c5780bce27e0b37ac238`
- Contract source: `contract/contracts/mosaic.py`
- Canonical source SHA-256: `2d62cc8b9de7bc4a94bd4bb79081d9013eae338afbc347a5ce132b495dee8537`
- Final V5 release candidate: `0xFc94b79754bFb57Ff72fD5Ce86c55050Aa615E46`
- Deployment transaction: [`0xd5e7868bc37d981f39e873166f0c97fd0cdc5167fe507b2f44d371c33fb68af2`](https://explorer-studio.genlayer.com/tx/0xd5e7868bc37d981f39e873166f0c97fd0cdc5167fe507b2f44d371c33fb68af2) (`FINALIZED`, `SUCCESS`, `MAJORITY_AGREE`)
- Receipt: `FINALIZED`, consensus `MAJORITY_AGREE`, leader execution `SUCCESS`
- Created on 2026-10-03 (Studionet receipt timestamp `1791025599`).
- Retrieved deployed source, canonicalized to LF, matches the frozen repository bytes and exact SHA-256.

## Production frontend

- Vercel project: `mosaic` (`prj_YuwUxgdIrmVoKwkl9LaGQv4i2ftX`)
- Root directory: `frontend`
- Deployment: `dpl_E4D3LcVYDSccPotNzV2pemy2wWyH`
- Production URL: [themosaic.vercel.app](https://themosaic.vercel.app)
- Production environment points to the canonical contract address above.
- Deployment status: `READY`; build completed with Next.js `16.3.8`.
- Release commit: `30e4137471b72e84aa81f82dd55b8aedd8733dcf`.

## Historical addresses

- `0x70361A9e742A1386B3EEe21ecA9bC17A1a9CB32b`: **OBSOLETE** pre-hardening deployment.
- `0x8966Da098d86D0E6D2769e59912C6EC5D951c74B`: **SUPERSEDED** first hardened deployment; not configured by the current frontend.
- `0x05fd77aB1f916e36C718E6b55CBdf5F726216d4a`: **SUPERSEDED** after live withdrawal delivery exposed an EOA transfer-interface defect.
- `0xCd019C05232F6b67BB9d75FEB8D96f48AAe57921`: **SUPERSEDED** prior release-candidate deployment; a stale already-open browser bundle submitted one launch there before the final browser was hard-reloaded.

The V5 deployment is source-verified and ready for a fresh gated lifecycle. No mission has been created or funded on V5 yet. Earlier Backfill mission evidence and payout proof belong to superseded deployments and are historical only. Full deployment and lifecycle provenance is in `LIVE_VALIDATION.md` and `RELEASE_MANIFEST.json`.

The deployment above is the fresh hardened release candidate. The earlier `0x418180Bf909C50c8710C4B378E9113264d484eDF` and `0x9F8d9eA8366948A91ADf34cBf5250a54f85f1eD5` deployments are **SUPERSEDED** and their lifecycle evidence is historical only; the new canonical lifecycle remains gated pending the required manual multi-contributor plan.
