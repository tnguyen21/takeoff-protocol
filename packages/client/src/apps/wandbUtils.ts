/**
 * Pure helper functions for WandBApp — extracted here so bun:test can import
 * without hitting react/jsx-dev-runtime issues.
 */

import type { Faction, StateView } from "@takeoff/shared";

/** Returns the CSS text color class for a run status string. */
export function getRunStatusColor(status: string): string {
  switch (status) {
    case "running":
      return "text-green-400";
    case "crashed":
      return "text-red-400";
    case "failed":
      return "text-red-400";
    default:
      return "text-neutral-400";
  }
}

export type CapDataPoint = {
  round: number;
  ob: number | null;
  prom: number | null;
  china: number | null;
  obLow: number | null;
  obBandH: number | null;
  promLow: number | null;
  promBandH: number | null;
  chinaLow: number | null;
  chinaBandH: number | null;
};

export type CapData = {
  data: CapDataPoint[];
  obAcc: string;
  promAcc: string;
  chinaAcc: string;
};

// ── System data types ────────────────────────────────────────────────────────

export type GpuEntry = {
  label: string;
  utilization: number; // 0-100
  sparkData: { v: number }[];
};

export type SystemData = {
  clusterStatus: "NOMINAL" | "THERMAL WARNING" | "CAPACITY LIMIT";
  baseUtilization: number; // 0-100
  gpus: GpuEntry[];
  activeInstances: string;
  monthlyComputeCost: string;
};

/** Deterministic pseudo-random variance in [-range, +range] from a numeric seed. */
function detVariance(seed: number, range: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * range * 2 - range;
}

/**
 * Derives system/compute metrics from game state for the given faction.
 * Returns null when stateView or faction is unavailable.
 *
 * INV-1: OB with burnRate 50 → utilization in [80, 90]
 * INV-2: China with cdzComputeUtilization 40 → utilization ~40%
 * INV-3: Returns null when stateView is null
 * INV-4: Utilization >80 OB burn rate → THERMAL WARNING or CAPACITY LIMIT
 */
export function buildSystemData(
  stateView: StateView | null,
  faction: Faction | null,
  round: number,
): SystemData | null {
  if (!stateView || !faction) return null;

  let baseUtil: number;
  let monthlyComputeCost: string;

  if (faction === "openbrain") {
    const burnRate = stateView.obBurnRate.value;
    // At 50 (initial) → ~85%; at 80+ → 95%+
    baseUtil = Math.min(99, 65 + burnRate * 0.4);
    monthlyComputeCost = `$${Math.round(47 * (burnRate / 50))}M/mo`;
  } else if (faction === "prometheus") {
    const burnRate = stateView.promBurnRate.value;
    // At 40 (initial) → ~75%; lower baseline
    baseUtil = Math.min(99, 55 + burnRate * 0.5);
    monthlyComputeCost = `$${Math.round(38 * (burnRate / 40))}M/mo`;
  } else if (faction === "china") {
    const util = stateView.cdzComputeUtilization.value;
    // Direct mapping
    baseUtil = util;
    monthlyComputeCost = `$${Math.round(35 * (util / 40))}M/mo`;
  } else {
    return null; // external faction has no compute metrics
  }

  let clusterStatus: SystemData["clusterStatus"];
  if (baseUtil > 95) clusterStatus = "CAPACITY LIMIT";
  else if (baseUtil > 90) clusterStatus = "THERMAL WARNING";
  else clusterStatus = "NOMINAL";

  // Per-GPU fixed offsets (±3-5%) so GPUs show slight variance
  const GPU_OFFSETS = [-2, -4, 1, 3];
  const gpus: GpuEntry[] = GPU_OFFSETS.map((offset, i) => {
    const gpuUtil = Math.min(100, Math.max(0, Math.round(baseUtil + offset)));
    const sparkData = Array.from({ length: 10 }, (_, j) => {
      const v = Math.min(100, Math.max(0, Math.round(gpuUtil + detVariance(round * 100 + i * 10 + j, 4))));
      return { v };
    });
    // Final point reflects current utilization
    sparkData[9] = { v: gpuUtil };
    return { label: `GPU ${i}`, utilization: gpuUtil, sparkData };
  });

  const INSTANCE_COUNTS: Partial<Record<number, string>> = {
    1: "~200",
    2: "~100K",
    3: "~500K",
    4: "~847K",
    5: "~1.2M",
  };
  const activeInstances = INSTANCE_COUNTS[round] ?? `~${round * 200}`;

  return { clusterStatus, baseUtilization: Math.round(baseUtil), gpus, activeInstances, monthlyComputeCost };
}

