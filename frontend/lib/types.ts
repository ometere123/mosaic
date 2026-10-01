export type MissionStatus = "OPEN" | "SETTLED" | "EXPIRED";
export type MissionOutcome =
  | "ACHIEVED"
  | "MATERIAL_PROGRESS"
  | "NOT_ACHIEVED"
  | "INSUFFICIENT_EVIDENCE"
  | "SOURCE_UNAVAILABLE"
  | "EXPIRED"
  | "";
export type ImpactRole = "CORE" | "MAJOR" | "SUPPORTING" | "NO_CREDIT";

export type Settlement = {
  outcome: MissionOutcome;
  roles: Record<string, ImpactRole>;
  rationale: string;
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
  criteria: string[];
  created_at: number;
  close_at: number;
  status: MissionStatus;
  pool_wei: string;
  total_funded_wei: string;
  sponsor_wallets: string[];
  contributor_wallets: string[];
  contribution_count: number;
  resolution_attempts: number;
  last_resolution: MissionOutcome;
  evidence_failures: number;
  last_evidence_status: string;
  released_wei: string;
  residual_wei: string;
  settlement: Settlement | null;
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
