# Deployment Evidence

## Final canonical release deployment

- Network: GenLayer Studionet, chain `61999` (`0xF22F`)
- RPC: https://studio.genlayer.com/api
- Explorer: https://explorer-studio.genlayer.com
- Repository-local CLI: `0.39.1`
- Frozen source commit: `b2b5a85000401261e207e4d84e90f08d77ca0ab7`
- Frozen source tree: `8fce82c9b60d2528323984514f02c9ea723e3fb0`
- Contract source: `contract/contracts/mosaic.py`
- Canonical source SHA-256: `23d1d4c38f5e30b2f4b60966c65f0aca9f3dcfa7ae528ef03958f30650c1b32a`
- Final V5 release candidate: `0x30BF3a932690e557d31db74521F8BdDE1483898a`
- Deployment transaction: [`0xbe17206cd6fea236dd92ca59be687dd2eccd50cd8fd0785e6ff51039fa85a9be`](https://explorer-studio.genlayer.com/tx/0xbe17206cd6fea236dd92ca59be687dd2eccd50cd8fd0785e6ff51039fa85a9be) (`FINALIZED`, `SUCCESS`, `MAJORITY_AGREE`)
- Receipt: `FINALIZED`, consensus `MAJORITY_AGREE`, leader execution `SUCCESS`
- Created on 2026-10-03 (Studionet receipt timestamp `1791025599`).
- Retrieved deployed source, canonicalized to LF, matches the frozen repository bytes and exact SHA-256.

## Production frontend

- Vercel project: `mosaic` (`prj_YuwUxgdIrmVoKwkl9LaGQv4i2ftX`)
- Root directory: `frontend`
- Deployment: `dpl_E4D3LcVYDSccPotNzV2pemy2wWyH`
- Production URL: [themosaic.vercel.app](https://themosaic.vercel.app)
- Production environment will point to the canonical contract address above after the next production redeployment.
- Deployment status: `READY`; build completed with Next.js `16.3.8`.
- Release commit: `30e4137471b72e84aa81f82dd55b8aedd8733dcf`.

## Historical addresses

- `0x70361A9e742A1386B3EEe21ecA9bC17A1a9CB32b`: **OBSOLETE** pre-hardening deployment.
- `0x8966Da098d86D0E6D2769e59912C6EC5D951c74B`: **SUPERSEDED** first hardened deployment; not configured by the current frontend.
- `0x05fd77aB1f916e36C718E6b55CBdf5F726216d4a`: **SUPERSEDED** after live withdrawal delivery exposed an EOA transfer-interface defect.
- `0xCd019C05232F6b67BB9d75FEB8D96f48AAe57921`: **SUPERSEDED** prior release-candidate deployment; a stale already-open browser bundle submitted one launch there before the final browser was hard-reloaded.

The V5 deployment is source-verified and ready for a fresh gated lifecycle. No mission has been created or funded on V5 yet. Earlier Backfill mission evidence and payout proof belong to superseded deployments and are historical only. Full deployment and lifecycle provenance is in `LIVE_VALIDATION.md` and `RELEASE_MANIFEST.json`.

The deployment above is the fresh hardened release candidate. The earlier `0x418180Bf909C50c8710C4B378E9113264d484eDF` and `0x9F8d9eA8366948A91ADf34cBf5250a54f85f1eD5` deployments are **SUPERSEDED** and their lifecycle evidence is historical only; the new canonical lifecycle remains gated pending the required manual multi-contributor plan.
