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

# Each target is a regression against the actual contract file, never a toy model.
# The unmodified full Direct Mode suite remains the control; targeted runs make
# individual source mutants practical in CI while preserving a concrete kill proof.
MUTANTS = {
    "baseline_verification": ("if baseline_result.get(\"status\") != \"OK\" or baseline_result.get(\"sha\") != baseline_sha:", "if False:", "contract/tests/direct/test_mosaic.py::test_open_mission_rejects_target_diverged_from_baseline"),
    "baseline_source_unavailable": ("if baseline_result.get(\"status\") == \"SOURCE_UNAVAILABLE\":", "if False:", "contract/tests/direct/test_mosaic.py::test_baseline_unavailable_fails_before_lock"),
    "repository_validation": ("if not _repo_ok(repo_slug):", "if False:", "contract/tests/direct/test_state_machine_boundaries.py::test_open_mission_rejects_each_frozen_term_boundary"),
    "target_ref_validation": ("if not _target_ref_ok(target_ref):", "if False:", "contract/tests/direct/test_mosaic.py::test_invalid_target_ref_rejected_before_source_read"),
    "duration_validation": ("if duration < MIN_MISSION_SECONDS or duration > MAX_MISSION_SECONDS:", "if False:", "contract/tests/direct/test_state_machine_boundaries.py::test_open_mission_rejects_each_frozen_term_boundary"),
    "open_minimum_funding": ("if amount < MIN_FUND_WEI:\n            raise gl.vm.UserError(\"funding_below_minimum\")\n\n        baseline_context", "if False:\n            raise gl.vm.UserError(\"funding_below_minimum\")\n\n        baseline_context", "contract/tests/direct/test_state_machine_boundaries.py::test_open_mission_rejects_funding_below_protocol_minimum"),
    "funding_minimum": ("if amount < MIN_FUND_WEI:\n            raise gl.vm.UserError(\"funding_below_minimum\")\n        sponsor = _wallet", "if False:\n            raise gl.vm.UserError(\"funding_below_minimum\")\n        sponsor = _wallet", "contract/tests/direct/test_collection_limits.py::test_add_funding_enforces_minimum_on_existing_mission"),
    "duplicate_pr": ("if pr_key in self.used_prs and self.used_prs[pr_key]:", "if False:", "contract/tests/direct/test_mosaic.py::test_duplicate_pr_rejected"),
    "proof_author_identity": ("if not author_account_id or author_account_id != comment_account_id:", "if False:", "contract/tests/direct/test_mosaic.py::test_proof_login_match_cannot_replace_stable_github_identity"),
    "proof_marker": ("if str(evidence.get(\"comment_body\") or \"\").strip() != expected_marker:", "if False:", "contract/tests/direct/test_mosaic.py::test_wrong_wallet_marker_rejected"),
    "proof_issue_identity": ("if issue_url.lower() != expected_issue_url.lower():", "if False:", "contract/tests/direct/test_mosaic.py::test_wrong_pull_request_proof_rejected"),
    "merge_timestamp": ("if merged_dt.tzinfo is None or merged_dt.utcoffset() is None:", "if False:", "contract/tests/direct/test_mosaic.py::test_naive_merge_timestamp_rejected"),
    "duplicate_merge": ("if merge_key in self.used_merge_shas and self.used_merge_shas[merge_key]:", "if False:", "contract/tests/direct/test_mosaic.py::test_duplicate_merge_sha_rejected_across_pr_numbers"),
    "capsule_schema": ("if set(capsule.keys()) != {\"summary\", \"relevance\", \"substantive_changes\", \"risk_flags\"}:", "if False:", "contract/tests/direct/test_mosaic.py::test_capsule_rejects_unexpected_fields"),
    "author_wallet_binding": ("if author_key in self.author_wallets and self.author_wallets[author_key] != caller:", "if False:", "contract/tests/direct/test_mosaic.py::test_github_author_cannot_bind_to_second_wallet"),
    "wallet_author_binding": ("if wallet_key in self.wallet_authors and self.wallet_authors[wallet_key] != author_account_id:", "if False:", "contract/tests/direct/test_mosaic.py::test_wallet_cannot_bind_to_second_github_author"),
    "terminal_target_guard": ("if terminal.get(\"status\") != \"OK\":", "if False:", "contract/tests/direct/test_mosaic.py::test_terminal_force_push_away_from_baseline_blocks_settlement"),
    "immutable_digest": ("refreshed.get(\"immutable_source_digest\") != item.get(\"immutable_source_digest\")", "refreshed.get(\"immutable_source_digest\") == item.get(\"immutable_source_digest\")", "contract/tests/direct/test_mosaic.py::test_immutable_head_substitution_blocks_resolution"),
    "capsule_commitment": ("capsule_digest = _canonical_digest(capsule)", "capsule_digest = \"0\" * 64", "contract/tests/direct/test_mosaic.py::test_seal_contribution_binds_author_wallet_and_merge"),
    "contribution_commitment": ("contribution_commitment = _canonical_digest(contribution_identity)", "contribution_commitment = _canonical_digest({\"mutated\": True})", "contract/tests/direct/test_mosaic.py::test_seal_contribution_binds_author_wallet_and_merge"),
    "resolution_terminal_root": ("\"terminal_source_digest\": terminal[\"terminal_source_digest\"]", "\"terminal_source_digest\": \"\"", "contract/tests/direct/test_terminal_commitments.py::test_empty_terminal_snapshot_is_committed_and_settles_truthfully"),
    "terminal_consensus": ("leader[\"terminal_objective_status\"] == validator[\"terminal_objective_status\"]", "True", "contract/tests/direct/test_mosaic.py::test_validator_rejects_terminal_status_only_disagreement"),
    "claimant_consensus": ("leader[\"claimant_outcome\"] == validator[\"claimant_outcome\"]", "True", "contract/tests/direct/test_mosaic.py::test_validator_rejects_claimant_outcome_only_disagreement"),
    "role_map_consensus": ("and leader[\"roles\"] == validator[\"roles\"]", "and True", "contract/tests/direct/test_mosaic.py::test_validator_rejects_role_map_disagreement"),
    "material_progress_fraction": ("released = pool * 40 // 100", "released = pool * 50 // 100", "contract/tests/direct/test_economic_properties.py::test_material_progress_uses_fixed_40_percent_before_role_weights"),
    "achieved_fraction": ("if claimant_outcome == \"ACHIEVED\":\n            released = pool", "if claimant_outcome == \"ACHIEVED\":\n            released = pool * 99 // 100", "contract/tests/direct/test_economic_properties.py::test_achieved_role_weights_conserve_full_pool"),
    "double_settlement": ("if mission[\"status\"] != \"OPEN\":\n            raise gl.vm.UserError(\"mission_not_resolvable\")", "if False:\n            raise gl.vm.UserError(\"mission_not_resolvable\")", "contract/tests/direct/test_mosaic.py::test_double_settlement_rejected"),
    "expiry_timing": ("if _now_unix() <= int(mission[\"close_at\"]) + UNRESOLVED_GRACE_SECONDS:", "if False:", "contract/tests/direct/test_state_machine_boundaries.py::test_expiry_rejects_until_grace_has_elapsed"),
    "withdraw_zero_before_transfer": ("self.balances[wallet] = \"0\"", "self.balances[wallet] = str(amount)", "contract/tests/direct/test_mosaic.py::test_withdraw_is_pull_based_and_zeroes_balance"),
    "pr_base_repository": ("if base_full_name.lower() != repo.lower():", "if False:", "contract/tests/direct/test_mosaic.py::test_pr_must_target_frozen_repository"),
    "pr_target_branch": ("if base_ref != target_ref:", "if False:", "contract/tests/direct/test_mosaic.py::test_pr_must_target_frozen_branch"),
    "pr_head_sha": ("if not _sha_ok(head_sha):", "if False:", "contract/tests/direct/test_mosaic.py::test_pr_requires_immutable_head_sha"),
    "merge_baseline_ancestry": ("if comparison_status not in {\"ahead\", \"identical\"} or merge_base_sha != baseline:", "if False:", "contract/tests/direct/test_mosaic.py::test_merge_must_descend_from_frozen_baseline"),
    "pr_file_bound": ("if changed_files > MAX_CHANGED_FILES:", "if False:", "contract/tests/direct/test_mosaic.py::test_oversized_evidence_is_explicit_and_not_retryable"),
    "pr_missing_patch": ("if missing_patch > 0:", "if False:", "contract/tests/direct/test_mosaic.py::test_missing_patch_evidence_is_not_semantically_judged"),
    "contribution_limit": ("if int(mission[\"contribution_count\"]) >= MAX_CONTRIBUTIONS:", "if False:", "contract/tests/direct/test_collection_limits.py::test_contribution_record_cap_is_enforced_at_twelve"),
    "sponsor_limit": ("if len(sponsors) >= MAX_SPONSORS:", "if False:", "contract/tests/direct/test_collection_limits.py::test_sponsor_collection_cap_is_enforced_at_sixteen"),
    "contributor_limit": ("if len(contributors) >= MAX_CONTRIBUTORS:", "if False:", "contract/tests/direct/test_collection_limits.py::test_contributor_collection_cap_is_enforced_at_eight"),
    "terminal_file_bound": ("if len(files) > MAX_TERMINAL_FILES:", "if False:", "contract/tests/direct/test_terminal_commitments.py::test_terminal_file_count_bound_fails_closed"),
    "terminal_patch_bound": ("if patch_chars > MAX_TERMINAL_PATCH_CHARS or total_changes > MAX_TERMINAL_TOTAL_CHANGES:", "if False:", "contract/tests/direct/test_terminal_commitments.py::test_terminal_patch_budget_fails_closed"),
    "terminal_change_bound": ("if patch_chars > MAX_TERMINAL_PATCH_CHARS or total_changes > MAX_TERMINAL_TOTAL_CHANGES:", "if patch_chars > MAX_TERMINAL_PATCH_CHARS or False:", "contract/tests/direct/test_terminal_commitments.py::test_terminal_total_change_budget_fails_closed"),
    "positive_outcome_role_compatibility": ("if claimant_outcome in {\"ACHIEVED\", \"MATERIAL_PROGRESS\"} and not any(ROLE_WEIGHT[role] > 0 for role in roles.values()):", "if False:", "contract/tests/direct/test_mosaic.py::test_positive_claimant_outcome_requires_positive_role"),
    "contributor_allocation_rounding": ("share = released * weight // total_weight", "share = released * weight // total_weight + 1", "contract/tests/direct/test_economic_properties.py::test_achieved_role_weights_conserve_full_pool"),
    "sponsor_allocation_rounding": ("share = residual * contributed // pool", "share = residual * contributed // pool + 1", "contract/tests/direct/test_economic_properties.py::test_sponsor_residual_rounding_is_deterministic_and_conserved"),
    "core_role_weight": ("ROLE_WEIGHT = {\"CORE\": 5, \"MAJOR\": 3, \"SUPPORTING\": 1, \"NO_CREDIT\": 0}", "ROLE_WEIGHT = {\"CORE\": 4, \"MAJOR\": 3, \"SUPPORTING\": 1, \"NO_CREDIT\": 0}", "contract/tests/direct/test_economic_properties.py::test_achieved_role_weights_conserve_full_pool"),
    "github_identifier_positive": ("if pr_number <= 0 or proof_comment_id <= 0:", "if False:", "contract/tests/direct/test_collection_limits.py::test_nonpositive_github_identifiers_are_rejected_before_source_reads"),
    "proof_comment_issue_url": ("if issue_url.lower() != expected_issue_url.lower():", "if False:", "contract/tests/direct/test_mosaic.py::test_wrong_pull_request_proof_rejected"),
    "merge_timestamp_timezone": ("if merged_dt.tzinfo is None or merged_dt.utcoffset() is None:", "if False:", "contract/tests/direct/test_mosaic.py::test_naive_merge_timestamp_rejected"),
    "resolution_schema_exact": ("if set(verdict.keys()) != {\"terminal_objective_status\", \"claimant_outcome\", \"roles\", \"rationale\"}:", "if False:", "contract/tests/direct/test_mosaic.py::test_resolution_rejects_unexpected_output_fields"),
    "no_credit_role_compatibility": ("if claimant_outcome in {\"NOT_ACHIEVED\", \"INSUFFICIENT_EVIDENCE\"} and any(ROLE_WEIGHT[role] > 0 for role in roles.values()):", "if False:", "contract/tests/direct/test_mosaic.py::test_not_achieved_cannot_store_positive_impact_role"),
    "terminal_branch_identity": ("if not isinstance(branch, dict) or str(branch.get(\"name\") or \"\") != target_ref or not _sha_ok(tip):", "if not isinstance(branch, dict) or False:", "contract/tests/direct/test_terminal_commitments.py::test_terminal_branch_wrong_name_is_insufficient"),
    "terminal_tip_sha": ("if not isinstance(branch, dict) or str(branch.get(\"name\") or \"\") != target_ref or not _sha_ok(tip):", "if not isinstance(branch, dict) or str(branch.get(\"name\") or \"\") != target_ref or False:", "contract/tests/direct/test_terminal_commitments.py::test_terminal_malformed_tip_is_insufficient"),
    "terminal_files_required": ("if not isinstance(files, list):\n        return _canonical_json({\"status\": \"INSUFFICIENT_EVIDENCE\", \"reason\": \"terminal_files_incomplete\"})", "if False:\n        return _canonical_json({\"status\": \"INSUFFICIENT_EVIDENCE\", \"reason\": \"terminal_files_incomplete\"})", "contract/tests/direct/test_terminal_commitments.py::test_terminal_missing_files_is_insufficient"),
    "terminal_patch_required": ("if not isinstance(item, dict) or item.get(\"patch\") is None:\n            return _canonical_json({\"status\": \"INSUFFICIENT_EVIDENCE\", \"reason\": \"terminal_patch_incomplete\"})", "if False:\n            return _canonical_json({\"status\": \"INSUFFICIENT_EVIDENCE\", \"reason\": \"terminal_patch_incomplete\"})", "contract/tests/direct/test_terminal_commitments.py::test_terminal_missing_patch_fails_closed"),
    "terminal_nonnegative_counts": ("if additions < 0 or deletions < 0 or changes < 0:\n            return _canonical_json({\"status\": \"INVALID\", \"reason\": \"terminal_file_counts_invalid\"})", "if False:\n            return _canonical_json({\"status\": \"INVALID\", \"reason\": \"terminal_file_counts_invalid\"})", "contract/tests/direct/test_terminal_commitments.py::test_terminal_negative_file_counts_fail_closed"),
    "terminal_baseline_ancestry": ("if not isinstance(comparison, dict) or str(comparison.get(\"status\") or \"\").lower() not in {\"ahead\", \"identical\"} or merge_base_sha != baseline:", "if False:", "contract/tests/direct/test_terminal_commitments.py::test_terminal_divergence_from_baseline_fails_closed"),
}

