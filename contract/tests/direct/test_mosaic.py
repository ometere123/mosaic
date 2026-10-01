import json

from helpers import mock_baseline, mock_compare, mock_pr, mock_repo_probe, set_block_time

WEI = 10**18


def wallet(addr):
    if isinstance(addr, bytes):
        return "0x" + addr.hex()
    return addr.as_hex.lower() if hasattr(addr, "as_hex") else str(addr).lower()


def open_mission(contract, vm, sender, mission_terms, funding=100 * WEI):
    vm.sender = sender
    vm.value = funding
    mock_baseline(vm, mission_terms["repo"], mission_terms["baseline"], mission_terms["target_ref"])
    return contract.open_mission(
        mission_terms["repo"],
        mission_terms["target_ref"],
        mission_terms["baseline"],
        mission_terms["title"],
        mission_terms["objective"],
        json.dumps(mission_terms["criteria"]),
        1791201600,  # 2026-10-05T00:00:00Z
    )


def test_open_mission_and_multiple_sponsors(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.sender = direct_bob
    direct_vm.value = 25 * WEI
    assert contract.add_funding(mission_id) == f"funded_{25 * WEI}"
    mission = json.loads(contract.get_mission(mission_id))
    assert mission["pool_wei"] == str(125 * WEI)
    assert mission["sponsor_wallets"] == [wallet(direct_alice), wallet(direct_bob)]
    assert mission["target_ref"] == "main"


def test_open_mission_verifies_baseline_is_on_target_branch(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 10 * WEI
    mock_baseline(
        direct_vm,
        mission_terms["repo"],
        mission_terms["baseline"],
        mission_terms["target_ref"],
        tip_sha="c" * 40,
    )
    mission_id = contract.open_mission(
        mission_terms["repo"], mission_terms["target_ref"], mission_terms["baseline"],
        mission_terms["title"], mission_terms["objective"],
        json.dumps(mission_terms["criteria"]), 1791201600,
    )
    assert json.loads(contract.get_mission(mission_id))["baseline_sha"] == "a" * 40


def test_invalid_target_ref_rejected_before_source_read(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 10 * WEI
    with direct_vm.expect_revert("invalid_target_ref"):
        contract.open_mission(
            mission_terms["repo"], "../main", mission_terms["baseline"],
            mission_terms["title"], mission_terms["objective"],
            json.dumps(mission_terms["criteria"]), 1791201600,
        )


def test_rejects_bad_terms(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 10 * WEI
    with direct_vm.expect_revert("invalid_repository"):
        contract.open_mission("not a repo", "main", "a" * 40, "x", "y", '["z"]', 1791201600)


def test_baseline_unavailable_fails_before_lock(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    direct_vm.sender = direct_alice
    direct_vm.value = 10 * WEI
    direct_vm.mock_web(r"api\.github\.com/repos/acme/widget/commits/", {"status": 503, "body": "{}"})
    with direct_vm.expect_revert("baseline_source_unavailable"):
        contract.open_mission(
            mission_terms["repo"], mission_terms["target_ref"], mission_terms["baseline"], mission_terms["title"],
            mission_terms["objective"], json.dumps(mission_terms["criteria"]), 1791201600,
        )


def test_seal_contribution_binds_author_wallet_and_merge(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob))
    result = contract.seal_contribution(mission_id, 7, 99)
    assert result == "sealed_0"
    item = json.loads(contract.get_contribution(mission_id, 0))
    assert item["wallet"] == wallet(direct_bob)
    assert item["merge_sha"] == "b" * 40
    assert item["status"] == "SEALED"
    assert len(item["evidence_digest"]) == 64


def test_duplicate_pr_rejected(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob))
    contract.seal_contribution(mission_id, 7, 99)
    with direct_vm.expect_revert("pr_already_sealed"):
        contract.seal_contribution(mission_id, 7, 99)


def test_wrong_wallet_marker_rejected(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_charlie))
    with direct_vm.expect_revert("proof_marker_mismatch"):
        contract.seal_contribution(mission_id, 7, 99)


def test_merge_must_descend_from_frozen_baseline(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(
        direct_vm,
        int(mission_id),
        wallet(direct_bob),
        compare_status="diverged",
        merge_base="c" * 40,
    )
    with direct_vm.expect_revert("merge_not_descended_from_baseline"):
        contract.seal_contribution(mission_id, 7, 99)


def test_pr_must_target_frozen_branch(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), target_ref="release")
    with direct_vm.expect_revert("wrong_target_ref"):
        contract.seal_contribution(mission_id, 7, 99)


def test_pr_must_target_frozen_repository(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), base_repo="attacker/widget")
    with direct_vm.expect_revert("wrong_base_repository"):
        contract.seal_contribution(mission_id, 7, 99)


def test_pr_requires_immutable_head_sha(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), head_sha="bad")
    with direct_vm.expect_revert("missing_head_sha"):
        contract.seal_contribution(mission_id, 7, 99)


