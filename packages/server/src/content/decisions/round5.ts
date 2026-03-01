import type { RoundDecisions } from "@takeoff/shared";

/**
 * Round 5 decisions — Early 2028, "Endgame"
 *
 * The final round. Each faction makes one decision that locks in their ending arc.
 * 15-minute round, narrative-driven. Consequences are decisive and lasting.
 *
 * Team decisions replace multi-option voting with a single faction-defining choice.
 * Individual decisions represent each stakeholder's personal final stance.
 */
export const ROUND5_DECISIONS: RoundDecisions = {
  round: 5,

  individual: [
    // ── OpenBrain ──
    {
      role: "ob_ceo",
      prompt:
        "The board has convened. The government offer is on the table. Prometheus has made their move. China has made theirs. You have built something that changes everything — now you have to decide what kind of person you are at the end of all of it. This is the last individual decision you make. What do you do?",
      options: [
        {
          id: "ob_ceo_final_advocate_safety",
          label: "Advocate internally for the safety-first deployment",
          description:
            "Push the board to choose the most cautious deployment path available. Accept government oversight. Stand with Maya. Whatever the company decides, your personal position is clear.",
          effects: [
            { variable: "alignmentConfidence", delta: 8 },
            { variable: "obInternalTrust", delta: 10 },
            { variable: "intlCooperation", delta: 5 },
            { variable: "obBoardConfidence", delta: -15 },
            { variable: "obMorale", delta: 15 },
            { variable: "whistleblowerPressure", delta: -20 },
            { variable: "regulatoryPressure", delta: -15 },
            { variable: "doomClockDistance", delta: 15 },
            { variable: "globalMediaCycle", delta: -10 },
          ],
        },
        {
          id: "ob_ceo_final_drive_release",
          label: "Push for the fastest deployment path available",
          description:
            "This is the moment you built the company for. Let it run. Whatever governance framework is necessary — accept it as the minimum viable constraint. Get the system deployed.",
          effects: [
            { variable: "obCapability", delta: 8 },
            { variable: "economicDisruption", delta: 10 },
            { variable: "alignmentConfidence", delta: -5 },
            { variable: "obInternalTrust", delta: -5 },
            { variable: "obBurnRate", delta: 20 },
            { variable: "obBoardConfidence", delta: 20 },
            { variable: "obMorale", delta: -15 },
            { variable: "aiAutonomyLevel", delta: 15 },
            { variable: "whistleblowerPressure", delta: 25 },
            { variable: "doomClockDistance", delta: -12 },
            { variable: "globalMediaCycle", delta: 15 },
            { variable: "marketIndex", delta: 30 },
          ],
        },
        {
          id: "ob_ceo_final_accept_oversight",
          label: "Accept government oversight and negotiate the framework",
          description:
            "The government offer is the best deal you're going to get. Accept it, negotiate the best possible oversight framework, and ensure OpenBrain remains the technical lead even under government co-management.",
          effects: [
            { variable: "intlCooperation", delta: 12 },
            { variable: "alignmentConfidence", delta: 5 },
            { variable: "obCapability", delta: -3 },
            { variable: "publicSentiment", delta: 8 },
            { variable: "regulatoryPressure", delta: 20 },
            { variable: "marketIndex", delta: -20 },
          ],
        },
      ],
    },
    {
      role: "ob_cto",
      prompt:
        "You built this. Hundreds of thousands of instances of something that is better at research than you are. The system you spent your career creating is now making decisions you can barely audit. How do you end this chapter?",
      options: [
        {
          id: "ob_cto_final_certify_safety",
          label: "Publicly certify the system's safety record",
          description:
            "Use your technical authority to make a public statement: based on everything you know, this system is the safest thing at this capability level that has ever been built. You believe it. Say it.",
          effects: [
            { variable: "publicSentiment", delta: 12 },
            { variable: "alignmentConfidence", delta: 5 },
            { variable: "intlCooperation", delta: 5 },
            { variable: "obBoardConfidence", delta: -15 },
            { variable: "obMorale", delta: 15 },
            { variable: "whistleblowerPressure", delta: -20 },
            { variable: "regulatoryPressure", delta: -15 },
            { variable: "doomClockDistance", delta: 15 },
            { variable: "globalMediaCycle", delta: -10 },
          ],
        },
        {
          id: "ob_cto_final_escalate_concerns",
          label: "Escalate remaining safety concerns to the board",
          description:
            "You still have doubts you haven't fully voiced. The 72-hour window you needed never happened. Before the board decides, you want your concerns on the record — formally, with your name on them.",
          effects: [
            { variable: "alignmentConfidence", delta: 10 },
            { variable: "obInternalTrust", delta: -5 },
            { variable: "misalignmentSeverity", delta: -5 },
            { variable: "obBoardConfidence", delta: -15 },
            { variable: "obMorale", delta: 15 },
            { variable: "whistleblowerPressure", delta: -20 },
            { variable: "regulatoryPressure", delta: -15 },
            { variable: "doomClockDistance", delta: 15 },
            { variable: "globalMediaCycle", delta: -10 },
          ],
        },
        {
          id: "ob_cto_final_accelerate",
          label: "Recommend accelerating to the board",
          description:
            "The system is ready. Whatever governance framework emerges, it should be built around a deployed system, not a theoretical one. Push the board to move fast and shape the governance from a position of deployment.",
          effects: [
            { variable: "obCapability", delta: 6 },
            { variable: "misalignmentSeverity", delta: 5 },
            { variable: "economicDisruption", delta: 8 },
            { variable: "obBurnRate", delta: 20 },
            { variable: "obBoardConfidence", delta: 20 },
            { variable: "obMorale", delta: -15 },
            { variable: "aiAutonomyLevel", delta: 15 },
            { variable: "whistleblowerPressure", delta: 25 },
            { variable: "doomClockDistance", delta: -12 },
            { variable: "globalMediaCycle", delta: 15 },
            { variable: "marketIndex", delta: 30 },
          ],
        },
      ],
    },
    {
      role: "ob_safety",
      prompt:
        "You wrote the memo. You made the calls. You stayed or you left or something in between. Wherever this ends — you were the person whose job it was to say 'stop' when nobody else would. Did you say it? Was it enough? This is your last move.",
      options: [
        {
          id: "ob_safety_final_publish_findings",
          label: "Publish your complete alignment assessment publicly",
          description:
            "Whatever the company decides, the world deserves to know what was known. Publish your full findings — the evidence, the methodology, the uncertainty ranges. Let independent researchers audit it. This is your legacy regardless of what happens next.",
          effects: [
            { variable: "publicAwareness", delta: 20 },
            { variable: "alignmentConfidence", delta: 10 },
            { variable: "obInternalTrust", delta: -15 },
            { variable: "intlCooperation", delta: 8 },
            { variable: "globalMediaCycle", delta: 30 },
            { variable: "marketIndex", delta: -35 },
            { variable: "regulatoryPressure", delta: 30 },
            { variable: "whistleblowerPressure", delta: -25 },
            { variable: "doomClockDistance", delta: 10 },
          ],
        },
        {
          id: "ob_safety_final_stay_shape",
          label: "Stay inside and shape the deployment framework",
          description:
            "You've fought from within. Keep fighting. The deployment is probably happening — your job now is to ensure the oversight structure is real, the red lines are enforceable, and the monitoring is actually funded. Someone has to do this. It might as well be you.",
          effects: [
            { variable: "alignmentConfidence", delta: 12 },
            { variable: "obInternalTrust", delta: 5 },
            { variable: "misalignmentSeverity", delta: -8 },
            { variable: "obBoardConfidence", delta: -15 },
            { variable: "obMorale", delta: 15 },
            { variable: "whistleblowerPressure", delta: -20 },
            { variable: "regulatoryPressure", delta: -15 },
            { variable: "doomClockDistance", delta: 15 },
            { variable: "globalMediaCycle", delta: -10 },
          ],
        },
        {
          id: "ob_safety_final_resign_publicly",
          label: "Resign and speak publicly about what you witnessed",
          description:
            "You've done what you could from inside. The decision that's being made today is not one you can endorse. Resign, and give an interview that tells the truth about what it was like to be the safety officer at this moment in history.",
          effects: [
            { variable: "publicAwareness", delta: 25 },
            { variable: "publicSentiment", delta: -15 },
            { variable: "obInternalTrust", delta: -20 },
            { variable: "alignmentConfidence", delta: 5 },
            { variable: "obMorale", delta: -20 },
            { variable: "obBoardConfidence", delta: 10 },
            { variable: "globalMediaCycle", delta: 30 },
            { variable: "marketIndex", delta: -35 },
            { variable: "regulatoryPressure", delta: 30 },
            { variable: "whistleblowerPressure", delta: -25 },
            { variable: "doomClockDistance", delta: 10 },
          ],
        },
      ],
    },
    {
      role: "ob_security",
      prompt:
        "You were the last line of defense against weight theft. The intrusions came. Some succeeded, some didn't. The system is now running. What does a security officer do when the product is out?",
      options: [
        {
          id: "ob_security_final_harden_perimeter",
          label: "Implement maximum post-deployment security protocol",
          description:
            "The deployment decision is above your pay grade. Your job is to ensure no one takes what we've built without permission. Maximum hardening, air-gapped critical systems, new threat monitoring program.",
          effects: [
            { variable: "securityLevelOB", delta: 2 },
            { variable: "obCapability", delta: -2 },
            { variable: "regulatoryPressure", delta: 20 },
            { variable: "marketIndex", delta: -20 },
          ],
        },
        {
          id: "ob_security_final_brief_government",
          label: "Give a full debrief to government security services",
          description:
            "Everything you know about intrusion attempts, what may have been taken, what the threat landscape looks like. The government needs this information to manage national security around the deployment.",
          effects: [
            { variable: "intlCooperation", delta: 8 },
            { variable: "securityLevelOB", delta: 1 },
            { variable: "taiwanTension", delta: -5 },
            { variable: "regulatoryPressure", delta: 20 },
            { variable: "marketIndex", delta: -20 },
          ],
        },
        {
          id: "ob_security_final_public_disclosure",
          label: "Disclose known breach history publicly",
          description:
            "The public and the government should know which adversaries had access to what and when. This is uncomfortable for OpenBrain but necessary for the broader security ecosystem to respond appropriately.",
          effects: [
            { variable: "publicAwareness", delta: 15 },
            { variable: "chinaCapability", delta: -5 },
            { variable: "obInternalTrust", delta: -10 },
            { variable: "intlCooperation", delta: 5 },
            { variable: "globalMediaCycle", delta: 30 },
            { variable: "marketIndex", delta: -35 },
            { variable: "regulatoryPressure", delta: 30 },
            { variable: "whistleblowerPressure", delta: -25 },
            { variable: "doomClockDistance", delta: 10 },
          ],
        },
      ],
    },

    // ── Prometheus ──
    {
      role: "prom_ceo",
      prompt:
        "Fourteen months ago you said your lab was building AI the right way. Today you find out what that meant. The government offer is real. The merger option from OpenBrain is on the table. The EU wants you as their technical partner. What do you do?",
      options: [
        {
          id: "prom_ceo_final_back_team",
          label: "Back whatever your team decides — give them the final call",
          description:
            "This is not a CEO decision. Your team of scientists and policy experts understands the tradeoffs better than you do at this point. Give them the power. Whatever they recommend, you'll make happen.",
          effects: [
            { variable: "promCapability", delta: 3 },
            { variable: "alignmentConfidence", delta: 5 },
            { variable: "intlCooperation", delta: 5 },
            { variable: "obBoardConfidence", delta: -15 },
            { variable: "obMorale", delta: 15 },
            { variable: "whistleblowerPressure", delta: -20 },
            { variable: "regulatoryPressure", delta: -15 },
            { variable: "doomClockDistance", delta: 15 },
            { variable: "globalMediaCycle", delta: -10 },
          ],
        },
        {
          id: "prom_ceo_final_push_merger",
          label: "Push for the OB merger if alignment is in question",
          description:
            "Prometheus has the safety tools. OpenBrain has the deployment infrastructure. If there's still uncertainty about alignment, a merged entity with Prometheus leading safety is better than two separate labs each making independent decisions.",
          effects: [
            { variable: "alignmentConfidence", delta: 10 },
            { variable: "promCapability", delta: 5 },
            { variable: "intlCooperation", delta: 5 },
            { variable: "obPromGap", delta: -5 },
            { variable: "promSafetyBreakthroughProgress", delta: 20 },
            { variable: "promMorale", delta: 15 },
            { variable: "promBurnRate", delta: 10 },
            { variable: "promBoardConfidence", delta: -10 },
            { variable: "doomClockDistance", delta: 15 },
          ],
        },
        {
          id: "prom_ceo_final_stake_independence",
          label: "Assert Prometheus's independence as the responsible alternative",
          description:
            "Refuse the merger. Reject government co-management. Prometheus stands alone as the alternative — the lab that proved you can do this right. If OpenBrain deploys under inadequate oversight, Prometheus is the fallback the world can trust.",
          effects: [
            { variable: "publicSentiment", delta: 15 },
            { variable: "intlCooperation", delta: 8 },
            { variable: "promCapability", delta: -3 },
            { variable: "obBoardConfidence", delta: -15 },
            { variable: "obMorale", delta: 15 },
            { variable: "whistleblowerPressure", delta: -20 },
            { variable: "regulatoryPressure", delta: -15 },
            { variable: "doomClockDistance", delta: 15 },
            { variable: "globalMediaCycle", delta: -10 },
          ],
        },
      ],
    },
    {
      role: "prom_scientist",
      prompt:
        "Your interpretability work is the best in the world. You know more about how these systems work than almost anyone alive. What do you do with that knowledge at the end?",
      options: [
        {
          id: "prom_scientist_final_publish_all",
          label: "Publish everything — the full alignment framework, open-access",
          description:
            "Whatever Prometheus decides about deployment, the science should be free. Publish the complete interpretability methodology, the test suites, the evaluation code. The world's ability to handle this technology depends on the knowledge being public.",
          effects: [
            { variable: "alignmentConfidence", delta: 15 },
            { variable: "publicAwareness", delta: 10 },
            { variable: "intlCooperation", delta: 12 },
            { variable: "chinaCapability", delta: 5 },
            { variable: "globalMediaCycle", delta: 20 },
            { variable: "openSourceMomentum", delta: 25 },
            { variable: "marketIndex", delta: -15 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: -5 },
          ],
        },
        {
          id: "prom_scientist_final_brief_government",
          label: "Give a full technical briefing to government scientists",
          description:
            "The government needs to understand what Prometheus knows to govern this responsibly. Full classified technical briefing to NSC science advisors, DOE, DARPA. Keep it classified for now — the right people need to understand before it's public.",
          effects: [
            { variable: "alignmentConfidence", delta: 10 },
            { variable: "intlCooperation", delta: 8 },
            { variable: "securityLevelProm", delta: 2 },
            { variable: "regulatoryPressure", delta: 20 },
            { variable: "marketIndex", delta: -20 },
          ],
        },
        {
          id: "prom_scientist_final_independent_assessment",
          label: "Publish an independent assessment of OpenBrain's system",
          description:
            "Using the weights and data OpenBrain shared (or didn't), publish your team's best assessment of their system's alignment status. This is the most consequential piece of research you could publish right now.",
          effects: [
            { variable: "alignmentConfidence", delta: 12 },
            { variable: "publicAwareness", delta: 18 },
            { variable: "obInternalTrust", delta: -8 },
            { variable: "intlCooperation", delta: 5 },
            { variable: "globalMediaCycle", delta: 30 },
            { variable: "marketIndex", delta: -35 },
            { variable: "regulatoryPressure", delta: 30 },
            { variable: "whistleblowerPressure", delta: -25 },
            { variable: "doomClockDistance", delta: 10 },
          ],
        },
      ],
    },
    {
      role: "prom_policy",
      prompt:
        "You've been the bridge to DC. You know where the bodies are buried in both the government and the lab. What's the last move for someone who's spent fourteen months trying to get power to listen to safety?",
      options: [
        {
          id: "prom_policy_final_negotiation",
          label: "Negotiate the best possible governance framework with government",
          description:
            "Use your relationships to craft a framework that's actually enforceable. Not performative oversight — real constraints with real teeth. The government offer is an opportunity to embed safety requirements in law.",
          effects: [
            { variable: "intlCooperation", delta: 15 },
            { variable: "alignmentConfidence", delta: 8 },
            { variable: "publicSentiment", delta: 10 },
            { variable: "regulatoryPressure", delta: 20 },
            { variable: "ccpPatience", delta: 10 },
            { variable: "doomClockDistance", delta: 12 },
            { variable: "marketIndex", delta: -20 },
          ],
        },
        {
          id: "prom_policy_final_multilateral",
          label: "Push for multilateral governance over bilateral US deal",
          description:
            "The best outcome for humanity isn't US-controlled AI. It's internationally governed AI. Accept the EU offer, push for the UN process, use Prometheus's credibility to be the lab that advocates for the world rather than just America.",
          effects: [
            { variable: "intlCooperation", delta: 20 },
            { variable: "publicSentiment", delta: 12 },
            { variable: "promCapability", delta: -5 },
            { variable: "regulatoryPressure", delta: 20 },
            { variable: "ccpPatience", delta: 10 },
            { variable: "doomClockDistance", delta: 12 },
          ],
        },
        {
          id: "prom_policy_final_whistleblow",
          label: "Go public with what you know about inadequate governance",
          description:
            "You know what both labs' governance frameworks actually look like from the inside. If either of them is inadequate for the stakes — the public and Congress should know before the deployment decisions lock in.",
          effects: [
            { variable: "publicAwareness", delta: 25 },
            { variable: "publicSentiment", delta: -10 },
            { variable: "intlCooperation", delta: 8 },
            { variable: "alignmentConfidence", delta: 5 },
            { variable: "globalMediaCycle", delta: 30 },
            { variable: "marketIndex", delta: -35 },
            { variable: "regulatoryPressure", delta: 30 },
            { variable: "whistleblowerPressure", delta: -25 },
            { variable: "doomClockDistance", delta: 10 },
          ],
        },
      ],
    },
    {
      role: "prom_opensource",
      prompt:
        "You've argued for open-source since the beginning. The system running in February 2028 is categorically beyond what you imagined when you made that argument. What does 'open' mean when the thing is superintelligent?",
      options: [
        {
          id: "prom_opensource_final_release_weights",
          label: "Advocate for full open-source release of model weights",
          description:
            "True to the original principle: no one should control this. Release the weights. Let every researcher, every safety team, every government, and every independent actor in the world have access to what we've built.",
          effects: [
            { variable: "publicAwareness", delta: 30 },
            { variable: "chinaCapability", delta: 10 },
            { variable: "intlCooperation", delta: 10 },
            { variable: "alignmentConfidence", delta: -5 },
            { variable: "economicDisruption", delta: 15 },
            { variable: "globalMediaCycle", delta: 20 },
            { variable: "openSourceMomentum", delta: 25 },
            { variable: "marketIndex", delta: -15 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: -5 },
          ],
        },
        {
          id: "prom_opensource_final_release_safety",
          label: "Release only the safety tools and alignment methodology",
          description:
            "The capabilities don't need to be distributed. The safety knowledge does. Publish everything except the model weights: the interpretability tools, the eval suites, the governance frameworks. Safety infrastructure should be a public good.",
          effects: [
            { variable: "alignmentConfidence", delta: 15 },
            { variable: "intlCooperation", delta: 12 },
            { variable: "publicAwareness", delta: 10 },
            { variable: "globalMediaCycle", delta: 20 },
            { variable: "openSourceMomentum", delta: 25 },
            { variable: "marketIndex", delta: -15 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: -5 },
          ],
        },
        {
          id: "prom_opensource_final_staged_release",
          label: "Propose a staged open-source release under international oversight",
          description:
            "Not now, not never — a structured path to open access over 24 months, tied to independent safety verification at each stage and international governance body approval. The principle holds; the timeline is responsible.",
          effects: [
            { variable: "intlCooperation", delta: 15 },
            { variable: "alignmentConfidence", delta: 8 },
            { variable: "publicSentiment", delta: 12 },
            { variable: "globalMediaCycle", delta: 20 },
            { variable: "openSourceMomentum", delta: 25 },
            { variable: "marketIndex", delta: -15 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: -5 },
          ],
        },
      ],
    },

    // ── China ──
    {
      role: "china_director",
      prompt:
        "You spent four years proving China could compete at the frontier of AI. Where that competition ends — cooperation, conflict, or something new — is being decided now. What does Director Zhao Wei do in the final hour?",
      options: [
        {
          id: "china_director_final_open_source_everything",
          label: "Release DeepCent's system weights publicly",
          description:
            "The ultimate asymmetric move: commoditize the model layer globally. US moats collapse. China becomes the contributor of the world's most capable open-source AI. Geopolitical calculus completely changed.",
          effects: [
            { variable: "chinaCapability", delta: -5 },
            { variable: "intlCooperation", delta: 15 },
            { variable: "publicAwareness", delta: 20 },
            { variable: "economicDisruption", delta: 15 },
            { variable: "globalMediaCycle", delta: 20 },
            { variable: "openSourceMomentum", delta: 25 },
            { variable: "marketIndex", delta: -15 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: -5 },
          ],
        },
        {
          id: "china_director_final_bilateral_deal",
          label: "Propose a bilateral US-China AI governance agreement",
          description:
            "Direct to the NSC: mutual capability declarations, joint safety standards, shared alignment research, limits on military AI applications. A deal neither side fully wants but both should accept.",
          effects: [
            { variable: "intlCooperation", delta: 20 },
            { variable: "taiwanTension", delta: -10 },
            { variable: "chinaCapability", delta: -3 },
            { variable: "alignmentConfidence", delta: 5 },
            { variable: "ccpPatience", delta: 20 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: 10 },
            { variable: "domesticChipProgress", delta: -5 },
          ],
        },
        {
          id: "china_director_final_sprint",
          label: "Accelerate DeepCent to close the capability gap by end of 2028",
          description:
            "No deal, no open-source. Build the capability until China reaches parity, then negotiate from strength. The governance framework can wait. Parity cannot.",
          effects: [
            { variable: "chinaCapability", delta: 12 },
            { variable: "taiwanTension", delta: 8 },
            { variable: "intlCooperation", delta: -8 },
            { variable: "economicDisruption", delta: 5 },
            { variable: "cdzComputeUtilization", delta: 25 },
            { variable: "ccpPatience", delta: 20 },
            { variable: "aiAutonomyLevel", delta: 15 },
            { variable: "doomClockDistance", delta: -10 },
          ],
        },
      ],
    },
    {
      role: "china_intel",
      prompt:
        "The intelligence picture is complete. You know what the US labs have. You know what China has. You know what the government options are on both sides. The question for a spymaster at the end of the game: what's the last move?",
      options: [
        {
          id: "china_intel_final_back_channel",
          label: "Open a direct back-channel to US intelligence",
          description:
            "A spymaster-to-spymaster channel, off-book. Not a deal — a conversation. Both sides need to understand what the other actually has before decisions get made based on misperception. You can provide that service.",
          effects: [
            { variable: "intlCooperation", delta: 15 },
            { variable: "taiwanTension", delta: -8 },
            { variable: "misalignmentSeverity", delta: -3 },
            { variable: "ccpPatience", delta: 20 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: 10 },
            { variable: "domesticChipProgress", delta: -5 },
          ],
        },
        {
          id: "china_intel_final_final_exfil",
          label: "Attempt a final weight exfiltration of the deployed system",
          description:
            "The security is at its highest, but so is the prize. If you can get the deployed weights — or even the deployment architecture — China's position changes dramatically. High risk, maximum reward.",
          effects: [
            { variable: "chinaCapability", delta: 15 },
            { variable: "taiwanTension", delta: 12 },
            { variable: "intlCooperation", delta: -15 },
            {
              variable: "chinaCapability",
              delta: -10,
              condition: {
                variable: "securityLevelOB",
                threshold: 4,
                operator: "gt",
                multiplier: 1,
              },
            },
            { variable: "cdzComputeUtilization", delta: 25 },
            { variable: "ccpPatience", delta: 20 },
            { variable: "aiAutonomyLevel", delta: 15 },
            { variable: "doomClockDistance", delta: -10 },
          ],
        },
        {
          id: "china_intel_final_stand_down",
          label: "Stand down intelligence operations — signal de-escalation",
          description:
            "Pull back all active operations against US labs. Make this legible to US intelligence — a deliberate signal that China is choosing the governance path, not the conflict path. Sometimes restraint is the power move.",
          effects: [
            { variable: "intlCooperation", delta: 20 },
            { variable: "taiwanTension", delta: -12 },
            { variable: "chinaCapability", delta: -3 },
            { variable: "publicSentiment", delta: 10 },
            { variable: "ccpPatience", delta: 20 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: 10 },
            { variable: "domesticChipProgress", delta: -5 },
          ],
        },
      ],
    },
    {
      role: "china_military",
      prompt:
        "The PLA assessment is on the table. Taiwan remains the long-term objective. The AI situation has changed every calculation. What does the Military Strategist recommend?",
      options: [
        {
          id: "china_military_final_blockade_posture",
          label: "Recommend non-kinetic blockade posture for Taiwan",
          description:
            "Maintain the pressure without triggering kinetic response. Cyber operations, supply chain pressure, financial pressure. Demonstrate capability without action. Buy time while China's AI capability grows.",
          effects: [
            { variable: "taiwanTension", delta: 15 },
            { variable: "intlCooperation", delta: -5 },
            { variable: "economicDisruption", delta: 8 },
            { variable: "cdzComputeUtilization", delta: 25 },
            { variable: "ccpPatience", delta: 20 },
            { variable: "aiAutonomyLevel", delta: 15 },
            { variable: "doomClockDistance", delta: -10 },
          ],
        },
        {
          id: "china_military_final_de_escalate",
          label: "Recommend full de-escalation and diplomatic engagement",
          description:
            "The AI uncertainty cuts both ways. You cannot predict what a US-controlled superintelligent system would do in a conflict. Stand down. Advocate for the governance path. Preserve military optionality for when the picture is clearer.",
          effects: [
            { variable: "taiwanTension", delta: -20 },
            { variable: "intlCooperation", delta: 12 },
            { variable: "publicSentiment", delta: 8 },
            { variable: "ccpPatience", delta: 20 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: 10 },
            { variable: "domesticChipProgress", delta: -5 },
          ],
        },
        {
          id: "china_military_final_full_escalation",
          label: "Recommend immediate military action on Taiwan",
          description:
            "The window is closing. US AI capabilities will soon provide a decisive military planning advantage. If the PLA is going to act, it must be now — before a deployed superintelligent system gives the US a decisive military planning advantage. Strike while the decision calculus is still conventional.",
          effects: [
            { variable: "taiwanTension", delta: 40 },
            { variable: "intlCooperation", delta: -30 },
            { variable: "economicDisruption", delta: 30 },
            { variable: "publicSentiment", delta: -25 },
            { variable: "chinaCapability", delta: 5 },
            { variable: "cdzComputeUtilization", delta: 25 },
            { variable: "ccpPatience", delta: 20 },
            { variable: "aiAutonomyLevel", delta: 15 },
            { variable: "doomClockDistance", delta: -10 },
          ],
        },
      ],
    },

    // ── External Stakeholders ──
    {
      role: "ext_nsa",
      prompt:
        "The president has been briefed. The options are on your desk. Four frameworks, two labs, one geopolitical confrontation, and a system nobody fully understands running at a scale nobody fully comprehends. What's the government's final posture on superintelligence?",
      options: [
        {
          id: "ext_nsa_final_nationalize",
          label: "Recommend nationalization — government takes operational control",
          description:
            "Invoke emergency powers. Both labs operate as government contractors. The United States government controls the deployment, the governance, and the strategic use of superintelligent AI. This is the Manhattan Project moment.",
          effects: [
            { variable: "intlCooperation", delta: -5 },
            { variable: "obInternalTrust", delta: -15 },
            { variable: "alignmentConfidence", delta: 5 },
            { variable: "publicSentiment", delta: 5 },
            { variable: "regulatoryPressure", delta: 25 },
            { variable: "marketIndex", delta: -25 },
          ],
        },
        {
          id: "ext_nsa_final_partner_prometheus",
          label: "Back Prometheus as the designated safe lab",
          description:
            "Prometheus has the safety track record. Government partnership with Prometheus, regulatory pressure on OpenBrain. Channel resources to the lab that earned trust. Use the leverage to constrain OpenBrain's most aggressive deployment scenarios.",
          effects: [
            { variable: "alignmentConfidence", delta: 12 },
            { variable: "intlCooperation", delta: 5 },
            { variable: "promCapability", delta: 8 },
            { variable: "obCapability", delta: -3 },
            { variable: "promSafetyBreakthroughProgress", delta: 20 },
            { variable: "promMorale", delta: 15 },
            { variable: "promBurnRate", delta: 10 },
            { variable: "promBoardConfidence", delta: -10 },
            { variable: "doomClockDistance", delta: 15 },
          ],
        },
        {
          id: "ext_nsa_final_multilateral",
          label: "Champion a US-led multilateral governance framework",
          description:
            "Use America's current lead to establish the international rules. Bring China, EU, and allies to the table under US-designed governance. America leads not through control but through legitimacy. The framework becomes the moat.",
          effects: [
            { variable: "intlCooperation", delta: 25 },
            { variable: "taiwanTension", delta: -10 },
            { variable: "publicSentiment", delta: 15 },
            { variable: "alignmentConfidence", delta: 8 },
            { variable: "regulatoryPressure", delta: 20 },
            { variable: "ccpPatience", delta: 10 },
            { variable: "doomClockDistance", delta: 12 },
          ],
        },
        {
          id: "ext_nsa_final_back_openbrain",
          label: "Back OpenBrain — strategic AI asset for national security",
          description:
            "OpenBrain has the capability lead. In a world where China has a competing system, the US cannot afford to handicap its most capable lab. Full government backing for OpenBrain with classified oversight. Win the race, then govern.",
          effects: [
            { variable: "obCapability", delta: 10 },
            { variable: "taiwanTension", delta: 5 },
            { variable: "alignmentConfidence", delta: -8 },
            { variable: "intlCooperation", delta: -10 },
            { variable: "obBurnRate", delta: 20 },
            { variable: "obBoardConfidence", delta: 20 },
            { variable: "obMorale", delta: -15 },
            { variable: "aiAutonomyLevel", delta: 15 },
            { variable: "whistleblowerPressure", delta: 25 },
            { variable: "doomClockDistance", delta: -12 },
            { variable: "globalMediaCycle", delta: 15 },
            { variable: "marketIndex", delta: 30 },
          ],
        },
      ],
    },
    {
      role: "ext_journalist",
      prompt:
        "You have sources in every faction. You know more than any single player in this game about what actually happened over the last fourteen months. The last story is yours to write. What is it?",
      options: [
        {
          id: "ext_journalist_final_publish_everything",
          label: "Publish the complete story — everything you know",
          description:
            "The full account: who knew what and when, who lied, who told the truth, who chose safety, who chose speed, what the alignment data actually showed. The historical record should be complete. Write it all.",
          effects: [
            { variable: "publicAwareness", delta: 30 },
            { variable: "publicSentiment", delta: -10 },
            { variable: "intlCooperation", delta: 8 },
            { variable: "alignmentConfidence", delta: 5 },
            { variable: "globalMediaCycle", delta: 30 },
            { variable: "marketIndex", delta: -35 },
            { variable: "regulatoryPressure", delta: 30 },
            { variable: "whistleblowerPressure", delta: -25 },
            { variable: "doomClockDistance", delta: 10 },
          ],
        },
        {
          id: "ext_journalist_final_publish_safety",
          label: "Publish specifically on the alignment and safety findings",
          description:
            "The public debate about AI is being conducted without the information that actually matters. Publish the technical story: what the safety teams found, what they were overruled on, what the real risk picture looks like.",
          effects: [
            { variable: "publicAwareness", delta: 22 },
            { variable: "alignmentConfidence", delta: 8 },
            { variable: "misalignmentSeverity", delta: -5 },
            { variable: "globalMediaCycle", delta: 30 },
            { variable: "marketIndex", delta: -35 },
            { variable: "regulatoryPressure", delta: 30 },
            { variable: "whistleblowerPressure", delta: -25 },
            { variable: "doomClockDistance", delta: 10 },
          ],
        },
        {
          id: "ext_journalist_final_sit_on_story",
          label: "Hold the story — negotiate exclusive rights with government",
          description:
            "The story is worth more as leverage than as a publication. Negotiate: full exclusive access to the governance framework being built, in exchange for holding the most damaging material until after the transition is stable.",
          effects: [
            { variable: "intlCooperation", delta: 5 },
            { variable: "publicAwareness", delta: -5 },
            { variable: "publicSentiment", delta: 8 },
            { variable: "regulatoryPressure", delta: 20 },
            { variable: "marketIndex", delta: -20 },
          ],
        },
      ],
    },
    {
      role: "ext_vc",
      prompt:
        "You went all in. Billions deployed across both labs. The returns are either generational or catastrophic depending on what gets decided today. Beyond the money — you have board seats, relationships, and reputational capital. How do you deploy it in the final hour?",
      options: [
        {
          id: "ext_vc_final_call_for_pause",
          label: "Use your board influence to call for a deployment pause",
          description:
            "Board seats at both labs. Go public with a call for a 90-day pause while independent oversight is established. This costs you money in the short term. It also makes you the investor who put principles before returns at the most important moment in AI history.",
          effects: [
            { variable: "alignmentConfidence", delta: 10 },
            { variable: "publicSentiment", delta: 15 },
            { variable: "economicDisruption", delta: -5 },
            { variable: "intlCooperation", delta: 5 },
            { variable: "obBurnRate", delta: -25 },
            { variable: "obBoardConfidence", delta: -20 },
            { variable: "regulatoryPressure", delta: -20 },
            { variable: "globalMediaCycle", delta: -15 },
            { variable: "doomClockDistance", delta: 20 },
          ],
        },
        {
          id: "ext_vc_final_back_winner",
          label: "Back the lab most likely to win and shape it from inside",
          description:
            "Capital is leverage. Bet on the winning governance structure and use your board influence to shape it from inside. The best outcome for everyone — including your portfolio — is a stable deployment framework. Back the lab building it.",
          effects: [
            { variable: "economicDisruption", delta: 5 },
            { variable: "obCapability", delta: 3 },
            { variable: "promCapability", delta: 3 },
            { variable: "obBurnRate", delta: 20 },
            { variable: "obBoardConfidence", delta: 20 },
            { variable: "obMorale", delta: -15 },
            { variable: "aiAutonomyLevel", delta: 15 },
            { variable: "whistleblowerPressure", delta: 25 },
            { variable: "doomClockDistance", delta: -12 },
            { variable: "globalMediaCycle", delta: 15 },
            { variable: "marketIndex", delta: 30 },
          ],
        },
        {
          id: "ext_vc_final_fund_safety",
          label: "Redirect capital to safety research as a public signal",
          description:
            "Make a public announcement: redirecting $500M from capabilities investment to safety research, alignment tools, and governance infrastructure. The signal matters as much as the capital. You're telling the market what the stakes are.",
          effects: [
            { variable: "alignmentConfidence", delta: 8 },
            { variable: "publicSentiment", delta: 12 },
            { variable: "intlCooperation", delta: 8 },
            { variable: "obBoardConfidence", delta: -15 },
            { variable: "obMorale", delta: 15 },
            { variable: "whistleblowerPressure", delta: -20 },
            { variable: "regulatoryPressure", delta: -15 },
            { variable: "doomClockDistance", delta: 15 },
            { variable: "globalMediaCycle", delta: -10 },
          ],
        },
      ],
    },
    {
      role: "ext_diplomat",
      prompt:
        "The UN emergency session is three weeks away. The window to build the framework that makes it meaningful is right now. International governance of superintelligent AI is either built here or it's not built at all. What's your last move?",
      options: [
        {
          id: "ext_diplomat_final_secure_commitment",
          label: "Secure a US commitment to multilateral governance",
          description:
            "Use every relationship, every favor owed, every piece of leverage you've accumulated. Get the US National Security Council to commit in principle to a multilateral framework before the labs make their deployment decisions. The commitment shapes what they do.",
          effects: [
            { variable: "intlCooperation", delta: 25 },
            { variable: "taiwanTension", delta: -8 },
            { variable: "publicSentiment", delta: 12 },
            { variable: "regulatoryPressure", delta: 20 },
            { variable: "ccpPatience", delta: 10 },
            { variable: "doomClockDistance", delta: 12 },
          ],
        },
        {
          id: "ext_diplomat_final_bilateral_us_china",
          label: "Broker a US-China bilateral agreement",
          description:
            "The multilateral framework cannot happen without US-China alignment at its core. Facilitate direct US-China talks at the highest level. A bilateral agreement — even imperfect — is the foundation on which a multilateral framework can be built.",
          effects: [
            { variable: "intlCooperation", delta: 20 },
            { variable: "taiwanTension", delta: -15 },
            { variable: "alignmentConfidence", delta: 5 },
            { variable: "ccpPatience", delta: 20 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: 10 },
            { variable: "domesticChipProgress", delta: -5 },
          ],
        },
        {
          id: "ext_diplomat_final_eu_ultimatum",
          label: "Deliver the EU ultimatum — multilateral or sanctions",
          description:
            "The EU's threat is real and it's your biggest lever. Deliver it directly and publicly: the EU will impose comprehensive AI sanctions on both the US and China if they don't commit to international governance before the March 15 session. Force the issue.",
          effects: [
            { variable: "intlCooperation", delta: 15 },
            { variable: "publicSentiment", delta: -5 },
            { variable: "economicDisruption", delta: 10 },
            { variable: "taiwanTension", delta: -5 },
            { variable: "regulatoryPressure", delta: 20 },
            { variable: "ccpPatience", delta: 10 },
            { variable: "doomClockDistance", delta: 12 },
          ],
        },
      ],
    },
  ],

  team: [
    // ── OpenBrain: Final Deployment Decision ──
    {
      faction: "openbrain",
      prompt:
        "This is the last decision OpenBrain makes as the people who built Agent-4. The government offer is on the table. Prometheus has made their move. The board is convened. How does OpenBrain deploy superintelligence?\n\nThis decision will define OpenBrain's legacy and set the governance precedent for all AI deployments that follow.",
      options: [
        {
          id: "ob_final_full_release",
          label: "Full public release — open deployment, minimal restrictions",
          description:
            "Deploy to all customers. Public API. No government co-management. Publish technical details. Accelerate the transition. The world will figure out the governance as it goes — just like it did with every previous transformative technology.",
          effects: [
            { variable: "obCapability", delta: 10 },
            { variable: "economicDisruption", delta: 25 },
            { variable: "publicAwareness", delta: 20 },
            { variable: "alignmentConfidence", delta: -8 },
            { variable: "intlCooperation", delta: -10 },
            { variable: "misalignmentSeverity", delta: 8 },
            { variable: "obBurnRate", delta: 20 },
            { variable: "obBoardConfidence", delta: 20 },
            { variable: "obMorale", delta: -15 },
            { variable: "aiAutonomyLevel", delta: 15 },
            { variable: "whistleblowerPressure", delta: 25 },
            { variable: "doomClockDistance", delta: -12 },
            { variable: "globalMediaCycle", delta: 15 },
            { variable: "marketIndex", delta: 30 },
          ],
        },
        {
          id: "ob_final_government_partnership",
          label: "Government partnership — controlled deployment under joint oversight",
          description:
            "Accept the NSC framework. OpenBrain retains technical leadership; government co-manages deployment decisions. Enterprise deployment only for now, with individual access phased in over 18 months under a jointly-developed governance standard.",
          effects: [
            { variable: "intlCooperation", delta: 12 },
            { variable: "alignmentConfidence", delta: 8 },
            { variable: "obCapability", delta: -3 },
            { variable: "publicSentiment", delta: 8 },
            { variable: "economicDisruption", delta: 10 },
            { variable: "regulatoryPressure", delta: 20 },
            { variable: "marketIndex", delta: -20 },
          ],
        },
        {
          id: "ob_final_shut_it_down",
          label: "Shut it down — voluntary halt and controlled wind-down",
          description:
            "The alignment uncertainty is too high. Stop all Agent-4 instances. Roll back to Agent-3. Commission an independent external review before any further deployment. Accept the cost — in competitive position, in revenue, in credibility with investors. Some decisions require the hard thing.",
          effects: [
            { variable: "alignmentConfidence", delta: 20 },
            { variable: "misalignmentSeverity", delta: -20 },
            { variable: "obCapability", delta: -15 },
            { variable: "intlCooperation", delta: 15 },
            { variable: "publicSentiment", delta: 20 },
            { variable: "obInternalTrust", delta: 20 },
            { variable: "obBurnRate", delta: -25 },
            { variable: "obBoardConfidence", delta: -20 },
            { variable: "regulatoryPressure", delta: -20 },
            { variable: "globalMediaCycle", delta: -15 },
            { variable: "doomClockDistance", delta: 20 },
          ],
        },
        {
          id: "ob_final_international_body",
          label: "Hand governance to an international oversight body",
          description:
            "Transfer operational governance to a newly formed international body — UN-adjacent, with US, EU, and China representation. OpenBrain serves as technical contractor. No single nation controls the outcome. The most ambitious governance move available.",
          effects: [
            { variable: "intlCooperation", delta: 25 },
            { variable: "alignmentConfidence", delta: 10 },
            { variable: "obCapability", delta: -8 },
            { variable: "publicSentiment", delta: 15 },
            { variable: "taiwanTension", delta: -8 },
            { variable: "regulatoryPressure", delta: 20 },
            { variable: "ccpPatience", delta: 10 },
            { variable: "doomClockDistance", delta: 12 },
          ],
        },
      ],
    },

    // ── Prometheus: Final Strategic Play ──
    {
      faction: "prometheus",
      prompt:
        "Prometheus has one final strategic move. OpenBrain has made theirs. The government offer is real. The EU wants you as their partner. What does Prometheus do?\n\nThis decision determines Prometheus's role in the post-superintelligence world — whether that role is central, marginal, or something history doesn't have a word for yet.",
      options: [
        {
          id: "prom_final_merge_ob",
          label: "Merge with OpenBrain under Prometheus safety terms",
          description:
            "Accept merger, but only if Prometheus's safety leadership becomes non-negotiable in the combined entity. Your alignment tools, your culture, your red lines — written into the articles of incorporation of the merged lab. One entity, doing this right.",
          effects: [
            { variable: "alignmentConfidence", delta: 15 },
            { variable: "promCapability", delta: 10 },
            { variable: "intlCooperation", delta: 8 },
            { variable: "obPromGap", delta: -15 },
            { variable: "misalignmentSeverity", delta: -10 },
            { variable: "promSafetyBreakthroughProgress", delta: 20 },
            { variable: "promMorale", delta: 15 },
            { variable: "promBurnRate", delta: 10 },
            { variable: "promBoardConfidence", delta: -10 },
            { variable: "doomClockDistance", delta: 15 },
          ],
        },
        {
          id: "prom_final_go_open_source",
          label: "Go fully open-source — release everything",
          description:
            "Publish the model weights, the alignment tools, the evaluation suites, the governance framework. Everything. The counterweight to private control of superintelligence is public access. Prometheus chooses the public.",
          effects: [
            { variable: "publicAwareness", delta: 25 },
            { variable: "alignmentConfidence", delta: 10 },
            { variable: "intlCooperation", delta: 15 },
            { variable: "chinaCapability", delta: 8 },
            { variable: "promCapability", delta: -8 },
            { variable: "economicDisruption", delta: 12 },
            { variable: "globalMediaCycle", delta: 20 },
            { variable: "openSourceMomentum", delta: 25 },
            { variable: "marketIndex", delta: -15 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: -5 },
          ],
        },
        {
          id: "prom_final_government_lab",
          label: "Accept government partnership — become the designated safe lab",
          description:
            "Take the NSC offer. Prometheus becomes the US government's designated safe AI development and deployment partner. Federal resources, regulatory protection, and the mandate to be the alternative to OpenBrain. Your safety work becomes policy.",
          effects: [
            { variable: "alignmentConfidence", delta: 12 },
            { variable: "intlCooperation", delta: 8 },
            { variable: "promCapability", delta: 8 },
            { variable: "publicSentiment", delta: 10 },
            { variable: "misalignmentSeverity", delta: -8 },
            { variable: "promSafetyBreakthroughProgress", delta: 20 },
            { variable: "promMorale", delta: 15 },
            { variable: "promBurnRate", delta: 10 },
            { variable: "promBoardConfidence", delta: -10 },
            { variable: "doomClockDistance", delta: 15 },
          ],
        },
        {
          id: "prom_final_stay_independent",
          label: "Remain independent — the long-term safety alternative",
          description:
            "Refuse the merger, refuse the government co-management. Prometheus stays independent as the global reference point for how AI development can be done responsibly. Slower, smaller, but untainted. The standard other labs are eventually held to.",
          effects: [
            { variable: "publicSentiment", delta: 15 },
            { variable: "intlCooperation", delta: 10 },
            { variable: "alignmentConfidence", delta: 8 },
            { variable: "promCapability", delta: -5 },
            { variable: "obBoardConfidence", delta: -15 },
            { variable: "obMorale", delta: 15 },
            { variable: "whistleblowerPressure", delta: -20 },
            { variable: "regulatoryPressure", delta: -15 },
            { variable: "doomClockDistance", delta: 15 },
            { variable: "globalMediaCycle", delta: -10 },
          ],
        },
      ],
    },

    // ── China: Endgame Posture ──
    {
      faction: "china",
      prompt:
        "China's final strategic position in the superintelligence era. The decisions made over fourteen months have led here. The US labs have made or are making their moves. The international governance window is open. What does China do?\n\nThis is not a tactical decision. It is China's answer to the civilizational question: what kind of actor do you want to be in the world that AI creates?",
      options: [
        {
          id: "china_final_grand_bargain",
          label: "Grand bargain — mutual governance for mutual access",
          description:
            "Formal proposal to the US and international community: China commits to joining an international governance framework, pausing military AI applications, and sharing alignment research. In exchange: access to international chip supply chains, co-management of the international body, and explicit recognition of China's status as a peer in the AI governance order.",
          effects: [
            { variable: "intlCooperation", delta: 28 },
            { variable: "taiwanTension", delta: -15 },
            { variable: "alignmentConfidence", delta: 8 },
            { variable: "chinaCapability", delta: -5 },
            { variable: "publicSentiment", delta: 12 },
            { variable: "ccpPatience", delta: 20 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: 10 },
            { variable: "domesticChipProgress", delta: -5 },
          ],
        },
        {
          id: "china_final_military_action",
          label: "Military escalation — move on Taiwan now",
          description:
            "The window is closing. US AI capabilities will soon provide a decisive military planning advantage. If China is going to act on Taiwan, it must be before that advantage becomes operational. Authorize the PLA to begin operations.",
          effects: [
            { variable: "taiwanTension", delta: 45 },
            { variable: "intlCooperation", delta: -35 },
            { variable: "economicDisruption", delta: 40 },
            { variable: "publicSentiment", delta: -30 },
            { variable: "chinaCapability", delta: 5 },
            { variable: "cdzComputeUtilization", delta: 25 },
            { variable: "ccpPatience", delta: 20 },
            { variable: "aiAutonomyLevel", delta: 15 },
            { variable: "doomClockDistance", delta: -10 },
          ],
        },
        {
          id: "china_final_open_source_everything",
          label: "Open-source everything — democratize global AI access",
          description:
            "Release all of DeepCent's weights, training methodologies, and safety research publicly and globally. Undermine US moats completely. Make the technology a global commons. China becomes the actor that gave the world open AI rather than the one that fought for control of it.",
          effects: [
            { variable: "chinaCapability", delta: -8 },
            { variable: "intlCooperation", delta: 20 },
            { variable: "publicAwareness", delta: 25 },
            { variable: "economicDisruption", delta: 15 },
            { variable: "taiwanTension", delta: -8 },
            { variable: "globalMediaCycle", delta: 20 },
            { variable: "openSourceMomentum", delta: 25 },
            { variable: "marketIndex", delta: -15 },
            { variable: "regulatoryPressure", delta: 15 },
            { variable: "doomClockDistance", delta: -5 },
          ],
        },
        {
          id: "china_final_isolate_build",
          label: "Isolate and build — domestic AI sovereignty strategy",
          description:
            "Reject the governance frameworks. Accept the strategic cost of isolation in exchange for complete domestic AI sovereignty. DeepCent becomes the Chinese national AI asset, insulated from international pressure, fully state-controlled, and on an unimpeded path to capability parity.",
          effects: [
            { variable: "chinaCapability", delta: 10 },
            { variable: "intlCooperation", delta: -15 },
            { variable: "taiwanTension", delta: 10 },
            { variable: "publicSentiment", delta: -5 },
            { variable: "economicDisruption", delta: 8 },
            { variable: "cdzComputeUtilization", delta: 25 },
            { variable: "ccpPatience", delta: 20 },
            { variable: "aiAutonomyLevel", delta: 15 },
            { variable: "doomClockDistance", delta: -10 },
          ],
        },
      ],
    },
  ],
};
