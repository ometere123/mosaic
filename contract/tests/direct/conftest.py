import pytest
import json
import os
from pathlib import Path

from gltest.direct.loader import deploy_contract


GENVM_DIRECT_VERSION = "v0.2.12"


@pytest.fixture
def direct_deploy(direct_vm):
    """Deploy every test against the project's pinned stable GenVM runtime."""
    def _deploy(contract_path, *args, **kwargs):
        contract_path = os.environ.get("MOSAIC_MUTANT_CONTRACT", contract_path)
        return deploy_contract(
            Path(contract_path).resolve(),
            direct_vm,
            *args,
            sdk_version=GENVM_DIRECT_VERSION,
            **kwargs,
        )

    return _deploy


@pytest.fixture
def mission_terms():
    return {
        "repo": "acme/widget",
        "target_ref": "main",
        "baseline": "a" * 40,
        "title": "Wallet reliability pass",
        "objective": "Make injected-wallet account switching and rejected-signature recovery reliable.",
        "criteria": [
            {"text": "Account changes must update application state without reload.", "evidence_kind": "SOURCE"},
            {"text": "Rejected signatures must recover without duplicate submission.", "evidence_kind": "SOURCE"},
        ],
    }


@pytest.fixture(autouse=True)
def migrate_legacy_test_verdicts(direct_vm):
    """Translate historical fixture payloads into the hardened matrix schema.

    Production normalization is matrix-only. This adapter keeps older state and
    accounting scenarios useful while they are incrementally rewritten: the
    model payload actually reaching the contract is still a criterion matrix.
    """
    original = direct_vm.mock_llm

    def wrapped(pattern, response):
        try:
            value = json.loads(response)
        except Exception:
            return original(pattern, response)
        legacy = isinstance(value, dict) and set(value.keys()) == {"terminal_objective_status", "claimant_outcome", "roles", "rationale"}
        if not legacy:
            return original(pattern, response)
        terminal = value["terminal_objective_status"]
        claimant = value["claimant_outcome"]
        terminal_status = {"ACHIEVED": "SATISFIED", "MATERIAL_PROGRESS": "PARTIAL", "NOT_ACHIEVED": "NOT_SATISFIED", "INSUFFICIENT_EVIDENCE": "UNVERIFIABLE"}.get(terminal, "UNVERIFIABLE")
        claimant_status = {"ACHIEVED": "SATISFIED", "MATERIAL_PROGRESS": "PARTIAL", "NOT_ACHIEVED": "NOT_SATISFIED", "INSUFFICIENT_EVIDENCE": "UNVERIFIABLE"}.get(claimant, "UNVERIFIABLE")
        role_items = list(value.get("roles", {}).items())
        roles = {wallet: {"role": role, "evidence_refs": [f"contribution:{index}"] if role != "NO_CREDIT" else []} for index, (wallet, role) in enumerate(role_items)}
        causal_by_role = {"CORE": "DIRECT", "MAJOR": "MATERIAL", "SUPPORTING": "SUPPORTING", "NO_CREDIT": "NONE"}
        wallet_causality = {
            wallet: {
                "status": causal_by_role.get(role, "NONE"),
                "evidence_refs": [f"contribution:{index}"] if role != "NO_CREDIT" else [],
            }
            for index, (wallet, role) in enumerate(role_items)
        }
        claimant_refs = [f"contribution:{index}" for index, (_, role) in enumerate(role_items) if role != "NO_CREDIT"]
        row_refs = ["source:0:src/wallet.ts", *claimant_refs] if claimant_status in {"SATISFIED", "PARTIAL"} or terminal_status in {"SATISFIED", "PARTIAL"} else []
        rows = [{"criterion_index": 0, "terminal_status": terminal_status, "claimant_status": claimant_status, "evidence_refs": row_refs}, {"criterion_index": 1, "terminal_status": terminal_status, "claimant_status": claimant_status, "evidence_refs": row_refs}]
        # Register the same semantic fixture against the component prompts.
        # This keeps legacy accounting scenarios meaningful while they migrate
        # to the canonical criterion/role pipeline.
        original(
            r'"kind": "CRITERION"',
            json.dumps({
                "terminal_status": terminal_status,
                "claimant_status": claimant_status,
                "evidence_refs": row_refs,
                "support_refs": [],
                "counter_refs": [],
                "causal_status": "UNSPECIFIED",
                "reason_code": "IMPLEMENTATION",
                "wallet_causality": wallet_causality,
                "rationale": value["rationale"],
            }),
        )
        for index, (role_wallet, role_name) in enumerate(role_items):
            original(
                rf'"wallet": "{role_wallet.lower()}"',
                json.dumps({
                    "role": role_name,
                    "evidence_refs": [f"contribution:{index}"],
                    "rationale": value["rationale"],
                }),
            )
        original(
            r'"kind": "ROLE"',
            json.dumps({
                "role": "NO_CREDIT",
                "evidence_refs": [],
                "rationale": value["rationale"],
            }),
        )

    direct_vm.mock_llm = wrapped
    yield
    direct_vm.mock_llm = original