def test_duplicate_merge_sha_rejected_across_pr_numbers(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), pr_number=7, comment_id=99, author="dev")
    contract.seal_contribution(mission_id, 7, 99)
    direct_vm.clear_mocks()
    mock_pr(
        direct_vm, int(mission_id), wallet(direct_bob), pr_number=8,
        comment_id=100, author="dev", merge_sha="b" * 40,
    )
    with direct_vm.expect_revert("merge_already_sealed"):
        contract.seal_contribution(mission_id, 8, 100)


def test_github_author_cannot_bind_to_second_wallet(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), author="DevUser")
    contract.seal_contribution(mission_id, 7, 99)
    assert contract.get_author_wallet(mission_id, "devuser") == wallet(direct_bob)
    direct_vm.clear_mocks()
    direct_vm.sender = direct_charlie
    mock_pr(direct_vm, int(mission_id), wallet(direct_charlie), pr_number=8, comment_id=100, author="devuser", merge_sha="d" * 40)
    with direct_vm.expect_revert("github_author_bound_to_another_wallet"):
        contract.seal_contribution(mission_id, 8, 100)


def test_wallet_cannot_bind_to_second_github_author(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), author="alice-gh")
    contract.seal_contribution(mission_id, 7, 99)
    assert contract.get_wallet_author(mission_id, wallet(direct_bob).upper()) == "alice-gh"
    direct_vm.clear_mocks()
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), pr_number=8, comment_id=100, author="bob-gh", merge_sha="d" * 40)
    with direct_vm.expect_revert("wallet_bound_to_another_github_author"):
        contract.seal_contribution(mission_id, 8, 100)


def test_insufficient_record_does_not_grief_identity_binding(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), author="shared", changed_files=31)
    assert contract.seal_contribution(mission_id, 7, 99) == "insufficient_evidence"
    assert contract.get_author_wallet(mission_id, "shared") == ""
    direct_vm.clear_mocks()
    direct_vm.sender = direct_charlie
    mock_pr(direct_vm, int(mission_id), wallet(direct_charlie), pr_number=8, comment_id=100, author="SHARED", merge_sha="d" * 40)
    assert contract.seal_contribution(mission_id, 8, 100) == "sealed_1"
    assert contract.get_author_wallet(mission_id, "shared") == wallet(direct_charlie)


def test_capsule_storage_output_is_bounded(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(
        direct_vm,
        int(mission_id),
        wallet(direct_bob),
        capsule={
            "summary": "x" * 601,
            "relevance": "Relevant.",
            "substantive_changes": [],
            "risk_flags": [],
        },
    )
    with direct_vm.expect_revert("capsule_missing_summary"):
        contract.seal_contribution(mission_id, 7, 99)


def test_capsule_list_growth_is_bounded(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(
        direct_vm,
        int(mission_id),
        wallet(direct_bob),
        capsule={
            "summary": "Bounded summary.",
            "relevance": "Relevant.",
            "substantive_changes": ["change"] * 5,
            "risk_flags": [],
        },
    )
    with direct_vm.expect_revert("capsule_invalid_changes"):
        contract.seal_contribution(mission_id, 7, 99)


def test_wrong_pull_request_proof_rejected(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), issue_pr_number=8)
    with direct_vm.expect_revert("proof_comment_wrong_pull_request"):
        contract.seal_contribution(mission_id, 7, 99)


def test_naive_merge_timestamp_rejected(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), merged_at="2026-10-03T10:00:00")
    with direct_vm.expect_revert("invalid_merge_timestamp"):
        contract.seal_contribution(mission_id, 7, 99)


def test_malformed_compare_payload_rejected(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), merge_base=[])
    with direct_vm.expect_revert("malformed_compare_payload"):
        contract.seal_contribution(mission_id, 7, 99)


