import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = fileURLToPath(new URL("..", import.meta.url));
const contractPath = join(root, "contract", "contracts", "mosaic.py");
const contractBytes = readFileSync(contractPath);
const contract = contractBytes.toString("utf8");
const requirements = readFileSync(join(root, "contract", "requirements.txt"), "utf8");
const rootPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const frontendPackage = JSON.parse(readFileSync(join(root, "frontend", "package.json"), "utf8"));
const findings = [];

const exactPins = new Map([
  ["genlayer", [rootPackage.devDependencies?.genlayer, "0.39.1"]],
  ["genlayer-js", [frontendPackage.dependencies?.["genlayer-js"], "1.1.8"]],
]);
for (const [name, [actual, expected]] of exactPins) {
  if (actual !== expected) findings.push(`${name} must be pinned exactly to ${expected}; found ${actual ?? "missing"}`);
}

for (const pin of ["genlayer-py==0.16.3", "genlayer-test==0.29.2", "genvm-linter==0.11.0"]) {
  if (!requirements.split(/\r?\n/).includes(pin)) findings.push(`Missing exact requirement pin: ${pin}`);
}

const runner = '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }';
if (contract.split(/\r?\n/, 1)[0] !== runner) findings.push("Contract runner header changed");

const publicMethods = [...contract.matchAll(/@gl\.public\.(?:view|write)(?:\.payable)?\s+def\s+(\w+)\s*\(/g)].map((match) => match[1]);
const expectedMethods = [
  "preview_legacy_import", "import_legacy_frozen_mission", "adjudicate_resolution", "preview_component_context", "adjudicate_criterion", "adjudicate_role", "finalize_adjudication", "fund_and_settle_imported", "open_mission", "add_funding", "seal_contribution", "checkpoint_terminal", "freeze_terminal", "resolve_mission", "expire_unresolved",
  "withdraw", "withdraw_for", "get_mission", "get_contribution", "get_sponsor_total", "get_balance",
  "get_author_wallet", "get_wallet_author", "get_next_mission_id",
];
if (JSON.stringify(publicMethods) !== JSON.stringify(expectedMethods)) {
  findings.push(`Contract public surface changed: ${publicMethods.join(", ")}`);
}

let blobBytes;
try {
  blobBytes = execFileSync("git", ["show", "HEAD:contract/contracts/mosaic.py"], {
    cwd: root,
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (error) {
  findings.push(`Unable to read contract Git blob: ${error.message}`);
}
if (blobBytes && !contractBytes.equals(blobBytes)) {
  findings.push("Working-tree contract bytes differ from the canonical HEAD Git blob");
}

if (findings.length) {
  console.error(`Integrity audit failed:\n${findings.join("\n")}`);
  process.exit(1);
}
const sha256 = createHash("sha256").update(contractBytes).digest("hex");
const blobSha256 = createHash("sha256").update(blobBytes).digest("hex");
console.log(`Integrity audit passed: 5 exact pins, ${publicMethods.length} public methods, canonical source SHA-256 ${sha256}, Git blob SHA-256 ${blobSha256}.`);
