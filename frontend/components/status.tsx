import type { Mission, MissionOutcome } from "@/lib/types";

export function missionPhase(mission: Mission, now = Math.floor(Date.now() / 1000)) {
  if (mission.status === "SETTLED") return "SETTLED";
  if (mission.status === "EXPIRED") return "EXPIRED";
  if (mission.status === "TERMINAL_FROZEN") return "TERMINAL FROZEN";
  if (mission.freeze_not_before === undefined && mission.close_at !== undefined) return now >= mission.close_at ? "CLOSED · UNRESOLVED" : "OPEN";
  const freezeAt = mission.freeze_not_before ?? mission.close_at ?? Number.MAX_SAFE_INTEGER;
  return now >= freezeAt ? "FREEZE ELIGIBLE" : "OPEN";
}

export function StatusStamp({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warn" | "bad" | "blue" }) {
  return <span className={`status-stamp ${tone}`}>{label}</span>;
}

export function outcomeTone(outcome: MissionOutcome): "neutral" | "good" | "warn" | "bad" | "blue" {
  if (outcome === "ACHIEVED") return "good";
  if (outcome === "MATERIAL_PROGRESS") return "blue";
  if (outcome === "NOT_ACHIEVED" || outcome === "EXPIRED") return "bad";
  if (outcome === "INSUFFICIENT_EVIDENCE" || outcome === "SOURCE_UNAVAILABLE") return "warn";
  return "neutral";
}