def test_insufficient_evidence_still_requires_wallet_proof(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(
        direct_vm,
        int(mission_id),
        wallet(direct_charlie),
        changed_files=31,
    )
    with direct_vm.expect_revert("proof_marker_mismatch"):
        contract.seal_contribution(mission_id, 7, 99)
    mission = json.loads(contract.get_mission(mission_id))
    assert mission["contribution_count"] == 0


def test_source_unavailable_is_not_low_impact(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    direct_vm.mock_web(r"api\.github\.com/repos/acme/widget/pulls/7$", {"status": 503, "body": "{}"})
    assert contract.seal_contribution(mission_id, 7, 99) == "source_unavailable"
    mission = json.loads(contract.get_mission(mission_id))
    assert mission["contribution_count"] == 0
    assert mission["evidence_failures"] == 1


def test_oversized_evidence_is_explicit_and_not_retryable(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    direct_vm.mock_web(
        r"api\.github\.com/repos/acme/widget/pulls/7$",
        {"status": 200, "body": json.dumps({
            "title": "huge", "body": "", "user": {"login": "dev"},
            "merged_at": "2026-10-03T10:00:00Z", "merge_commit_sha": "b" * 40,
            "base": {"ref": "main", "repo": {"full_name": "acme/widget"}},
            "head": {"sha": "c" * 40},
            "changed_files": 31, "additions": 5000, "deletions": 1,
        })},
    )
    mock_compare(direct_vm)
    direct_vm.mock_web(
        r"api\.github\.com/repos/acme/widget/issues/comments/99$",
        {"status": 200, "body": json.dumps({"user": {"login": "dev"}, "body": f"mosaic:{int(mission_id)}:{wallet(direct_bob)}", "issue_url": "https://api.github.com/repos/acme/widget/issues/7"})},
    )
    assert contract.seal_contribution(mission_id, 7, 99) == "insufficient_evidence"
    with direct_vm.expect_revert("pr_already_sealed"):
        contract.seal_contribution(mission_id, 7, 99)


def test_achieved_settlement_splits_by_roles(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms, funding=80 * WEI)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), pr_number=7, comment_id=99, author="bob")
    contract.seal_contribution(mission_id, 7, 99)
    direct_vm.clear_mocks()
    direct_vm.sender = direct_charlie
    mock_pr(direct_vm, int(mission_id), wallet(direct_charlie), pr_number=8, comment_id=100, author="charlie")
    contract.seal_contribution(mission_id, 8, 100)

    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks()
    mock_repo_probe(direct_vm)
    direct_vm.mock_llm(
        r"allocating a funded open-source engineering mission",
        json.dumps({
            "mission_outcome": "ACHIEVED",
            "roles": {wallet(direct_bob): "CORE", wallet(direct_charlie): "MAJOR"},
            "rationale": "Both materially achieved the objective; Bob was primary.",
        }),
    )
    assert contract.resolve_mission(mission_id) == "settled_achieved"
    assert int(contract.get_balance(wallet(direct_bob))) == 50 * WEI
    assert int(contract.get_balance(wallet(direct_charlie))) == 30 * WEI
    assert int(contract.get_balance(wallet(direct_alice))) == 0


def test_material_progress_releases_40_percent_and_refunds_residual(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms, funding=100 * WEI)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob))
    contract.seal_contribution(mission_id, 7, 99)

    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks()
    mock_repo_probe(direct_vm)
    direct_vm.mock_llm(
        r"allocating a funded open-source engineering mission",
        json.dumps({"mission_outcome": "MATERIAL_PROGRESS", "roles": {wallet(direct_bob): "CORE"}, "rationale": "Meaningful but incomplete."}),
    )
    assert contract.resolve_mission(mission_id) == "settled_material_progress"
    assert int(contract.get_balance(wallet(direct_bob))) == 40 * WEI
    assert int(contract.get_balance(wallet(direct_alice))) == 60 * WEI


def test_not_achieved_returns_all_sponsor_funds_pro_rata(direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms, funding=75 * WEI)
    direct_vm.sender = direct_charlie
    direct_vm.value = 25 * WEI
    contract.add_funding(mission_id)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob))
    contract.seal_contribution(mission_id, 7, 99)

    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks()
    mock_repo_probe(direct_vm)
    direct_vm.mock_llm(
        r"allocating a funded open-source engineering mission",
        json.dumps({"mission_outcome": "NOT_ACHIEVED", "roles": {wallet(direct_bob): "NO_CREDIT"}, "rationale": "Work was unrelated."}),
    )
    contract.resolve_mission(mission_id)
    assert int(contract.get_balance(wallet(direct_alice))) == 75 * WEI
    assert int(contract.get_balance(wallet(direct_charlie))) == 25 * WEI
    assert int(contract.get_balance(wallet(direct_bob))) == 0


def test_insufficient_resolution_does_not_move_money(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob))
    contract.seal_contribution(mission_id, 7, 99)

    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks()
    mock_repo_probe(direct_vm)
    direct_vm.mock_llm(
        r"allocating a funded open-source engineering mission",
        json.dumps({"mission_outcome": "INSUFFICIENT_EVIDENCE", "roles": {wallet(direct_bob): "NO_CREDIT"}, "rationale": "Evidence cannot support settlement."}),
    )
    assert contract.resolve_mission(mission_id) == "insufficient_evidence"
    mission = json.loads(contract.get_mission(mission_id))
    assert mission["status"] == "OPEN"
    assert mission["pool_wei"] == str(100 * WEI)


