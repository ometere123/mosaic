import pytest


@pytest.fixture
def mission_terms():
    return {
        "repo": "acme/widget",
        "baseline": "a" * 40,
        "title": "Wallet reliability pass",
        "objective": "Make injected-wallet account switching and rejected-signature recovery reliable.",
        "criteria": [
            "Account changes must update application state without reload.",
            "Rejected signatures must recover without duplicate submission.",
        ],
    }
