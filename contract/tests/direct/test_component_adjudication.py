import json

import pytest

from helpers import checkpoint_then_freeze, mock_baseline, mock_pr, mock_terminal, set_block_time

WEI = 10**18


def _open_frozen(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice
    direct_vm.value = WEI
    mock_baseline(direct_vm)
    mission_id = contract.open_mission(
        mission_terms["repo"], mission_terms["target_ref"], mission_terms["baseline"],
        mission_terms["title"], mission_terms["objective"],
        json.dumps(mission_terms["criteria"]), 1791201600,
    )
    set_block_time(direct_vm, "2026-10-05T12:30:00Z")
    direct_vm.value = 0
    direct_vm.clear_mocks()
    mock_terminal(direct_vm)
    assert checkpoint_then_freeze(contract, mission_id) == "terminal_frozen"
    mission = json.loads(contract.get_mission(mission_id))
    source_ref = json.loads(mission["frozen_evidence"]["terminal_state_json"])["evidence_objects"][0]["id"]
    return contract, mission_id, source_ref


def _criterion_response(source_ref, terminal="SATISFIED", claimant="NOT_SATISFIED"):
    return json.dumps({
        "terminal_status": terminal,
        "claimant_status": claimant,
        "evidence_refs": [source_ref],
        "support_refs": [],
        "counter_refs": [],
        "causal_status": "UNSPECIFIED",
        "reason_code": "IMPLEMENTATION",
        "rationale": "Frozen implementation evidence.",
    })


def test_each_criterion_is_immutable_after_consensus(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id, source_ref = _open_frozen(direct_vm, direct_deploy, direct_alice, mission_terms)
    direct_vm.mock_llm(r'"kind": "CRITERION"', _criterion_response(source_ref))
    assert contract.adjudicate_criterion(mission_id, 0) == "criterion_adjudicated"
    with direct_vm.expect_revert("criterion_already_adjudicated"):
        contract.adjudicate_criterion(mission_id, 0)


def test_finalization_requires_all_criteria_and_roles(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id, source_ref = _open_frozen(direct_vm, direct_deploy, direct_alice, mission_terms)
    direct_vm.mock_llm(r'"kind": "CRITERION"', _criterion_response(source_ref))
    assert contract.adjudicate_criterion(mission_id, 0) == "criterion_adjudicated"
    with direct_vm.expect_revert("criteria_incomplete"):
        contract.finalize_adjudication(mission_id)


def test_finalized_settlement_is_deterministic_and_one_time(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id, source_ref = _open_frozen(direct_vm, direct_deploy, direct_alice, mission_terms)
    direct_vm.mock_llm(r'"kind": "CRITERION"', _criterion_response(source_ref))
    assert contract.adjudicate_criterion(mission_id, 0) == "criterion_adjudicated"
    assert contract.adjudicate_criterion(mission_id, 1) == "criterion_adjudicated"
    assert contract.finalize_adjudication(mission_id) == "adjudication_finalized"
    assert contract.settle_finalized(mission_id) == "settled_finalized"
    with direct_vm.expect_revert("mission_not_frozen"):
        contract.settle_finalized(mission_id)


def test_unregistered_role_wallet_is_rejected(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id, _ = _open_frozen(direct_vm, direct_deploy, direct_alice, mission_terms)
    with direct_vm.expect_revert("unregistered_wallet"):
        contract.adjudicate_role(mission_id, "0x0000000000000000000000000000000000000001")


def test_checkpoint_source_failure_is_retryable(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice
    direct_vm.value = WEI
    mock_baseline(direct_vm)
    mission_id = contract.open_mission(
        mission_terms["repo"], mission_terms["target_ref"], mission_terms["baseline"],
        mission_terms["title"], mission_terms["objective"],
        json.dumps(mission_terms["criteria"]), 1791201600,
    )
    set_block_time(direct_vm, "2026-10-05T12:30:00Z")
    direct_vm.value = 0
    direct_vm.clear_mocks()
    direct_vm.mock_web(r"api\.github\.com/repos/acme/widget/branches/main$", {"status": 503, "body": "{}"})
    assert contract.checkpoint_terminal(mission_id) == "source_unavailable"


def test_checkpoint_malformed_terminal_tip_is_rejected(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice
    direct_vm.value = WEI
    mock_baseline(direct_vm)
    mission_id = contract.open_mission(
        mission_terms["repo"], mission_terms["target_ref"], mission_terms["baseline"],
        mission_terms["title"], mission_terms["objective"],
        json.dumps(mission_terms["criteria"]), 1791201600,
    )
    set_block_time(direct_vm, "2026-10-05T12:30:00Z")
    direct_vm.value = 0
    direct_vm.clear_mocks()
    mock_terminal(direct_vm, terminal_sha="malformed")
    assert contract.checkpoint_terminal(mission_id) == "insufficient_evidence"


def test_github_check_terminal_status_is_bound(direct_vm, direct_deploy, direct_alice, mission_terms):
    """The frozen check identity and conclusion determine the component status."""
    terms = {**mission_terms, "criteria": [{
        "text": "the verification check passes",
        "evidence_kind": "GITHUB_CHECK",
        "check_name": "verify",
        "check_app_slug": "github-actions",
    }]}
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice
    direct_vm.value = WEI
    mock_baseline(direct_vm)
    mission_id = contract.open_mission(
        terms["repo"], terms["target_ref"], terms["baseline"], terms["title"],
        terms["objective"], json.dumps(terms["criteria"]), 1791201600,
    )
    set_block_time(direct_vm, "2026-10-05T12:30:00Z")
    direct_vm.value = 0
    direct_vm.clear_mocks()
    mock_terminal(direct_vm)
    direct_vm.mock_web(r".*check-runs.*", {"status": 200, "body": json.dumps({
        "total_count": 1,
        "check_runs": [{"id": 42, "name": "verify", "app": {"slug": "github-actions"},
                         "head_sha": "d" * 40, "status": "completed", "conclusion": "success"}],
    })})
    assert checkpoint_then_freeze(contract, mission_id) == "terminal_frozen"
    frozen = json.loads(contract.get_mission(mission_id))
    terminal = json.loads(frozen["frozen_evidence"]["terminal_state_json"])
    check_ref = next(item["id"] for item in terminal["evidence_objects"] if item["kind"] == "GITHUB_CHECK")
    direct_vm.mock_llm(r'"kind": "CRITERION"', json.dumps({
        "terminal_status": "NOT_SATISFIED",
        "claimant_status": "NOT_SATISFIED",
        "evidence_refs": [check_ref],
        "support_refs": [], "counter_refs": [], "causal_status": "UNSPECIFIED",
        "reason_code": "CHECK", "rationale": "Frozen check is authoritative.",
    }))
    assert contract.adjudicate_criterion(mission_id, 0) == "criterion_adjudicated"
    result = json.loads(contract.get_mission(mission_id))
    row = result["criterion_results"][0]
    assert row["criterion_index"] == 0
    assert row["terminal_status"] == "SATISFIED"
    assert check_ref in row["evidence_refs"]


def test_github_check_failure_cannot_be_positive(direct_vm, direct_deploy, direct_alice, mission_terms):
    terms = {**mission_terms, "criteria": [{"text": "verification fails closed", "evidence_kind": "GITHUB_CHECK", "check_name": "verify", "check_app_slug": "github-actions"}]}
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice; direct_vm.value = WEI; mock_baseline(direct_vm)
    mission_id = contract.open_mission(terms["repo"], terms["target_ref"], terms["baseline"], terms["title"], terms["objective"], json.dumps(terms["criteria"]), 1791201600)
    set_block_time(direct_vm, "2026-10-05T12:30:00Z"); direct_vm.value = 0; direct_vm.clear_mocks(); mock_terminal(direct_vm)
    direct_vm.mock_web(r".*check-runs.*", {"status": 200, "body": json.dumps({"total_count": 1, "check_runs": [{"id": 43, "name": "verify", "app": {"slug": "github-actions"}, "head_sha": "d" * 40, "status": "completed", "conclusion": "failure"}]})})
    assert checkpoint_then_freeze(contract, mission_id) == "terminal_frozen"
    frozen = json.loads(contract.get_mission(mission_id)); terminal = json.loads(frozen["frozen_evidence"]["terminal_state_json"])
    check_ref = next(item["id"] for item in terminal["evidence_objects"] if item["kind"] == "GITHUB_CHECK")
    direct_vm.mock_llm(r'"kind": "CRITERION"', json.dumps({"terminal_status": "SATISFIED", "claimant_status": "NOT_SATISFIED", "evidence_refs": [check_ref], "support_refs": [], "counter_refs": [], "causal_status": "UNSPECIFIED", "reason_code": "CHECK", "rationale": "A failed check cannot be positive."}))
    assert contract.adjudicate_criterion(mission_id, 0) == "criterion_adjudicated"
    result = json.loads(contract.get_mission(mission_id))
    assert result["criterion_results"][0]["terminal_status"] == "NOT_SATISFIED"


def test_github_check_evidence_is_bound_to_criterion(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.mock_llm(r'"kind": "CRITERION"', json.dumps({
        "terminal_status": "SATISFIED", "claimant_status": "NOT_SATISFIED",
        "evidence_refs": ["check:0:51"], "support_refs": [], "counter_refs": [],
        "causal_status": "UNSPECIFIED", "reason_code": "CHECK", "rationale": "wrong criterion evidence",
    }))
    allowed = {
        "__kind": "GITHUB_CHECK",
        "check:0:51": {"kind": "GITHUB_CHECK", "criterion_index": 0},
        "check:1:52": {"kind": "GITHUB_CHECK", "criterion_index": 1},
    }
    with direct_vm.expect_revert("component_invalid_status"):
        contract._run_component("{\"kind\":\"CRITERION\"}", "CRITERION", 1, allowed=allowed, check_kind=True)
