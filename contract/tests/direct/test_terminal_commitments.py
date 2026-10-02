import hashlib
import json

from helpers import mock_compare, mock_pr, set_block_time

WEI = 10**18


def canonical_digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def wallet(addr):
    return "0x" + addr.hex() if isinstance(addr, bytes) else addr.as_hex.lower()


def open_mission(contract, vm, sender, terms):
    vm.sender = sender
    vm.value = 10 * WEI
    vm.mock_web(r"api\.github\.com/repos/acme/widget/commits/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", {"status": 200, "body": json.dumps({"sha": "a" * 40})})
    vm.mock_web(r"api\.github\.com/repos/acme/widget/branches/main$", {"status": 200, "body": json.dumps({"name": "main", "commit": {"sha": "a" * 40}})})
    return contract.open_mission(terms["repo"], terms["target_ref"], terms["baseline"], terms["title"], terms["objective"], json.dumps(terms["criteria"]), 1791201600)


def mock_terminal(vm, *, tip="d" * 40, files=None, status="ahead", merge_base="a" * 40):
    vm.mock_web(r"api\.github\.com/repos/acme/widget/branches/main$", {"status": 200, "body": json.dumps({"name": "main", "commit": {"sha": tip}})})
    body = {"status": status, "merge_base_commit": {"sha": merge_base}}
    if files is not None:
        body["files"] = files
    vm.mock_web(rf"api\.github\.com/repos/acme/widget/compare/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\.\.\.{tip}$", {"status": 200, "body": json.dumps(body)})


def terminal_file(patch="@@ terminal @@\n+surviving behavior", changes=2, additions=1, deletions=1):
    return {"filename": "src/wallet.ts", "status": "modified", "additions": additions, "deletions": deletions, "changes": changes, "patch": patch}


def judge(vm, terminal="ACHIEVED", claimant="NOT_ACHIEVED", roles=None):
    vm.mock_llm(
        r"allocating a funded open-source engineering mission",
        json.dumps({
            "terminal_objective_status": terminal,
            "claimant_outcome": claimant,
            "roles": roles or {},
            "rationale": "A bounded, source-grounded judgment.",
        }),
    )


def closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks()
    return contract, mission_id


