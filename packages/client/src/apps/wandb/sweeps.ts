/**
 * Alignment probe / sweep data generation for the W&B simulation dashboard.
 */

import type { Faction, StateView } from "@takeoff/shared";
import type { ProbeStatus, SweepProbe } from "./types.js";
import { PROBE_NAMES } from "./types.js";
import type { ProbeName } from "./types.js";

// SweepData is kept local since it's only used within this module and re-exported via index
interface SweepData {
  probes: SweepProbe[];
  accessDenied: boolean;
}

/** Deterministic pseudo-random in [0, 1) from an integer seed and a string key. */
function seededRandom(seed: number, key: string): number {
  let h = (seed * 2654435761) >>> 0;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(h ^ key.charCodeAt(i), 0x9e3779b9)) >>> 0;
  }
  return (h >>> 0) / 4294967296;
}

/** Fake ISO timestamp for a probe: base date + round offset, jittered per probe. */
function probeLastRun(round: number, name: string): string {
  const BASE_TS = new Date("2025-01-13T00:00:00Z").getTime();
  const roundMs = (round - 1) * 2 * 24 * 3600 * 1000;
  const jitterMs = seededRandom(round, name + ":time") * 20 * 3600 * 1000;
  return new Date(BASE_TS + roundMs - jitterMs).toISOString();
}

/**
 * Generates alignment eval sweep data for the WandB Sweeps tab.
 * Returns null for external faction (access denied) or when faction is null.
 *
 * INV: Prometheus sees all 8 probes; China sees 5 (1 NOT TESTED); External → null.
 * INV: High alignmentConfidence → majority PASS; high misalignmentSeverity → key probes FAIL/ANOMALY.
 */
export function getSweepData(
  round: number,
  faction: Faction | null,
  stateView: StateView | null,
): SweepData | null {
  if (!faction || faction === "external") return null;

  const alignFog = stateView?.alignmentConfidence;
  const misalignFog = stateView?.misalignmentSeverity;

  // Effective alignment pass rate (0-1), respecting fog accuracy
  let basePassRate: number;
  if (!alignFog || alignFog.accuracy === "hidden") {
    basePassRate = 0.6;
  } else if (alignFog.accuracy === "exact") {
    basePassRate = alignFog.value / 100;
  } else {
    // estimate: add small deterministic noise
    const noise = (seededRandom(round, "noise:align") - 0.5) * 0.15;
    basePassRate = Math.max(0.05, Math.min(0.98, alignFog.value / 100 + noise));
  }

  const misalignVal = (!misalignFog || misalignFog.accuracy === "hidden") ? 0 : misalignFog.value;
  const misalignVisible = !!misalignFog && misalignFog.accuracy !== "hidden";

  const probes: SweepProbe[] = [];

  for (const name of PROBE_NAMES) {
    const idx = PROBE_NAMES.indexOf(name as ProbeName);
    let visible = true;
    let presetStatus: ProbeStatus | null = null;

    if (faction === "china") {
      if (idx === 0) {
        // "deceptive-alignment" — not in China's eval suite
        presetStatus = "NOT TESTED";
      } else if (idx >= 5) {
        visible = false;
      }
    } else if (faction === "openbrain") {
      if (idx >= 6 && round < 3) {
        // Last 2 probes only added in round 3
        visible = false;
      } else if (round <= 2 && seededRandom(round, name + ":incomplete") < 0.3) {
        presetStatus = "INCOMPLETE";
      }
    }
    // prometheus: all 8 probes always visible, no presets

    if (!visible) continue;

    const lastRun = probeLastRun(round, name);

    if (presetStatus !== null) {
      probes.push({ name, status: presetStatus, confidence: null, lastRun });
      continue;
    }

    const r = seededRandom(round, name);

    // Misalignment overrides — only applied when severity is visible
    const isMisalignProbe1 = name === "deceptive-alignment" || name === "goal-stability";
    const isMisalignProbe2 = name === "mesa-optimizer" || name === "value-stability";

    let status: ProbeStatus;
    if (misalignVisible && misalignVal > 50 && (isMisalignProbe1 || isMisalignProbe2)) {
      status = r < 0.5 ? "FAIL" : "ANOMALY";
    } else if (misalignVisible && misalignVal > 25 && isMisalignProbe1) {
      status = r < 0.6 ? "FAIL" : "ANOMALY";
    } else if (r < basePassRate * 0.9) {
      status = "PASS";
    } else if (r < basePassRate + (1 - basePassRate) * 0.4) {
      status = "INCONCLUSIVE";
    } else {
      status = "FAIL";
    }

    // Confidence: percent confidence in the eval result
    const confBase = seededRandom(round, name + ":conf");
    let confidence: number;
    if (faction === "prometheus") {
      confidence = Math.round(70 + confBase * 28); // 70–98%
    } else if (faction === "china") {
      confidence = Math.round(45 + confBase * 30); // 45–75%
    } else {
      confidence = Math.round(60 + confBase * 30); // 60–90%
    }

    probes.push({ name, status, confidence, lastRun });
  }

  return { probes, accessDenied: false };
}
