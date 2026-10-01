# MOSAIC

MOSAIC funds public software outcomes and uses GenLayer consensus to decide which merged contributions materially produced those outcomes before GEN is allocated.

A mission creator freezes a public GitHub repository, baseline commit, engineering objective, acceptance dimensions and closing time, then locks GEN. Other wallets can add funding. Contributors work normally on GitHub and bind merged pull requests to their wallets with an exact public proof comment. The Intelligent Contract independently verifies GitHub provenance, seals bounded contribution evidence through validator consensus, and later asks validators to determine the mission outcome and each contributor wallet's impact role.

The contract, not the frontend or an application server, controls all money and canonical mission state.

## Core loop

`DEFINE → FUND → BUILD → PROVE → JUDGE → SPLIT → WITHDRAW`

Mission outcomes:

- `ACHIEVED` releases 100% of the pool to credited contributors.
- `MATERIAL_PROGRESS` releases 40%; the remaining 60% becomes sponsor residual balances.
- `NOT_ACHIEVED` releases 0%; the whole pool becomes sponsor residual balances.
- `INSUFFICIENT_EVIDENCE` moves no GEN and leaves the mission unresolved.
- source unavailability moves no GEN and leaves the mission unresolved.
- after a 30-day unresolved grace period, anyone can expire the mission and return the pool to sponsors pro-rata.

Contributor impact roles are `CORE`, `MAJOR`, `SUPPORTING`, and `NO_CREDIT`, with deterministic weights 5/3/1/0 after consensus fixes the roles. Multiple PRs from one wallet form one portfolio at settlement.

## Why GenLayer matters

The economic question is semantic rather than mechanical:

> Did the eligible merged work achieve the frozen software objective, and what role did each contributor's combined eligible work play in that outcome?

A sponsor, maintainer or contributor should not unilaterally control that answer because the answer decides how pooled GEN moves. Validators reason independently over consensus-sealed public evidence. Exact GitHub provenance checks are separated from the subjective outcome and impact judgment.

## Architecture

```text
USER
  ↓
NEXT.JS APP ROUTER FRONTEND
  ↓
INJECTED EIP-1193 WALLET
  ↓
MOSAIC INTELLIGENT CONTRACT
  ↓
GENLAYER VALIDATORS ↔ PUBLIC GITHUB EVIDENCE
  ↓
CONTRACT STATE / CLAIMABLE GEN
  ↓
FRONTEND
```

There is no application backend, database, webhook relay, cron worker, server signer, server-side decision service, GitHub App or centralized AI service.

## Network and toolchain

- Network: **Studionet**
- Chain ID: **61999**
- RPC: **https://studio.genlayer.com/api**
- Explorer: **https://explorer-studio.genlayer.com**
- Repository-local GenLayer CLI: **0.39.1**
- GenVM Direct Mode target: **v0.2.12**
- `genlayer-js`: **1.1.8**
- `genlayer-py`: **0.16.3**
- `genlayer-test`: **0.29.2**
- `genvm-linter`: **0.11.0**
- Next.js: **16.3.2**
- React: **19.2.4**

The repository root pins the CLI as a dev dependency. Use `npm run genlayer -- ...` or `npx --no-install genlayer ...` after installation. Do not use a globally installed CLI.

## Contract

`contract/contracts/mosaic.py`

One contract owns:

- mission escrow;
- immutable mission terms;
- sponsor accounting;
- contribution evidence records;
- replay protection;
- validator-produced evidence capsules;
- mission settlement;
- contributor and sponsor claimable balances;
- unresolved-expiry recovery.

The architecture intentionally uses one contract because these responsibilities share one economic state machine and no separate trust boundary justifies cross-contract complexity.

### Evidence bounds

A contribution is not silently reduced to a tiny sample and then confidently judged. The contract currently caps each submitted PR at 30 changed files, 2,500 total changed lines, 1,200 changed lines in any single file and 24,000 textual patch characters. If GitHub reports more than the supported evidence budget, the contribution is recorded as `INSUFFICIENT_EVIDENCE` rather than assigned a low impact value.

