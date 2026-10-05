import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { TransactionHashVariant } from "../frontend/node_modules/genlayer-js/dist/types/index.js";
import { studionet } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const RPC = "https://studio.genlayer.com/api";
const FRONTEND = "https://themosaic.vercel.app";
const fail = (message) => { throw new Error(`Release smoke failed: ${message}`); };
const manifest = JSON.parse(readFileSync(`${ROOT}/docs/RELEASE_MANIFEST.json`, "utf8"));
const CONTRACT = process.env.MOSAIC_SMOKE_CONTRACT ?? manifest.deployment?.contract;
const SOURCE_SHA = process.env.MOSAIC_SMOKE_SOURCE_SHA ?? manifest.contract_source?.sha256;
if (!CONTRACT || !SOURCE_SHA) fail("release manifest lacks current deployment anchors");
const MISSION_ID_TEXT = process.env.MOSAIC_SMOKE_MISSION_ID;
const MISSION_ID = MISSION_ID_TEXT === undefined ? null : Number(MISSION_ID_TEXT);
const SPONSOR = process.env.MOSAIC_SMOKE_SPONSOR?.toLowerCase();
const EXPECTED_BALANCE_WEI = process.env.MOSAIC_SMOKE_EXPECTED_BALANCE_WEI;
const CHILD_TRANSFER_HASHES = (process.env.MOSAIC_SMOKE_CHILD_TRANSFER_HASHES ?? "").split(",").map((item) => item.trim()).filter(Boolean);

