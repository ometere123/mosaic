"""Execute source-level MOSAIC mutants against the actual Direct Mode suite."""
from __future__ import annotations

import os
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "contract" / "contracts" / "mosaic.py"
REPORT = ROOT / "contract" / "tests" / "mutation" / "latest-report.json"

MUTANTS = {
    "baseline_verification": ("if baseline_result.get(\"status\") != \"OK\" or baseline_result.get(\"sha\") != baseline_sha:", "if False:"),
    "target_ref_validation": ("if not _target_ref_ok(target_ref):", "if False:"),
    "duplicate_pr": ("if pr_key in self.used_prs and self.used_prs[pr_key]:", "if False:"),
    "proof_marker": ("if str(evidence.get(\"comment_body\") or \"\").strip() != expected_marker:", "if False:"),
    "author_wallet_binding": ("if author_key in self.author_wallets and self.author_wallets[author_key] != caller:", "if False:"),
    "immutable_digest": ("refreshed.get(\"immutable_source_digest\") != item.get(\"immutable_source_digest\")", "refreshed.get(\"immutable_source_digest\") == item.get(\"immutable_source_digest\")"),
    "material_progress_fraction": ("released = pool * 40 // 100", "released = pool * 50 // 100"),
    "withdraw_zero_before_transfer": ("self.balances[wallet] = \"0\"", "self.balances[wallet] = str(amount)"),
}

def main() -> int:
    source = SOURCE.read_text(encoding="utf-8")
    control = subprocess.run([sys.executable, "-m", "pytest", "contract/tests/direct", "-q"], cwd=ROOT, check=False)
    if control.returncode:
        print("control failed")
        return control.returncode
    killed, survivors = [], []
    with tempfile.TemporaryDirectory(prefix="mosaic-mutants-") as directory:
        for name, (old, new) in MUTANTS.items():
            if source.count(old) != 1:
                raise RuntimeError(f"non-unique mutant target: {name}")
            path = Path(directory) / f"{name}.py"
            path.write_text(source.replace(old, new), encoding="utf-8", newline="\n")
            env = dict(os.environ, MOSAIC_MUTANT_CONTRACT=str(path))
            result = subprocess.run([sys.executable, "-m", "pytest", "contract/tests/direct", "-q"], cwd=ROOT, env=env, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
            (killed if result.returncode else survivors).append(name)
    report = {"total": len(MUTANTS), "killed": killed, "surviving": survivors, "equivalent": []}
    REPORT.write_text(json.dumps(report, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    print(f"mutants total={len(MUTANTS)} killed={len(killed)} surviving={len(survivors)} equivalent=0")
    if survivors:
        print("surviving=" + ",".join(survivors))
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
