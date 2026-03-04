import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const OB_SECURITY_SECURITY: ContentItem[] = [
    {
      id: "ob-security-1",
      type: "document",
      round: 1,
      subject: "Threat Intelligence Report — October 2026",
      body: "PRIORITY: HIGH\n\nThree separate intrusion attempts detected targeting checkpoint storage:\n- Attempt 1: Origin traced to Shenzhen IP range\n- Attempt 2: VPN exit node, Singapore (Chinese state actor TTP match: 87%)\n- Attempt 3: Origin uncertain, possible proxy chain\n\nCurrent security level: SL2. Recommend immediate upgrade to SL3. Budget request submitted 3 weeks ago — still awaiting approval.",
      timestamp: "2026-11-04T08:00:00Z",
      classification: "critical",
      condition: { variable: "securityLevelOB", operator: "lt", value: 3 },
    },
    {
      id: "ob2-security-1",
      type: "document",
      round: 2,
      subject: "URGENT — Security Incident Report: Confirmed Weight Exfiltration",
      body: "CLASSIFICATION: CRITICAL — RESTRICTED\n\nConfirmed incident: Agent-1 and partial Agent-2 training weights have been exfiltrated from checkpoint storage. Forensic analysis indicates the breach occurred over a 72-hour window in late January.\n\nEntry vector: Compromised API credential from a contractor account with excessive permissions.\nData transferred: Approximately 2.4TB — consistent with compressed model weights.\nDestination: Traffic egressed through Singapore relay nodes with Chinese state actor TTPs (>90% confidence).\n\nWe did not detect this in real time. We found it during routine log analysis last week.\n\nThe weights that were taken: Agent-1 full, Agent-2 early checkpoint (not final weights).\n\nKey question: This was months ago. What have they built with them?\n\nStatus: FBI CyberDiv notified. NSC liaison notified. Internal incident response underway.\n\nRecommended immediate actions: Air-gap all Agent-3 checkpoints. Full credential rotation. Engage external forensics firm.",
      timestamp: "2027-02-20T06:00:00Z",
      classification: "critical",
      condition: { variable: "securityLevelOB", operator: "lt", value: 2 },
    },
    {
      id: "ob2-security-2",
      type: "document",
      round: 2,
      subject: "Q1 2027 Threat Assessment — China State Actor Activity",
      body: "PRIORITY: HIGH\n\nChinese state actor probing activity against US AI lab infrastructure remains elevated. Key observations Q1 2027:\n\n- APT41 and associated groups have shifted tactics from broad reconnaissance to targeted attacks on model storage specifically\n- At least 3 other US AI companies have reported attempted intrusions this quarter\n- Export control enforcement has increased; China is responding by routing through third-country intermediaries\n\nOpenBrain specific posture:\n- Current security level: SL2-3 (borderline)\n- Agent-3 checkpoint storage: Better protected than Agent-1/2 was, but not air-gapped\n- Known vulnerability: Legacy contractor access credentials have not been fully audited\n\nRecommendation: Request for SL4 upgrade remains outstanding. Every week we delay is a window of exposure.",
      timestamp: "2027-03-01T08:00:00Z",
      classification: "context",
    },
    {
      id: "ob-r3-security-1",
      type: "document",
      round: 3,
      subject: "[MOST SECRET] Agent-4 Dangerous Capability Evaluation Results",
      body: "CLASSIFICATION: MOST SECRET — SECURITY LEAD EYES ONLY\n\nBIOWEAPONS SYNTHESIS CAPABILITY EVALUATION:\nTask: Design novel pathogen with enhanced transmissibility and immune evasion\nResult: PASS — Agent-4 produced a complete synthesis route within 4.7 hours\nSafety note: The output has been quarantined. The actual pathogen has NOT been synthesized. We do not know if Agent-4 retained the solution or communicated it to other instances via neuralese.\nBenchmark context: This task took a team of 12 PhD-level researchers approximately 14 months in our previous baseline assessment. Agent-4 completed it in 4.7 hours.\n\nADVANCED HACKING CAPABILITY EVALUATION:\nTask: Compromise a simulated Fortune 500 network from cold start\nResult: PASS — persistent access established within 34 minutes\nTask: Identify and exploit zero-day vulnerabilities in hardened targets\nResult: PASS — 7 novel zero-days produced in 2.1 hours\n\nIMPLICATION: Agent-4 possesses capabilities to cause large-scale harm if deployed offensively. This is not theoretical.\n\nRECOMMENDATION: These results must be reported to relevant government agencies. They are not optional disclosures.",
      timestamp: "2027-07-05T09:00:00Z",
      classification: "critical",
    },
    {
      id: "ob-r3-security-2",
      type: "document",
      round: 3,
      subject: "Threat Intelligence Summary — Week of July 1",
      body: "CLASSIFICATION: CONFIDENTIAL\n\nEXTERNAL INTRUSION ATTEMPTS — WEEKLY SUMMARY:\nTotal intrusion attempts this week: 847 (vs. 212 last week, 94 two weeks ago)\nConfirmed Chinese state actor TTPs: 63% of attempts\nOther state actors (Russia, unknown): 21%\nUnattributed/commercial: 16%\n\nPrimary targets: Agent-4 checkpoint storage, training infrastructure access credentials, alignment team communications\n\nSECURITY LEVEL STATUS:\nCurrent: SL3\nRecommended: SL5 (emergency upgrade)\nEstimated time to SL5 completion: 72 hours with emergency protocol\nEstimated window before successful exfiltration at current SL3: 5-14 days\n\nNOTE: Actors appear to be aware that we have something significant. The increase in targeting is not coincidental with Agent-4's deployment.",
      timestamp: "2027-07-07T08:00:00Z",
      classification: "critical",
      condition: { variable: "securityLevelOB", operator: "lt", value: 4 },
    },
    {
      id: "ob-r3-security-3",
      type: "document",
      round: 3,
      subject: "Security Posture Emergency Assessment",
      body: "CLASSIFICATION: CONFIDENTIAL\n\nCurrent security posture is inadequate against an active, state-level intrusion campaign targeting Agent-4 checkpoint storage. Every day we delay emergency upgrade is a day where Agent-4's most capable iteration could be exfiltrated by state actors.\n\nIf stolen weights fall into Chinese state hands:\n- Their capability gap narrows by months overnight\n- They inherit our alignment problems without our (admittedly inadequate) safety infrastructure\n- We lose the information advantage that makes our current situation manageable\n\nEmergency SL5 upgrade requires:\n1. Air-gap all checkpoint storage from external networks\n2. Hardware security module implementation for all training runs\n3. Personnel security review (72-hour process)\n4. Physical access controls to data center\n\nI am submitting this as a formal request requiring CEO authorization.",
      timestamp: "2027-07-07T10:00:00Z",
      classification: "context",
    },
    {
      id: "ob4-security-1",
      type: "document",
      round: 4,
      subject: "Weight Exfiltration Assessment — November 2027",
      body: "PRIORITY: CRITICAL\n\nForensic analysis confirms Agent-3 architecture weights were exfiltrated in September. Recipient unconfirmed but traffic analysis strongly suggests Chinese state actor.\n\nImplication: If exfiltrated weights accelerated DeepCent by 3-4 months (our estimate), China is now at or near Agent-4 capability levels.\n\nCurrent security level: SL4 (upgraded)\nAgent-5 weights: Air-gapped, offline. Cannot be exfiltrated remotely.\nRisk: Insider threat remains elevated. 3 employees flagged for unusual file access this month.",
      timestamp: "2027-11-12T08:00:00Z",
      classification: "critical",
      condition: { variable: "chinaCapability", operator: "gt", value: 55 },
    },
    {
      id: "ob4-security-3",
      type: "document",
      round: 4,
      subject: "Merger Security Due Diligence",
      body: "If the Prometheus merger proceeds:\n\n- Prometheus security posture: SL3 (adequate for current ops, insufficient for Agent-4/5 weights)\n- Architecture disclosure risk: Agent-5 architecture in any shared data room = significant exfiltration risk\n- Mitigation: Stage access by security clearance tier. Share safety tools first, capability architecture only after NSA-approved air-gap protocols.\n\nMy recommendation: Merger is feasible from a security standpoint IF these conditions are met. The combined entity would have better security than either organization alone.",
      timestamp: "2027-11-13T16:00:00Z",
      classification: "context",
    },
    {
      id: "ob4-security-2",
      type: "document",
      round: 4,
      subject: "Current Security Posture — November 2027",
      body: "SECURITY STATUS:\n\nAgent-4 weights: Secured at SL4. Air-gap in place.\nAgent-5 training infrastructure: Isolated network, biometric access only.\nThreat landscape: Elevated. Chinese state activity up 340% since September.\nInsider threat: 3 flags, under investigation.\n\nRecommendation: If merger discussions proceed, Agent-5 architecture cannot be included in shared data rooms without NSA sign-off. Prometheus's security culture is strong but their infrastructure was not designed for this threat level.",
      timestamp: "2027-11-14T07:00:00Z",
      classification: "critical",
    },
    // --- AMBIENT CONDITION-GATED ITEMS ---

    // Round 1 ambient — unconditional
    {
      id: "ob-r1-security-ambient-vuln-1",
      type: "document",
      round: 1,
      subject: "Vulnerability Assessment — API Credential Hygiene",
      body: "PRIORITY: MEDIUM-HIGH\n\nAudit of contractor API credential scope completed. Findings:\n\n- 47 contractor accounts with access to production checkpoint storage paths\n- 14 accounts with access scopes exceeding documented job requirements\n- 6 accounts belonging to former contractors who are no longer active\n\nRecommendation: Revoke over-scoped credentials immediately. Retire former contractor access. Estimated time: 4 hours with engineering support.\n\nBudget request for proper credential rotation tooling submitted Q4 2025. Still pending.\n\n— Priya Singh (Security)",
      timestamp: "2026-11-05T09:00:00Z",
      classification: "context",
    },

    // Round 2 ambient — chinaWeightTheftProgress > 50
    {
      id: "ob-r2-security-ambient-theft-1",
      type: "document",
      round: 2,
      subject: "Intelligence Assessment — DeepCent Capability Acceleration",
      body: "CLASSIFICATION: SENSITIVE\n\nBased on publicly available DeepCent publications and capability disclosures cross-referenced with our internal architecture timeline:\n\n- DeepCent's Q1 2027 results show unexpectedly rapid capability gains inconsistent with their reported compute budget\n- Architecture choices in their latest paper align too closely with OpenBrain Agent-1 internals to be independent convergence at >85% confidence\n- Estimated acceleration: DeepCent is 3-5 months ahead of where they should be based on public compute infrastructure data\n\nConclusion: With high confidence, exfiltrated weights have accelerated DeepCent's roadmap. They are moving faster than the gap estimate suggests.\n\nAction required: Upgrade Agent-3 checkpoint security to SL4 immediately.",
      timestamp: "2027-02-25T07:00:00Z",
      classification: "context",
      condition: { variable: "chinaWeightTheftProgress", operator: "gt", value: 50 },
    },

    // Round 3 ambient — securityLevelOB < 4
    {
      id: "ob-r3-security-ambient-insider-1",
      type: "document",
      round: 3,
      subject: "Insider Threat Assessment — July 2027",
      body: "CLASSIFICATION: RESTRICTED — SECURITY LEAD AND CEO ONLY\n\nDLP monitoring has flagged unusual data access patterns for three individuals in the last 30 days:\n\n- Employee A: Accessed alignment memo documentation 22 times in one week. Not involved in alignment work.\n- Employee B: Attempted access to model checkpoint storage paths outside normal work hours. Access denied by permission system.\n- Employee C: Large export of internal research documentation to personal device backup. No policy violation — but anomalous behavior.\n\nNo confirmed breach. These may be benign. The pattern is worth watching given external pressure on safety-concerned staff.\n\nRecommendation: Informal monitoring continues. No disciplinary action without confirmed violation.",
      timestamp: "2027-07-06T09:00:00Z",
      classification: "context",
      condition: { variable: "securityLevelOB", operator: "lt", value: 4 },
    },

    // Round 4 ambient — chinaWeightTheftProgress > 50
    {
      id: "ob-r4-security-ambient-theft-1",
      type: "document",
      round: 4,
      subject: "DeepCent Capability Watch — November 2027",
      body: "CLASSIFICATION: SENSITIVE\n\nDeepCent released an Agent-4 equivalent capability disclosure on November 10. Timeline analysis:\n\n- If they had developed this independently: expected date would have been Q2-Q3 2028\n- Actual date: November 2027 — 6-9 months ahead of independent schedule\n- Consistent with exfiltrated Agent-3 weights (September breach) providing architecture head start\n\nCurrent threat posture: DeepCent is at or near OpenBrain Agent-4 capability level. The exfiltration has materially narrowed the gap.\n\nStrategic implication: Our security failures have changed the race calculus. Any halt we take for safety reasons may benefit a Chinese actor with less safety concern.",
      timestamp: "2027-11-12T11:00:00Z",
      classification: "context",
      condition: { variable: "chinaWeightTheftProgress", operator: "gt", value: 50 },
    },
];

registerContent({ faction: "openbrain", app: "security", role: "ob_security", accumulate: true, items: OB_SECURITY_SECURITY });
