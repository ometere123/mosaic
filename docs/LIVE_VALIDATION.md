# Live Validation Checklist

Do not mark an item complete from a unit test or screenshot. Record actual transaction hashes and observed state.

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
