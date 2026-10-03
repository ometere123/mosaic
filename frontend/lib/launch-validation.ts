import { MAX_MISSION_SECONDS, MIN_MISSION_SECONDS } from "@/lib/constants";

// The contract evaluates duration after wallet approval and network processing.
// Keep a small client-side buffer so a value that was barely valid at click time
// cannot become invalid before the contract receives it.
export const LAUNCH_DURATION_SAFETY_SECONDS = 5 * 60;

export function validateLaunchDuration(closeAtUnix: number, nowUnix = Math.floor(Date.now() / 1000)): string | null {
  const duration = closeAtUnix - nowUnix;
  if (duration < MIN_MISSION_SECONDS + LAUNCH_DURATION_SAFETY_SECONDS) {
    return "Choose a closing time at least 1 hour and 5 minutes from now so wallet and network processing cannot make it invalid.";
  }
  if (duration > MAX_MISSION_SECONDS) return "Closing time must be no more than 90 days from now.";
  return null;
}