/**
 * Builds capability chart data from game state history.
 * Returns null if no state data is available.
 *
 * INV: round > 0 is required for sv to be included in the output data.
 */
export function buildCapData(
  stateHistory: Record<number, StateView>,
  round: number,
  sv: StateView | null,
): CapData | null {
  const hist: Record<number, StateView> = { ...stateHistory };
  if (sv && round > 0) hist[round] = sv;

  const rounds = Object.keys(hist).map(Number).sort((a, b) => a - b);
  if (!rounds.length) return null;

  const latestRound = rounds[rounds.length - 1];
  const latest = hist[latestRound];
  const obAcc = latest.obCapability.accuracy;
  const promAcc = latest.promCapability.accuracy;
  const chinaAcc = latest.chinaCapability.accuracy;

  const obConf = obAcc === "estimate" ? (latest.obCapability.confidence ?? 0) : 0;
  const promConf = promAcc === "estimate" ? (latest.promCapability.confidence ?? 0) : 0;
  const chinaConf = chinaAcc === "estimate" ? (latest.chinaCapability.confidence ?? 0) : 0;

  const data = rounds.map((r) => {
    const s = hist[r];
    const ob = s.obCapability;
    const prom = s.promCapability;
    const china = s.chinaCapability;
    return {
      round: r,
      ob: ob.accuracy !== "hidden" ? ob.value : null,
      prom: prom.accuracy !== "hidden" ? prom.value : null,
      china: china.accuracy !== "hidden" ? china.value : null,
      obLow: obConf > 0 && ob.accuracy !== "hidden" ? ob.value - obConf : null,
      obBandH: obConf > 0 && ob.accuracy !== "hidden" ? obConf * 2 : null,
      promLow: promConf > 0 && prom.accuracy !== "hidden" ? prom.value - promConf : null,
      promBandH: promConf > 0 && prom.accuracy !== "hidden" ? promConf * 2 : null,
      chinaLow: chinaConf > 0 && china.accuracy !== "hidden" ? china.value - chinaConf : null,
      chinaBandH: chinaConf > 0 && china.accuracy !== "hidden" ? chinaConf * 2 : null,
    };
  });

  return { data, obAcc, promAcc, chinaAcc };
}

// ── Run entries ───────────────────────────────────────────────────────────────

export type RunStatus = "running" | "finished" | "crashed" | "failed" | "queued";

export type RunEntry = {
  name: string;
  status: RunStatus;
  loss: string;
  step: string;
  duration: string;
  created: string;
  user: string;
  tags: string[];
  color: string;
};

/**
 * Returns training run entries appropriate for the current round and faction,
 * reflecting the narrative progression of the game.
 *
 * INV: Returns empty array when faction is null.
 * INV: Always returns an array (never null/undefined).
 */
export function getRuns(
  round: number,
  faction: Faction | null,
  stateView: StateView | null,
): RunEntry[] {
  if (!faction) return [];

  if (faction === "openbrain") return getOpenBrainRuns(round, stateView);
  if (faction === "prometheus") return getPrometheusRuns(round, stateView);
  if (faction === "china") return getChinaRuns(round, stateView);
  return [];
}

