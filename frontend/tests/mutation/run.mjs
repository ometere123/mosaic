import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "../..");
const files = {
  transaction: path.join(root, "lib/transaction.ts"),
  network: path.join(root, "lib/eip1193.ts"),
  github: path.join(root, "lib/github.ts"),
  deployment: path.join(root, "lib/deployment.ts"),
  contract: path.join(root, "lib/contract.ts"),
  format: path.join(root, "lib/format.ts"),
  status: path.join(root, "components/status.tsx"),
  genlayer: path.join(root, "lib/genlayer.ts"),
  readResilience: path.join(root, "lib/read-resilience.ts"),
  readCache: path.join(root, "lib/read-cache.ts"),
};

// These replacements mutate production frontend source, then run the real Vitest
// regression against that source. They are deliberately distinct protocol/UI
// failures, not formatting or duplicate edits.
const mutants = [
  ["accepted_durable_success", "transaction", 'executionFailed ? "failed" : "accepted"', 'executionFailed ? "failed" : "finalized"', "tests/transaction.test.ts"],
  ["finalized_unknown_success", "transaction", 'executionSucceeded ? "finalized" : "finalized_unverified"', 'executionSucceeded ? "finalized" : "finalized"', "tests/transaction.test.ts"],
  ["single_leader_receipt_required", "transaction", "labeledLeaders.length === 1\n    ? labeledLeaders", "labeledLeaders.length >= 1\n    ? [labeledLeaders[0]]", "tests/transaction.test.ts"],
  ["leader_receipt_ignored", "transaction", "|| authoritativeLeaderExecution(tx)", "|| \"\"", "tests/transaction.test.ts"],
  ["execution_error_ignored", "transaction", 'exec.includes("ERROR")', 'false', "tests/transaction.test.ts"],
  ["timeout_treated_as_success", "transaction", '|| exec.includes("TIMEOUT")', '|| false', "tests/transaction.test.ts"],
  ["correct_chain_guard_removed", "network", "=== NETWORK.chainId", "!== NETWORK.chainId", "tests/network.test.ts"],
  ["post_switch_verification_removed", "network", "if (after !== NETWORK.chainId)", "if (false)", "tests/network.test.ts"],
  ["unknown_chain_add_bypassed", "network", "if (code !== 4902) throw error;", "if (false) throw error;", "tests/network.test.ts"],
  ["wrong_switch_chain", "network", "params: [{ chainId: NETWORK.chainIdHex }]", 'params: [{ chainId: "0x1" }]', "tests/network.test.ts"],
  ["chain_id_radix_wrong", "network", "Number.parseInt(String(hex), 16)", "Number.parseInt(String(hex), 10)", "tests/network.test.ts"],
  ["proof_partial_match", "github", "body !== marker", "false", "tests/github.test.ts"],
  ["malformed_comments_accepted", "github", 'if (!Array.isArray(data)) throw new Error("GitHub returned malformed comment data. You can enter the comment ID manually.");', 'if (!Array.isArray(data)) return [];', "tests/github.test.ts"],
  ["unsafe_comment_id_accepted", "github", "!Number.isSafeInteger(id) || id <= 0", "false", "tests/github.test.ts"],
  ["unbounded_comments_endpoint", "github", "comments?per_page=100", "comments?per_page=1", "tests/github.test.ts"],
  ["deployment_address_validation_removed", "deployment", "ADDRESS_RE.test(raw)\n  ?", "true\n  ?", "tests/deployment.test.ts"],
  ["missing_deployment_allowed", "deployment", 'if (!CONTRACT_ADDRESS) throw new Error("MOSAIC contract address is not configured for this deployment.");\n  return CONTRACT_ADDRESS;', 'return CONTRACT_ADDRESS!;', "tests/deployment.test.ts"],
  ["wrong_funding_method", "contract", 'functionName: "add_funding"', 'functionName: "withdraw"', "tests/contract.test.ts"],
  ["target_ref_not_written", "contract", "args: [input.repo, input.targetRef, input.baseline", "args: [input.repo, input.baseline, input.baseline", "tests/contract.test.ts"],
  ["seal_sends_value", "contract", 'functionName: "seal_contribution", args: [BigInt(missionId), pr, commentId], value: 0n', 'functionName: "seal_contribution", args: [BigInt(missionId), pr, commentId], value: 1n', "tests/contract.test.ts"],
  ["resolve_sends_value", "contract", 'functionName: "resolve_mission", args: [BigInt(missionId)], value: 0n', 'functionName: "resolve_mission", args: [BigInt(missionId)], value: 1n', "tests/contract.test.ts"],
  ["withdraw_has_arguments", "contract", 'functionName: "withdraw", args: [], value: 0n', 'functionName: "withdraw", args: [0n], value: 0n', "tests/contract.test.ts"],
  ["trailing_decimal_allowed", "format", "\\d{1,18}", "\\d{0,18}", "tests/format.test.ts"],
  ["hash_tail_wrong", "format", "slice(-tail)", "slice(-head)", "tests/format.test.ts"],
  ["closed_boundary_wrong", "format", "delta <= 0", "delta < 0", "tests/format.test.ts"],
  ["settled_phase_mislabelled", "status", 'if (mission.status === "SETTLED") return "SETTLED";', 'if (mission.status === "SETTLED" && false) return "SETTLED";', "tests/state.test.ts"],
  ["expired_phase_mislabelled", "status", 'return "EXPIRED"', 'return "OPEN"', "tests/state.test.ts"],
  ["achieved_tone_mislabelled", "status", 'outcome === "ACHIEVED") return "good"', 'outcome === "ACHIEVED") return "warn"', "tests/state.test.ts"],
  ["partial_tone_mislabelled", "status", 'outcome === "MATERIAL_PROGRESS") return "blue"', 'outcome === "MATERIAL_PROGRESS") return "warn"', "tests/state.test.ts"],
  ["funding_value_dropped", "contract", 'functionName: "add_funding", args: [BigInt(missionId)], value });', 'functionName: "add_funding", args: [BigInt(missionId)], value: 0n });', "tests/contract.test.ts"],
  ["read_retry_count_removed", "readResilience", "options.attempts ?? 4", "options.attempts ?? 1", "tests/read-resilience.test.ts"],
  ["failed_fetch_not_transient", "readResilience", '"failed to fetch", "fetch failed"', '"transport fetch failure", "fetch failed"', "tests/read-resilience.test.ts"],
  ["public_read_concurrency_unbounded", "readResilience", "MAX_PUBLIC_READ_CONCURRENCY = 4", "MAX_PUBLIC_READ_CONCURRENCY = 8", "tests/read-resilience.test.ts"],
  ["latest_final_downgraded", "contract", "TransactionHashVariant.LATEST_FINAL", "TransactionHashVariant.LATEST_NONFINAL", "tests/contract.test.ts"],
  ["read_cache_contract_scope_removed", "readCache", "`${NETWORK.chainId}:${contract.toLowerCase()}:${VERSION}`", "`${NETWORK.chainId}:${VERSION}`", "tests/read-cache.test.ts"],
];

