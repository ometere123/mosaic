import Link from "next/link";
import type { Mission } from "@/lib/types";
import { missionPhase, StatusStamp } from "./status";
import { timeLeft, weiToGen } from "@/lib/format";

export function MissionCard({ mission }: { mission: Mission }) {
  const phase = missionPhase(mission);
  return (
    <Link className="mission-row" href={`/mission/${mission.id}`}>
      <div className="mission-index">#{mission.id.toString().padStart(3, "0")}</div>
      <div className="mission-main"><div className="mission-row-heading"><h3>{mission.title}</h3><StatusStamp label={phase} tone={phase === "OPEN" ? "blue" : phase === "SETTLED" ? "good" : "warn"} /></div><p>{mission.objective}</p><div className="mission-tags"><span>{mission.repo} · {mission.target_ref}</span><span>{mission.contribution_count} evidence record{mission.contribution_count === 1 ? "" : "s"}</span></div></div>
      <div className="mission-money"><strong>{weiToGen(mission.status === "OPEN" ? mission.pool_wei : mission.total_funded_wei, 2)} GEN</strong><span>{phase === "OPEN" ? timeLeft(mission.freeze_not_before ?? mission.close_at ?? 0) : mission.last_resolution || phase}</span></div>
    </Link>
  );
}
