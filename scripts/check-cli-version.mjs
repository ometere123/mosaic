import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const expected = "0.39.1";
const bin = process.platform === "win32" ? "genlayer.cmd" : "genlayer";
const localBin = join(root, "node_modules", ".bin", bin);
let output = "";
try {
  output = execFileSync(localBin, ["--version"], { encoding: "utf8" }).trim();
} catch (error) {
  console.error("Repository-local GenLayer CLI is not installed. Run npm install at the repository root first.");
  process.exit(1);
}
if (!output.includes(expected)) {
  console.error(`GenLayer CLI version mismatch. Expected ${expected}; got ${output || "unknown"}.`);
  process.exit(1);
}
console.log(`Repository-local GenLayer CLI verified: ${expected}.`);