const canonical = (value) => value.replace(/\r\n/g, "\n");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const parse = (value, label) => {
  if (typeof value !== "string") fail(`${label} did not return JSON text`);
  try { return JSON.parse(value); } catch { fail(`${label} returned malformed JSON`); }
};
const rpc = async (method, params) => {
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) fail(`${method} HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) fail(`${method}: ${payload.error.message ?? "RPC error"}`);
  return payload.result;
};

if (Number(studionet.id) !== 61999) fail(`SDK Studionet chain is ${studionet.id}, expected 61999`);
const client = createClient({ chain: studionet });
const readFinal = (functionName, args) => client.readContract({ address: CONTRACT, functionName, args, transactionHashVariant: TransactionHashVariant.LATEST_FINAL });

const localSource = canonical(readFileSync(`${ROOT}/contract/contracts/mosaic.py`, "utf8"));
if (sha256(localSource) !== SOURCE_SHA) fail("working-tree contract source hash mismatch");
const deployedSource = canonical(await client.getContractCode(CONTRACT));
if (sha256(deployedSource) !== SOURCE_SHA || deployedSource !== localSource) fail("deployed source does not equal frozen source");

const nextId = Number(await readFinal("get_next_mission_id", []));
if (!Number.isSafeInteger(nextId) || nextId < 0) fail(`invalid next mission id ${nextId}`);

let mission = null;
let contribution = null;
let sponsorTotal = null;
let walletBalance = null;
if (MISSION_ID !== null) {
  if (!Number.isSafeInteger(MISSION_ID) || MISSION_ID < 0 || MISSION_ID >= nextId) fail(`mission ${MISSION_ID_TEXT} is absent (next id ${nextId})`);
  mission = parse(await readFinal("get_mission", [BigInt(MISSION_ID)]), "get_mission");
  if (!mission.repo || !mission.target_ref || !mission.baseline_sha) fail("mission lacks its frozen source boundary");
  if (!mission.total_funded_wei) fail("mission lacks funded accounting");
  if (Number(mission.contribution_count) > 0) {
    contribution = parse(await readFinal("get_contribution", [BigInt(MISSION_ID), 0]), "get_contribution");
    if (!contribution.status || !contribution.record_commitment) fail("first contribution lacks an auditable record commitment");
  }
  if (SPONSOR) {
    sponsorTotal = String(await readFinal("get_sponsor_total", [BigInt(MISSION_ID), SPONSOR]));
    walletBalance = String(await readFinal("get_balance", [SPONSOR]));
    if (EXPECTED_BALANCE_WEI !== undefined && walletBalance !== EXPECTED_BALANCE_WEI) fail(`wallet balance is ${walletBalance}, expected ${EXPECTED_BALANCE_WEI}`);
  }
}

const routes = ["/", "/missions", "/docs", "/profile"];
if (MISSION_ID !== null) routes.push(`/mission/${MISSION_ID}`, `/mission/${MISSION_ID}/contribute`);
for (const path of routes) {
  const response = await fetch(`${FRONTEND}${path}`, { redirect: "follow" });
  if (!response.ok) fail(`${path} returned HTTP ${response.status}`);
}

for (const hash of (process.env.MOSAIC_SMOKE_TX_HASHES ?? "").split(",").map((item) => item.trim()).filter(Boolean)) {
  const tx = await rpc("eth_getTransactionByHash", [hash]);
  const leader = Array.isArray(tx?.consensus_data?.leader_receipt) ? tx.consensus_data.leader_receipt[0] : tx?.consensus_data?.leader_receipt;
  if (tx?.status !== "FINALIZED") fail(`${hash} is ${tx?.status ?? "missing"}, not FINALIZED`);
  if (leader?.mode !== "leader" || leader?.execution_result !== "SUCCESS") fail(`${hash} lacks authoritative leader SUCCESS`);
}

for (const hash of CHILD_TRANSFER_HASHES) {
  const tx = await rpc("eth_getTransactionByHash", [hash]);
  if (tx?.status !== "FINALIZED") fail(`${hash} is ${tx?.status ?? "missing"}, not FINALIZED`);
  if (tx?.value_credited !== true) fail(`${hash} did not credit its external value transfer`);
  if (typeof tx?.from_address !== "string" || typeof tx?.to_address !== "string" || BigInt(tx?.value ?? 0) <= 0n) {
    fail(`${hash} lacks a positive, attributable external transfer`);
  }
}

if (mission?.settlement) {
  const released = BigInt(mission.released_wei);
  const residual = BigInt(mission.residual_wei);
  const funded = BigInt(mission.total_funded_wei);
  if (released + residual !== funded) fail(`settlement conservation mismatch: ${released} + ${residual} != ${funded}`);
  if (!mission.settlement_digest || !mission.resolution_evidence_root || !mission.ordered_contribution_root) fail("settled mission is missing commitment roots");
  if (!Array.isArray(mission.settlement.criterion_matrix) || mission.settlement.criterion_matrix.length !== mission.criteria.length) fail("settled mission lacks complete criterion_matrix");
  const indexes = mission.settlement.criterion_matrix.map((row) => Number(row.criterion_index));
  if (new Set(indexes).size !== mission.criteria.length || indexes.some((index) => index < 0 || index >= mission.criteria.length)) fail("settlement criterion coverage is invalid");
  if (!mission.settlement.role_evidence || typeof mission.settlement.role_evidence !== "object") fail("settled mission lacks role_evidence");
}

if (mission && mission.status !== "OPEN") {
  if (!mission.terminal_tip_sha || !mission.closed_at || !mission.terminal_source_digest || !mission.frozen_evidence) fail("non-open mission lacks an auditable frozen terminal snapshot");
  let frozen;
  try { frozen = JSON.parse(mission.frozen_evidence.terminal_state_json ?? ""); } catch { fail("frozen terminal snapshot is malformed"); }
  const checks = Array.isArray(frozen.required_checks) ? frozen.required_checks : [];
  const objects = Array.isArray(frozen.evidence_objects) ? frozen.evidence_objects : [];
  for (const [index, criterion] of mission.criteria.entries()) {
    if (typeof criterion === "object" && criterion.evidence_kind === "GITHUB_CHECK") {
      const check = checks.find((item) => Number(item.criterion_index) === index);
      if (!check || check.status !== "completed" || !objects.some((item) => item.kind === "GITHUB_CHECK" && Number(item.criterion_index) === index && String(item.run_id) === String(check.run_id))) fail(`criterion ${index} lacks criterion-bound frozen check evidence`);
    }
  }
}

console.log(JSON.stringify({
  chain_id: studionet.id,
  contract: CONTRACT,
  source_sha256: SOURCE_SHA,
  frontend: FRONTEND,
  next_mission_id: nextId,
  mission_id: MISSION_ID,
  mission_status: mission?.status ?? null,
  contribution_status: contribution?.status ?? null,
  sponsor_total_wei: sponsorTotal,
  wallet_balance_wei: walletBalance,
  settlement_verified: Boolean(mission?.settlement),
  child_transfers_verified: CHILD_TRANSFER_HASHES.length,
  routes_verified: routes.length,
}, null, 2));