def main() -> int:
    source = SOURCE.read_text(encoding="utf-8")
    selected = {name for name in os.environ.get("MOSAIC_MUTANT_FILTER", "").split(",") if name}
    if selected and not selected.issubset(MUTANTS):
        raise RuntimeError("unknown mutant filter")
    active = {name: value for name, value in MUTANTS.items() if not selected or name in selected}
    if not os.environ.get("MOSAIC_MUTANT_SKIP_CONTROL"):
        control = subprocess.run([sys.executable, "-m", "pytest", "contract/tests/direct", "-q"], cwd=ROOT, check=False)
        if control.returncode:
            print("control failed")
            return control.returncode
    killed, survivors = [], []
    with tempfile.TemporaryDirectory(prefix="mosaic-mutants-") as directory:
        for name, (old, new, target) in active.items():
            if source.count(old) != 1:
                raise RuntimeError(f"non-unique mutant target: {name}")
            path = Path(directory) / f"{name}.py"
            path.write_text(source.replace(old, new), encoding="utf-8", newline="\n")
            env = dict(os.environ, MOSAIC_MUTANT_CONTRACT=str(path))
            result = subprocess.run([sys.executable, "-m", "pytest", target, "-q"], cwd=ROOT, env=env, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
            (killed if result.returncode else survivors).append(name)
    report = {"total": len(active), "killed": killed, "surviving": survivors, "equivalent": []}
    REPORT.write_text(json.dumps(report, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    print(f"mutants total={len(active)} killed={len(killed)} surviving={len(survivors)} equivalent=0")
    if survivors:
        print("surviving=" + ",".join(survivors))
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
