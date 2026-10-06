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