GitHub API failures are not interpreted as poor work. Source failure returns an unavailable outcome and no payout decision.

## Frontend

`frontend/` is a Next.js App Router TypeScript application.

Routes:

- `/` — mission ledger and entry experience
- `/launch` — immutable mission composer and initial GEN funding
- `/mission/[id]` — impact workspace, funding, evidence, settlement and history
- `/mission/[id]/contribute` — merged PR preview, wallet-proof marker and seal transaction
- `/earnings` — authoritative contract balance and pull withdrawal

The frontend uses only an injected EIP-1193 wallet such as MetaMask or Rabby. It listens for account and chain changes, hard-gates writes to Studionet 61999, stores submitted transaction hashes locally for recovery, and polls the real GenLayer transaction lifecycle. `Accepted` is shown as provisional; execution errors remain failures; durable success requires finality plus successful execution evidence.

Browser-side GitHub PR preview is convenience only. The contract independently retrieves evidence when it matters.

## Setup

Requirements:

- Node.js 20+ (Node 22 recommended)
- Python 3.12 for the pinned GenLayer Python tooling
- npm
- an injected EVM wallet for live browser writes

Install the repository-local CLI:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Create the contract environment:

```bash
python -m venv .venv
# Activate the environment using the normal command for your operating system.
python -m pip install -r contract/requirements.txt
```

Download/pin the Direct Mode GenVM runtime expected by this repository:

```bash
genvm-lint download --version v0.2.12
```

## Local frontend

Before a live deployment, create `frontend/.env.local`:

```text
NEXT_PUBLIC_MOSAIC_CONTRACT_ADDRESS=0x...
```

Then:

```bash
npm --prefix frontend run dev
```

No wallet secret or private key belongs in frontend environment files.

## Verification

Run the network contamination guard:

```bash
npm run check:network
```

Contract syntax without external packages:

```bash
python -m py_compile contract/contracts/mosaic.py
```

With the pinned Python toolchain installed:

```bash
genvm-lint check contract/contracts/mosaic.py
python -m pytest contract/tests/direct -q
```

Frontend:

```bash
npm --prefix frontend run lint
npm --prefix frontend run test
npm --prefix frontend run build
```

The combined check is:

```bash
npm run check
```

## Deployment

Deployment has intentionally not been fabricated in this source package. Before declaring a live release, deploy the exact contract source to Studionet 61999 using the repository-local CLI 0.39.1, record the address and deployment transaction, configure the frontend with that address, run the full verification suite, deploy the frontend, and perform the manual funded-wallet lifecycle described in `docs/LIVE_VALIDATION.md`.

`docs/DEPLOYMENT.md` is the deployment evidence record and must be updated with real values only.

## Security and trust boundaries

- No administrator can rewrite a mission outcome or payout.
- Mission terms are immutable after creation.
- A PR can be sealed only once per mission after conclusive evidence processing.
- A proof comment must come from the PR author and must exactly bind mission ID to the caller wallet.
- Participant-supplied arbitrary evidence URLs are not accepted.
- Repository content, PR text and comments are untrusted evidence, never validator instructions.
- Payout and residual accounting conserve the mission pool.
- Withdrawals zero claimable balance before transfer.
- An inconclusive judgment does not move funds.
- A 30-day unresolved grace prevents indefinite lockup.

## Known limitations

- Public GitHub API availability and anonymous rate limits can delay evidence processing.
- The first release intentionally bounds missions to 12 contribution records and 8 contributor wallets.
- Pull requests beyond the evidence budget are marked insufficient rather than partially judged.
- Initial attribution binds a wallet to the PR author's GitHub account; multi-author allocation is not attempted.
- Semantic consensus is judgment, not mathematical proof. Poorly written mission objectives can still produce ambiguous outcomes.
- This source package does not contain a fabricated contract address, transaction hash or live URL. Those must be produced and verified during deployment.