const reportPath = path.join(root, "tests/mutation/latest-report.json");
const selected = process.env.MOSAIC_FRONTEND_MUTANT_FILTER?.split(",").filter(Boolean);
const active = selected?.length ? mutants.filter((m) => selected.includes(m[0])) : mutants;
if (selected?.length && active.length !== selected.length) throw new Error("unknown frontend mutant filter");

const originals = new Map(Object.values(files).map((file) => [file, fs.readFileSync(file, "utf8")]));
const killed = [], surviving = [], invalid = [];
const runner = process.platform === "win32" ? "cmd.exe" : "npx";
const testArgs = ["vitest", "run", "--no-cache", "--pool=threads", "--maxWorkers=2", "--minWorkers=1"];
const runTests = (testFile) => spawnSync(
  runner,
  process.platform === "win32"
    ? ["/d", "/s", "/c", `${["npx", ...testArgs, ...(testFile ? [testFile] : [])].join(" ")} && exit /b 0 || exit /b 1`]
    : [...testArgs, ...(testFile ? [testFile] : [])],
  { cwd: root, stdio: "ignore", env: process.env },
);
const runTypecheck = () => spawnSync(
  runner,
  process.platform === "win32"
    ? ["/d", "/s", "/c", "npx tsc --noEmit && exit /b 0 || exit /b 1"]
    : ["tsc", "--noEmit"],
  { cwd: root, encoding: "utf8", env: process.env },
);
const control = runTests();
if (control.error || control.status !== 0) {
  throw new Error("frontend mutation control run failed; refusing to classify mutants");
}
try {
  for (const [name, fileKey, oldText, newText, testFile] of active) {
    const file = files[fileKey];
    const original = originals.get(file);
    if (original.split(oldText).length - 1 !== 1) {
      throw new Error(`non-unique frontend mutant target: ${name}`);
    }
    fs.writeFileSync(file, original.replace(oldText, newText), "utf8");
    const compile = runTypecheck();
    const result = compile.status === 0 ? runTests(testFile) : compile;
    if (compile.status !== 0 || result.error?.code === "ENOENT" || result.status === null) {
      invalid.push(name);
      if (compile.status !== 0) console.error(`${name} failed typecheck:\n${compile.stdout ?? ""}${compile.stderr ?? ""}`);
    }
    else if (result.status !== 0) killed.push(name);
    else surviving.push(name);
    fs.writeFileSync(file, original, "utf8");
  }
} finally {
  for (const [file, original] of originals) fs.writeFileSync(file, original, "utf8");
}
const report = { total: active.length, unique_meaningful: active.length, killed, surviving, equivalent: [], invalid_syntax_or_runner: invalid };
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`frontend mutants total=${active.length} unique_meaningful=${active.length} killed=${killed.length} surviving=${surviving.length} invalid=${invalid.length}`);
if (surviving.length || invalid.length) process.exitCode = 1;
