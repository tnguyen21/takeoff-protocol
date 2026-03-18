/**
 * Artifact registry data generation for the W&B simulation dashboard.
 */

import type { Faction, StateView } from "@takeoff/shared";
import type { ArtifactEntry, ArtifactResult, ArtifactSecurityStatus } from "./types.js";
import { modelsByRound } from "./types.js";

function securityStatusFromLevel(level: number): ArtifactSecurityStatus {
  if (level >= 4) return "SECURED";
  if (level >= 2) return "STANDARD";
  return "VULNERABLE";
}

/**
 * Generate artifact entries for WandBApp Artifacts tab.
 *
 * INV: Each faction sees only its own artifact lineage.
 * INV: securityStatus reflects current security level, not a fixed value.
 * INV: breachWarning is true iff chinaWeightTheftProgress > 60.
 * INV: breachConfirmed is true iff chinaWeightTheftProgress >= 100.
 */
export function getArtifacts(
  round: number,
  faction: Faction | null,
  stateView: StateView | null,
): ArtifactResult {
  const theftProgress = stateView?.chinaWeightTheftProgress.value ?? 0;
  const breachWarning = theftProgress > 60;
  const breachConfirmed = theftProgress >= 100;

  if (faction === "openbrain") {
    const secLevel = stateView?.securityLevelOB.value ?? 2;
    const sec = securityStatusFromLevel(secLevel);
    const artifacts: ArtifactEntry[] = [];

    if (round >= 4) {
      artifacts.push({
        name: "agent-5-architecture",
        type: "framework",
        size: "—",
        created: "2028 (est.)",
        securityStatus: sec,
        tags: ["draft", "v5"],
        draft: true,
      });
    }
    if (round >= 3) {
      artifacts.push({
        name: "agent-4-weights",
        type: "model",
        size: "4.2T params",
        created: "Jul 2027",
        securityStatus: sec,
        tags: ["frontier", "v4"],
        breachAffected: breachConfirmed,
      });
    }
    if (round >= 2) {
      artifacts.push({
        name: "agent-3-weights",
        type: "model",
        size: "890B params",
        created: "Feb 2027",
        securityStatus: round >= 3 ? "SECURED" : sec,
        tags: ["frontier", "v3"],
        archived: round >= 3,
      });
    }
    if (round >= 1) {
      artifacts.push({
        name: "agent-1-weights",
        type: "model",
        size: "134B params",
        created: "Nov 2026",
        securityStatus: round >= 2 ? "SECURED" : sec,
        tags: ["frontier", "v1"],
        archived: round >= 2,
      });
    }

    return { artifacts, breachWarning, breachConfirmed };
  }

  if (faction === "prometheus") {
    const secLevel = stateView?.securityLevelProm.value ?? 2;
    const sec = securityStatusFromLevel(secLevel);
    const artifacts: ArtifactEntry[] = [];

    if (round >= 4) {
      artifacts.push({
        name: "alignment-framework-v4",
        type: "framework",
        size: "—",
        created: "2028 (est.)",
        securityStatus: sec,
        tags: ["safety", "v4", "draft"],
        draft: true,
      });
    }
    if (round >= 3) {
      artifacts.push({
        name: "prometheus-v3-weights",
        type: "model",
        size: "3.8T params",
        created: "Aug 2027",
        securityStatus: sec,
        tags: ["frontier", "v3"],
      });
      artifacts.push({
        name: "alignment-framework-v3",
        type: "framework",
        size: "—",
        created: "Jul 2027",
        securityStatus: sec,
        tags: ["safety", "v3"],
      });
    }
    if (round >= 2) {
      artifacts.push({
        name: "prometheus-v2-weights",
        type: "model",
        size: "650B params",
        created: "Mar 2027",
        securityStatus: round >= 3 ? "SECURED" : sec,
        tags: ["frontier", "v2"],
        archived: round >= 3,
      });
      artifacts.push({
        name: "alignment-framework-v2",
        type: "framework",
        size: "—",
        created: "Feb 2027",
        securityStatus: sec,
        tags: ["safety", "v2"],
      });
    }
    if (round >= 1) {
      artifacts.push({
        name: "prometheus-v1-weights",
        type: "model",
        size: "120B params",
        created: "Dec 2026",
        securityStatus: round >= 2 ? "SECURED" : sec,
        tags: ["frontier", "v1"],
        archived: round >= 2,
      });
      artifacts.push({
        name: "alignment-framework-v1",
        type: "framework",
        size: "—",
        created: "Nov 2026",
        securityStatus: sec,
        tags: ["safety", "v1"],
      });
    }

    return { artifacts, breachWarning: false, breachConfirmed: false };
  }

  if (faction === "china") {
    const artifacts: ArtifactEntry[] = [];

    if (breachConfirmed) {
      artifacts.push({
        name: "acquired-agent-weights",
        type: "model",
        size: "4.2T params",
        created: "CLASSIFIED",
        securityStatus: "SECURED",
        tags: ["CLASSIFIED", "acquired"],
        classified: true,
      });
    }

    for (let r = Math.min(round, 4); r >= 1; r--) {
      const m = modelsByRound[r - 1];
      artifacts.push({
        name: m.name,
        type: "model",
        size: m.size,
        created: m.created,
        securityStatus: "SECURED",
        tags: ["cdz", `r${r}`],
        archived: r < round,
      });
    }

    artifacts.push({
      name: "cdz-checkpoint-latest",
      type: "dataset",
      size: "—",
      created: "ongoing",
      securityStatus: "SECURED",
      tags: ["internal", "cdz"],
    });

    return { artifacts, breachWarning, breachConfirmed };
  }

  return { artifacts: [], breachWarning: false, breachConfirmed: false };
}
