import ast
from pathlib import Path


SOURCE = Path(__file__).parents[1] / "contracts" / "mosaic.py"
TREE = ast.parse(SOURCE.read_text(encoding="utf-8"))


def _function(name):
    return next(node for node in ast.walk(TREE) if isinstance(node, ast.FunctionDef) and node.name == name)


def test_judgment_normalisation_has_no_legacy_top_level_path():
    source = SOURCE.read_text(encoding="utf-8")
    assert '"terminal_objective_status", "claimant_outcome", "roles", "rationale"' not in source
    fn = _function("_normalise_judgment")
    assert not any(isinstance(node, ast.Return) and isinstance(node.value, ast.Dict) for node in ast.walk(fn))


def test_positive_matrix_rows_require_typed_evidence_and_roles_require_owned_contributions():
    source = SOURCE.read_text(encoding="utf-8")
    assert 'obj.get("kind") == "SOURCE"' in source
    assert 'obj.get("kind") == "CONTRIBUTION"' in source
    assert 'obj.get("wallet", "")).lower() == str(wallet).lower()' in source


def test_machine_checks_are_terminal_before_freeze():
    source = SOURCE.read_text(encoding="utf-8")
    assert 'if status != "completed"' in source
    assert 'check_runs_incomplete' in source


def test_settlement_commits_matrix_and_role_evidence():
    source = SOURCE.read_text(encoding="utf-8")
    assert '"criterion_matrix": criterion_matrix' in source
    assert '"role_evidence": role_evidence' in source
