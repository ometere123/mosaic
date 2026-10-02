# Live Validation Checklist

The hardened contract and frontend are deployed. The checklist below remains the required live wallet/economic validation record; no user wallet lifecycle is claimed until its real hashes and states are recorded.

## Release deployment evidence

- Contract: `0x8966Da098d86D0E6D2769e59912C6EC5D951c74B`
- Deployment transaction: `0xbc96f3d51a194d4d3fa876eafed2a31912d3e47441963e991e671d9f18796a72`
- Frontend: https://mosaic-five-rust.vercel.app
- Network: Studionet 61999

## Launch transaction observed

The first production validation mission was created on-chain from the injected wallet:

- Mission ID: `1`
- State: `OPEN`
- Repository / target ref: `ometere123/mosaic` / `main`
- Baseline: `12ef178f0c2bced6e43f710c344b763cbaaf7768`
- Pool: `1 GEN` (`1000000000000000000` wei)
- Launch transaction: [`0x5bbc95e81288a5e943671495ea501720eeae286a7078f5d8b214d9802ce17acb`](https://explorer-studio.genlayer.com/tx/0x5bbc95e81288a5e943671495ea501720eeae286a7078f5d8b214d9802ce17acb)
- Receipt: `FINALIZED`, consensus `MAJORITY_AGREE`, leader execution `SUCCESS`

The authoritative `get_mission(1)` read confirms the funded pool and immutable mission terms. No contribution, settlement, or withdrawal is claimed yet.

## Successful lifecycle

1. Open the deployed frontend.
2. Connect an injected wallet.
3. Confirm the UI identifies Studionet chain 61999.
4. Launch a mission against a public test repository using a real 40-character baseline SHA, 1–5 criteria, a future closing time and real test GEN.
5. Record the mission-creation transaction hash and resulting mission ID after successful execution/finality.
6. From a different wallet, add funding and record the transaction.
7. Merge a real PR inside the mission window.
8. From the PR author's GitHub account, post the exact marker shown by the contribution page.
9. Submit PR number + numeric proof-comment ID from the wallet named in the marker.
10. Record the evidence-seal transaction hash, merge SHA and stored evidence digest.
11. After the mission closes, trigger `resolve_mission`.
12. Record the settlement transaction, protocol status, execution result, mission outcome and per-wallet impact roles.
13. Confirm claimable balances match the deterministic economic rule.
14. Withdraw one contributor balance and, if present, one sponsor residual. Record both transactions and balance changes.

## Alternate/failure evidence

Exercise at least one real non-success branch without fabricating it:

- GitHub source unavailable / rate-limited; or
- insufficient evidence; or
- a resolved `NOT_ACHIEVED` mission; or
- a resolved `MATERIAL_PROGRESS` mission.

Record what actually happened. An Accepted transaction with an execution error is not success.

## Browser QA

Verify desktop and narrow/mobile widths:

- connect;
- disconnect/app disconnect state;
- account change;
- wrong-network switch guidance;
- signature rejection;
- transaction hash persistence across refresh;
- Accepted displayed as provisional;
- execution failure displayed as failure;
- final contract state reconstructed from reads;
- correct explorer links;
- no critical console errors.

## External action required

The injected-wallet browser session has completed the sponsor launch. To finish live validation, a human must use the same wallet session and a GitHub account that can create and merge a bounded public PR. The remaining required evidence is:

1. optionally approve an additional sponsor-funding transaction;
2. create and merge the bounded PR, post the exact wallet marker, and approve sealing;
3. approve resolution and withdrawals;
4. provide the resulting transaction hashes, mission ID, explorer links, and observed terminal/claimant outcomes.

No private key, seed phrase or custodial secret should be shared. Until those actions occur, the production deployment is real but the economic lifecycle remains unverified.
