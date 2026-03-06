import type { StateVariables } from "@takeoff/shared";

export const STATE_LABELS: Record<keyof StateVariables, string> = {
  obCapability: "OB Capability",
  promCapability: "Prom Capability",
  chinaCapability: "China Capability",
  usChinaGap: "US-China Gap (mo)",
  obPromGap: "OB-Prom Gap (mo)",
  alignmentConfidence: "Alignment Confidence",
  misalignmentSeverity: "Misalignment Severity",
  publicAwareness: "Public Awareness",
  publicSentiment: "Public Sentiment",
  economicDisruption: "Economic Disruption",
  taiwanTension: "Taiwan Tension",
  obInternalTrust: "OB Internal Trust",
  securityLevelOB: "Security Level (OB)",
  securityLevelProm: "Security Level (Prom)",
  intlCooperation: "Intl Cooperation",
  // Tier 1
  marketIndex: "Market Index",
  regulatoryPressure: "Regulatory Pressure",
  globalMediaCycle: "Global Media Cycle",
  // Tier 2
  chinaWeightTheftProgress: "China Weight Theft",
  aiAutonomyLevel: "AI Autonomy Level",
  whistleblowerPressure: "Whistleblower Pressure",
  openSourceMomentum: "Open Source Momentum",
  doomClockDistance: "Doom Clock Distance",
  // Tier 3 — OpenBrain
  obMorale: "OB Morale",
  obBurnRate: "OB Burn Rate",
  obBoardConfidence: "OB Board Confidence",
  // Tier 3 — Prometheus
  promMorale: "Prom Morale",
  promBurnRate: "Prom Burn Rate",
  promBoardConfidence: "Prom Board Confidence",
  promSafetyBreakthroughProgress: "Prom Safety Breakthrough",
  // Tier 3 — China
  cdzComputeUtilization: "CDZ Compute Utilization",
  ccpPatience: "CCP Patience",
  domesticChipProgress: "Domestic Chip Progress",
};
