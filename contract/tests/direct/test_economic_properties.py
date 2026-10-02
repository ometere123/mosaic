import json

import pytest

from helpers import mock_baseline, mock_lineage, mock_pr, set_block_time

WEI = 10**18


def wallet(addr):
    return "0x" + addr.hex() if isinstance(addr, bytes) else addr.as_hex.lower()


def open_mission(contract, vm, sender, terms, amount):
    vm.sender = sender; vm.value = amount
    mock_baseline(vm, terms["repo"], terms["baseline"], terms["target_ref"])
    return contract.open_mission(terms["repo"], terms["target_ref"], terms["baseline"], terms["title"], terms["objective"], json.dumps(terms["criteria"]), 1791201600)


def seal_two(contract, vm, mission_id, bob, charlie):
    vm.value = 0; vm.sender = bob
    mock_pr(vm, int(mission_id), wallet(bob), pr_number=7, comment_id=99, author="bob")
    assert contract.seal_contribution(mission_id, 7, 99) == "sealed_0"
    vm.clear_mocks(); vm.sender = charlie
    mock_pr(vm, int(mission_id), wallet(charlie), pr_number=8, comment_id=100, author="charlie")
    assert contract.seal_contribution(mission_id, 8, 100) == "sealed_1"


def resolve_two(contract, vm, mission_id, bob, charlie, terminal, claimant, bob_role, charlie_role):
    set_block_time(vm, "2026-10-06T10:00:00Z"); vm.clear_mocks()
    mock_pr(vm, int(mission_id), wallet(bob), pr_number=7, comment_id=99, author="bob")
    mock_pr(vm, int(mission_id), wallet(charlie), pr_number=8, comment_id=100, author="charlie")
    mock_lineage(vm, "acme/widget", "b" * 40, "0" * 39 + "8")
    mock_lineage(vm, "acme/widget", "0" * 39 + "8", "0" * 39 + "8")
    mock_lineage(vm, "acme/widget", "b" * 40, "b" * 40)
    mock_lineage(vm, "acme/widget", "0" * 39 + "8", "b" * 40)
    vm.mock_llm(r"allocating a funded open-source engineering mission", json.dumps({
        "terminal_objective_status": terminal,
        "claimant_outcome": claimant,
        "roles": {wallet(bob): bob_role, wallet(charlie): charlie_role},
        "rationale": "Deterministic role-weight property case.",
    }))
    return contract.resolve_mission(mission_id)


@pytest.mark.parametrize(
    ("bob_role", "charlie_role", "expected_bob", "expected_charlie"),
    [
        ("CORE", "CORE", 50, 50),
        ("CORE", "MAJOR", 62, 37),
        ("MAJOR", "SUPPORTING", 75, 25),
        ("SUPPORTING", "SUPPORTING", 50, 50),
    ],
)
def test_achieved_role_weights_conserve_full_pool(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, mission_terms, bob_role, charlie_role, expected_bob, expected_charlie):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms, 100 * WEI)
    seal_two(contract, direct_vm, mission_id, direct_bob, direct_charlie)
    assert resolve_two(contract, direct_vm, mission_id, direct_bob, direct_charlie, "ACHIEVED", "ACHIEVED", bob_role, charlie_role) == "settled_achieved"
    bob_balance = int(contract.get_balance(wallet(direct_bob)))
    charlie_balance = int(contract.get_balance(wallet(direct_charlie)))
    assert bob_balance == expected_bob * WEI + (500_000_000_000_000_000 if (bob_role, charlie_role) == ("CORE", "MAJOR") else 0)
    assert charlie_balance == expected_charlie * WEI + (500_000_000_000_000_000 if (bob_role, charlie_role) == ("CORE", "MAJOR") else 0)
    assert bob_balance + charlie_balance == 100 * WEI


def test_material_progress_uses_fixed_40_percent_before_role_weights(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms, 100 * WEI)
    seal_two(contract, direct_vm, mission_id, direct_bob, direct_charlie)
    assert resolve_two(contract, direct_vm, mission_id, direct_bob, direct_charlie, "ACHIEVED", "MATERIAL_PROGRESS", "CORE", "MAJOR") == "settled_material_progress"
    assert int(contract.get_balance(wallet(direct_bob))) == 25 * WEI
    assert int(contract.get_balance(wallet(direct_charlie))) == 15 * WEI
    assert int(contract.get_balance(wallet(direct_alice))) == 60 * WEI


@pytest.mark.parametrize("funds", [(50, 30, 20), (34, 33, 33), (1, 1, 1)])
def test_sponsor_residual_rounding_is_deterministic_and_conserved(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, mission_terms, funds):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms, funds[0] * WEI)
    for sponsor, amount in ((direct_charlie, funds[1]), (direct_bob, funds[2])):
        direct_vm.sender = sponsor; direct_vm.value = amount * WEI
        assert contract.add_funding(mission_id) == f"funded_{amount * WEI}"
    direct_vm.value = 0; direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), author="bob")
    contract.seal_contribution(mission_id, 7, 99)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z"); direct_vm.clear_mocks()
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), author="bob")
    vm_roles = {wallet(direct_bob): "CORE"}
    direct_vm.mock_llm(r"allocating a funded open-source engineering mission", json.dumps({"terminal_objective_status": "MATERIAL_PROGRESS", "claimant_outcome": "MATERIAL_PROGRESS", "roles": vm_roles, "rationale": "Fixed policy release."}))
    assert contract.resolve_mission(mission_id) == "settled_material_progress"
    mission = json.loads(contract.get_mission(mission_id))
    residuals = mission["settlement"]["sponsor_allocations"]
    observed = tuple(int(residuals.get(wallet(sponsor), "0")) for sponsor in (direct_alice, direct_charlie, direct_bob))
    pool = sum(funds) * WEI
    residual = pool - pool * 40 // 100
    expected = (residual * funds[0] // sum(funds), residual * funds[1] // sum(funds), 0)
    expected = (expected[0], expected[1], residual - expected[0] - expected[1])
    assert observed == expected
    assert sum(int(value) for value in residuals.values()) + int(mission["released_wei"]) == sum(funds) * WEI
