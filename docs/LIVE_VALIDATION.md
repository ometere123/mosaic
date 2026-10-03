# Live Validation

## Final canonical release surfaces

- Contract: `0xE8CB904b47e97C0a09bF679525C5BF8b722fF1bD`
- Deployment transaction: `0xffb52a0012ce2d56108ca2ba8ac64279aff432acfd9eeed2663f016b0f02863a` (`FINALIZED`, `MAJORITY_AGREE`, leader execution `SUCCESS`)
- Frontend: https://themosaic.vercel.app
- Network: Studionet `61999` / `0xF22F`

The earlier MOSAIC-self-validation mission and the old deployment evidence are historical/superseded only. They are not the canonical live proof.

## Canonical external-repository lifecycle

- External repository: `ometere123/backfill`, created `2026-09-06T17:05:17Z`; target ref `main`.
- Mission `0`, baseline `987fca62be4eaba1741195910e4d2079402e419d`, funded with `1 GEN`; launch tx `0xf4624fd2427590d0735fa61417d0828545e853e0c0e46bd09de117a7c2ec5ab7` finalized with successful execution.
- Causal PR [#4](https://github.com/ometere123/backfill/pull/4) adds announced EIP-6963 provider selection before the existing EIP-1193 fallback. It merged as `73ad12c5534d713c8fa01efc8c3bdce2f06f2e1c` on 2026-10-03.
- Proof comment `5970233201` contains the exact mission marker and was posted by stable GitHub account ID `45469370`, the same account that authored the PR.
- Seal tx `0x0d6f55284dc92e0f470d6982a42ec4c3f8a5ce192d14fd6eaae6ff5d3daf36b6` finalized with `MAJORITY_AGREE` and successful leader execution. Contract reread shows exactly one sealed contribution.
- Duplicate-seal safety tx `0x32c7d8fa3e3650887dcf86b8d0e01098065d87628d95ccfc286b1556ae19372c` finalized with `MAJORITY_AGREE` and execution error `pr_already_sealed`; no second contribution or GEN movement occurred.
- Resolution tx `0x53f492e446ff54ba3a2dda8e6ff7e56dbc3d7bf83116f1498d4c229ce8a13854` finalized with `MAJORITY_AGREE` and leader execution `SUCCESS`.
- Terminal tip `73ad12c5534d713c8fa01efc8c3bdce2f06f2e1c`; terminal objective status `ACHIEVED`; claimant outcome `ACHIEVED`; complete role map `{0xfcef676044658b5402f590dabe9e04a0f640522f: CORE}`.
- Accounting: funded `1000000000000000000` wei; released `1000000000000000000` wei; sponsor residual `0` wei. Conservation is exact.
- Terminal source digest `c0a161e45120ed79a1e86aaaeb6b32538244efe5d8d4e7467e7a67c26ac2d0e5`; ordered contribution root `808038022304a131993e826c8dae4c68fff4ce2b1ad747c62b3aa2f735cc147f`; lineage root `19f6028a2c1a4f72cbe9a7b29fd5b2d28c4103871237193a4339152f719f7c2b`; resolution evidence root `695947241bd0c99d73a5073983f4dce8703e4e7e506610da3064cf3f3c0bc3cb`; settlement digest `242e56e94cfa2803733de4c6d4959a3c079d4ddc7d6c07c58edd20d485d2af81`.
- Production withdrawal parent tx `0x3284f7a249d416d1e1589d565a009be28c258275b715a2bb0bb398d4c9b42347` finalized with `MAJORITY_AGREE` and leader execution `SUCCESS`; contract `get_balance` reread `0`.
- Its triggered EOA transfer `0xe07e016cde8d23ce7c51f3ff780ae1d7fd31e5133f78554af123e74ecdc46073` finalized from the contract to `0xfcef676044658b5402f590dabe9e04a0f640522f` with value `1000000000000000000` wei and RPC field `value_credited: true`. This is the delivery proof; this plain EOA transfer has no GenVM leader receipt.

## Canonical positive lifecycle

- External repository: `ometere123/backfill`, created `2026-09-06T17:05:17Z`.
- Mission `0`, baseline `735ce2399e5749be72c542caea11098570827aed`, launch tx `0x45d8afb9fc6429cd77e49ec7d8337fc42ee093fda1c8d00eaa5ed48fcc803caa`.
- Causal PR [#3](https://github.com/ometere123/backfill/pull/3), merge `987fca62be4eaba1741195910e4d2079402e419d`.
- Proof comment `5965906014`, stable GitHub account ID `45469370`.
- Seal tx `0xd8acde0726d8a535bb5fc808089a6ad2b713e747592d272dfaa820fe743bc103`, finalized with successful execution.
- Resolution tx `0x64b45f1cdd0c783f8db6938df0f0ba0940564531d3f79f5784ea074bf3f02254` finalized with successful leader execution.
- Terminal objective status `ACHIEVED`; claimant outcome `ACHIEVED`; the registered wallet received role `CORE`.
- The 1 GEN pool was released completely to the contributor with zero sponsor residual: `1 = 1 + 0 GEN`.
- Terminal source digest `5dbb30999541ce1b23b1008484e3da9921fe29b89eea7649b227a6198d67a662`; lineage root `1a84eda902b42c8df79ebdc8c64a056beecf9a2bec76f7a98bb801c8b20e1101`; ordered contribution root `f12edf9f6600af3f1bbc9de2c074901935398c13453a7bf260bddffaf79c042b`; resolution root `43e71046df2206fc12630ac1efe8eec46cc596f50d8bd5aabd694bd7d0c83c3b`; settlement digest `bb53360e4af5f7c4c28f33a2b3ff6228984e81ecd5b1b093902f33a072861c1d`.
- Contributor withdrawal parent tx `0x269e636799111b2dfac175efe6afcd9a3692057c673025f56af3d4a9bebdbcb3` finalized with leader `SUCCESS` and zeroed the pull balance, but its 1 GEN child transfer `0xd544e8229bbfe2bd44e1c27c3b884368c57cacedcb11a14be86946ff8bba30d2` finalized `ERROR` (`contract_not_found`). No successful payout delivery is claimed.

## Canonical economic-negative lifecycle

- Mission `1` used the same external repository at baseline `987fca62be4eaba1741195910e4d2079402e419d`, with no registered contributions and 3 GEN funded.
- Resolution tx `0xf9cfee6fbfa6421bc78f635d13159540e1eb6fa937a811c89fb79289497d01ad` finalized with successful leader execution.
- Terminal objective status `NOT_ACHIEVED`; claimant outcome `NOT_ACHIEVED`; role map and contributor allocations were empty.
- Released amount was `0`; sponsor residual was `3 GEN`: `3 = 0 + 3 GEN`.
- Terminal tip `987fca62be4eaba1741195910e4d2079402e419d`; terminal source digest `ed35a282bd45588b1c2fcf044805e579811c4e9484e6e098ddbbb5e2dde58f15`; lineage root `6716f6be7a70b2445c846124bed24e8e78413f227a91d383013de8f80e7edd5f`; resolution root `bb7d1badfbb875ddfe6355ed37e893174c09c60c20afcfb58867ace6d4552703`; settlement digest `5aa683520f46b0a93e21a0548fa504ac503a3d4d25d7f80b77ab4545dcd871b1`.
- Sponsor withdrawal parent tx `0xf1f93ac9720579d6f0923e6881590918e8fedd0ecaafa91d8dee127b267b498d` finalized with leader `SUCCESS` and zeroed the pull balance, but its 3 GEN child transfer `0x46a710098c11b9c17ec0e0b80cb7e2ed0b69be760cbf98ef86963c9458d8a5d9` finalized `ERROR` (`contract_not_found`). No successful residual delivery is claimed.

Observed adverse evidence on the final contract includes finalized duplicate-PR rejection tx `0x874125139472ffb57784f5f173c11c4772565ef91fb155774dcb331708606ad9` (`pr_already_sealed`), a frontend minimum-funding rejection before wallet submission, and a real wallet rejection displayed as failure with no state transition.

## Required recorded evidence

1. selected external repository, age evidence, target ref and baseline;
2. mission launch finality and mission ID;
3. real PR, merge SHA, stable author identity and proof-comment ID;
4. contribution seal finality and stored evidence commitments;
5. terminal tip/source/lineage and terminal objective status;
6. claimant outcome, complete role map, allocations and sponsor residual;
7. withdrawal parent finality, child-transfer execution, and post-withdraw balances (the superseded deployment failed child delivery and motivated the replacement source);
8. at least three real adverse classes and browser/wallet QA.

The remaining release work is browser/wallet QA breadth, final evidence reconciliation, hostile audit and final green CI; the positive and negative economic lifecycles above are complete and chain-verified.
