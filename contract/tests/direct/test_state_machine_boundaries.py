from helpers import freeze_then_resolve
import json

import pytest

from helpers import mock_baseline, mock_pr, mock_terminal, set_block_time

WEI = 10**18


def wallet(addr):
    return "0x" + addr.hex() if isinstance(addr, bytes) else addr.as_hex.lower()


def valid_args(terms):
    return [terms["repo"], terms["target_ref"], terms["baseline"], terms["title"], terms["objective"], json.dumps(terms["criteria"]), 1791201600]


def open_mission(contract, vm, sender, terms, amount=10 * WEI):
    vm.sender = sender; vm.value = amount
    mock_baseline(vm, terms["repo"], terms["baseline"], terms["target_ref"])
    return contract.open_mission(*valid_args(terms))


@pytest.mark.parametrize(
    ("change", "error"),
    [
        (lambda args: args.__setitem__(0, "invalid repo"), "invalid_repository"),
        (lambda args: args.__setitem__(1, "../main"), "invalid_target_ref"),
        (lambda args: args.__setitem__(2, "not-a-sha"), "invalid_baseline_sha"),
        (lambda args: args.__setitem__(3, ""), "invalid_title"),
        (lambda args: args.__setitem__(3, "x" * 121), "invalid_title"),
        (lambda args: args.__setitem__(4, ""), "invalid_objective"),
        (lambda args: args.__setitem__(4, "x" * 1201), "invalid_objective"),
        (lambda args: args.__setitem__(5, "not-json"), "criteria_not_json"),
        (lambda args: args.__setitem__(5, "[]"), "invalid_criteria_count"),
        (lambda args: args.__setitem__(5, json.dumps(["a"] * 6)), "invalid_criteria_count"),
        (lambda args: args.__setitem__(5, json.dumps([""])), "invalid_criterion"),
        (lambda args: args.__setitem__(5, json.dumps(["x" * 321])), "invalid_criterion"),
        (lambda args: args.__setitem__(6, 1), "invalid_mission_duration"),
        (lambda args: args.__setitem__(6, 2000000000), "invalid_mission_duration"),
    ],
)
def test_open_mission_rejects_each_frozen_term_boundary(direct_vm, direct_deploy, direct_alice, mission_terms, change, error):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice; direct_vm.value = 10 * WEI
    args = valid_args(mission_terms); change(args)
    with direct_vm.expect_revert(error):
        contract.open_mission(*args)


def test_open_mission_rejects_funding_below_protocol_minimum(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice; direct_vm.value = WEI - 1
    with direct_vm.expect_revert("funding_below_minimum"):
        contract.open_mission(*valid_args(mission_terms))


def test_add_funding_rejects_after_close(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z"); direct_vm.sender = direct_bob; direct_vm.value = WEI
    direct_vm.value = 0
    direct_vm.clear_mocks()
    mock_terminal(direct_vm)
    assert contract.freeze_terminal(mission_id) == "terminal_frozen"
    direct_vm.value = WEI
    with direct_vm.expect_revert("mission_not_open"):
        contract.add_funding(mission_id)


def test_seal_contribution_rejects_after_close(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z"); direct_vm.sender = direct_bob; direct_vm.value = 0
    direct_vm.clear_mocks()
    mock_terminal(direct_vm)
    assert contract.freeze_terminal(mission_id) == "terminal_frozen"
    with direct_vm.expect_revert("mission_not_open"):
        contract.seal_contribution(mission_id, 7, 99)


def test_resolve_rejects_until_terminal_freeze(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    with direct_vm.expect_revert("mission_not_resolvable"):
        contract.resolve_mission(mission_id)


def test_expiry_rejects_until_grace_has_elapsed(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    set_block_time(direct_vm, "2026-10-20T10:00:00Z")
    with direct_vm.expect_revert("resolution_grace_active"):
        contract.expire_unresolved(mission_id)


def test_settled_mission_rejects_funding_and_expiry(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0; set_block_time(direct_vm, "2026-10-06T10:00:00Z"); direct_vm.clear_mocks()
    mock_terminal(direct_vm)
    direct_vm.mock_llm(r"allocating a funded open-source engineering mission", json.dumps({"terminal_objective_status": "NOT_ACHIEVED", "claimant_outcome": "NOT_ACHIEVED", "roles": {}, "rationale": "No claimant portfolio exists."}))
    assert freeze_then_resolve(contract, mission_id) == "settled_not_achieved"
    direct_vm.sender = direct_alice; direct_vm.value = WEI
    with direct_vm.expect_revert("mission_not_open"):
        contract.add_funding(mission_id)
    with direct_vm.expect_revert("mission_not_expirable"):
        contract.expire_unresolved(mission_id)


def test_expired_mission_rejects_resolution(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0; set_block_time(direct_vm, "2026-11-10T10:00:00Z")
    assert contract.expire_unresolved(mission_id) == "expired_refunded"
    with direct_vm.expect_revert("mission_not_resolvable"):
        freeze_then_resolve(contract, mission_id)


def test_source_failure_can_retry_to_a_terminal_settlement(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0; set_block_time(direct_vm, "2026-10-06T10:00:00Z"); direct_vm.clear_mocks()
    direct_vm.mock_web(r"api\.github\.com/repos/acme/widget/branches/main$", {"status": 503, "body": "{}"})
    assert freeze_then_resolve(contract, mission_id) == "source_unavailable"
    direct_vm.clear_mocks(); mock_terminal(direct_vm)
    direct_vm.mock_llm(r"allocating a funded open-source engineering mission", json.dumps({"terminal_objective_status": "NOT_ACHIEVED", "claimant_outcome": "NOT_ACHIEVED", "roles": {}, "rationale": "No claimant portfolio exists."}))
    assert freeze_then_resolve(contract, mission_id) == "settled_not_achieved"
    mission = json.loads(contract.get_mission(mission_id))
    assert mission["freeze_attempts"] == 2
    assert mission["resolution_attempts"] == 1
