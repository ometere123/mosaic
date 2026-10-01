import type { Mission, MissionOutcome } from "@/lib/types";

export function missionPhase(mission: Mission, now = Math.floor(Date.now() / 1000)) {
  if (mission.status === "SETTLED") return "SETTLED";
  if (mission.status === "EXPIRED") return "EXPIRED";
  return now > mission.close_at ? "CLOSED · UNRESOLVED" : "OPEN";
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
