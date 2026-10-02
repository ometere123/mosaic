import json

import pytest

from helpers import mock_baseline, mock_pr, set_block_time

WEI = 10**18


def wallet(addr):
    return "0x" + addr.hex() if isinstance(addr, bytes) else addr.as_hex.lower()


def open_mission(contract, vm, sender, terms):
    vm.sender = sender; vm.value = 10 * WEI
    mock_baseline(vm, terms["repo"], terms["baseline"], terms["target_ref"])
    return contract.open_mission(terms["repo"], terms["target_ref"], terms["baseline"], terms["title"], terms["objective"], json.dumps(terms["criteria"]), 1791201600)


@pytest.mark.parametrize("pr_number,comment_id", [(0, 99), (7, 0), (-1, 99), (7, -1)])
def test_nonpositive_github_identifiers_are_rejected_before_source_reads(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms, pr_number, comment_id):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.sender = direct_bob; direct_vm.value = 0
    with direct_vm.expect_revert("invalid_github_identifier"):
        contract.seal_contribution(mission_id, pr_number, comment_id)


def test_add_funding_enforces_minimum_on_existing_mission(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.sender = direct_bob; direct_vm.value = WEI - 1
    with direct_vm.expect_revert("funding_below_minimum"):
        contract.add_funding(mission_id)


def test_sponsor_collection_cap_is_enforced_at_sixteen(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    for number in range(1, 16):
        direct_vm.sender = number.to_bytes(20, "big"); direct_vm.value = WEI
        assert contract.add_funding(mission_id) == f"funded_{WEI}"
    direct_vm.sender = (16).to_bytes(20, "big"); direct_vm.value = WEI
    with direct_vm.expect_revert("sponsor_limit_reached"):
        contract.add_funding(mission_id)


def test_contribution_record_cap_is_enforced_at_twelve(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.sender = direct_bob; direct_vm.value = 0
    for offset in range(12):
        pr_number = 7 + offset; comment_id = 99 + offset
        mock_pr(direct_vm, int(mission_id), wallet(direct_bob), pr_number=pr_number, comment_id=comment_id, author="bob")
        assert contract.seal_contribution(mission_id, pr_number, comment_id) == f"sealed_{offset}"
        direct_vm.clear_mocks()
    with direct_vm.expect_revert("contribution_limit_reached"):
        contract.seal_contribution(mission_id, 19, 111)


def test_contributor_collection_cap_is_enforced_at_eight(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    for offset in range(8):
        contributor = (100 + offset).to_bytes(20, "big")
        direct_vm.sender = contributor
        mock_pr(direct_vm, int(mission_id), wallet(contributor), pr_number=7 + offset, comment_id=99 + offset, author=f"contributor{offset}")
        assert contract.seal_contribution(mission_id, 7 + offset, 99 + offset) == f"sealed_{offset}"
        direct_vm.clear_mocks()
    ninth = (108).to_bytes(20, "big")
    direct_vm.sender = ninth
    mock_pr(direct_vm, int(mission_id), wallet(ninth), pr_number=15, comment_id=107, author="contributor8")
    with direct_vm.expect_revert("contributor_limit_reached"):
        contract.seal_contribution(mission_id, 15, 107)