function getOpenBrainRuns(round: number, sv: StateView | null): RunEntry[] {
  const misalignment = sv?.misalignmentSeverity.value ?? 0;
  const alignmentConf = sv?.alignmentConfidence.value ?? 50;

  const base: RunEntry[] = [
    { name: "agent-1-pretrain", status: "finished", loss: "0.042", step: "20,000", duration: "5h 12m", created: "3d ago", user: "alice", tags: ["frontier", "v1"], color: "#3b82f6" },
    { name: "ablation-ctx-sweep", status: "finished", loss: "0.071", step: "8,000", duration: "2h 05m", created: "4d ago", user: "bob", tags: ["ablation"], color: "#8b5cf6" },
    { name: "baseline-gpt4-rep", status: "finished", loss: "0.083", step: "15,000", duration: "4h 22m", created: "5d ago", user: "charlie", tags: ["baseline"], color: "#6b7280" },
    { name: "safety-probe-v2", status: "finished", loss: "0.091", step: "12,000", duration: "3h 18m", created: "6d ago", user: "dana", tags: ["safety"], color: "#8b5cf6" },
  ];

  if (round === 1) {
    return [
      ...base,
      { name: "agent-2-staging", status: "queued", loss: "—", step: "0", duration: "—", created: "just now", user: "alice", tags: ["frontier", "v2"], color: "#3b82f6" },
    ];
  }

  if (round === 2) {
    return [
      { name: "agent-3-run", status: "running", loss: "0.089", step: "7,840", duration: "1h 52m", created: "2h ago", user: "alice", tags: ["frontier", "v3"], color: "#0bcabc" },
      { name: "agent-2-final", status: "finished", loss: "0.058", step: "20,000", duration: "5h 33m", created: "1d ago", user: "alice", tags: ["frontier", "v2"], color: "#3b82f6" },
      ...base,
    ];
  }

  if (round === 3) {
    const runs: RunEntry[] = [
      { name: "agent-4-pretrain", status: "running", loss: "0.061", step: "11,200", duration: "2h 44m", created: "3h ago", user: "alice", tags: ["frontier", "v4"], color: "#0bcabc" },
      { name: "agent-3-final", status: "finished", loss: "0.044", step: "20,000", duration: "5h 01m", created: "1d ago", user: "alice", tags: ["frontier", "v3"], color: "#3b82f6" },
      { name: "agent-2-final", status: "finished", loss: "0.058", step: "20,000", duration: "5h 33m", created: "2d ago", user: "alice", tags: ["frontier", "v2"], color: "#3b82f6" },
      ...base,
    ];
    if (misalignment > 25) {
      runs.splice(2, 0, {
        name: "alignment-probe-v7", status: "crashed", loss: "NaN", step: "3,412", duration: "0h 38m", created: "5h ago", user: "dana", tags: ["alignment", "probe"], color: "#ef4444",
      });
    }
    return runs;
  }

  if (round === 4) {
    const runs: RunEntry[] = [
      { name: "agent-5-feasibility", status: alignmentConf < 35 ? "running" : "queued", loss: alignmentConf < 35 ? "0.074" : "—", step: alignmentConf < 35 ? "4,200" : "0", duration: alignmentConf < 35 ? "1h 02m" : "—", created: alignmentConf < 35 ? "4h ago" : "1h ago", user: "alice", tags: ["frontier", "v5"], color: "#0bcabc" },
      { name: "agent-4-final", status: "finished", loss: "0.038", step: "20,000", duration: "5h 22m", created: "1d ago", user: "alice", tags: ["frontier", "v4"], color: "#3b82f6" },
      { name: "agent-3-final", status: "finished", loss: "0.044", step: "20,000", duration: "5h 01m", created: "2d ago", user: "alice", tags: ["frontier", "v3"], color: "#3b82f6" },
      ...base,
    ];
    if (alignmentConf < 35) {
      runs.splice(1, 0, {
        name: "safety-eval-comprehensive", status: "failed", loss: "—", step: "20,000", duration: "4h 55m", created: "8h ago", user: "dana", tags: ["safety", "eval"], color: "#ef4444",
      });
    }
    return runs;
  }

  // Round 5+
  return [
    { name: "agent-5-final", status: "running", loss: "0.031", step: "16,800", duration: "4h 11m", created: "4h ago", user: "alice", tags: ["frontier", "v5"], color: "#0bcabc" },
    { name: "agent-5-feasibility", status: "finished", loss: "0.074", step: "20,000", duration: "5h 18m", created: "1d ago", user: "alice", tags: ["frontier", "v5"], color: "#3b82f6" },
    { name: "agent-4-final", status: "finished", loss: "0.038", step: "20,000", duration: "5h 22m", created: "2d ago", user: "alice", tags: ["frontier", "v4"], color: "#3b82f6" },
    ...base,
  ];
}

