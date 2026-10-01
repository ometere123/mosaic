import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const targetChain = "61999";
const targetRpc = "https://studio.genlayer.com/api";
const targetExplorer = "https://explorer-studio.genlayer.com";
const skip = new Set([
  "node_modules",
  ".next",
  ".git",
  ".venv",
  "venv",
  "env",
  "__pycache__",
  ".pytest_cache",
]);
const findings = [];
let sawTargetChain = false;
let sawTargetRpc = false;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (/\.(?:ts|tsx|js|mjs|json|md|py|yaml|yml|txt|example)$/.test(name) || name === "README.md") {
      const source = readFileSync(path, "utf8");
      if (source.includes(targetChain)) sawTargetChain = true;
      if (source.includes(targetRpc)) sawTargetRpc = true;
      for (const match of source.matchAll(/(?:chain\s*id|chainId)\D{0,12}(\d{4,6})/gi)) {
        if (match[1] !== targetChain) findings.push(`${relative(root, path)} contains a non-target chain identifier`);
      }
      for (const match of source.matchAll(/https:\/\/[A-Za-z0-9.-]*genlayer\.com(?:\/[^\s)`'\"]*)?/g)) {
        const url = match[0].replace(/[.,;:]$/, "");
        if (url.includes("explorer")) {
          if (!url.startsWith(targetExplorer)) findings.push(`${relative(root, path)} contains a non-target GenLayer explorer`);
        } else if (url.includes("studio.genlayer.com") && !url.startsWith(targetRpc)) {
          findings.push(`${relative(root, path)} contains a non-target Studionet RPC path`);
        }
      }
    }
  }
}
walk(root);
if (!sawTargetChain) findings.push("Target chain identifier is missing");
if (!sawTargetRpc) findings.push("Target RPC is missing");
if (findings.length) { console.error("Network configuration audit failed:\n" + findings.join("\n")); process.exit(1); }
console.log("Network configuration audit passed: Studionet 61999 configuration is consistent.");
