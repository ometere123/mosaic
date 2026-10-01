import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const expected = "0.39.1";
const localBin = join(root, "node_modules", "genlayer", "dist", "index.js");
let output = "";
try {
  output = execFileSync(process.execPath, [localBin, "--version"], { encoding: "utf8" }).trim();
} catch (error) {
  console.error("Repository-local GenLayer CLI is not installed. Run npm install at the repository root first.");
  process.exit(1);
}
if (!output.includes(expected)) {
  console.error(`GenLayer CLI version mismatch. Expected ${expected}; got ${output || "unknown"}.`);
  process.exit(1);
}
console.log(`Repository-local GenLayer CLI verified: ${expected}.`);
