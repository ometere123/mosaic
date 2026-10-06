export type MissionStatus = "OPEN" | "TERMINAL_FROZEN" | "SETTLED" | "EXPIRED";
export type MissionOutcome =
  | "ACHIEVED"
  | "MATERIAL_PROGRESS"
  | "NOT_ACHIEVED"
  | "INSUFFICIENT_EVIDENCE"
  | "SOURCE_UNAVAILABLE"
  | "EXPIRED"
  | "";
export type ImpactRole = "CORE" | "MAJOR" | "SUPPORTING" | "NO_CREDIT";
export type Criterion = {
  text: string;
  evidence_kind: "SOURCE" | "GITHUB_CHECK" | "DEPLOYMENT_PROBE" | "METRIC_RECEIPT";
  check_name?: string;
  check_app_slug?: string;
  url?: string;
  expected_status?: number;
  terminal_sha_field?: string;
  predicates?: Array<{ field: string; operator: "EQ" | "NE" | "LT" | "LTE" | "GT" | "GTE"; value: string | number | boolean }>;
  path_or_url?: string;
  metric_name?: string;
  comparator?: "EQ" | "NE" | "LT" | "LTE" | "GT" | "GTE";
  threshold?: number;
  scale?: number;
};

export type Settlement = {
  settlement_type: "RESOLVED" | "EXPIRED";
  terminal_objective_status: MissionOutcome;
  claimant_outcome: MissionOutcome;
  roles: Record<string, ImpactRole>;
  criterion_matrix?: Array<Record<string, unknown>>;
  role_evidence?: Record<string, Record<string, unknown>>;
  rationale: string;
  contributor_allocations: Record<string, string>;
  sponsor_allocations: Record<string, string>;
  evidence_root: string;
  settlement_digest: string;
  settled_at: number;
};

export type Mission = {
  id: number;
  creator: string;
  repo: string;
  target_ref: string;
  baseline_sha: string;
  title: string;
  objective: string;
  criteria: Array<Criterion | string>;
  created_at: number;
  freeze_not_before?: number;
  closed_at?: number;
  terminal_tip_sha?: string;
  terminal_source_digest?: string;
  terminal_lineage_root?: string;
  resolution_evidence_root?: string;
  ordered_contribution_root?: string;
  /** legacy read compatibility for historical fixtures only */
  close_at?: number;
  status: MissionStatus;
  pool_wei: string;
  total_funded_wei: string;
  sponsor_wallets: string[];
  contributor_wallets: string[];
  contribution_count: number;
  resolution_attempts: number;
  last_resolution: MissionOutcome;
  terminal_objective_status: MissionOutcome;
  claimant_outcome: MissionOutcome;
  evidence_failures: number;
  last_evidence_status: string;
  released_wei: string;
  residual_wei: string;
  mission_evidence_root: string;
  settlement_digest: string;
  settlement: Settlement | null;
  frozen_evidence?: { terminal_state_json?: string; [key: string]: unknown } | null;
};

export type Contribution = {
  index: number;
  mission_id: number;
  wallet: string;
  pr_number: number;
  proof_comment_id: number;
  status: "SEALED" | "INSUFFICIENT_EVIDENCE";
  reason: string;
  merge_sha: string;
  head_sha: string;
  target_ref: string;
  author: string;
  evidence_digest: string;
  capsule: null | {
    summary: string;
    relevance: string;
    substantive_changes: string[];
    risk_flags: string[];
  };
  capsule_digest?: string;
  contribution_commitment?: string;
  sealed_at: number;
};

export type TxStage =
  | "submitted"
  | "pending"
  | "accepted"
  | "finalized"
  | "finalized_unverified"
  | "failed"
  | "undetermined"
  | "canceled"
  | "timeout";

export type TxRecord = {
  hash: string;
  action: string;
  missionId?: number;
  submittedAt: number;
  stage: TxStage;
  statusName?: string;
  executionName?: string;
  error?: string;
};
