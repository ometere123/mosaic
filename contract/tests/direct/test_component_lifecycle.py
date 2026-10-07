import hashlib
import json

from helpers import checkpoint_then_freeze, mock_baseline, mock_terminal, set_block_time

WEI = 10**18


def test_componentized_source_criteria_finalize_without_monolithic_resolver(
    direct_vm, direct_deploy, direct_alice, mission_terms
):
    """The V5 path adjudicates each criterion and finalizes deterministically."""
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
    frozen = json.loads(contract.get_mission(mission_id))
    assert frozen["mission_terms_digest"]
    assert frozen["ordered_contribution_root"]
    assert frozen["terminal_lineage_root"]
    assert frozen["resolution_evidence_root"]
    source_ref = json.loads(frozen["frozen_evidence"]["terminal_state_json"])["evidence_objects"][0]["id"]
    assert frozen["terminal_verification_receipt"]["terminal_source_digest"] == frozen["terminal_source_digest"]
    assert frozen["terminal_verification_receipt"]["mission_terms_digest"] == frozen["mission_terms_digest"]
    assert frozen["terminal_verification_receipt"]["terminal_lineage_root"] == frozen["terminal_lineage_root"]
    expected_resolution_root = hashlib.sha256(json.dumps({
        "mission_terms_digest": frozen["mission_terms_digest"],
        "ordered_contribution_root": frozen["ordered_contribution_root"],
        "terminal_source_digest": frozen["terminal_source_digest"],
        "terminal_lineage_root": frozen["terminal_lineage_root"],
    }, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    assert frozen["resolution_evidence_root"] == expected_resolution_root
    response = json.dumps({
        "terminal_status": "SATISFIED",
        "claimant_status": "NOT_SATISFIED",
        "evidence_refs": [source_ref],
        "support_refs": [],
        "counter_refs": [],
        "causal_status": "UNSPECIFIED",
        "reason_code": "IMPLEMENTATION",
        "rationale": "The frozen source implements this criterion.",
    })
    direct_vm.mock_llm(r'"kind": "CRITERION"', response)
    assert contract.adjudicate_criterion(mission_id, 0) == "criterion_adjudicated"
    assert contract.adjudicate_criterion(mission_id, 1) == "criterion_adjudicated"
    assert contract.finalize_adjudication(mission_id) == "adjudication_finalized"
    result = json.loads(contract.get_mission(mission_id))
    assert result["adjudication_complete"] is True
    assert result["derived_terminal_objective_status"] == "ACHIEVED"
    assert contract.settle_finalized(mission_id) == "settled_finalized"
    settled = json.loads(contract.get_mission(mission_id))
    assert settled["status"] == "SETTLED"
    assert settled["pool_wei"] == "0"
    assert settled["settlement"]["resolution_evidence_root"] == settled["resolution_evidence_root"]
    assert settled["settlement"]["contributor_allocations"] == {}
    with direct_vm.expect_revert("mission_not_resolvable"):
        contract.resolve_mission(mission_id)
