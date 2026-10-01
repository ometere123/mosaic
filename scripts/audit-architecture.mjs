import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const sourceRoots = [join(root, "frontend"), join(root, "contract")];
const backendPaths = [join(root, "frontend", "app", "api"), join(root, "frontend", "pages", "api")];
const findings = [];
for (const path of backendPaths) if (existsSync(path)) findings.push(`Unexpected application-server route path: ${relative(root, path)}`);

const allowedRootDeps = new Set(["genlayer"]);
const allowedFrontendDeps = new Set(["genlayer-js", "next", "react", "react-dom"]);

function auditPackage(path, allowed) {
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  for (const name of Object.keys(pkg.dependencies ?? {})) if (!allowed.has(name)) findings.push(`Unexpected runtime dependency ${name} in ${relative(root, path)}`);
}
auditPackage(join(root, "package.json"), allowedRootDeps);
auditPackage(join(root, "frontend", "package.json"), allowedFrontendDeps);

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".next", "__pycache__"].includes(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (/\.(?:ts|tsx|js|mjs|py)$/.test(name)) {
      const source = readFileSync(path, "utf8");
      if (/^[\s\S]*["']use server["']/m.test(source)) findings.push(`Server Action directive found: ${relative(root, path)}`);
      if (/privateKeyToAccount|ACCOUNT_PRIVATE_KEY|mnemonic/i.test(source)) findings.push(`Application-controlled signing pattern found: ${relative(root, path)}`);
    }
  }
}
for (const dir of sourceRoots) walk(dir);
if (findings.length) { console.error(findings.join("\n")); process.exit(1); }
console.log("Architecture audit passed: browser frontend + Intelligent Contract only.");
