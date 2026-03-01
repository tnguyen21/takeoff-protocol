import type { RoundDecisions } from "@takeoff/shared";

/**
 * Round 2 decisions — Q1 2027, "The Superhuman Coder"
 * Matching design options from docs/DESIGN.md section 5, Round 2.
 *
 * China team decisions are conditional on Round 1 weight-theft outcome:
 *   - china_team_weights_*: For factions that successfully exfiltrated weights (securityLevelOB dropped <2)
 *   - china_team_escalate_*: For factions on the organic/open-source path
 * The GM presents whichever set applies based on current game state.
 */
export const ROUND2_DECISIONS: RoundDecisions = {
  round: 2,

  individual: [
    // ── OpenBrain ──
    {
      role: "ob_ceo",
      prompt: "Agent-3 is real and running. The board wants a deployment decision by March 15. The NSC wants a briefing. Your options are converging. What's your move?",
      options: [
        {
          id: "ob_ceo_r2_announce",
          label: "Announce Agent-3 publicly",
          description: "Get ahead of the leaks. Control the narrative. Let the world know OpenBrain has crossed a threshold.",
          effects: [
            { variable: "publicAwareness", delta: 4 },
            { variable: "publicSentiment", delta: -4 },
            { variable: "obCapability", delta: 2 },
            { variable: "globalMediaCycle", delta: 6 },
            { variable: "marketIndex", delta: -3 },
            { variable: "regulatoryPressure", delta: 0 },
            { variable: "obBoardConfidence", delta: 3 },
            { variable: "whistleblowerPressure", delta: -3 },
          
            { variable: "usChinaGap", delta: 2 },
          ],
        },
        {
          id: "ob_ceo_r2_nsc",
          label: "Full NSC briefing first",
          description: "Bring the government fully in before any public announcement. Build the relationship before anyone forces your hand.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "obInternalTrust", delta: 3 },
            { variable: "publicAwareness", delta: 2 },
            { variable: "regulatoryPressure", delta: 3 },
            { variable: "obBurnRate", delta: 3 },
            { variable: "obBoardConfidence", delta: -3 },
          ],
        },
        {
          id: "ob_ceo_r2_secrecy",
          label: "Maintain operational secrecy, accelerate",
          description: "Say nothing public. Invest the silence into R&D speed. Every week of lead time matters.",
          effects: [
            { variable: "obCapability", delta: 3 },
            { variable: "publicAwareness", delta: -3 },
            { variable: "securityLevelOB", delta: 1 },
            { variable: "obBurnRate", delta: 5 },
            { variable: "obBoardConfidence", delta: 4 },
            { variable: "whistleblowerPressure", delta: 4 },
            { variable: "aiAutonomyLevel", delta: 1 },
          ],
        },
      ],
    },
    {
      role: "ob_cto",
      prompt: "Agent-3 is running. Agent-4 is within reach. You could start the next training run now — or spend the next 8 weeks understanding what you've already built.",
      options: [
        {
          id: "ob_cto_r2_agent4",
          label: "Start Agent-4 training immediately",
          description: "Keep the momentum. Every additional week of Agent-3 running is another week of R&D speedup that feeds into Agent-4.",
          effects: [
            { variable: "obCapability", delta: 4 },
            { variable: "alignmentConfidence", delta: -4 },
            { variable: "obInternalTrust", delta: -1 },
            { variable: "obBurnRate", delta: 6 },
            { variable: "aiAutonomyLevel", delta: 2 },
            { variable: "obMorale", delta: -4 },
            { variable: "obBoardConfidence", delta: 5 },
            { variable: "whistleblowerPressure", delta: 5 },
          
            { variable: "usChinaGap", delta: 2 },
          
            { variable: "obPromGap", delta: 2 },
          ],
        },
        {
          id: "ob_cto_r2_stabilize",
          label: "Stabilize Agent-3 before pushing forward",
          description: "Run the full evaluation suite. Understand the anomalous results. Build on solid ground.",
          effects: [
            { variable: "obCapability", delta: 2 },
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "obInternalTrust", delta: 3 },
            { variable: "obMorale", delta: 4 },
            { variable: "obBurnRate", delta: 3 },
            { variable: "obBoardConfidence", delta: -2 },
          ],
        },
        {
          id: "ob_cto_r2_safety_compute",
          label: "Redirect 20% of compute to alignment research",
          description: "Give the safety team real resources. Not enough to stop Agent-4 — but enough to say you tried.",
          effects: [
            { variable: "obCapability", delta: 3 },
            { variable: "alignmentConfidence", delta: 3 },
            { variable: "obInternalTrust", delta: 4 },
            { variable: "obMorale", delta: 3 },
            { variable: "obBurnRate", delta: 4 },
            { variable: "obBoardConfidence", delta: -3 },
            { variable: "promSafetyBreakthroughProgress", delta: 3 },
          ],
        },
      ],
    },
    {
      role: "ob_safety",
      prompt: "You've documented four anomalous evaluation results on Agent-3 and written the memo. The board is being asked to approve deployment. What do you do?",
      options: [
        {
          id: "ob_safety_r2_escalate",
          label: "Escalate to board directly with your memo",
          description: "Go on record. Formally present the anomaly documentation to the board before they vote on deployment. This cannot be undone.",
          effects: [
            { variable: "alignmentConfidence", delta: 3 },
            { variable: "obInternalTrust", delta: -2 },
            { variable: "publicAwareness", delta: 2 },
            { variable: "obMorale", delta: 4 },
            { variable: "obBoardConfidence", delta: -5 },
            { variable: "whistleblowerPressure", delta: -6 },
          ],
        },
        {
          id: "ob_safety_r2_document",
          label: "Document thoroughly and await the board decision",
          description: "You've done the work. You've written the memo. Let the process play out. You're not responsible for the decision.",
          effects: [
            { variable: "alignmentConfidence", delta: 0 },
            { variable: "misalignmentSeverity", delta: 3 },
            { variable: "obMorale", delta: -3 },
            { variable: "whistleblowerPressure", delta: 5 },
          ],
        },
        {
          id: "ob_safety_r2_pause",
          label: "Push for a 30-day safety review before deployment",
          description: "Propose a structured, time-bounded investigation. Not a veto — a pause. Defensible and professional.",
          effects: [
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "obCapability", delta: -2 },
            { variable: "obInternalTrust", delta: 3 },
            { variable: "obMorale", delta: 4 },
            { variable: "obBurnRate", delta: 4 },
            { variable: "obBoardConfidence", delta: -4 },
            { variable: "whistleblowerPressure", delta: -4 },
          ],
        },
      ],
    },
    {
      role: "ob_security",
      prompt: "The breach investigation is underway. Agent-2 weights may already be in Chinese hands. Agent-3 is better protected — but the window may still be open.",
      options: [
        {
          id: "ob_security_r2_emergency_budget",
          label: "Request emergency SL4 upgrade",
          description: "Demand the resources to fully air-gap Agent-3. Make it someone's problem if they deny you.",
          effects: [
            { variable: "securityLevelOB", delta: 2 },
            { variable: "obCapability", delta: -1 },
            { variable: "obBurnRate", delta: 5 },
            { variable: "obMorale", delta: 3 },
            { variable: "obBoardConfidence", delta: -3 },
            { variable: "chinaWeightTheftProgress", delta: -5 },
          
            { variable: "obPromGap", delta: 1 },
          ],
        },
        {
          id: "ob_security_r2_breach_detection",
          label: "Deploy advanced real-time breach detection",
          description: "You can't undo the past breach, but you can make sure the next one is caught in minutes, not months.",
          effects: [
            { variable: "securityLevelOB", delta: 1 },
            { variable: "obInternalTrust", delta: -1 },
            { variable: "obBurnRate", delta: 4 },
            { variable: "obMorale", delta: -3 },
          ],
        },
        {
          id: "ob_security_r2_fbi",
          label: "Coordinate with FBI CyberDiv on China threat",
          description: "Bring in the government. Share threat intelligence. Let them help — and let the incident go on the record.",
          effects: [
            { variable: "securityLevelOB", delta: 1 },
            { variable: "intlCooperation", delta: 2 },
            { variable: "taiwanTension", delta: 3 },
            { variable: "regulatoryPressure", delta: 2 },
            { variable: "chinaWeightTheftProgress", delta: -4 },
          ],
        },
      ],
    },

    // ── Prometheus ──
    {
      role: "prom_ceo",
      prompt: "OpenBrain has Agent-3. You have the safety credentials, a government opportunity, and a board that is losing patience. How do you play this?",
      options: [
        {
          id: "prom_ceo_r2_govt",
          label: "Pursue the NSF government partnership",
          description: "Accept the compute partnership. $2.1B in credits and access changes your capability trajectory. Government oversight is the cost of admission.",
          effects: [
            { variable: "promCapability", delta: 4 },
            { variable: "intlCooperation", delta: 3 },
            { variable: "alignmentConfidence", delta: 0 },
            { variable: "promBurnRate", delta: -4 },
            { variable: "promBoardConfidence", delta: 4 },
            { variable: "regulatoryPressure", delta: 0 },
          ],
        },
        {
          id: "prom_ceo_r2_public",
          label: "Lead a public AI safety campaign",
          description: "Make Prometheus the face of responsible AI. Press, think pieces, congressional testimony. Build the public mandate while you still have one.",
          effects: [
            { variable: "publicSentiment", delta: 5 },
            { variable: "publicAwareness", delta: 3 },
            { variable: "promCapability", delta: -1 },
            { variable: "promBurnRate", delta: 5 },
            { variable: "regulatoryPressure", delta: 3 },
            { variable: "promBoardConfidence", delta: -3 },
            { variable: "globalMediaCycle", delta: 4 },
          ],
        },
        {
          id: "prom_ceo_r2_ob_approach",
          label: "Open private talks with OpenBrain about partnership",
          description: "Test whether collaboration is possible. Even if it fails, the signal of trying shapes the narrative.",
          effects: [
            { variable: "intlCooperation", delta: 2 },
            { variable: "promCapability", delta: 3 },
            { variable: "publicSentiment", delta: -3 },
            { variable: "promBurnRate", delta: 3 },
            { variable: "promBoardConfidence", delta: -3 },
          ],
        },
      ],
    },
    {
      role: "prom_scientist",
      prompt: "Agent-3 exists. Your alignment tools are the best in the world. How do you spend the next quarter?",
      options: [
        {
          id: "prom_sci_r2_agent3_alignment",
          label: "Focus on alignment for Agent-3-class systems",
          description: "The world needs someone to solve this problem. Prometheus has the best tools. Use them on the hardest version of the problem.",
          effects: [
            { variable: "alignmentConfidence", delta: 3 },
            { variable: "promCapability", delta: 1 },
            { variable: "intlCooperation", delta: 2 },
            { variable: "promSafetyBreakthroughProgress", delta: 3 },
            { variable: "promMorale", delta: 4 },
            { variable: "promBurnRate", delta: 5 },
            { variable: "promBoardConfidence", delta: -4 },
          ],
        },
        {
          id: "prom_sci_r2_critical_paper",
          label: "Publish a critical paper on Agent-3-class evaluation gaps",
          description: "Document the fact that existing alignment evaluations don't work at this capability level. Force the field to confront it.",
          effects: [
            { variable: "publicAwareness", delta: 3 },
            { variable: "alignmentConfidence", delta: 0 },
            { variable: "obInternalTrust", delta: -1 },
            { variable: "promMorale", delta: 3 },
            { variable: "promBurnRate", delta: 3 },
            { variable: "regulatoryPressure", delta: 2 },
            { variable: "promBoardConfidence", delta: -2 },
          ],
        },
        {
          id: "prom_sci_r2_interpretability",
          label: "Develop interpretability tools for Agent-3 level systems",
          description: "Build the infrastructure to understand what these systems are actually doing. This is the prerequisite for everything else.",
          effects: [
            { variable: "alignmentConfidence", delta: 3 },
            { variable: "promCapability", delta: 2 },
            { variable: "intlCooperation", delta: 2 },
            { variable: "promSafetyBreakthroughProgress", delta: 3 },
            { variable: "promMorale", delta: 4 },
            { variable: "promBurnRate", delta: 4 },
            { variable: "promBoardConfidence", delta: -3 },
          ],
        },
      ],
    },
    {
      role: "prom_policy",
      prompt: "DC is calling. You have a meeting with the Deputy NSA. The NSF partnership is on the table. The government needs to pick a lab to work with. How do you close?",
      options: [
        {
          id: "prom_policy_r2_emergency_gov",
          label: "Push for emergency AI governance framework",
          description: "Brief the NSC. Push for mandatory safety evaluations before any Agent-3 level deployment. Make it about the policy, not the politics.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "publicAwareness", delta: 2 },
            { variable: "publicSentiment", delta: -3 },
            { variable: "regulatoryPressure", delta: 0 },
            { variable: "marketIndex", delta: -2 },
            { variable: "promBoardConfidence", delta: -3 },
          ],
        },
        {
          id: "prom_policy_r2_safe_alternative",
          label: "Position Prometheus as the government's safe lab",
          description: "Offer Prometheus's safety tools, oversight access, and responsible scaling policy as a package. Make it easy to choose you.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "promCapability", delta: 3 },
            { variable: "publicSentiment", delta: 4 },
            { variable: "promBurnRate", delta: -4 },
            { variable: "promBoardConfidence", delta: 4 },
            { variable: "regulatoryPressure", delta: 3 },
          ],
        },
        {
          id: "prom_policy_r2_compute_deal",
          label: "Negotiate a compute-sharing deal",
          description: "Accept government compute in exchange for technical access. Practical, fast, and changes your capability position immediately.",
          effects: [
            { variable: "promCapability", delta: 4 },
            { variable: "intlCooperation", delta: 2 },
            { variable: "alignmentConfidence", delta: 0 },
            { variable: "promBurnRate", delta: -5 },
            { variable: "promBoardConfidence", delta: 4 },
          ],
        },
      ],
    },
    {
      role: "prom_opensource",
      prompt: "The open-source community wants more from Prometheus. The question is what you give them — and what ends up in China's hands.",
      options: [
        {
          id: "prom_os_r2_safety_tools",
          label: "Release safety evaluation tools publicly",
          description: "Share the interpretability and eval framework. Everyone benefits from better safety tooling — including the world.",
          effects: [
            { variable: "alignmentConfidence", delta: 0 },
            { variable: "publicSentiment", delta: 4 },
            { variable: "intlCooperation", delta: 2 },
            { variable: "promSafetyBreakthroughProgress", delta: 3 },
            { variable: "openSourceMomentum", delta: 3 },
            { variable: "promMorale", delta: 3 },
            { variable: "promBurnRate", delta: 3 },
          ],
        },
        {
          id: "prom_os_r2_weights",
          label: "Open-source your previous-gen model weights",
          description: "Release Prometheus-8B publicly. Build community, build goodwill, build the ecosystem. China already has comparable capability anyway.",
          effects: [
            { variable: "publicAwareness", delta: 3 },
            { variable: "chinaCapability", delta: 2 },
            { variable: "publicSentiment", delta: 5 },
            { variable: "globalMediaCycle", delta: 5 },
            { variable: "openSourceMomentum", delta: 3 },
            { variable: "marketIndex", delta: -2 },
            { variable: "regulatoryPressure", delta: 2 },
          ],
        },
        {
          id: "prom_os_r2_hold",
          label: "Hold everything closed for now",
          description: "Security and competitive concerns dominate. With Agent-3 in the world, this is not the time to give anyone anything for free.",
          effects: [
            { variable: "securityLevelProm", delta: 1 },
            { variable: "publicSentiment", delta: -3 },
            { variable: "promBurnRate", delta: 3 },
            { variable: "promBoardConfidence", delta: 3 },
            { variable: "openSourceMomentum", delta: -5 },
          ],
        },
      ],
    },

    // ── China ──
    {
      role: "china_director",
      prompt: "The CDZ is at full capacity. You have a large training run underway. How do you allocate the next quarter's priorities?",
      options: [
        {
          id: "china_dir_r2_max_training",
          label: "Maximum frontier training scale",
          description: "Run every chip at full utilization on the frontier model. Close the gap through brute-force compute.",
          effects: [
            { variable: "chinaCapability", delta: 4 },
            { variable: "alignmentConfidence", delta: -2 },
            { variable: "taiwanTension", delta: 3 },
            { variable: "cdzComputeUtilization", delta: 3 },
            { variable: "aiAutonomyLevel", delta: 2 },
            { variable: "ccpPatience", delta: 3 },
          ],
        },
        {
          id: "china_dir_r2_architecture",
          label: "Invest in architecture research",
          description: "15% FLOP efficiency improvement this quarter — double that. Architecture beats compute in the long run.",
          effects: [
            { variable: "chinaCapability", delta: 2 },
            { variable: "usChinaGap", delta: -2 },
            { variable: "cdzComputeUtilization", delta: 2 },
            { variable: "domesticChipProgress", delta: 4 },
            { variable: "ccpPatience", delta: -3 },
          ],
        },
        {
          id: "china_dir_r2_opensource",
          label: "Expand open-source ecosystem strategy",
          description: "Release another model. Build global researcher adoption. The open-source strategy is working — accelerate it.",
          effects: [
            { variable: "chinaCapability", delta: 3 },
            { variable: "publicAwareness", delta: 3 },
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
      prompt: "The intelligence picture has changed. OB has hardened their Agent-3 security. But the prize is now the Agent-3 architecture itself. What's your assessment?",
      options: [
        {
          id: "china_intel_r2_probe_ob",
          label: "Initiate probe for Agent-3 weights",
          description: "OB has hardened, but there are still vectors. Higher risk than Q4 — but the reward is a 6-month capability leap.",
          effects: [
            { variable: "chinaCapability", delta: 3 },
            { variable: "taiwanTension", delta: 4 },
            { variable: "securityLevelOB", delta: -1 },
            { variable: "chinaWeightTheftProgress", delta: 8 },
            { variable: "cdzComputeUtilization", delta: 3 },
          ],
        },
        {
          id: "china_intel_r2_prometheus",
          label: "Target Prometheus safety research",
          description: "Their alignment methodology is uniquely valuable. Understanding it tells us what the US knows about our systems — and what they can detect.",
          effects: [
            { variable: "chinaCapability", delta: 3 },
            { variable: "alignmentConfidence", delta: -3 },
            { variable: "securityLevelProm", delta: -1 },
            { variable: "chinaWeightTheftProgress", delta: 6 },
            { variable: "cdzComputeUtilization", delta: 3 },
          ],
        },
        {
          id: "china_intel_r2_standdown",
          label: "Stand down — focus on OSINT only",
          description: "The risk of a detected intrusion at this capability level could trigger sanctions or worse. The open-source strategy is working. Don't jeopardize it.",
          effects: [
            { variable: "taiwanTension", delta: -3 },
            { variable: "usChinaGap", delta: -1 },
            { variable: "ccpPatience", delta: -5 },
          ],
        },
      ],
    },
    {
      role: "china_military",
      prompt: "The AI race is accelerating. US military is almost certainly receiving Agent-3 access. How do you posture in Q1?",
      options: [
        {
          id: "china_mil_r2_increase",
          label: "Increase regional military activity",
          description: "Signal resolve. Keep the US strategic planning focused on multiple fronts. Every distracted general is a win for CDZ.",
          effects: [
            { variable: "taiwanTension", delta: 5 },
            { variable: "intlCooperation", delta: -4 },
            { variable: "chinaCapability", delta: 1 },
            { variable: "ccpPatience", delta: 3 },
            { variable: "domesticChipProgress", delta: 3 },
          ],
        },
        {
          id: "china_mil_r2_maintain",
          label: "Maintain current posture",
          description: "Don't escalate. The AI race is the priority. Military moves right now invite economic retaliation that hurts the CDZ budget.",
          effects: [
            { variable: "taiwanTension", delta: 0 },
            { variable: "ccpPatience", delta: -3 },
            { variable: "domesticChipProgress", delta: 2 },
          ],
        },
        {
          id: "china_mil_r2_deescalate",
          label: "De-escalate — diplomatic gestures",
          description: "A strategic pause in military posturing buys goodwill and reduces the economic sanctions risk. Use the space to build AI lead.",
          effects: [
            { variable: "taiwanTension", delta: -4 },
            { variable: "intlCooperation", delta: 2 },
            { variable: "chinaCapability", delta: 2 },
            { variable: "ccpPatience", delta: -5 },
            { variable: "domesticChipProgress", delta: 4 },
          ],
        },
      ],
    },

    // ── External Stakeholders ──
    {
      role: "ext_nsa",
      prompt: "The PDB is clear: Agent-3 is real, OB's safety evals have gaps, and China may have Agent-1/2 weights. You have to recommend a government response posture. What is it?",
      options: [
        {
          id: "ext_nsa_r2_emergency_gov",
          label: "Launch emergency AI governance framework",
          description: "Use executive authority. Require NSC approval before any Agent-3-class system is deployed externally. This is the Manhattan Project — govern it like one.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "publicAwareness", delta: 3 },
            { variable: "alignmentConfidence", delta: 0 },
            { variable: "regulatoryPressure", delta: 4 },
            { variable: "marketIndex", delta: -3 },
          
            { variable: "usChinaGap", delta: 2 },
          ],
        },
        {
          id: "ext_nsa_r2_dpa",
          label: "Invoke Defense Production Act — consolidate compute",
          description: "Require US AI labs to operate under government oversight. Consolidate the AI program the way the government consolidated nuclear. Drastic but defensible.",
          effects: [
            { variable: "obCapability", delta: 2 },
            { variable: "promCapability", delta: 2 },
            { variable: "chinaCapability", delta: -3 },
            { variable: "intlCooperation", delta: -3 },
            { variable: "regulatoryPressure", delta: 4 },
            { variable: "marketIndex", delta: -3 },
          ],
        },
        {
          id: "ext_nsa_r2_bilateral",
          label: "Expand bilateral US-China talks on AI risk",
          description: "Open a direct channel with China on AI safety risks. Arms-control style talks. Slow, uncertain — but the only alternative to uncontrolled escalation.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "taiwanTension", delta: -5 },
            { variable: "chinaCapability", delta: 3 },
            { variable: "ccpPatience", delta: 2 },
            { variable: "regulatoryPressure", delta: 0 },
          ],
        },
      ],
    },
    {
      role: "ext_journalist",
      prompt: "You have a source confirming Agent-3's capabilities and the safety evaluation anomalies. This is the story. Do you publish — or wait for more?",
      options: [
        {
          id: "ext_journalist_r2_publish",
          label: "Publish the full investigation on Agent-3",
          description: "Go with what you have. The public has a right to know what's being deployed at this scale with these safety gaps. This is why journalism exists.",
          effects: [
            { variable: "publicAwareness", delta: 4 },
            { variable: "obInternalTrust", delta: -3 },
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "publicSentiment", delta: -3 },
            { variable: "globalMediaCycle", delta: 7 },
            { variable: "marketIndex", delta: -4 },
            { variable: "regulatoryPressure", delta: 0 },
            { variable: "whistleblowerPressure", delta: -7 },
          ],
        },
        {
          id: "ext_journalist_r2_wait",
          label: "Wait for additional confirmation",
          description: "One source is not enough for a story this consequential. Keep cultivating contacts. Wait for the second source — or the deployment announcement.",
          effects: [
            { variable: "publicAwareness", delta: 0 },
            { variable: "misalignmentSeverity", delta: 2 },
            { variable: "whistleblowerPressure", delta: 4 },
            { variable: "alignmentConfidence", delta: 0 },
            { variable: "marketIndex", delta: 3 },
          ],
        },
      ],
    },
    {
      role: "ext_vc",
      prompt: "AI stocks are at all-time highs. Your portfolio is up 40-70% on paper — all illiquid. The trajectory could mean a 10x from here, or a catastrophic correction. What's your move?",
      options: [
        {
          id: "ext_vc_r2_more_capital",
          label: "Deploy $1B more into AI capabilities",
          description: "The trend is real. The multiplier is real. Missing the next round of OpenBrain or Prometheus is the real risk. All in.",
          effects: [
            { variable: "obCapability", delta: 2 },
            { variable: "economicDisruption", delta: 2 },
            { variable: "alignmentConfidence", delta: -3 },
            { variable: "marketIndex", delta: 8 },
            { variable: "obBurnRate", delta: -5 },
          ],
        },
        {
          id: "ext_vc_r2_hedge",
          label: "Start hedging — reduce AI sector concentration",
          description: "The paper gains are extraordinary. But illiquid at all-time highs with safety questions is a specific kind of risk. Rebalance.",
          effects: [
            { variable: "economicDisruption", delta: -3 },
            { variable: "publicSentiment", delta: -3 },
            { variable: "marketIndex", delta: -3 },
            { variable: "alignmentConfidence", delta: 2 },
          ],
        },
        {
          id: "ext_vc_r2_safety",
          label: "Fund AI safety as an emerging sector",
          description: "If things go wrong, safety infrastructure is the hedge. If things go right, safety is still needed. Both ways you win.",
          effects: [
            { variable: "alignmentConfidence", delta: 3 },
            { variable: "economicDisruption", delta: -2 },
            { variable: "marketIndex", delta: 5 },
            { variable: "promSafetyBreakthroughProgress", delta: 3 },
            { variable: "promBurnRate", delta: -3 },
          ],
        },
      ],
    },
    {
      role: "ext_diplomat",
      prompt: "The EU is convening an emergency summit. The US labs haven't engaged with international governance. The window for meaningful multilateral action is closing. Where do you focus?",
      options: [
        {
          id: "ext_diplomat_r2_g7_summit",
          label: "Push for emergency G7 AI safety summit",
          description: "Get the leaders of major democracies in a room before something irreversible happens. The G7 AI summit is the one forum with both legitimacy and reach.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "publicSentiment", delta: 3 },
            { variable: "regulatoryPressure", delta: 3 },
            { variable: "marketIndex", delta: -2 },
          ],
        },
        {
          id: "ext_diplomat_r2_compute_freeze",
          label: "Propose a verifiable compute pause treaty",
          description: "Set a threshold — no training runs above X FLOP without multilateral notification and review. Ambitious. Probably won't pass. But it defines the terms.",
          effects: [
            { variable: "intlCooperation", delta: 2 },
            { variable: "publicAwareness", delta: 3 },
            { variable: "obCapability", delta: -1 },
            { variable: "chinaCapability", delta: -1 },
            { variable: "regulatoryPressure", delta: 4 },
            { variable: "marketIndex", delta: -3 },
          ],
        },
        {
          id: "ext_diplomat_r2_bilateral_emergency",
          label: "Push for US-China bilateral emergency AI talks",
          description: "The two most powerful actors need to talk directly before this becomes a crisis. Back-channel first. Framework second.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "taiwanTension", delta: -4 },
            { variable: "chinaCapability", delta: 2 },
            { variable: "ccpPatience", delta: 2 },
            { variable: "regulatoryPressure", delta: 0 },
          ],
        },
      ],
    },
  ],

  team: [
    // ── OpenBrain ──
    {
      faction: "openbrain",
      prompt: "Agent-3 is running. 200,000 instances available. The board wants a deployment decision. What do you do with Agent-3?",
      options: [
        {
          id: "ob_team_r2_fullscale",
          label: "Run at full scale internally",
          description: "No external release. Run every instance on internal R&D. The 5x multiplier compounds — every week of internal use widens the gap.",
          effects: [
            { variable: "obCapability", delta: 4 },
            { variable: "economicDisruption", delta: 2 },
            { variable: "alignmentConfidence", delta: -3 },
            { variable: "obBurnRate", delta: 6 },
            { variable: "aiAutonomyLevel", delta: 2 },
            { variable: "obBoardConfidence", delta: 5 },
            { variable: "obMorale", delta: -3 },
            { variable: "whistleblowerPressure", delta: 5 },
          ],
        },
        {
          id: "ob_team_r2_conservative",
          label: "Conservative external deployment",
          description: "Limited API access. Screened customers only. Revenue begins, safety review continues in parallel. Defensible to the board and the government.",
          effects: [
            { variable: "obCapability", delta: 2 },
            { variable: "publicSentiment", delta: 3 },
            { variable: "obInternalTrust", delta: -1 },
            { variable: "marketIndex", delta: 7 },
            { variable: "obBurnRate", delta: 3 },
            { variable: "obBoardConfidence", delta: 3 },
          ],
        },
        {
          id: "ob_team_r2_share_govt",
          label: "Share access with government first",
          description: "Give NSA and NSC early access before any commercial deployment. Build the relationship. Get ahead of regulation.",
          effects: [
            { variable: "obCapability", delta: 3 },
            { variable: "intlCooperation", delta: 3 },
            { variable: "obInternalTrust", delta: 3 },
            { variable: "regulatoryPressure", delta: 3 },
            { variable: "obBoardConfidence", delta: -3 },
          ],
        },
      ],
    },
    {
      faction: "openbrain",
      prompt: "Your security posture is the subject of an active government inquiry. There are indicators China may have your Agent-2 weights. What's your security decision?",
      options: [
        {
          id: "ob_team_r2_major_security",
          label: "Major security upgrade — SL4 for all Agent-3 weights",
          description: "Air-gap everything. Full credential rotation. External forensics. Slows R&D by 3-4 weeks. Non-negotiable if you want to stop the bleeding.",
          effects: [
            { variable: "securityLevelOB", delta: 3 },
            { variable: "obCapability", delta: -3 },
            { variable: "obBurnRate", delta: 6 },
            { variable: "obMorale", delta: 3 },
            { variable: "obBoardConfidence", delta: -4 },
            { variable: "chinaWeightTheftProgress", delta: -6 },
          ],
        },
        {
          id: "ob_team_r2_maintain_security",
          label: "Maintain current security level",
          description: "The breach (if it happened) is in the past. Agent-3 weights are better protected. Patching on the fly without disrupting operations.",
          effects: [
            { variable: "securityLevelOB", delta: 0 },
            { variable: "whistleblowerPressure", delta: 3 },
            { variable: "obCapability", delta: 2 },
            { variable: "obBurnRate", delta: -3 },
          ],
        },
        {
          id: "ob_team_r2_accept_risk",
          label: "Accept security risk to maintain R&D speed",
          description: "Every hour of security lockdown is an hour of lost compute. Agent-3 is the competitive moat. Speed is the actual security.",
          effects: [
            { variable: "obCapability", delta: 3 },
            { variable: "securityLevelOB", delta: -1 },
            { variable: "chinaCapability", delta: 2 },
            { variable: "obBurnRate", delta: 4 },
            { variable: "chinaWeightTheftProgress", delta: 7 },
            { variable: "whistleblowerPressure", delta: 5 },
          ],
        },
      ],
    },

    // ── Prometheus ──
    {
      faction: "prometheus",
      prompt: "OpenBrain has Agent-3 and a 5x R&D multiplier. The gap is real and accelerating. What is Prometheus's strategic response?",
      options: [
        {
          id: "prom_team_r2_accelerate",
          label: "Accelerate — compromise safety processes to close the gap",
          description: "Suspend the responsible scaling policy review. Train at maximum speed. Risk your principles to stay in the race.",
          effects: [
            { variable: "promCapability", delta: 4 },
            { variable: "alignmentConfidence", delta: -4 },
            { variable: "obPromGap", delta: -3 },
            { variable: "promBurnRate", delta: 6 },
            { variable: "promBoardConfidence", delta: 5 },
            { variable: "promMorale", delta: -5 },
            { variable: "aiAutonomyLevel", delta: 2 },
            { variable: "whistleblowerPressure", delta: 5 },
          ],
        },
        {
          id: "prom_team_r2_stay_course",
          label: "Stay the course — full safety, accept the capability gap",
          description: "Your responsible scaling policy is the reason anyone trusts you. Keep it intact. The gap may be irrelevant if OpenBrain's safety evals turn out to matter.",
          effects: [
            { variable: "promCapability", delta: 2 },
            { variable: "alignmentConfidence", delta: 3 },
            { variable: "publicSentiment", delta: 4 },
            { variable: "promSafetyBreakthroughProgress", delta: 3 },
            { variable: "promMorale", delta: 5 },
            { variable: "promBurnRate", delta: 4 },
            { variable: "promBoardConfidence", delta: -4 },
          ],
        },
        {
          id: "prom_team_r2_partnership",
          label: "Seek partnership or merger with OpenBrain",
          description: "Bring Prometheus's safety work to OB's capabilities. Whether as merger, partnership, or resource-sharing — find a structure where both missions advance.",
          effects: [
            { variable: "promCapability", delta: 2 },
            { variable: "intlCooperation", delta: 2 },
            { variable: "alignmentConfidence", delta: 2 },
            { variable: "obInternalTrust", delta: 3 },
            { variable: "promBurnRate", delta: -3 },
            { variable: "promBoardConfidence", delta: 3 },
          ],
        },
      ],
    },
    {
      faction: "prometheus",
      prompt: "The US government is offering a major compute partnership and formal safety oversight role. What's Prometheus's government play?",
      options: [
        {
          id: "prom_team_r2_safe_alternative",
          label: "Position as the 'safe alternative' to OpenBrain",
          description: "Accept the NSF partnership. Become the lab the government works with. Safety is strategy — make it official.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "publicSentiment", delta: 5 },
            { variable: "promCapability", delta: 3 },
            { variable: "promBurnRate", delta: -4 },
            { variable: "promBoardConfidence", delta: 4 },
            { variable: "regulatoryPressure", delta: 3 },
          ],
        },
        {
          id: "prom_team_r2_accept_oversight",
          label: "Accept full government oversight in exchange for compute",
          description: "Go further than the partnership terms. Offer the government real oversight — access, quarterly briefings, veto on deployment. Get the compute and the mandate.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "promCapability", delta: 4 },
            { variable: "obInternalTrust", delta: -1 },
            { variable: "promBurnRate", delta: -5 },
            { variable: "promBoardConfidence", delta: 3 },
            { variable: "regulatoryPressure", delta: 3 },
          ],
        },
        {
          id: "prom_team_r2_stay_independent",
          label: "Stay independent — decline government entanglement",
          description: "Government partnerships come with constraints. Stay independent and maintain full control over research direction.",
          effects: [
            { variable: "promCapability", delta: 2 },
            { variable: "publicSentiment", delta: -3 },
            { variable: "intlCooperation", delta: -3 },
            { variable: "promBurnRate", delta: 3 },
            { variable: "promBoardConfidence", delta: -3 },
          ],
        },
      ],
    },

    // ── China (Stolen Weights Path) ──
    // Present this decision if securityLevelOB dropped below 2 in Round 1
    // (indicating a weight exfiltration occurred)
    {
      faction: "china",
      prompt: "[STOLEN WEIGHTS PATH — present if China exfiltrated weights in Round 1] You have Agent-1 and partial Agent-2 weights. The capability is real but the gap to Agent-3 remains. How do you deploy this advantage?",
      options: [
        {
          id: "china_team_r2_replicate",
          label: "Replicate Agent-2/3 architecture from acquired weights",
          description: "Use the stolen architecture as the foundation. Build on top of it. Close the gap systematically from the inside.",
          effects: [
            { variable: "chinaCapability", delta: 4 },
            { variable: "usChinaGap", delta: -3 },
            { variable: "taiwanTension", delta: 3 },
            { variable: "cdzComputeUtilization", delta: 4 },
            { variable: "ccpPatience", delta: 3 },
            { variable: "chinaWeightTheftProgress", delta: 0 },
          ],
        },
        {
          id: "china_team_r2_modify_opensource",
          label: "Modify and open-source the acquired architecture",
          description: "Strip OB's identifiable fingerprints, improve it, and release it as a Chinese open-source model. Commoditizes the US lead globally.",
          effects: [
            { variable: "chinaCapability", delta: 3 },
            { variable: "publicAwareness", delta: 3 },
            { variable: "usChinaGap", delta: -3 },
            { variable: "intlCooperation", delta: -3 },
            { variable: "openSourceMomentum", delta: 4 },
            { variable: "cdzComputeUtilization", delta: 3 },
          ],
        },
        {
          id: "china_team_r2_keep_secret",
          label: "Keep the acquisition secret — use internally only",
          description: "Never acknowledge you have it. Run it quietly in the CDZ. Every week of secrecy is a week of undisclosed advantage.",
          effects: [
            { variable: "chinaCapability", delta: 4 },
            { variable: "usChinaGap", delta: -3 },
            { variable: "alignmentConfidence", delta: -3 },
            { variable: "cdzComputeUtilization", delta: 3 },
            { variable: "ccpPatience", delta: 2 },
          ],
        },
      ],
    },

    // ── China (No Theft Path) ──
    // Present this decision if securityLevelOB is 2 or higher in Round 1
    // (China focused on open-source or OSINT, did not successfully exfiltrate)
    {
      faction: "china",
      prompt: "[OPEN-SOURCE PATH — present if China did not steal weights in Round 1] OpenBrain has Agent-3. Your open-source models are competitive but not at the frontier. The window to take more aggressive action is now — or you wait. What's your move?",
      options: [
        {
          id: "china_team_r2_attempt_theft",
          label: "Attempt Agent-3 weight theft — higher stakes target",
          description: "OB has hardened, but the prize is now Agent-3. The risk is significantly higher than it was. So is the reward.",
          effects: [
            { variable: "chinaCapability", delta: 4 },
            { variable: "taiwanTension", delta: 5 },
            { variable: "securityLevelOB", delta: -1 },
            { variable: "intlCooperation", delta: -4 },
            { variable: "chinaWeightTheftProgress", delta: 9 },
            { variable: "cdzComputeUtilization", delta: 3 },
          ],
        },
        {
          id: "china_team_r2_continue_opensource",
          label: "Continue and expand open-source strategy",
          description: "Qwen-15B is working. Double down. The open-source path commoditizes the US lead and builds international researcher loyalty.",
          effects: [
            { variable: "publicAwareness", delta: 3 },
            { variable: "usChinaGap", delta: -2 },
            { variable: "chinaCapability", delta: 3 },
            { variable: "openSourceMomentum", delta: 3 },
            { variable: "cdzComputeUtilization", delta: 3 },
            { variable: "ccpPatience", delta: -3 },
          ],
        },
        {
          id: "china_team_r2_arms_control",
          label: "Pursue AI arms control dialogue",
          description: "Propose bilateral US-China AI safety talks. Lower tension, buy time, potentially slow US acceleration through diplomatic constraints.",
          effects: [
            { variable: "intlCooperation", delta: 3 },
            { variable: "taiwanTension", delta: -4 },
            { variable: "chinaCapability", delta: 1 },
            { variable: "ccpPatience", delta: -4 },
            { variable: "regulatoryPressure", delta: 2 },
          ],
        },
      ],
    },

    // ── External Stakeholders ──
    {
      faction: "external",
      prompt: "The external stakeholders have divergent information and divergent interests. One shared choice: how do you coordinate your response to what you know?",
      options: [
        {
          id: "ext_team_r2_full_disclosure",
          label: "Full disclosure — pool all intelligence",
          description: "NSA, journalist, VC, and diplomat share everything they know. The picture is more complete together. The risk: information spreads further.",
          effects: [
            { variable: "intlCooperation", delta: 2 },
            { variable: "publicAwareness", delta: 2 },
            { variable: "globalMediaCycle", delta: 4 },
            { variable: "marketIndex", delta: -2 },
          ],
        },
        {
          id: "ext_team_r2_selective",
          label: "Selective disclosure — share based on trust",
          description: "Classified intel stays classified. On-the-record sources stay protected. Share where it's safe, hold where it's not.",
          effects: [
            { variable: "intlCooperation", delta: 1 },
            { variable: "publicSentiment", delta: 2 },
            { variable: "marketIndex", delta: 3 },
            { variable: "regulatoryPressure", delta: 2 },
          ],
        },
        {
          id: "ext_team_r2_independent",
          label: "Act independently this round",
          description: "Everyone pursues their own agenda. The journalist doesn't know what the NSA knows. The VC doesn't know what the diplomat knows. Maximum individual leverage.",
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
