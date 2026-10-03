import { describe, expect, it } from "vitest";
import { LAUNCH_DURATION_SAFETY_SECONDS, validateLaunchDuration } from "@/lib/launch-validation";
import { MAX_MISSION_SECONDS, MIN_MISSION_SECONDS } from "@/lib/constants";

describe("launch-duration validation", () => {
  const now = 1_791_037_600;

  it("rejects a contract-minimum closing time that can expire during wallet processing", () => {
    expect(validateLaunchDuration(now + MIN_MISSION_SECONDS, now)).toMatch(/1 hour and 5 minutes/);
  });

  it("accepts the first safe closing time and retains the contract maximum", () => {
    expect(validateLaunchDuration(now + MIN_MISSION_SECONDS + LAUNCH_DURATION_SAFETY_SECONDS, now)).toBeNull();
    expect(validateLaunchDuration(now + MAX_MISSION_SECONDS, now)).toBeNull();
    expect(validateLaunchDuration(now + MAX_MISSION_SECONDS + 1, now)).toMatch(/90 days/);
  });
});
