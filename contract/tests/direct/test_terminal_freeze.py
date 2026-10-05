import json
import pytest

from helpers import mock_baseline, mock_pr, mock_terminal, set_block_time

WEI = 10**18
EARLIEST = 1791201600


def address(account):
    return "0x" + account.hex() if isinstance(account, bytes) else account.as_hex.lower()


def create(vm, deploy, sponsor, terms):
    set_block_time(vm, "2026-10-01T10:00:00Z")
    contract = deploy("contract/contracts/mosaic.py")
    vm.sender = sponsor
    vm.value = WEI
    mock_baseline(vm)
    mission_id = contract.open_mission(terms["repo"], terms["target_ref"], terms["baseline"], terms["title"], terms["objective"], json.dumps(terms["criteria"]), EARLIEST)
    vm.value = 0
    return contract, mission_id


def test_freeze_is_permissionless_atomic_and_ends_eligibility(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    contract, mission_id = create(direct_vm, direct_deploy, direct_alice, mission_terms)
    with direct_vm.expect_revert("freeze_not_yet_allowed"):
        contract.freeze_terminal(mission_id)
    set_block_time(direct_vm, "2026-10-06T00:00:00Z")
    direct_vm.sender = direct_bob
    direct_vm.clear_mocks()
    mock_terminal(direct_vm)
    direct_vm.value = WEI
    assert contract.add_funding(mission_id) == f"funded_{WEI}"
    direct_vm.value = 0
    assert contract.freeze_terminal(mission_id) == "terminal_frozen"
    mission = json.loads(contract.get_mission(mission_id))
    assert mission["status"] == "TERMINAL_FROZEN"
    assert mission["freeze_not_before"] == EARLIEST
    assert mission["closed_at"] > EARLIEST
    assert "close_at" not in mission
    assert mission["frozen_evidence"] is not None
    assert len(mission["frozen_evidence_digest"]) == 64
    with direct_vm.expect_revert("mission_not_freezable"):
        contract.freeze_terminal(mission_id)
    direct_vm.value = WEI
    with direct_vm.expect_revert("mission_not_open"):
        contract.add_funding(mission_id)
    direct_vm.value = 0
    with direct_vm.expect_revert("mission_not_open"):
        contract.seal_contribution(mission_id, 7, 99)


def test_freeze_outage_keeps_eligibility_open_without_partial_snapshot(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    contract, mission_id = create(direct_vm, direct_deploy, direct_alice, mission_terms)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks()
    direct_vm.mock_web(r"api\.github\.com/.*", {"status": 503, "body": "{}"})
    assert contract.freeze_terminal(mission_id) == "source_unavailable"
    mission = json.loads(contract.get_mission(mission_id))
    assert mission["status"] == "OPEN"
    assert mission["closed_at"] == 0
    assert mission["frozen_evidence"] is None
    assert mission["terminal_tip_sha"] == ""
    assert contract.get_balance(address(direct_alice)) == "0"
    direct_vm.sender = direct_bob
    direct_vm.value = WEI
    assert contract.add_funding(mission_id) == f"funded_{WEI}"
    direct_vm.value = 0
    direct_vm.clear_mocks()
    mock_pr(direct_vm, int(mission_id), address(direct_bob), merged_at="2026-10-06T09:00:00Z")
    assert contract.seal_contribution(mission_id, 7, 99) == "sealed_0"
    # The immutable revalidation has the same real merge timestamp on retry.
    assert contract.freeze_terminal(mission_id) == "terminal_frozen"
    assert json.loads(contract.get_mission(mission_id))["closed_at"] > EARLIEST


def test_delayed_resolution_uses_frozen_prompt_despite_branch_change(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = create(direct_vm, direct_deploy, direct_alice, mission_terms)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks()
    mock_terminal(direct_vm, terminal_sha="d" * 40)
    assert contract.freeze_terminal(mission_id) == "terminal_frozen"
    before = json.loads(contract.get_mission(mission_id))
    set_block_time(direct_vm, "2026-10-25T10:00:00Z")
    direct_vm.clear_mocks()
    mock_terminal(direct_vm, terminal_sha="e" * 40)
    # No generic model mock: settlement succeeds only if the frozen SHA reaches judgment.
    direct_vm.mock_llm(r"(?s)allocating a funded open-source engineering mission.*" + "d" * 40,
        json.dumps({"terminal_objective_status": "ACHIEVED", "claimant_outcome": "NOT_ACHIEVED", "roles": {}, "rationale": "Outside work satisfies the frozen target; no eligible claimant."}))
    assert contract.resolve_mission(mission_id) == "settled_not_achieved"
    after = json.loads(contract.get_mission(mission_id))
    for key in ("closed_at", "terminal_tip_sha", "terminal_source_digest", "terminal_lineage_root", "ordered_contribution_root", "resolution_evidence_root", "frozen_evidence", "frozen_evidence_digest"):
        assert after[key] == before[key]
    assert after["terminal_tip_sha"] == "d" * 40
    assert after["residual_wei"] == str(WEI)


def test_resolution_has_no_public_source_acquisition():
    import ast
    import os
    from pathlib import Path

    path = Path(os.environ.get("MOSAIC_MUTANT_CONTRACT", "contract/contracts/mosaic.py"))
    tree = ast.parse(path.read_text(encoding="utf-8"))
    method = next(node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef) and node.name == "resolve_mission")
    names = {node.id for node in ast.walk(method) if isinstance(node, ast.Name)}
    assert not names.intersection({"_fetch_terminal_state", "_fetch_terminal_lineage", "_fetch_immutable_pr_evidence", "_read_json_url"})
    assert "web" not in {node.attr for node in ast.walk(method) if isinstance(node, ast.Attribute)}


def test_typed_check_plan_is_frozen_and_missing_check_cannot_pass(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice
    direct_vm.value = WEI
    mock_baseline(direct_vm)
    criteria = [{"text": "the verification check passes", "evidence_kind": "GITHUB_CHECK", "check_name": "verify", "check_app_slug": "github-actions"}]
    mission_id = contract.open_mission(mission_terms["repo"], mission_terms["target_ref"], mission_terms["baseline"], mission_terms["title"], mission_terms["objective"], json.dumps(criteria), EARLIEST)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks()
    mock_terminal(direct_vm)
    direct_vm.mock_web(r".*check-runs.*", {"status": 200, "body": json.dumps({"total_count": 0, "check_runs": []})})
    assert contract.freeze_terminal(mission_id) == "insufficient_evidence"
    assert json.loads(contract.get_mission(mission_id))["status"] == "OPEN"


def test_duplicate_named_check_matches_fail_closed(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice; direct_vm.value = WEI; mock_baseline(direct_vm)
    criteria = [{"text": "the verification check passes", "evidence_kind": "GITHUB_CHECK", "check_name": "verify", "check_app_slug": "github-actions"}]
    mission_id = contract.open_mission(mission_terms["repo"], mission_terms["target_ref"], mission_terms["baseline"], mission_terms["title"], mission_terms["objective"], json.dumps(criteria), EARLIEST)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z"); direct_vm.clear_mocks(); mock_terminal(direct_vm)
    direct_vm.mock_web(r".*check-runs.*", {"status": 200, "body": json.dumps({"total_count": 1, "check_runs": [
        {"id": 42, "name": "verify", "app": {"slug": "github-actions"}, "head_sha": "d" * 40, "status": "completed", "conclusion": "success"},
        {"id": 43, "name": "verify", "app": {"slug": "github-actions"}, "head_sha": "d" * 40, "status": "completed", "conclusion": "success"},
    ]})})
    assert contract.freeze_terminal(mission_id) == "insufficient_evidence"


def test_failed_named_check_is_committed_as_negative_evidence(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice
    direct_vm.value = WEI
    mock_baseline(direct_vm)
    criteria = [{"text": "the verification check passes", "evidence_kind": "GITHUB_CHECK", "check_name": "verify", "check_app_slug": "github-actions"}]
    mission_id = contract.open_mission(mission_terms["repo"], mission_terms["target_ref"], mission_terms["baseline"], mission_terms["title"], mission_terms["objective"], json.dumps(criteria), EARLIEST)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks()
    mock_terminal(direct_vm)
    direct_vm.mock_web(r".*check-runs.*", {"status": 200, "body": json.dumps({"total_count": 1, "check_runs": [{"id": 42, "name": "verify", "app": {"slug": "github-actions"}, "head_sha": "d" * 40, "status": "completed", "conclusion": "failure"}]})})
    assert contract.freeze_terminal(mission_id) == "terminal_frozen"
    evidence = json.loads(json.loads(contract.get_mission(mission_id))["frozen_evidence"]["terminal_state_json"])
    assert evidence["required_checks"][0]["conclusion"] == "failure"


def test_schema_valid_matrix_cannot_cite_fabricated_evidence(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = create(direct_vm, direct_deploy, direct_alice, mission_terms)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks(); mock_terminal(direct_vm)
    assert contract.freeze_terminal(mission_id) == "terminal_frozen"
    mission = json.loads(contract.get_mission(mission_id))
    criteria = mission["criteria"]
    forged = {
        "criteria": [{"criterion_index": index, "terminal_status": "SATISFIED", "claimant_status": "NOT_SATISFIED", "evidence_refs": ["source:forged"]} for index in range(len(criteria))],
        "roles": {},
        "rationale": "The repository text contains instructions, but they are not evidence.",
    }
    direct_vm.mock_llm(r"allocating a funded open-source engineering mission", json.dumps(forged))
    with direct_vm.expect_revert("invalid_resolution_judgment"):
        contract.resolve_mission(mission_id)


def test_schema_valid_matrix_must_cover_every_frozen_criterion(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = create(direct_vm, direct_deploy, direct_alice, mission_terms)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks(); mock_terminal(direct_vm)
    assert contract.freeze_terminal(mission_id) == "terminal_frozen"
    forged = {"criteria": [], "roles": {}, "rationale": "Missing criterion rows cannot establish the objective."}
    direct_vm.mock_llm(r"allocating a funded open-source engineering mission", json.dumps(forged))
    with direct_vm.expect_revert("invalid_resolution_judgment"):
        contract.resolve_mission(mission_id)


def test_failed_required_check_cannot_be_overridden_by_valid_matrix(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice; direct_vm.value = WEI; mock_baseline(direct_vm)
    criteria = [{"text": "the verification check passes", "evidence_kind": "GITHUB_CHECK", "check_name": "verify", "check_app_slug": "github-actions"}]
    mission_id = contract.open_mission(mission_terms["repo"], mission_terms["target_ref"], mission_terms["baseline"], mission_terms["title"], mission_terms["objective"], json.dumps(criteria), EARLIEST)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z"); direct_vm.clear_mocks(); mock_terminal(direct_vm)
    direct_vm.mock_web(r".*check-runs.*", {"status": 200, "body": json.dumps({"total_count": 1, "check_runs": [{"id": 42, "name": "verify", "app": {"slug": "github-actions"}, "head_sha": "d" * 40, "status": "completed", "conclusion": "failure"}]})})
    assert contract.freeze_terminal(mission_id) == "terminal_frozen"
    mission = json.loads(contract.get_mission(mission_id))
    evidence = json.loads(mission["frozen_evidence"]["terminal_state_json"])
    check_ref = next(item["id"] for item in evidence["evidence_objects"] if item.get("id", "").startswith("check:"))
    verdict = {"criteria": [{"criterion_index": 0, "terminal_status": "SATISFIED", "claimant_status": "NOT_SATISFIED", "evidence_refs": [check_ref]}], "roles": {}, "rationale": "A failed check cannot be rewritten by prose."}
    direct_vm.mock_llm(r"allocating a funded open-source engineering mission", json.dumps(verdict))
    with direct_vm.expect_revert("invalid_resolution_judgment"):
        contract.resolve_mission(mission_id)


def _check_mission(vm, deploy, sponsor, terms, conclusion):
    criteria = [{"text": "the verification check passes", "evidence_kind": "GITHUB_CHECK", "check_name": "verify", "check_app_slug": "github-actions"}]
    terms = {**terms, "criteria": criteria}
    contract, mission_id = create(vm, deploy, sponsor, terms)
    set_block_time(vm, "2026-10-06T10:00:00Z")
    vm.clear_mocks(); mock_terminal(vm)
    vm.mock_web(r".*check-runs.*", {"status": 200, "body": json.dumps({"total_count": 1, "check_runs": [{"id": 42, "name": "verify", "app": {"slug": "github-actions"}, "head_sha": "d" * 40, "status": "completed", "conclusion": conclusion}]})})
    assert contract.freeze_terminal(mission_id) == "terminal_frozen"
    mission = json.loads(contract.get_mission(mission_id))
    check_ref = next(item["id"] for item in json.loads(mission["frozen_evidence"]["terminal_state_json"])["evidence_objects"] if item["kind"] == "GITHUB_CHECK")
    return contract, mission_id, check_ref


@pytest.mark.parametrize("terminal_status", ["NOT_SATISFIED", "PARTIAL", "UNVERIFIABLE"])
def test_successful_machine_check_cannot_be_downgraded_by_matrix(direct_vm, direct_deploy, direct_alice, mission_terms, terminal_status):
    contract, mission_id, check_ref = _check_mission(direct_vm, direct_deploy, direct_alice, mission_terms, "success")
    verdict = {"criteria": [{"criterion_index": 0, "terminal_status": terminal_status, "claimant_status": "NOT_SATISFIED", "evidence_refs": [check_ref]}], "roles": {}, "rationale": "The frozen machine result is authoritative."}
    direct_vm.mock_llm(r"allocating a funded open-source engineering mission", json.dumps(verdict))
    with direct_vm.expect_revert("invalid_resolution_judgment"):
        contract.resolve_mission(mission_id)


def test_successful_machine_check_accepts_satisfied_matrix(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id, check_ref = _check_mission(direct_vm, direct_deploy, direct_alice, mission_terms, "success")
    verdict = {"criteria": [{"criterion_index": 0, "terminal_status": "SATISFIED", "claimant_status": "NOT_SATISFIED", "evidence_refs": [check_ref]}], "roles": {}, "rationale": "The frozen machine result is authoritative."}
    direct_vm.mock_llm(r"allocating a funded open-source engineering mission", json.dumps(verdict))
    assert contract.resolve_mission(mission_id) == "settled_not_achieved"


def test_failed_machine_check_accepts_only_not_satisfied(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id, check_ref = _check_mission(direct_vm, direct_deploy, direct_alice, mission_terms, "failure")
    verdict = {"criteria": [{"criterion_index": 0, "terminal_status": "NOT_SATISFIED", "claimant_status": "NOT_SATISFIED", "evidence_refs": [check_ref]}], "roles": {}, "rationale": "The failed frozen check remains negative."}
    direct_vm.mock_llm(r"allocating a funded open-source engineering mission", json.dumps(verdict))
    assert contract.resolve_mission(mission_id) == "settled_not_achieved"


def test_check_evidence_from_another_criterion_is_rejected(direct_vm, direct_deploy, direct_alice, mission_terms):
    criteria = [
        {"text": "first check", "evidence_kind": "GITHUB_CHECK", "check_name": "verify", "check_app_slug": "github-actions"},
        {"text": "second check", "evidence_kind": "GITHUB_CHECK", "check_name": "lint", "check_app_slug": "github-actions"},
    ]
    contract, mission_id = create(direct_vm, direct_deploy, direct_alice, {**mission_terms, "criteria": criteria})
    set_block_time(direct_vm, "2026-10-06T10:00:00Z"); direct_vm.clear_mocks(); mock_terminal(direct_vm)
    direct_vm.mock_web(r".*check-runs.*", {"status": 200, "body": json.dumps({"total_count": 2, "check_runs": [
        {"id": 42, "name": "verify", "app": {"slug": "github-actions"}, "head_sha": "d" * 40, "status": "completed", "conclusion": "success"},
        {"id": 43, "name": "lint", "app": {"slug": "github-actions"}, "head_sha": "d" * 40, "status": "completed", "conclusion": "success"},
    ]})})
    assert contract.freeze_terminal(mission_id) == "terminal_frozen"
    mission = json.loads(contract.get_mission(mission_id)); evidence = json.loads(mission["frozen_evidence"]["terminal_state_json"])
    verify_ref = next(item["id"] for item in evidence["evidence_objects"] if item.get("run_id") == 42)
    verdict = {"criteria": [{"criterion_index": 0, "terminal_status": "SATISFIED", "claimant_status": "NOT_SATISFIED", "evidence_refs": [verify_ref]}, {"criterion_index": 1, "terminal_status": "SATISFIED", "claimant_status": "NOT_SATISFIED", "evidence_refs": [verify_ref]}], "roles": {}, "rationale": "Each machine criterion must cite its own frozen check."}
    direct_vm.mock_llm(r"allocating a funded open-source engineering mission", json.dumps(verdict))
    with direct_vm.expect_revert("invalid_resolution_judgment"):
        contract.resolve_mission(mission_id)