def test_repo_unavailable_during_resolution_moves_no_money(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob))
    contract.seal_contribution(mission_id, 7, 99)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks()
    direct_vm.mock_web(r"api\.github\.com/repos/acme/widget$", {"status": 503, "body": "{}"})
    assert contract.resolve_mission(mission_id) == "source_unavailable"
    assert contract.get_balance(wallet(direct_alice)) == "0"


def test_unresolved_grace_eventually_refunds(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms, funding=11 * WEI)
    direct_vm.value = 0
    set_block_time(direct_vm, "2026-11-10T10:00:00Z")
    assert contract.expire_unresolved(mission_id) == "expired_refunded"
    assert int(contract.get_balance(wallet(direct_alice))) == 11 * WEI


def test_double_settlement_rejected(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    assert contract.resolve_mission(mission_id) == "settled_not_achieved"
    with direct_vm.expect_revert("mission_not_resolvable"):
        contract.resolve_mission(mission_id)


def test_withdraw_is_pull_based_and_zeroes_balance(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms, funding=10 * WEI)
    direct_vm.value = 0
    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    contract.resolve_mission(mission_id)
    direct_vm.sender = direct_alice
    assert contract.withdraw() == f"withdrawn_{10 * WEI}"
    assert contract.get_balance(wallet(direct_alice)) == "0"
    assert contract.withdraw() == "nothing_to_withdraw"


def test_same_wallet_multiple_prs_remains_one_portfolio(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), pr_number=7, comment_id=99, author="bob")
    contract.seal_contribution(mission_id, 7, 99)
    direct_vm.clear_mocks()
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob), pr_number=8, comment_id=100, author="bob")
    contract.seal_contribution(mission_id, 8, 100)
    mission = json.loads(contract.get_mission(mission_id))
    assert mission["contribution_count"] == 2
    assert mission["contributor_wallets"] == [wallet(direct_bob)]


def test_missing_patch_evidence_is_not_semantically_judged(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    direct_vm.mock_web(
        r"api\.github\.com/repos/acme/widget/pulls/7$",
        {"status": 200, "body": json.dumps({
            "title": "binary-only", "body": "", "user": {"login": "bob"},
            "merged_at": "2026-10-03T10:00:00Z", "merge_commit_sha": "b" * 40,
            "base": {"ref": "main", "repo": {"full_name": "acme/widget"}},
            "head": {"sha": "c" * 40},
            "changed_files": 1, "additions": 0, "deletions": 0,
        })},
    )
    mock_compare(direct_vm)
    direct_vm.mock_web(
        r"api\.github\.com/repos/acme/widget/issues/comments/99$",
        {"status": 200, "body": json.dumps({
            "user": {"login": "bob"},
            "body": f"mosaic:{int(mission_id)}:{wallet(direct_bob)}",
            "issue_url": "https://api.github.com/repos/acme/widget/issues/7",
        })},
    )
    direct_vm.mock_web(
        r"api\.github\.com/repos/acme/widget/pulls/7/files\?per_page=30",
        {"status": 200, "body": json.dumps([{
            "filename": "artifact.bin", "status": "modified", "additions": 0,
            "deletions": 0, "changes": 0,
        }])},
    )
    assert contract.seal_contribution(mission_id, 7, 99) == "insufficient_evidence"
    record = json.loads(contract.get_contribution(mission_id, 0))
    assert record["reason"] == "missing_patch_evidence"


def test_not_achieved_cannot_store_positive_impact_role(direct_vm, direct_deploy, direct_alice, direct_bob, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    direct_vm.sender = direct_bob
    mock_pr(direct_vm, int(mission_id), wallet(direct_bob))
    contract.seal_contribution(mission_id, 7, 99)
    set_block_time(direct_vm, "2026-10-06T10:00:00Z")
    direct_vm.clear_mocks()
    mock_repo_probe(direct_vm)
    direct_vm.mock_llm(
        r"allocating a funded open-source engineering mission",
        json.dumps({"mission_outcome": "NOT_ACHIEVED", "roles": {wallet(direct_bob): "CORE"}, "rationale": "contradictory"}),
    )
    with direct_vm.expect_revert("not_achieved_cannot_credit_impact"):
        contract.resolve_mission(mission_id)


def test_unresolved_expiry_cannot_run_during_grace(direct_vm, direct_deploy, direct_alice, mission_terms):
    set_block_time(direct_vm, "2026-10-01T10:00:00Z")
    contract = direct_deploy("contract/contracts/mosaic.py")
    mission_id = open_mission(contract, direct_vm, direct_alice, mission_terms)
    direct_vm.value = 0
    set_block_time(direct_vm, "2026-10-20T10:00:00Z")
    with direct_vm.expect_revert("resolution_grace_active"):
        contract.expire_unresolved(mission_id)
