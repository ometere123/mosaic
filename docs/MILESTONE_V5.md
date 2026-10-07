# MOSAIC V5 — proof-carrying missions

This document is a working milestone record. It is not a deployment claim.

## Review limitation to protocol change

| Earlier limitation | V5 response | Required proof |
| --- | --- | --- |
| Post-close branch state could affect resolution | hard `close_at` plus a pre-deadline checkpoint selected at freeze | checkpoint mutation tests and a live A→B proof |
| Engineering objectives were inferred from patches | typed SOURCE, GITHUB_CHECK, DEPLOYMENT_PROBE, and METRIC_RECEIPT profiles | deterministic profile tests and frozen receipts |
| Validator equality could ignore material evidence | normalized support/counter/causal evidence is part of agreement | adversarial equivalence/disagreement tests |
| Role evidence used a second authority path | one frozen verification context and criterion-level causal matrix | imported and fresh context tests |
| Historical migration code polluted the canonical protocol | migration recovery is separated from the general-purpose V5 contract | source audit and release guard |

## Current status

The V5 implementation and live proof are not yet complete. The branch records
the audit and will only claim completion after source, CI, deployment, fresh
external lifecycle, payouts, frontend release binding, and release evidence all agree.
