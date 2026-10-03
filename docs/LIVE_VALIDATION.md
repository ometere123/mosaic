# Live Validation

## Canonical release surfaces

- Contract: `0x05fd77aB1f916e36C718E6b55CBdf5F726216d4a`
- Deployment transaction: `0x7def22417f48e35caff481815a7665d0dce26841bd025f5035a707da1791e167`
- Frontend: https://themosaic.vercel.app
- Network: Studionet `61999` / `0xF22F`

The earlier MOSAIC-self-validation mission is historical/superseded evidence only. It is not the canonical live proof.

## Canonical lifecycle in progress

- External repository: `ometere123/backfill`, created `2026-09-06T17:05:17Z`.
- Mission `0`, baseline `735ce2399e5749be72c542caea11098570827aed`, launch tx `0x45d8afb9fc6429cd77e49ec7d8337fc42ee093fda1c8d00eaa5ed48fcc803caa`.
- Causal PR [#3](https://github.com/ometere123/backfill/pull/3), merge `987fca62be4eaba1741195910e4d2079402e419d`.
- Proof comment `5965906014`, stable GitHub account ID `45469370`.
- Seal tx `0xd8acde0726d8a535bb5fc808089a6ad2b713e747592d272dfaa820fe743bc103`, finalized with successful execution.
- Contribution `0` is `SEALED`; resolution, allocation and withdrawal remain unclaimed until the legitimate close.

Observed adverse evidence on the final contract includes finalized duplicate-PR rejection tx `0x874125139472ffb57784f5f173c11c4772565ef91fb155774dcb331708606ad9` (`pr_already_sealed`), a frontend minimum-funding rejection before wallet submission, and a real wallet rejection displayed as failure with no state transition.

## Required recorded evidence

1. selected external repository, age evidence, target ref and baseline;
2. mission launch finality and mission ID;
3. real PR, merge SHA, stable author identity and proof-comment ID;
4. contribution seal finality and stored evidence commitments;
5. terminal tip/source/lineage and terminal objective status;
6. claimant outcome, complete role map, allocations and sponsor residual;
7. contributor and sponsor withdrawal finality and post-withdraw balances;
8. at least three real adverse classes and browser/wallet QA.

Until those actions are observed, the production deployment is verified but the economic release is not claimed as fully verified.
