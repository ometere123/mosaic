import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const RPC = "https://studio.genlayer.com/api";
const FRONTEND = "https://themosaic.vercel.app";
const CONTRACT = "0x05fd77aB1f916e36C718E6b55CBdf5F726216d4a";
const SOURCE_SHA = "96ceea3e7d71fd2c0e36461c4b4ca0d425f10fa9c013ff09ad895b8610acf8f5";
const MISSION_ID = Number(process.env.MOSAIC_SMOKE_MISSION_ID ?? "0");
const SPONSOR = "0xfcef676044658b5402f590dabe9e04a0f640522f";

const fail = (message) => { throw new Error(`Release smoke failed: ${message}`); };
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

const localSource = canonical(readFileSync(`${ROOT}/contract/contracts/mosaic.py`, "utf8"));
if (sha256(localSource) !== SOURCE_SHA) fail("working-tree contract source hash mismatch");
const deployedSource = canonical(await client.getContractCode(CONTRACT));
if (sha256(deployedSource) !== SOURCE_SHA || deployedSource !== localSource) fail("deployed source does not equal frozen source");

const nextId = Number(await client.readContract({ address: CONTRACT, functionName: "get_next_mission_id", args: [] }));
if (!Number.isSafeInteger(nextId) || nextId <= MISSION_ID) fail(`mission ${MISSION_ID} is absent (next id ${nextId})`);
const mission = parse(await client.readContract({ address: CONTRACT, functionName: "get_mission", args: [BigInt(MISSION_ID)] }), "get_mission");
if (mission.repo !== "ometere123/backfill" || mission.target_ref !== "main") fail("canonical mission source boundary mismatch");
if (mission.baseline_sha !== "735ce2399e5749be72c542caea11098570827aed") fail("canonical mission baseline mismatch");
if (mission.total_funded_wei !== "1000000000000000000") fail("canonical mission funding mismatch");
if (Number(mission.contribution_count) < 1) fail("canonical sealed contribution is absent");

const contribution = parse(await client.readContract({ address: CONTRACT, functionName: "get_contribution", args: [BigInt(MISSION_ID), 0] }), "get_contribution");
if (contribution.status !== "SEALED" || contribution.pr_number !== 3) fail("canonical contribution identity mismatch");
if (contribution.merge_sha !== "987fca62be4eaba1741195910e4d2079402e419d") fail("canonical merge SHA mismatch");
if (contribution.proof_comment_id !== 5965906014 || contribution.author_account_id !== "45469370") fail("canonical proof identity mismatch");
if (contribution.wallet !== SPONSOR) fail("canonical contribution wallet mismatch");

const sponsorTotal = String(await client.readContract({ address: CONTRACT, functionName: "get_sponsor_total", args: [BigInt(MISSION_ID), SPONSOR] }));
if (sponsorTotal !== "1000000000000000000") fail(`sponsor total is ${sponsorTotal}`);

for (const path of ["/", "/missions", "/docs", "/profile", `/mission/${MISSION_ID}`, `/mission/${MISSION_ID}/contribute`]) {
  const response = await fetch(`${FRONTEND}${path}`, { redirect: "follow" });
  if (!response.ok) fail(`${path} returned HTTP ${response.status}`);
}

for (const hash of (process.env.MOSAIC_SMOKE_TX_HASHES ?? "").split(",").map((item) => item.trim()).filter(Boolean)) {
  const tx = await rpc("eth_getTransactionByHash", [hash]);
  const leader = Array.isArray(tx?.consensus_data?.leader_receipt) ? tx.consensus_data.leader_receipt[0] : tx?.consensus_data?.leader_receipt;
  if (tx?.status !== "FINALIZED") fail(`${hash} is ${tx?.status ?? "missing"}, not FINALIZED`);
  if (leader?.mode !== "leader" || leader?.execution_result !== "SUCCESS") fail(`${hash} lacks authoritative leader SUCCESS`);
}

if (mission.settlement) {
  const released = BigInt(mission.released_wei);
  const residual = BigInt(mission.residual_wei);
  const funded = BigInt(mission.total_funded_wei);
  if (released + residual !== funded) fail(`settlement conservation mismatch: ${released} + ${residual} != ${funded}`);
  if (!mission.settlement_digest || !mission.resolution_evidence_root || !mission.ordered_contribution_root) fail("settled mission is missing commitment roots");
}

console.log(JSON.stringify({
  chain_id: studionet.id,
  contract: CONTRACT,
  source_sha256: SOURCE_SHA,
  frontend: FRONTEND,
  next_mission_id: nextId,
  mission_id: MISSION_ID,
  mission_status: mission.status,
  contribution_status: contribution.status,
  sponsor_total_wei: sponsorTotal,
  settlement_verified: Boolean(mission.settlement),
  routes_verified: 6,
}, null, 2));
