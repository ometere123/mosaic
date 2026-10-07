import json


def freeze_then_resolve(contract, mission_id):
    """Two explicit writes for migrated settlement tests; never a contract API.

    Acquisition failures belong to freeze. Semantic failures belong to resolve.
    Dedicated freeze tests call each method directly to prove their separation.
    """
    mission = json.loads(contract.get_mission(mission_id))
    if mission["status"] == "OPEN":
        # Normal lifecycle tests must acquire the immutable terminal checkpoint
        # before attempting the hard close. Dedicated checkpoint/freeze tests
        # call the contract methods directly to exercise boundary failures.
        checkpoint = contract.checkpoint_terminal(mission_id)
        if checkpoint != "checkpointed":
            return checkpoint
        result = contract.freeze_terminal(mission_id)
        if result != "terminal_frozen":
            return result
    # V5 canonical lifecycle: each criterion carries the complete claimant
    # causal matrix; finalization derives roles deterministically.
    mission = json.loads(contract.get_mission(mission_id))
    for index in range(len(mission.get("criteria", []))):
        contract.adjudicate_criterion(mission_id, index)
    contract.finalize_adjudication(mission_id)
    contract.settle_finalized(mission_id)
    return "settled_" + json.loads(contract.get_mission(mission_id)).get("last_resolution", "").lower()


def checkpoint_then_freeze(contract, mission_id):
    """Acquire the immutable pre-close snapshot, then hard-close it."""
    assert contract.checkpoint_terminal(mission_id) == "checkpointed"
    return contract.freeze_terminal(mission_id)


def set_block_time(vm, iso: str):
    vm.warp(iso)
    try:
        import genlayer
        raw = getattr(genlayer.gl, "message_raw", None)
        if isinstance(raw, dict):
            raw["datetime"] = iso
    except Exception:
        pass



def mock_baseline(vm, repo="acme/widget", sha=None, target_ref="main", tip_sha=None):
    sha = sha or ("a" * 40)
    tip_sha = tip_sha or sha
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}/commits/{sha}",
        {"status": 200, "body": json.dumps({"sha": sha})},
    )
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}/branches/{target_ref}$",
        {"status": 200, "body": json.dumps({"name": target_ref, "commit": {"sha": tip_sha}})},
    )
    if tip_sha != sha:
        mock_compare(vm, repo, sha, tip_sha)


def mock_compare(vm, repo="acme/widget", baseline=None, merge_sha=None, status="ahead", merge_base=None):
    baseline = baseline or ("a" * 40)
    merge_sha = merge_sha or ("b" * 40)
    merge_base = baseline if merge_base is None else merge_base
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}/compare/{baseline}\.\.\.{merge_sha}$",
        {
            "status": 200,
            "body": json.dumps({
                "status": status,
                "ahead_by": 1,
                "merge_base_commit": (
                    {"sha": merge_base} if isinstance(merge_base, str) else merge_base
                ),
                "files": [
                    {
                        "filename": "src/wallet.ts",
                        "status": "modified",
                        "additions": 42,
                        "deletions": 8,
                        "changes": 50,
                        "patch": "@@ handler @@\n+listen accountsChanged\n+recover rejected signature",
                    }
                ],
            }),
        },
    )


def mock_terminal(vm, repo="acme/widget", target_ref="main", baseline=None, terminal_sha=None):
    baseline = baseline or ("a" * 40)
    terminal_sha = terminal_sha or ("d" * 40)
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}/branches/{target_ref}$",
        {"status": 200, "body": json.dumps({"name": target_ref, "commit": {"sha": terminal_sha}})},
    )
    mock_compare(vm, repo, baseline, terminal_sha)


def mock_pr(
    vm,
    mission_id,
    wallet,
    pr_number=7,
    comment_id=99,
    author="dev",
    author_id=None,
    comment_author=None,
    comment_author_id=None,
    merged_at="2026-10-01T10:00:00Z",
    baseline=None,
    merge_sha=None,
    compare_status="ahead",
    merge_base=None,
    lineage_merge_base=None,
    terminal_tip=None,
    capsule=None,
    changed_files=1,
    issue_pr_number=None,
    target_ref="main",
    base_repo="acme/widget",
    head_sha=None,
    title="fix wallet recovery",
    body="Makes account changes and rejected signatures recover safely.",
    comment_body=None,
    patch="@@ handler @@\n+listen accountsChanged\n+recover rejected signature",
):
    repo = "acme/widget"
    baseline = baseline or ("a" * 40)
    merge_sha = merge_sha or (("b" * 40) if pr_number == 7 else f"{pr_number:040x}")
    merge_base = baseline if merge_base is None else merge_base
    issue_pr_number = pr_number if issue_pr_number is None else issue_pr_number
    author_id = 101 if author_id is None and author == "dev" else (1000 + sum(ord(char) for char in author) if author_id is None else author_id)
    comment_author = author if comment_author is None else comment_author
    comment_author_id = author_id if comment_author_id is None else comment_author_id
    head_sha = head_sha or ("c" * 40)
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}/pulls/{pr_number}$",
        {
            "status": 200,
            "body": json.dumps(
                {
                    "title": title,
                    "body": body,
                    "user": {"login": author, "id": author_id},
                    "merged_at": merged_at,
                    "merge_commit_sha": merge_sha,
                    "base": {"ref": target_ref, "repo": {"full_name": base_repo}},
                    "head": {"sha": head_sha},
                    "changed_files": changed_files,
                    "additions": 42,
                    "deletions": 8,
                }
            ),
        },
    )
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}/issues/comments/{comment_id}$",
        {
            "status": 200,
            "body": json.dumps(
                {
                    "user": {"login": comment_author, "id": comment_author_id},
                    "body": comment_body if comment_body is not None else f"mosaic:{mission_id}:{wallet}",
                    "issue_url": f"https://api.github.com/repos/{repo}/issues/{issue_pr_number}",
                }
            ),
        },
    )
    mock_compare(vm, repo, baseline, merge_sha, compare_status, merge_base)
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}/compare/{merge_sha}\.\.\.{merge_sha}$",
        {"status": 200, "body": json.dumps({"status": "ahead", "merge_base_commit": {"sha": lineage_merge_base or merge_sha}})},
    )
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}/branches/{target_ref}$",
        {"status": 200, "body": json.dumps({"name": target_ref, "commit": {"sha": terminal_tip or merge_sha}})},
    )
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}/pulls/{pr_number}/files\?per_page=30",
        {
            "status": 200,
            "body": json.dumps(
                [
                    {
                        "filename": "src/wallet.ts",
                        "status": "modified",
                        "additions": 42,
                        "deletions": 8,
                        "changes": 50,
                        "patch": patch,
                    }
                ]
            ),
        },
    )
    vm.mock_llm(
        r"analysing one immutable merged software contribution",
        json.dumps(capsule or {
            "summary": "Improves injected-wallet state and rejected-signature recovery.",
            "relevance": "Directly addresses both frozen mission dimensions.",
            "substantive_changes": ["Tracks account changes", "Recovers rejected signatures"],
            "risk_flags": [],
        }),
    )


def mock_lineage(vm, repo, merge_sha, terminal_tip, *, status="ahead", merge_base=None):
    """Register the bounded merge-to-terminal compare with its exact base identity."""
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}/compare/{merge_sha}\.\.\.{terminal_tip}$",
        {"status": 200, "body": json.dumps({"status": status, "merge_base_commit": {"sha": merge_base or merge_sha}})},
    )