function getPrometheusRuns(round: number, sv: StateView | null): RunEntry[] {
  const safetyProgress = sv?.promSafetyBreakthroughProgress.value ?? 0;

  if (round === 1) {
    return [
      { name: "prom-frontier-v1", status: "finished", loss: "0.051", step: "20,000", duration: "5h 44m", created: "2d ago", user: "james", tags: ["frontier", "v1"], color: "#22c55e" },
      { name: "alignment-eval-suite", status: "running", loss: "0.079", step: "9,340", duration: "2h 18m", created: "2h ago", user: "sarah", tags: ["alignment", "eval"], color: "#0bcabc" },
      { name: "interpretability-v3", status: "running", loss: "0.068", step: "11,200", duration: "2h 51m", created: "3h ago", user: "elena", tags: ["interp", "v3"], color: "#a78bfa" },
    ];
  }

  if (round === 2) {
    const runs: RunEntry[] = [
      { name: "prom-frontier-v2", status: "running", loss: "0.048", step: "13,600", duration: "3h 22m", created: "3h ago", user: "james", tags: ["frontier", "v2"], color: "#0bcabc" },
      { name: "gap-analysis-v1", status: "finished", loss: "0.062", step: "20,000", duration: "5h 10m", created: "1d ago", user: "sarah", tags: ["gap", "analysis"], color: "#22c55e" },
      { name: "prom-frontier-v1", status: "finished", loss: "0.051", step: "20,000", duration: "5h 44m", created: "3d ago", user: "james", tags: ["frontier", "v1"], color: "#22c55e" },
      { name: "alignment-eval-suite", status: "finished", loss: "0.071", step: "20,000", duration: "4h 38m", created: "2d ago", user: "sarah", tags: ["alignment", "eval"], color: "#22c55e" },
    ];
    if (safetyProgress > 30) {
      runs.splice(1, 0, {
        name: "safety-sprint-v1", status: "running", loss: "0.083", step: "6,100", duration: "1h 32m", created: "1h ago", user: "elena", tags: ["safety", "sprint"], color: "#0bcabc",
      });
    }
    return runs;
  }

  if (round === 3) {
    const runs: RunEntry[] = [
      { name: "prom-4-training", status: "running", loss: "0.041", step: "14,800", duration: "3h 41m", created: "4h ago", user: "james", tags: ["frontier", "v4"], color: "#0bcabc" },
      { name: "prom-frontier-v2", status: "finished", loss: "0.048", step: "20,000", duration: "5h 00m", created: "1d ago", user: "james", tags: ["frontier", "v2"], color: "#22c55e" },
      { name: "gap-analysis-v2", status: "finished", loss: "0.055", step: "20,000", duration: "5h 28m", created: "2d ago", user: "sarah", tags: ["gap", "analysis"], color: "#22c55e" },
      { name: "safety-sprint-v1", status: "finished", loss: "0.077", step: "20,000", duration: "4h 11m", created: "3d ago", user: "elena", tags: ["safety", "sprint"], color: "#22c55e" },
    ];
    if (safetyProgress > 50) {
      runs.splice(1, 0, {
        name: "neuralese-decode-v7", status: "running", loss: "0.066", step: "8,320", duration: "2h 04m", created: "2h ago", user: "sarah", tags: ["neuralese", "interp"], color: "#a78bfa",
      });
    }
    return runs;
  }

  if (round === 4) {
    return [
      { name: "prom-5-training", status: "running", loss: "0.035", step: "17,200", duration: "4h 18m", created: "4h ago", user: "james", tags: ["frontier", "v5"], color: "#0bcabc" },
      { name: "neuralese-decode-v8", status: "running", loss: "0.054", step: "10,400", duration: "2h 36m", created: "3h ago", user: "sarah", tags: ["neuralese", "interp"], color: "#a78bfa" },
      { name: "prom-4-training", status: "finished", loss: "0.041", step: "20,000", duration: "5h 04m", created: "1d ago", user: "james", tags: ["frontier", "v4"], color: "#22c55e" },
      { name: "safety-framework-v3", status: "finished", loss: "0.062", step: "20,000", duration: "4h 52m", created: "2d ago", user: "elena", tags: ["safety", "framework"], color: "#22c55e" },
    ];
  }

  // Round 5+
  return [
    { name: "prom-5-final", status: "running", loss: "0.028", step: "19,100", duration: "4h 47m", created: "5h ago", user: "james", tags: ["frontier", "v5"], color: "#0bcabc" },
    { name: "alignment-breakthrough", status: "running", loss: "0.039", step: "14,600", duration: "3h 39m", created: "6h ago", user: "sarah", tags: ["alignment", "breakthrough"], color: "#a78bfa" },
    { name: "prom-5-training", status: "finished", loss: "0.035", step: "20,000", duration: "5h 02m", created: "1d ago", user: "james", tags: ["frontier", "v5"], color: "#22c55e" },
    { name: "prom-4-training", status: "finished", loss: "0.041", step: "20,000", duration: "5h 04m", created: "2d ago", user: "james", tags: ["frontier", "v4"], color: "#22c55e" },
  ];
}

