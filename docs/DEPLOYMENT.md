# Deployment Evidence

This file contains real deployment evidence for the hardened release candidate.

## Obsolete pre-hardening deployment

Before the maximum-hardening phase began, commit `2fc14c4694e84282058de0affdd91ff61296ff01` was deployed to Studionet. Subsequent source changes make this address obsolete; it must not be configured as the release candidate or described as live validation.

- Contract address: `0x70361A9e742A1386B3EEe21ecA9bC17A1a9CB32b`
- Deployment transaction: `0xc2fac64b02fd488e0fa902283a00967a84fa3396ac8abb568664a13e08972db9`
- Deployment status observed: `FINALIZED`
- Consensus result observed: `MAJORITY_AGREE`
- Exact deployed source SHA-256: `0ca0b7ab08c7f62961cf3cae1690e4a76e34a4b96f7c9bdf64f6480f6bed9fb8`
- Live frontend: not deployed

## Hardened release candidate

- Network: Studionet
- Chain ID: 61999
- RPC: https://studio.genlayer.com/api
- Repository-local CLI: 0.39.1
- Contract source: `contract/contracts/mosaic.py`
- Release-candidate contract address: `0x8966Da098d86D0E6D2769e59912C6EC5D951c74B`
- Release-candidate deployment transaction: `0xbc96f3d51a194d4d3fa876eafed2a31912d3e47441963e991e671d9f18796a72`
- Explorer URL: [Studionet contract](https://explorer-studio.genlayer.com/address/0x8966Da098d86D0E6D2769e59912C6EC5D951c74B)
- Deployment source SHA-256: `96ceea3e7d71fd2c0e36461c4b4ca0d425f10fa9c013ff09ad895b8610acf8f5`
- Git commit containing exact deployed source: `4c969d9d0ac1bd147298f298e7fe6ed70121e7c9`
- Final receipt: `FINALIZED`, consensus `MAJORITY_AGREE`, leader execution `SUCCESS`
- Vercel project: `mosaic` (`prj_YuwUxgdIrmVoKwkl9LaGQv4i2ftX`)
- Vercel deployment: `dpl_8dW5b6rubUs862jZykGBYwJBtBqm`
- Live frontend URL: [mosaic-five-rust.vercel.app](https://mosaic-five-rust.vercel.app)

The CLI source retrieval matched the frozen source after canonical LF normalization and reproduced the exact SHA-256. If the contract source changes materially afterward, this deployment becomes obsolete and must not remain configured.
