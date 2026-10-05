import pytest
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
