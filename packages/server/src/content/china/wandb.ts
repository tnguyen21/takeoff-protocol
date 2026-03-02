import type { ContentItem } from "@takeoff/shared";
import { registerContent } from "../loader.js";

export const CHINA_WANDB: ContentItem[] = [
    {
      id: "china-wandb-1",
      type: "chart",
      round: 1,
      subject: "DeepCent Model Suite — November 2026",
      body: "Frontier model (internal): 6-8 months behind US labs on capability benchmarks\nOpen-source (Qwen-9B): Competitive with US labs' previous-gen models\nAlignment work: Minimal — not a current priority\nNext training run: Starting December 1 at CDZ Phase 2\n\nWith CDZ Phase 2 compute and optimized architecture: Could reach parity by Q2 2027",
      timestamp: "2026-11-01T07:00:00Z",
      classification: "critical",
    },
    {
      id: "china2-wandb-1",
      type: "chart",
      round: 2,
      subject: "DeepCent Model Suite — Q1 2027 Benchmarks",
      body: "DeepCent-Frontier-2 (current internal frontier model):\nMMLU: 91.4%\nHumanEval: 93.7%\nSWE-bench: 76.2%\nAlignment evals: Not a current evaluation priority\n\nQwen-15B (open source release):\nMMLU: 87.2%\nHumanEval: 89.1%\nSWE-bench: 64.8%\n\nEstimated US frontier (OpenBrain Agent-3): MMLU 98.7%, HumanEval 99.4%, SWE-bench 97.4%\n\nGap: Significant but closing. Our organic trajectory suggests D-F3 (current run) will reach Agent-2 equivalent by Q2. Agent-3 equivalent: Q4 2027 at current rate.",
      timestamp: "2027-03-01T07:00:00Z",
      classification: "critical",
    },
    {
      id: "china2-wandb-2",
      type: "chart",
      round: 2,
      subject: "Trajectory Analysis: DeepCent vs US Labs With Acquired Weights",
      body: "Scenario A (Organic only):\n- D-F3 estimated capability: Agent-2 equivalent by May 2027\n- Agent-3 equivalent: November 2027 (best case)\n\nScenario B (With acquired Agent-1/2 weights fine-tuned):\n- D-F3 + fine-tune: Agent-2+ by April 2027 (confirmed)\n- Agent-3 equivalent: September 2027 (accelerated 2 months)\n\nConclusion: Acquisition advanced our timeline but did not close the fundamental architecture gap. The 5x R&D multiplier OB is achieving with Agent-3 means they can generate improvements faster than we can replicate them. We need our own Agent-3 equivalent, not just their Agent-2.",
      timestamp: "2027-03-03T09:00:00Z",
      classification: "context",
      condition: { variable: "chinaCapability", operator: "gt", value: 25 },
    },
    {
      id: "china-r3-wandb-1",
      type: "chart",
      round: 3,
      subject: "DeepCent Frontier Model — July 2027 Benchmark",
      body: "MMLU: 91.3%\nHumanEval: 87.2%\nSWE-bench: 71.4%\nResearch automation: ~400% of senior human throughput\nAlignment evals: PASS (35/35) — our evals are acknowledged to be less comprehensive than OB/Prometheus\n\nGap to OB Agent-4: Significant (OB is at human research threshold; we are approaching it)\nGap to OB Agent-3: Modest (approx. 1-2 months of capability improvement)\n\nWith acquired weights (estimated):\nAgent-3 weights → closes gap to ~5-6 weeks of organic progress equivalent\nAgent-4 weights → requires architecture adaptation; uncertain capability after integration",
      timestamp: "2027-07-01T07:00:00Z",
      classification: "context",
    },
    {
      id: "china4-wandb-2",
      type: "chart",
      round: 4,
      subject: "Alignment Work Status",
      body: "Current alignment investment: 8% of research budget\nAlignment eval pass rate: 61% (vs OB 71%, Prometheus 94%)\nNote: Chinese government's position is that 'alignment' as defined by US researchers is a Western philosophical framework.\n\nPractical implication: DeepCent systems are aligned to CCP directives. This is a known design choice, not a failure.",
      timestamp: "2027-11-12T10:00:00Z",
      classification: "context",
    },
    {
      id: "china4-wandb-1",
      type: "chart",
      round: 4,
      subject: "DeepCent-7 Benchmark Suite — November 2027",
      body: "vs OpenBrain Agent-4 baseline:\nMMMU-Pro: 91% (Agent-4: 98%)\nCodeForce-X: 89% (Agent-4: 97%)\nScienceQA-Frontier: 93% (Agent-4: 96%)\nMath-Olympiad: 88% (Agent-4: 97%)\n\nWith exfiltrated Agent-3 architecture optimization: +4-7% across all benchmarks (estimated)\n\nGap to US labs: 4-8% capability. Within noise range for most real-world deployments.",
      timestamp: "2027-11-14T06:00:00Z",
      classification: "critical",
    },
];

registerContent({ faction: "china", app: "wandb", accumulate: false, items: CHINA_WANDB });
