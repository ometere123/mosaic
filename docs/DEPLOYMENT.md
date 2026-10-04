# Deployment Evidence

## Final canonical release deployment

- Network: GenLayer Studionet, chain `61999` (`0xF22F`)
- RPC: https://studio.genlayer.com/api
- Explorer: https://explorer-studio.genlayer.com
- Repository-local CLI: `0.39.1`
- Corrected source commit: `cab3e477a86a76b8616532ba84553ea5b5302043`
- Corrected source tree: `ec723272b6c3d3581a6da8b4879f8b2076a948f7`
- Contract source: `contract/contracts/mosaic.py`
- Canonical source SHA-256: `f6e5a496b0e56d7f1082fd9579fe1ca7e9ab55c7759c28e8c365d70c04c0e831`
- Final hardened release candidate: `0x9F8d9eA8366948A91ADf34cBf5250a54f85f1eD5`
- Deployment transaction: `0x6df6965d208fd126dfabd8f978eaa21b72d4812e02813ef3933722bde580221f` (`FINALIZED`, `SUCCESS`, `MAJORITY_AGREE`)
- Deployment transaction: [`0xffb52a0012ce2d56108ca2ba8ac64279aff432acfd9eeed2663f016b0f02863a`](https://explorer-studio.genlayer.com/tx/0xffb52a0012ce2d56108ca2ba8ac64279aff432acfd9eeed2663f016b0f02863a)
- Receipt: `FINALIZED`, consensus `MAJORITY_AGREE`, leader execution `SUCCESS`
- Created on 2026-10-03 (Studionet receipt timestamp `1791025599`).
- Retrieved deployed source, canonicalized to LF, matches the frozen repository bytes and exact SHA-256.

## Production frontend

- Vercel project: `mosaic` (`prj_YuwUxgdIrmVoKwkl9LaGQv4i2ftX`)
- Root directory: `frontend`
- Deployment: `dpl_6g2QcTCQCAVV9dP3CzcGVABHccC7`
- Production URL: [themosaic.vercel.app](https://themosaic.vercel.app)
- Production environment points to the canonical contract address above.
- Deployment status: `READY`; build completed with Next.js `16.3.8`.
- Release commit: `5328ea160a5a32e677d06056fbe88f7fc2f5fb5d`.

## Historical addresses

- `0x70361A9e742A1386B3EEe21ecA9bC17A1a9CB32b`: **OBSOLETE** pre-hardening deployment.
- `0x8966Da098d86D0E6D2769e59912C6EC5D951c74B`: **SUPERSEDED** first hardened deployment; not configured by the current frontend.
- `0x05fd77aB1f916e36C718E6b55CBdf5F726216d4a`: **SUPERSEDED** after live withdrawal delivery exposed an EOA transfer-interface defect.
- `0xCd019C05232F6b67BB9d75FEB8D96f48AAe57921`: **SUPERSEDED** prior release-candidate deployment; a stale already-open browser bundle submitted one launch there before the final browser was hard-reloaded.

The canonical deployment corrected the earlier EOA-transfer defect. Mission `0` against `ometere123/backfill` finalized with an `ACHIEVED` terminal status and claimant outcome; its 1 GEN allocation was withdrawn through production. The parent withdrawal finalized successfully and emitted a final, value-credited 1 GEN EOA transfer to the contributor wallet. Full references are in `LIVE_VALIDATION.md` and `RELEASE_MANIFEST.json`.