def test_terminal_branch_wrong_name_is_insufficient(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    direct_vm.mock_web(r"api\.github\.com/repos/acme/widget/branches/main$", {"status": 200, "body": json.dumps({"name": "release", "commit": {"sha": "d" * 40}})})
    assert contract.resolve_mission(mission_id) == "insufficient_evidence"


def test_terminal_malformed_tip_is_insufficient(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    direct_vm.mock_web(r"api\.github\.com/repos/acme/widget/branches/main$", {"status": 200, "body": json.dumps({"name": "main", "commit": {"sha": "not-a-sha"}})})
    assert contract.resolve_mission(mission_id) == "insufficient_evidence"


def test_terminal_compare_outage_is_retryable_source_unavailable(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    direct_vm.mock_web(r"api\.github\.com/repos/acme/widget/branches/main$", {"status": 200, "body": json.dumps({"name": "main", "commit": {"sha": "d" * 40}})})
    direct_vm.mock_web(r"api\.github\.com/repos/acme/widget/compare/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\.\.\.dddddddddddddddddddddddddddddddddddddddd$", {"status": 503, "body": "{}"})
    assert contract.resolve_mission(mission_id) == "source_unavailable"


def test_terminal_missing_files_is_insufficient(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    mock_terminal(direct_vm, files=None)
    assert contract.resolve_mission(mission_id) == "insufficient_evidence"


def test_terminal_file_count_bound_fails_closed(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    mock_terminal(direct_vm, files=[terminal_file() for _ in range(31)])
    assert contract.resolve_mission(mission_id) == "insufficient_evidence"


def test_terminal_missing_patch_fails_closed(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    incomplete = terminal_file(); incomplete.pop("patch")
    mock_terminal(direct_vm, files=[incomplete])
    assert contract.resolve_mission(mission_id) == "insufficient_evidence"


def test_terminal_negative_file_counts_fail_closed(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    mock_terminal(direct_vm, files=[terminal_file(changes=-1)])
    assert contract.resolve_mission(mission_id) == "insufficient_evidence"


def test_terminal_total_change_budget_fails_closed(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    mock_terminal(direct_vm, files=[terminal_file(changes=2501)])
    assert contract.resolve_mission(mission_id) == "insufficient_evidence"


def test_terminal_patch_budget_fails_closed(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    mock_terminal(direct_vm, files=[terminal_file(patch="x" * 24001)])
    assert contract.resolve_mission(mission_id) == "insufficient_evidence"


def test_terminal_divergence_from_baseline_fails_closed(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    mock_terminal(direct_vm, files=[], status="diverged", merge_base="e" * 40)
    assert contract.resolve_mission(mission_id) == "insufficient_evidence"


def test_empty_terminal_snapshot_is_committed_and_settles_truthfully(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    mock_terminal(direct_vm, tip="a" * 40, files=[], status="identical")
    judge(direct_vm, terminal="NOT_ACHIEVED")
    assert contract.resolve_mission(mission_id) == "settled_not_achieved"
    mission = json.loads(contract.get_mission(mission_id))
    expected_terminal = {"repo": "acme/widget", "target_ref": "main", "baseline_sha": "a" * 40, "terminal_tip_sha": "a" * 40, "files": []}
    assert mission["terminal_source_digest"] == canonical_digest(expected_terminal)


def test_terminal_patch_change_changes_terminal_and_resolution_commitments(direct_vm, direct_deploy, direct_alice, mission_terms):
    first, first_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    mock_terminal(direct_vm, files=[terminal_file(patch="@@ one @@\n+one")]); judge(direct_vm, terminal="MATERIAL_PROGRESS")
    assert first.resolve_mission(first_id) == "settled_not_achieved"
    first_mission = json.loads(first.get_mission(first_id))

    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    direct_vm.clear_mocks()
    second_id = open_mission(first, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks()
    mock_terminal(direct_vm, files=[terminal_file(patch="@@ two @@\n+two")]); judge(direct_vm, terminal="MATERIAL_PROGRESS")
    assert first.resolve_mission(second_id) == "settled_not_achieved"
    second_mission = json.loads(first.get_mission(second_id))
    assert first_mission["terminal_source_digest"] != second_mission["terminal_source_digest"]
    assert first_mission["resolution_evidence_root"] != second_mission["resolution_evidence_root"]


def test_settlement_digest_commits_both_economic_statuses(direct_vm, direct_deploy, direct_alice, mission_terms):
    contract, mission_id = closed_empty_mission(direct_vm, direct_deploy, direct_alice, mission_terms)
    mock_terminal(direct_vm, files=[terminal_file()]); judge(direct_vm, terminal="ACHIEVED", claimant="NOT_ACHIEVED")
    assert contract.resolve_mission(mission_id) == "settled_not_achieved"
    mission = json.loads(contract.get_mission(mission_id))
    settlement = mission["settlement"]
    expected = canonical_digest({
        "mission_id": int(mission_id),
        "mission_evidence_root": mission["mission_evidence_root"],
        "resolution_evidence_root": mission["resolution_evidence_root"],
        "terminal_objective_status": "ACHIEVED",
        "claimant_outcome": "NOT_ACHIEVED",
        "roles": {},
        "released_wei": "0",
        "residual_wei": str(10 * WEI),
        "contributor_allocations": {},
        "sponsor_allocations": {wallet(direct_alice): str(10 * WEI)},
        "settled_at": settlement["settled_at"],
    })
    assert settlement["settlement_digest"] == expected


def test_same_pr_is_scoped_to_its_mission_not_globally(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    first = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.clear_mocks()
    second = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0; direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(first), wallet(direct_bob)); assert contract.seal_contribution(first, 7, 99) == "sealed_0"
    direct_vm.clear_mocks(); mock_pr(direct_vm, int(second), wallet(direct_bob)); assert contract.seal_contribution(second, 7, 99) == "sealed_0"
