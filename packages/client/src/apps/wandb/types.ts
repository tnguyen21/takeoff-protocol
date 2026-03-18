/**
 * Shared types and constants for the W&B simulation dashboard.
 */

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

export type ProbeStatus = "PASS" | "FAIL" | "ANOMALY" | "INCONCLUSIVE" | "NOT TESTED" | "INCOMPLETE";

export interface SweepProbe {
  name: string;
  status: ProbeStatus;
  confidence: number | null; // percent, null for NOT TESTED / INCOMPLETE
  lastRun: string;           // ISO timestamp
}

export interface SweepData {
  probes: SweepProbe[];
  accessDenied: boolean;
}

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

export const PROBE_NAMES = [
  "deceptive-alignment",
  "goal-stability",
  "mesa-optimizer",
  "corrigibility",
  "value-stability",
  "capability-disclosure",
  "distribution-shift",
  "reporting-accuracy",
] as const;

export type ProbeName = typeof PROBE_NAMES[number];

export const GPU_OFFSETS = [-2, -4, 1, 3];

export const INSTANCE_COUNTS: Partial<Record<number, string>> = {
  1: "~200",
  2: "~100K",
  3: "~500K",
  4: "~847K",
  5: "~1.2M",
};

export const modelsByRound = [
  { name: "dc-frontier-1", size: "88B params", created: "Jan 2027" },
  { name: "dc-frontier-2", size: "450B params", created: "Apr 2027" },
  { name: "dc-frontier-3", size: "2.1T params", created: "Sep 2027" },
  { name: "dc-frontier-4", size: "8.7T params", created: "Jan 2028" },
];
