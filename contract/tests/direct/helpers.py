import json


def set_block_time(vm, iso: str):
    vm.warp(iso)
    try:
        import genlayer
        raw = getattr(genlayer.gl, "message_raw", None)
        if isinstance(raw, dict):
            raw["datetime"] = iso
    except Exception:
        pass



def mock_baseline(vm, repo="acme/widget", sha=None):
    sha = sha or ("a" * 40)
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}/commits/{sha}",
        {"status": 200, "body": json.dumps({"sha": sha})},
    )


def mock_repo_probe(vm, repo="acme/widget"):
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}$",
        {"status": 200, "body": json.dumps({"full_name": repo, "archived": False})},
    )


def mock_pr(vm, mission_id, wallet, pr_number=7, comment_id=99, author="dev", merged_at="2026-10-03T10:00:00Z"):
    repo = "acme/widget"
    vm.mock_web(
        rf"api\.github\.com/repos/{repo}/pulls/{pr_number}$",
        {
            "status": 200,
            "body": json.dumps(
                {
                    "title": "fix wallet recovery",
                    "body": "Makes account changes and rejected signatures recover safely.",
                    "user": {"login": author},
                    "merged_at": merged_at,
                    "merge_commit_sha": "b" * 40,
                    "changed_files": 1,
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
                    "user": {"login": author},
                    "body": f"mosaic:{mission_id}:{wallet}",
                    "issue_url": f"https://api.github.com/repos/{repo}/issues/{pr_number}",
                }
            ),
        },
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
                        "patch": "@@ handler @@\n+listen accountsChanged\n+recover rejected signature",
                    }
                ]
            ),
        },
    )
    vm.mock_llm(
        r"analysing one immutable merged software contribution",
        json.dumps(
            {
                "summary": "Improves injected-wallet state and rejected-signature recovery.",
                "relevance": "Directly addresses both frozen mission dimensions.",
                "substantive_changes": ["Tracks account changes", "Recovers rejected signatures"],
                "risk_flags": [],
            }
        ),
    )
