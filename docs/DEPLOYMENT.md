# Deployment Evidence

## Final canonical release deployment

- Network: GenLayer Studionet, chain `61999` (`0xF22F`)
- RPC: https://studio.genlayer.com/api
- Explorer: https://explorer-studio.genlayer.com
- Repository-local CLI: `0.39.1`
- Corrected source commit: `107ebf5a38f441cec6d6cf0e1250d116f3e72f96`
- Corrected source tree: `62ba12f9fdb51b8aa87d65ce2fa0c34cbe71b08f`
- Contract source: `contract/contracts/mosaic.py`
- Canonical source SHA-256: `92a8a514cd3ac556cb033fb2d9cd8dd4164a6c8cec37291e0873de79a85d5b58`
- Final hardened release candidate: `0x418180Bf909C50c8710C4B378E9113264d484eDF`
- Deployment transaction: [`0x785a22183aef5897b4975806f899006bfdb05bd058664b2013fed4304462476f`](https://explorer-studio.genlayer.com/tx/0x785a22183aef5897b4975806f899006bfdb05bd058664b2013fed4304462476f) (`FINALIZED`, `SUCCESS`, `MAJORITY_AGREE`)
- Receipt: `FINALIZED`, consensus `MAJORITY_AGREE`, leader execution `SUCCESS`
- Created on 2026-10-03 (Studionet receipt timestamp `1791025599`).
- Retrieved deployed source, canonicalized to LF, matches the frozen repository bytes and exact SHA-256.

## Production frontend

- Vercel project: `mosaic` (`prj_YuwUxgdIrmVoKwkl9LaGQv4i2ftX`)
- Root directory: `frontend`
- Deployment: `dpl_DnEq3unxhtzshQz7ToBSry5H8LG3`
- Production URL: [themosaic.vercel.app](https://themosaic.vercel.app)
- Production environment points to the canonical contract address above.
- Deployment status: `READY`; build completed with Next.js `16.3.8`.
- Release commit: `51000d7`.

## Historical addresses

- `0x70361A9e742A1386B3EEe21ecA9bC17A1a9CB32b`: **OBSOLETE** pre-hardening deployment.
- `0x8966Da098d86D0E6D2769e59912C6EC5D951c74B`: **SUPERSEDED** first hardened deployment; not configured by the current frontend.
- `0x05fd77aB1f916e36C718E6b55CBdf5F726216d4a`: **SUPERSEDED** after live withdrawal delivery exposed an EOA transfer-interface defect.
- `0xCd019C05232F6b67BB9d75FEB8D96f48AAe57921`: **SUPERSEDED** prior release-candidate deployment; a stale already-open browser bundle submitted one launch there before the final browser was hard-reloaded.

The canonical deployment corrected the earlier EOA-transfer defect. Mission `0` against `ometere123/backfill` finalized with an `ACHIEVED` terminal status and claimant outcome; its 1 GEN allocation was withdrawn through production. The parent withdrawal finalized successfully and emitted a final, value-credited 1 GEN EOA transfer to the contributor wallet. Full references are in `LIVE_VALIDATION.md` and `RELEASE_MANIFEST.json`.

The deployment above is the corrected hardened release candidate. The earlier `0x9F8d9eA8366948A91ADf34cBf5250a54f85f1eD5` deployment is **SUPERSEDED** and its lifecycle evidence is historical only; the new canonical lifecycle remains gated pending the required manual multi-contributor plan.