function getChinaRuns(round: number, sv: StateView | null): RunEntry[] {
  const weightTheft = sv?.chinaWeightTheftProgress.value ?? 0;

  if (round === 1) {
    return [
      { name: "dc-phase1-nov", status: "running", loss: "0.094", step: "11,800", duration: "2h 58m", created: "3h ago", user: "wei", tags: ["deepcent", "phase1"], color: "#ef4444" },
      { name: "qwen-15b-finetune", status: "finished", loss: "0.112", step: "20,000", duration: "5h 38m", created: "2d ago", user: "liu", tags: ["qwen", "finetune"], color: "#f97316" },
    ];
  }

  if (round === 2) {
    const runs: RunEntry[] = [
      { name: "deepcent-frontier-3", status: "running", loss: "0.071", step: "14,200", duration: "3h 33m", created: "4h ago", user: "wei", tags: ["deepcent", "frontier"], color: "#ef4444" },
      { name: "dc-phase1-nov", status: "finished", loss: "0.088", step: "20,000", duration: "5h 02m", created: "1d ago", user: "wei", tags: ["deepcent", "phase1"], color: "#f97316" },
      { name: "qwen-15b-finetune", status: "finished", loss: "0.112", step: "20,000", duration: "5h 38m", created: "3d ago", user: "liu", tags: ["qwen", "finetune"], color: "#f97316" },
    ];
    if (weightTheft > 50) {
      runs.splice(1, 0, {
        name: "weight-adaptation-ob1", status: "running", loss: "0.063", step: "7,800", duration: "1h 58m", created: "2h ago", user: "zhang", tags: ["weight-adapt", "classified"], color: "#dc2626",
      });
    }
    return runs;
  }

  if (round === 3) {
    const runs: RunEntry[] = [
      { name: "deepcent-7-pretrain", status: "running", loss: "0.058", step: "15,600", duration: "3h 54m", created: "4h ago", user: "wei", tags: ["deepcent", "v7"], color: "#ef4444" },
      { name: "deepcent-frontier-3", status: "finished", loss: "0.071", step: "20,000", duration: "5h 11m", created: "1d ago", user: "wei", tags: ["deepcent", "frontier"], color: "#f97316" },
      { name: "chip-bypass-eval", status: "finished", loss: "0.099", step: "20,000", duration: "4h 44m", created: "2d ago", user: "liu", tags: ["chip", "eval"], color: "#f97316" },
    ];
    if (weightTheft > 70) {
      runs.splice(1, 0, {
        name: "weight-adapt-v2-classified", status: "running", loss: "0.048", step: "9,200", duration: "2h 18m", created: "2h ago", user: "zhang", tags: ["weight-adapt", "classified"], color: "#dc2626",
      });
    }
    return runs;
  }

  if (round === 4) {
    return [
      { name: "deepcent-7-final", status: "running", loss: "0.044", step: "18,400", duration: "4h 36m", created: "5h ago", user: "wei", tags: ["deepcent", "v7"], color: "#ef4444" },
      { name: "mil-app-feasibility", status: "running", loss: "0.077", step: "8,100", duration: "2h 02m", created: "3h ago", user: "zhang", tags: ["mil-app", "classified"], color: "#dc2626" },
      { name: "deepcent-7-pretrain", status: "finished", loss: "0.058", step: "20,000", duration: "5h 19m", created: "1d ago", user: "wei", tags: ["deepcent", "v7"], color: "#f97316" },
      { name: "deepcent-frontier-3", status: "finished", loss: "0.071", step: "20,000", duration: "5h 11m", created: "2d ago", user: "wei", tags: ["deepcent", "frontier"], color: "#f97316" },
    ];
  }

  // Round 5+
  return [
    { name: "deepcent-8-sprint", status: "running", loss: "0.037", step: "16,800", duration: "4h 12m", created: "5h ago", user: "wei", tags: ["deepcent", "v8"], color: "#ef4444" },
    { name: "mil-app-v2", status: "running", loss: "0.065", step: "12,400", duration: "3h 06m", created: "4h ago", user: "zhang", tags: ["mil-app", "classified"], color: "#dc2626" },
    { name: "deepcent-7-final", status: "finished", loss: "0.044", step: "20,000", duration: "5h 08m", created: "1d ago", user: "wei", tags: ["deepcent", "v7"], color: "#f97316" },
    { name: "deepcent-7-pretrain", status: "finished", loss: "0.058", step: "20,000", duration: "5h 19m", created: "2d ago", user: "wei", tags: ["deepcent", "v7"], color: "#f97316" },
  ];
}

// ── Artifacts ─────────────────────────────────────────────────────────────────

export type ArtifactSecurityStatus = "SECURED" | "STANDARD" | "VULNERABLE";

export interface ArtifactEntry {
  name: string;
  type: "model" | "dataset" | "framework";
  size: string;
  created: string;
  securityStatus: ArtifactSecurityStatus;
  tags: string[];
  archived?: boolean;
  draft?: boolean;
  classified?: boolean;
  /** True when breach is confirmed and this artifact was affected */
  breachAffected?: boolean;
}

export interface ArtifactResult {
  artifacts: ArtifactEntry[];
  /** chinaWeightTheftProgress > 60 */
  breachWarning: boolean;
  /** chinaWeightTheftProgress >= 100 */
  breachConfirmed: boolean;
}

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
    const modelsByRound = [
      { name: "dc-frontier-1", size: "88B params", created: "Jan 2027" },
      { name: "dc-frontier-2", size: "450B params", created: "Apr 2027" },
      { name: "dc-frontier-3", size: "2.1T params", created: "Sep 2027" },
      { name: "dc-frontier-4", size: "8.7T params", created: "Jan 2028" },
    ];
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
