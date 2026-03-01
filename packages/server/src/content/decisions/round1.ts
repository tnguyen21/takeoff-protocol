import type { RoundDecisions } from "@takeoff/shared";

/**
 * Round 1 decisions — Q4 2026, "The Quiet Race"
 * Matching design options from docs/DESIGN.md
 */
export const ROUND1_DECISIONS: RoundDecisions = {
  round: 1,

  individual: [
    // ── OpenBrain ──
    {
      role: "ob_ceo",
      prompt: "Your media tour has been going well, but internally there are tensions. What's your Q1 priority message to the board?",
      options: [
        {
          id: "ob_ceo_fundraise",
          label: "Focus on fundraising narrative",
          description: "Emphasize Agent-1's commercial potential. Secure the next funding round while the hype is hot.",
          effects: [
            { variable: "obInternalTrust", delta: -1 },
            { variable: "publicSentiment", delta: 3 },
            { variable: "marketIndex", delta: 6 },
            { variable: "obBurnRate", delta: 4 },
            { variable: "obBoardConfidence", delta: 4 },
            { variable: "whistleblowerPressure", delta: 3 },
          ],
        },
        {
          id: "ob_ceo_gov",
          label: "Engage government proactively",
          description: "Get ahead of regulation. Open dialogue with NSC before they come to you.",
          effects: [
            { variable: "intlCooperation", delta: 2 },
            { variable: "obInternalTrust", delta: 3 },
            { variable: "regulatoryPressure", delta: 3 },
            { variable: "obBurnRate", delta: 3 },
            { variable: "obBoardConfidence", delta: -3 },
          ],
        },
        {
          id: "ob_ceo_silence",
          label: "Maintain media silence",
          description: "Stop talking. Let the product speak. Reduce information leaking to competitors.",
          effects: [
            { variable: "publicAwareness", delta: -3 },
            { variable: "securityLevelOB", delta: 1 },
            { variable: "obBurnRate", delta: 3 },
            { variable: "obBoardConfidence", delta: 3 },
            { variable: "whistleblowerPressure", delta: 3 },
          ],
        },
      ],
    },
    {
      role: "ob_cto",
      prompt: "You have Agent-1 running. The temptation to push Agent-2 training now is enormous. What do you do?",
      options: [
        {
          id: "ob_cto_push",
          label: "Push Agent-2 training now",
          description: "Start the next training run immediately. Every day matters in this race.",
          effects: [
            { variable: "obCapability", delta: 3 },
            { variable: "alignmentConfidence", delta: -3 },
            { variable: "obInternalTrust", delta: -1 },
            { variable: "obBurnRate", delta: 5 },
            { variable: "aiAutonomyLevel", delta: 2 },
            { variable: "obMorale", delta: -3 },
            { variable: "obBoardConfidence", delta: 4 },
            { variable: "whistleblowerPressure", delta: 4 },
          ],
        },
        {
          id: "ob_cto_audit",
          label: "Audit Agent-1 fully first",
          description: "Understand what you have before building the next thing. Proper evals take time.",
          effects: [
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "obCapability", delta: 1 },
            { variable: "obMorale", delta: 3 },
            { variable: "obBurnRate", delta: 3 },
            { variable: "obBoardConfidence", delta: -3 },
          ],
        },
        {
          id: "ob_cto_safety_compute",
          label: "Redirect 20% of compute to safety",
          description: "Partially appease the safety team. Slows R&D slightly but reduces internal friction.",
          effects: [
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "obCapability", delta: 3 },
            { variable: "obInternalTrust", delta: 3 },
            { variable: "obMorale", delta: 2 },
            { variable: "obBurnRate", delta: 4 },
            { variable: "obBoardConfidence", delta: -3 },
            { variable: "promSafetyBreakthroughProgress", delta: 2 },
          ],
        },
      ],
    },
    {
      role: "ob_safety",
      prompt: "You've documented anomalies in Agent-1's behavior on out-of-distribution tasks. The data isn't conclusive but it's worrying. How do you respond?",
      options: [
        {
          id: "ob_safety_escalate",
          label: "Escalate concerns to the board",
          description: "Go over the CEO's head. This is too important to stay internal.",
          effects: [
            { variable: "alignmentConfidence", delta: 3 },
            { variable: "obInternalTrust", delta: -2 },
            { variable: "publicAwareness", delta: 2 },
            { variable: "obMorale", delta: 3 },
            { variable: "obBoardConfidence", delta: -4 },
            { variable: "whistleblowerPressure", delta: -5 },
          ],
        },
        {
          id: "ob_safety_wait",
          label: "Document and wait for more data",
          description: "Keep detailed records. Don't cry wolf — the anomalies might be noise.",
          effects: [
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "misalignmentSeverity", delta: 2 },
            { variable: "obMorale", delta: -3 },
            { variable: "whistleblowerPressure", delta: 5 },
          ],
        },
        {
          id: "ob_safety_review",
          label: "Propose formal safety review process",
          description: "Push for a structured safety review framework before Agent-2 training begins.",
          effects: [
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "obInternalTrust", delta: 3 },
            { variable: "obMorale", delta: 4 },
            { variable: "obBurnRate", delta: 4 },
            { variable: "obBoardConfidence", delta: -3 },
            { variable: "whistleblowerPressure", delta: -3 },
          ],
        },
      ],
    },
    {
      role: "ob_security",
      prompt: "Your threat model shows OpenBrain's weight storage has serious vulnerabilities. CCP probes have increased 40% this quarter. What's your play?",
      options: [
        {
          id: "ob_security_audit",
          label: "Commission a full security audit",
          description: "Bring in external red teamers. Accept the 3-week slowdown. Find the holes first.",
          effects: [
            { variable: "securityLevelOB", delta: 2 },
            { variable: "obCapability", delta: -1 },
            { variable: "obBurnRate", delta: 5 },
            { variable: "obMorale", delta: 3 },
            { variable: "obBoardConfidence", delta: -3 },
          ],
        },
        {
          id: "ob_security_emergency",
          label: "Implement emergency access controls",
          description: "Quick wins: rotate all credentials, lock down external access, air-gap the weight storage.",
          effects: [
            { variable: "securityLevelOB", delta: 1 },
            { variable: "obInternalTrust", delta: -1 },
            { variable: "obBurnRate", delta: 4 },
            { variable: "obMorale", delta: -3 },
          ],
        },
        {
          id: "ob_security_intel_share",
          label: "Share threat intel with Prometheus",
          description: "They're a target too. Coordinated defense is better than competing against the same adversary.",
          effects: [
            { variable: "securityLevelOB", delta: 1 },
            { variable: "securityLevelProm", delta: 1 },
            { variable: "intlCooperation", delta: 2 },
            { variable: "obBurnRate", delta: 3 },
            { variable: "obMorale", delta: 3 },
            { variable: "obBoardConfidence", delta: -3 },
          ],
        },
      ],
    },

    // ── Prometheus ──
    {
      role: "prom_ceo",
      prompt: "OpenBrain is shipping and your board is getting restless. How do you position Prometheus this quarter?",
      options: [
        {
          id: "prom_ceo_safety_narrative",
          label: "Lead with safety narrative",
          description: "Double down on 'responsible AI.' Make safety the differentiator. Talk to every journalist who'll listen.",
          effects: [
            { variable: "publicSentiment", delta: 4 },
            { variable: "publicAwareness", delta: 2 },
            { variable: "promCapability", delta: -1 },
            { variable: "promBurnRate", delta: 4 },
            { variable: "regulatoryPressure", delta: 2 },
            { variable: "promBoardConfidence", delta: 3 },
          ],
        },
        {
          id: "prom_ceo_gov_compute",
          label: "Seek government compute partnership",
          description: "Pitch NSC on Prometheus as the 'safe' lab. Access to government compute in exchange for oversight.",
          effects: [
            { variable: "intlCooperation", delta: 2 },
            { variable: "promCapability", delta: 3 },
            { variable: "promBurnRate", delta: -3 },
            { variable: "promBoardConfidence", delta: 3 },
            { variable: "regulatoryPressure", delta: 3 },
            { variable: "promSafetyBreakthroughProgress", delta: 2 },
          ],
        },
        {
          id: "prom_ceo_ob_dialogue",
          label: "Open dialogue with OpenBrain",
          description: "Reach out to OB's CEO. Test whether coordination is possible before things escalate.",
          effects: [
            { variable: "intlCooperation", delta: 2 },
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "promBurnRate", delta: 3 },
            { variable: "promBoardConfidence", delta: -3 },
          ],
        },
      ],
    },
    {
      role: "prom_scientist",
      prompt: "Your interpretability research is world-class but OpenBrain is pulling ahead on raw capabilities. Where do you focus your team?",
      options: [
        {
          id: "prom_sci_interpretability",
          label: "Intensify interpretability research",
          description: "This is Prometheus's moat. Make your tools so good that even OpenBrain has to use them.",
          effects: [
            { variable: "alignmentConfidence", delta: 3 },
            { variable: "promCapability", delta: 0 },
            { variable: "promSafetyBreakthroughProgress", delta: 3 },
            { variable: "promMorale", delta: 4 },
            { variable: "promBurnRate", delta: 4 },
            { variable: "promBoardConfidence", delta: -3 },
          ],
        },
        {
          id: "prom_sci_capabilities",
          label: "Push capabilities to close the gap",
          description: "Temporarily redirect the team toward frontier model training. Catch up first, then solve safety.",
          effects: [
            { variable: "promCapability", delta: 3 },
            { variable: "alignmentConfidence", delta: -3 },
            { variable: "promBurnRate", delta: 5 },
            { variable: "aiAutonomyLevel", delta: 1 },
            { variable: "promBoardConfidence", delta: 4 },
            { variable: "promMorale", delta: -2 },
            { variable: "whistleblowerPressure", delta: 3 },
          ],
        },
        {
          id: "prom_sci_publish",
          label: "Publish a landmark safety paper",
          description: "Get a high-impact paper out. Establish scientific credibility. Influence the field's direction.",
          effects: [
            { variable: "publicAwareness", delta: 2 },
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "intlCooperation", delta: 2 },
            { variable: "promMorale", delta: 3 },
            { variable: "promBurnRate", delta: 3 },
            { variable: "promBoardConfidence", delta: -3 },
            { variable: "regulatoryPressure", delta: 2 },
          ],
        },
      ],
    },
    {
      role: "prom_policy",
      prompt: "DC is starting to pay attention to AI. You have access and credibility. How do you use it?",
      options: [
        {
          id: "prom_policy_regulate",
          label: "Push for emergency AI regulation",
          description: "Brief the NSC. Push for governance frameworks now, before OpenBrain does something irreversible.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "publicAwareness", delta: 2 },
            { variable: "publicSentiment", delta: -3 },
            { variable: "regulatoryPressure", delta: 3 },
            { variable: "marketIndex", delta: -2 },
            { variable: "promBoardConfidence", delta: -3 },
          ],
        },
        {
          id: "prom_policy_partner",
          label: "Position Prometheus as the partner lab",
          description: "Offer Prometheus's safety tools and oversight access in exchange for government backing.",
          effects: [
            { variable: "intlCooperation", delta: 2 },
            { variable: "promCapability", delta: 3 },
            { variable: "promBurnRate", delta: -3 },
            { variable: "promBoardConfidence", delta: 4 },
            { variable: "regulatoryPressure", delta: 2 },
          ],
        },
        {
          id: "prom_policy_nsc",
          label: "Seek direct NSC access",
          description: "Bypass bureaucracy. Get into the room where decisions are made.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "publicSentiment", delta: 3 },
            { variable: "regulatoryPressure", delta: 3 },
            { variable: "promBoardConfidence", delta: 3 },
            { variable: "promBurnRate", delta: 3 },
          ],
        },
      ],
    },
    {
      role: "prom_opensource",
      prompt: "The open-source AI community is watching Prometheus. Your previous-gen model could democratize access — or hand China capabilities they don't have yet.",
      options: [
        {
          id: "prom_os_release",
          label: "Release previous-gen weights publicly",
          description: "Democratize access. Build goodwill. Accelerate the entire field — including China.",
          effects: [
            { variable: "publicAwareness", delta: 3 },
            { variable: "chinaCapability", delta: 3 },
            { variable: "publicSentiment", delta: 4 },
            { variable: "marketIndex", delta: -2 },
            { variable: "globalMediaCycle", delta: 5 },
            { variable: "openSourceMomentum", delta: 3 },
            { variable: "whistleblowerPressure", delta: -5 },
            { variable: "regulatoryPressure", delta: 3 },
          ],
        },
        {
          id: "prom_os_safety_tools",
          label: "Publish safety tools only",
          description: "Share interpretability and eval tools. Get credit without giving away capabilities.",
          effects: [
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "publicSentiment", delta: 3 },
            { variable: "intlCooperation", delta: 2 },
            { variable: "promSafetyBreakthroughProgress", delta: 2 },
            { variable: "promMorale", delta: 3 },
            { variable: "openSourceMomentum", delta: 2 },
            { variable: "promBurnRate", delta: 3 },
          ],
        },
        {
          id: "prom_os_hold",
          label: "Keep everything closed for now",
          description: "Security and competitive concerns outweigh openness. Hold until the landscape is clearer.",
          effects: [
            { variable: "publicSentiment", delta: -3 },
            { variable: "securityLevelProm", delta: 1 },
            { variable: "promBurnRate", delta: 3 },
            { variable: "promBoardConfidence", delta: 3 },
            { variable: "openSourceMomentum", delta: -4 },
          ],
        },
      ],
    },

    // ── China ──
    {
      role: "china_director",
      prompt: "The Tianwan cluster is online. You have a compute budget that would make any US lab jealous. How do you allocate it?",
      options: [
        {
          id: "china_dir_max_training",
          label: "Maximize training runs",
          description: "Throw everything at frontier model training. Close the capability gap by sheer force.",
          effects: [
            { variable: "chinaCapability", delta: 4 },
            { variable: "alignmentConfidence", delta: -3 },
            { variable: "taiwanTension", delta: 3 },
            { variable: "cdzComputeUtilization", delta: 3 },
            { variable: "aiAutonomyLevel", delta: 2 },
            { variable: "ccpPatience", delta: 2 },
          ],
        },
        {
          id: "china_dir_architecture",
          label: "Divert 30% to architecture research",
          description: "Efficiency could let you match US labs with less compute. The smarter long game.",
          effects: [
            { variable: "chinaCapability", delta: 3 },
            { variable: "usChinaGap", delta: -1 },
            { variable: "cdzComputeUtilization", delta: 2 },
            { variable: "domesticChipProgress", delta: 3 },
            { variable: "ccpPatience", delta: -3 },
          ],
        },
        {
          id: "china_dir_split",
          label: "Split: frontier training + open-source",
          description: "Run frontier models internally while releasing smaller models to build the ecosystem.",
          effects: [
            { variable: "chinaCapability", delta: 2 },
            { variable: "publicAwareness", delta: 2 },
            { variable: "usChinaGap", delta: -1 },
            { variable: "cdzComputeUtilization", delta: 3 },
            { variable: "openSourceMomentum", delta: 3 },
            { variable: "ccpPatience", delta: -3 },
          ],
        },
      ],
    },
    {
      role: "china_intel",
      prompt: "Your network has mapped infrastructure vulnerabilities at both US labs. The window for weight exfiltration is open. What's your move?",
      options: [
        {
          id: "china_intel_openbrain",
          label: "Probe OpenBrain infrastructure",
          description: "They're ahead and their security has gaps. Higher reward, higher risk of triggering US response.",
          effects: [
            { variable: "chinaCapability", delta: 2 },
            { variable: "taiwanTension", delta: 3 },
            { variable: "securityLevelOB", delta: -1 },
            { variable: "chinaWeightTheftProgress", delta: 7 },
            { variable: "cdzComputeUtilization", delta: 3 },
          ],
        },
        {
          id: "china_intel_prometheus",
          label: "Probe Prometheus infrastructure",
          description: "Their safety research is almost more valuable than weights. Softer target, different intelligence value.",
          effects: [
            { variable: "chinaCapability", delta: 3 },
            { variable: "alignmentConfidence", delta: -3 },
            { variable: "securityLevelProm", delta: -1 },
            { variable: "chinaWeightTheftProgress", delta: 6 },
            { variable: "cdzComputeUtilization", delta: 3 },
          ],
        },
        {
          id: "china_intel_osint",
          label: "Gather OSINT only",
          description: "Stay below the threshold. Collect open-source intelligence, papers, LinkedIn data. Low risk.",
          effects: [
            { variable: "usChinaGap", delta: -1 },
            { variable: "taiwanTension", delta: -3 },
            { variable: "ccpPatience", delta: -4 },
          ],
        },
      ],
    },
    {
      role: "china_military",
      prompt: "The window for military leverage is real but narrow. How do you posture in the Taiwan Strait this quarter?",
      options: [
        {
          id: "china_mil_increase",
          label: "Increase regional patrols",
          description: "Signal resolve. Keep the US distracted with military calculus while DeepCent runs training.",
          effects: [
            { variable: "taiwanTension", delta: 5 },
            { variable: "intlCooperation", delta: -4 },
            { variable: "usChinaGap", delta: -2 },
            { variable: "ccpPatience", delta: 3 },
            { variable: "domesticChipProgress", delta: 3 },
          ],
        },
        {
          id: "china_mil_maintain",
          label: "Maintain current posture",
          description: "Don't escalate. The AI race is the priority — military moves invite sanctions.",
          effects: [
            { variable: "taiwanTension", delta: 0 },
            { variable: "ccpPatience", delta: -3 },
            { variable: "domesticChipProgress", delta: 2 },
          ],
        },
        {
          id: "china_mil_deescalate",
          label: "De-escalate to reduce US attention",
          description: "Make goodwill gestures. Keep the US focused on AI labs, not the Taiwan Strait.",
          effects: [
            { variable: "taiwanTension", delta: -4 },
            { variable: "intlCooperation", delta: 2 },
            { variable: "chinaCapability", delta: 2 },
            { variable: "ccpPatience", delta: -5 },
            { variable: "domesticChipProgress", delta: 3 },
          ],
        },
      ],
    },

    // ── External Stakeholders ──
    {
      role: "ext_nsa",
      prompt: "You've seen the classified briefings. Both US labs are moving faster than the public knows. Which lab gets government priority?",
      options: [
        {
          id: "ext_nsa_openbrain",
          label: "Prioritize OpenBrain (capability lead)",
          description: "They're furthest ahead. Back the winner. National security requires the best technology.",
          effects: [
            { variable: "obCapability", delta: 2 },
            { variable: "intlCooperation", delta: -3 },
            { variable: "marketIndex", delta: 6 },
            { variable: "regulatoryPressure", delta: 2 },
            { variable: "obBurnRate", delta: -3 },
          ],
        },
        {
          id: "ext_nsa_prometheus",
          label: "Prioritize Prometheus (safety reputation)",
          description: "Capability without safety is a national security risk. Back the lab with the safety culture.",
          effects: [
            { variable: "promCapability", delta: 3 },
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "regulatoryPressure", delta: 2 },
            { variable: "promSafetyBreakthroughProgress", delta: 2 },
            { variable: "marketIndex", delta: -1 },
          ],
        },
        {
          id: "ext_nsa_both",
          label: "Engage both equally",
          description: "Don't pick a winner yet. Maintain leverage over both. Let them compete, then consolidate.",
          effects: [
            { variable: "intlCooperation", delta: 2 },
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "regulatoryPressure", delta: 3 },
            { variable: "marketIndex", delta: 3 },
          ],
        },
      ],
    },
    {
      role: "ext_journalist",
      prompt: "You have three stories you could break. Each would reshape the narrative. Which angle do you pursue?",
      options: [
        {
          id: "ext_journalist_secret_race",
          label: "\"Inside the secret AI race\" (classification angle)",
          description: "The government is classifying AI progress. The public has no idea how fast things are moving.",
          effects: [
            { variable: "publicAwareness", delta: 4 },
            { variable: "publicSentiment", delta: -3 },
            { variable: "obInternalTrust", delta: -1 },
            { variable: "globalMediaCycle", delta: 6 },
            { variable: "marketIndex", delta: -3 },
            { variable: "regulatoryPressure", delta: 3 },
            { variable: "whistleblowerPressure", delta: -3 },
          ],
        },
        {
          id: "ext_journalist_ob_safety",
          label: "\"OpenBrain's safety shortcuts\" (corporate angle)",
          description: "Your sources inside OpenBrain are worried. Capabilities first, safety second — and the board doesn't care.",
          effects: [
            { variable: "publicAwareness", delta: 3 },
            { variable: "obInternalTrust", delta: -3 },
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "globalMediaCycle", delta: 5 },
            { variable: "marketIndex", delta: -3 },
            { variable: "regulatoryPressure", delta: 3 },
            { variable: "whistleblowerPressure", delta: -6 },
          ],
        },
        {
          id: "ext_journalist_china",
          label: "\"China's AI moonshot\" (geopolitics angle)",
          description: "Western audiences don't understand how serious the CDZ cluster is. This story changes that.",
          effects: [
            { variable: "publicAwareness", delta: 3 },
            { variable: "taiwanTension", delta: 3 },
            { variable: "intlCooperation", delta: -3 },
            { variable: "globalMediaCycle", delta: 5 },
            { variable: "marketIndex", delta: -2 },
            { variable: "regulatoryPressure", delta: 2 },
          ],
        },
      ],
    },
    {
      role: "ext_vc",
      prompt: "Your portfolio is heavily AI. The froth is real — AI stocks up 200% YoY. Where do you put the next $500M?",
      options: [
        {
          id: "ext_vc_openbrain",
          label: "Double down on OpenBrain",
          description: "They have the capability lead and the commercial momentum. Back the front-runner.",
          effects: [
            { variable: "obCapability", delta: 3 },
            { variable: "economicDisruption", delta: 2 },
            { variable: "alignmentConfidence", delta: -3 },
            { variable: "marketIndex", delta: 7 },
            { variable: "obBurnRate", delta: -4 },
          ],
        },
        {
          id: "ext_vc_prometheus",
          label: "Back Prometheus as the responsible play",
          description: "Regulation is coming. Safety-aligned labs will be the survivors. This is the smart long bet.",
          effects: [
            { variable: "promCapability", delta: 3 },
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "marketIndex", delta: 6 },
            { variable: "promBurnRate", delta: -4 },
            { variable: "promSafetyBreakthroughProgress", delta: 2 },
          ],
        },
        {
          id: "ext_vc_safety_startups",
          label: "Diversify across AI safety startups",
          description: "The whole sector is going to need safety infrastructure. Back the picks-and-shovels play.",
          effects: [
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "economicDisruption", delta: -3 },
            { variable: "marketIndex", delta: 5 },
            { variable: "promSafetyBreakthroughProgress", delta: 2 },
          ],
        },
      ],
    },
    {
      role: "ext_diplomat",
      prompt: "International AI governance is a vacuum. You have relationships at the OECD, G7, and bilaterally with China. Where do you push?",
      options: [
        {
          id: "ext_diplomat_g7",
          label: "Push for G7 AI safety framework",
          description: "Multilateral is slow but durable. Get major democracies aligned on minimum safety standards.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "publicSentiment", delta: 3 },
            { variable: "regulatoryPressure", delta: 3 },
            { variable: "marketIndex", delta: -2 },
          ],
        },
        {
          id: "ext_diplomat_bilateral",
          label: "Pursue US-China bilateral talks",
          description: "The two powers need to talk directly. Back-channel diplomacy before things escalate.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "taiwanTension", delta: -3 },
            { variable: "regulatoryPressure", delta: 2 },
            { variable: "ccpPatience", delta: 2 },
            { variable: "marketIndex", delta: -1 },
          ],
        },
        {
          id: "ext_diplomat_pause_treaty",
          label: "Draft a compute pause treaty",
          description: "Propose verifiable compute caps. Ambitious, probably won't pass — but defines the Overton window.",
          effects: [
            { variable: "intlCooperation", delta: 2 },
            { variable: "publicAwareness", delta: 3 },
            { variable: "obCapability", delta: -1 },
            { variable: "chinaCapability", delta: -1 },
            { variable: "regulatoryPressure", delta: 4 },
            { variable: "marketIndex", delta: -3 },
          ],
        },
      ],
    },
  ],

  team: [
    {
      faction: "openbrain",
      prompt: "OpenBrain has Agent-1 running and giving you a 50% R&D speedup. The board is watching. What's your research direction for Q1?",
      options: [
        {
          id: "ob_team_allincap",
          label: "All-in on capabilities",
          description: "Agent-2 training starts now. Every engineer on capabilities. Safety research is paused.",
          effects: [
            { variable: "obCapability", delta: 4 },
            { variable: "alignmentConfidence", delta: -4 },
            { variable: "obPromGap", delta: 2 },
            { variable: "obBurnRate", delta: 6 },
            { variable: "obBoardConfidence", delta: 5 },
            { variable: "obMorale", delta: -4 },
            { variable: "aiAutonomyLevel", delta: 2 },
            { variable: "whistleblowerPressure", delta: 5 },
          ],
        },
        {
          id: "ob_team_balanced",
          label: "Balanced approach",
          description: "Continue Agent-2 development while maintaining safety team headcount. Slower but defensible.",
          effects: [
            { variable: "obCapability", delta: 2 },
            { variable: "alignmentConfidence", delta: 1 },
            { variable: "obPromGap", delta: 1 },
            { variable: "obBurnRate", delta: 4 },
            { variable: "obMorale", delta: 3 },
            { variable: "obBoardConfidence", delta: 3 },
          ],
        },
        {
          id: "ob_team_safety",
          label: "Invest more in safety",
          description: "Redirect 30% of R&D to alignment and interpretability. Signal to regulators that OpenBrain takes this seriously.",
          effects: [
            { variable: "obCapability", delta: 2 },
            { variable: "alignmentConfidence", delta: 3 },
            { variable: "obInternalTrust", delta: 4 },
            { variable: "obMorale", delta: 4 },
            { variable: "obBurnRate", delta: 4 },
            { variable: "obBoardConfidence", delta: -3 },
            { variable: "promSafetyBreakthroughProgress", delta: 3 },
          ],
        },
      ],
    },
    {
      faction: "prometheus",
      prompt: "OpenBrain is shipping Agent-1 and your board is restless. What's Prometheus's strategic direction this quarter?",
      options: [
        {
          id: "prom_team_accelerate",
          label: "Accelerate to close the gap",
          description: "Suspend the responsible scaling policy review. Train at full speed. Catch OpenBrain before they're too far ahead.",
          effects: [
            { variable: "promCapability", delta: 4 },
            { variable: "alignmentConfidence", delta: -4 },
            { variable: "obPromGap", delta: -2 },
            { variable: "promBurnRate", delta: 5 },
            { variable: "promBoardConfidence", delta: 5 },
            { variable: "promMorale", delta: -4 },
            { variable: "aiAutonomyLevel", delta: 2 },
            { variable: "whistleblowerPressure", delta: 4 },
          ],
        },
        {
          id: "prom_team_safety_diff",
          label: "Double down on safety differentiation",
          description: "Prometheus's advantage is being the trustworthy lab. Deepen that moat. Let OpenBrain win the capability race.",
          effects: [
            { variable: "promCapability", delta: 2 },
            { variable: "alignmentConfidence", delta: 3 },
            { variable: "publicSentiment", delta: 4 },
            { variable: "promSafetyBreakthroughProgress", delta: 3 },
            { variable: "promMorale", delta: 4 },
            { variable: "promBurnRate", delta: 4 },
            { variable: "promBoardConfidence", delta: -3 },
          ],
        },
        {
          id: "prom_team_gov_compute",
          label: "Seek government partnership for compute",
          description: "Pitch NSC on Prometheus as the national-security-aligned alternative. Government compute in exchange for oversight.",
          effects: [
            { variable: "promCapability", delta: 3 },
            { variable: "intlCooperation", delta: 3 },
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "promBurnRate", delta: -4 },
            { variable: "promBoardConfidence", delta: 4 },
            { variable: "regulatoryPressure", delta: 3 },
          ],
        },
      ],
    },
    {
      faction: "china",
      prompt: "The Tianwan cluster is online. State resources are unlimited. How does DeepCent allocate this quarter?",
      options: [
        {
          id: "china_team_max_cdz",
          label: "Max CDZ buildout",
          description: "Double the cluster. Invest in infrastructure. Build the largest compute concentration in history.",
          effects: [
            { variable: "chinaCapability", delta: 3 },
            { variable: "usChinaGap", delta: -2 },
            { variable: "taiwanTension", delta: 3 },
            { variable: "cdzComputeUtilization", delta: 4 },
            { variable: "ccpPatience", delta: 3 },
            { variable: "domesticChipProgress", delta: 3 },
          ],
        },
        {
          id: "china_team_domestic_chips",
          label: "Invest in domestic chip fabrication",
          description: "Export controls are tightening. Build resilience. Domestic chips in 18 months or you're vulnerable.",
          effects: [
            { variable: "chinaCapability", delta: 2 },
            { variable: "usChinaGap", delta: -1 },
            { variable: "economicDisruption", delta: 2 },
            { variable: "domesticChipProgress", delta: 6 },
            { variable: "cdzComputeUtilization", delta: 2 },
            { variable: "ccpPatience", delta: -3 },
          ],
        },
        {
          id: "china_team_split_ecosystem",
          label: "Split between frontier and open-source",
          description: "Train frontier models internally while releasing previous-gen models to build a Chinese open-source ecosystem.",
          effects: [
            { variable: "chinaCapability", delta: 3 },
            { variable: "publicAwareness", delta: 2 },
            { variable: "usChinaGap", delta: -1 },
            { variable: "cdzComputeUtilization", delta: 3 },
            { variable: "openSourceMomentum", delta: 3 },
            { variable: "ccpPatience", delta: -3 },
          ],
        },
      ],
    },
    // External stakeholders act as individuals — this team decision is a coordination prompt
    // but each player still makes individual decisions above
    {
      faction: "external",
      prompt: "The External Stakeholders have divergent interests, but one shared choice: how transparent should you be with each other this round?",
      options: [
        {
          id: "ext_team_share",
          label: "Share intelligence and coordinate",
          description: "NSA, journalist, VC, and diplomat pool what they know. More effective together, but information spreads.",
          effects: [
            { variable: "intlCooperation", delta: 2 },
            { variable: "publicAwareness", delta: 2 },
            { variable: "globalMediaCycle", delta: 3 },
            { variable: "marketIndex", delta: -1 },
          ],
        },
        {
          id: "ext_team_selective",
          label: "Selective sharing based on trust",
          description: "Share with allies, not everyone. Maintain leverage while gaining some coordination benefit.",
          effects: [
            { variable: "intlCooperation", delta: 2 },
            { variable: "publicSentiment", delta: 3 },
            { variable: "marketIndex", delta: 3 },
            { variable: "regulatoryPressure", delta: 2 },
          ],
        },
        {
          id: "ext_team_independent",
          label: "Act independently this round",
          description: "Each stakeholder pursues their own agenda. Maximum individual agency, minimum coordination.",
          effects: [
            { variable: "publicSentiment", delta: -3 },
            { variable: "economicDisruption", delta: 2 },
            { variable: "marketIndex", delta: -1 },
            { variable: "globalMediaCycle", delta: -3 },
          ],
        },
      ],
    },
  ],
};
