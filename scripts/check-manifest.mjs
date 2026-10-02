import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifestPath = join(root, "docs", "PREDEPLOYMENT_MANIFEST.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const fail = (message) => { throw new Error(`Manifest verification failed: ${message}`); };

if (manifest.status !== "PREDEPLOYMENT_CANDIDATE") fail("unexpected status");
if (manifest.network?.chain_id !== 61999 || manifest.network?.chain_id_hex !== "0xF22F") fail("network is not Studionet 61999");
if (manifest.network?.rpc !== "https://studio.genlayer.com/api") fail("RPC mismatch");
if (manifest.toolchain?.genlayer_cli !== "0.39.1" || manifest.toolchain?.genlayer_js !== "1.1.8") fail("toolchain pin mismatch");
if (manifest.deployment?.performed !== false) fail("deployment must remain explicitly false");

const frozen = manifest.frozen_source_commit;
if (!/^[0-9a-f]{40}$/.test(frozen)) fail("frozen source commit is not a full SHA");
const frozenTree = git("rev-parse", `${frozen}^{tree}`);
if (frozenTree !== manifest.frozen_source_tree) fail(`tree mismatch: ${frozenTree}`);
const sourceBytes = Buffer.from(execFileSync("git", ["show", `${frozen}:contract/contracts/mosaic.py`], { cwd: root }));
const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");
if (sourceHash !== manifest.contract?.canonical_sha256 || sourceHash !== manifest.contract?.git_blob_sha256) fail("frozen contract hash mismatch");
const currentBytes = readFileSync(join(root, "contract", "contracts", "mosaic.py"));
if (createHash("sha256").update(currentBytes).digest("hex") !== sourceHash) fail("working-tree contract differs from frozen source");
const head = git("rev-parse", "HEAD");
if (head !== git("ls-remote", "origin", "refs/heads/main").split(/\s+/)[0]) fail("local HEAD differs from origin/main");

console.log(`Manifest verification passed: frozen ${frozen}, tree ${frozenTree}, contract SHA-256 ${sourceHash}, no deployment.`);
