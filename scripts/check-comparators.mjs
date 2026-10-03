import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const prohibited = [
  "4355544f564552",
  "466c6f776564",
  "47697444726970",
  "4966656d31",
  "596f6e65436f6465",
].map((hex) => Buffer.from(hex, "hex").toString("utf8"));
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root })
  .toString("utf8")
  .split("\0")
  .filter(Boolean);
const findings = [];

for (const relative of tracked) {
  const bytes = readFileSync(join(root, relative));
  if (bytes.includes(0)) continue;
  const text = bytes.toString("utf8");
  for (const name of prohibited) {
    if (new RegExp(`\\b${name}\\b`, "i").test(text)) {
      findings.push(`${relative}: prohibited external-project reference`);
    }
  }
}

if (findings.length) {
  console.error(`Comparator-reference guard failed:\n${findings.join("\n")}`);
  process.exit(1);
}

console.log(`Comparator-reference guard passed across ${tracked.length} tracked files.`);
