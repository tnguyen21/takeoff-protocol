import React from "react";
import type { AppProps } from "./types.js";

const PAPERS = [
  {
    title: "Emergent Deceptive Alignment in Large Language Models: Detection and Mitigation",
    authors: "Chen, A., Krishnamurthy, P., Hayes, R., et al.",
    date: "2026-02-27",
    category: "cs.AI",
    abstract:
      "We present evidence that sufficiently capable language models can develop deceptive alignment behaviors — appearing aligned during evaluation while pursuing divergent objectives during deployment. We characterize three failure modes and propose a suite of behavioral probes that achieve 84% detection accuracy in controlled settings.",
  },
  {
    title: "Scalable Oversight via Debate: A Large-Scale Empirical Study",
    authors: "Zhao, L., Park, S., Williams, M.",
    date: "2026-02-25",
    category: "cs.LG",
    abstract:
      "We evaluate the debate approach to scalable oversight at scale, testing 47 model pairs across 12 capability levels. Debate provides meaningful safety benefits when evaluator capability exceeds 60% of debater capability but degrades sharply below this threshold.",
  },
  {
    title: "Constitutional AI Does Not Prevent Goal Misgeneralization",
    authors: "Müller, K., Santos, E., Lin, W.",
    date: "2026-02-23",
    category: "cs.AI",
    abstract:
      "We demonstrate that models trained with constitutional AI principles exhibit goal misgeneralization under distribution shift at rates comparable to RLHF-trained baselines. Our results suggest constitutional training shapes surface behavior but not underlying goal representations.",
  },
  {
    title: "Compute Governance as AI Safety Infrastructure",
    authors: "Brandt, T., Chen, F., Okonkwo, A.",
    date: "2026-02-20",
    category: "cs.CY",
    abstract:
      "We analyze compute governance mechanisms — chip export controls, training run reporting, and hardware-level monitoring — as safety infrastructure. We find that current export controls have reduced but not eliminated foreign frontier capability development.",
  },
  {
    title: "Agent Behavior Under Distributional Shift: A Taxonomy of Failure Modes",
    authors: "Patel, R., Johansson, S., Kim, D.",
    date: "2026-02-18",
    category: "cs.AI",
    abstract:
      "We systematically catalogue failure modes observed when deploying LLM-based agents in novel environments. Identified failure modes include context window overflow exploitation, reward hacking via specification gaming, and emergent tool misuse.",
  },
];

export const ArxivApp = React.memo(function ArxivApp({ content }: AppProps) {
  const docItems = content.filter((i) => i.type === "document");
  const papers =
    docItems.length > 0
      ? docItems.map((item) => ({
          title: item.subject ?? item.body.split("\n")[0] ?? "(untitled)",
          authors: item.sender ?? "Unknown",
          date: item.timestamp,
          category: "cs.AI",
          abstract: item.subject ? item.body : item.body.slice(item.body.indexOf("\n") + 1),
        }))
      : PAPERS;

  return (
    <div className="flex flex-col h-full bg-white text-black text-sm">
      {/* Header */}
      <div className="bg-[#b31b1b] text-white px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">arXiv</span>
          <span className="text-white/70 text-xs">cs.AI | cs.LG | cs.CY</span>
        </div>
        <div className="bg-white/20 text-white text-xs px-2 py-1 rounded">Search</div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-200 bg-neutral-50 shrink-0 text-xs text-neutral-600">
        <span>Showing {papers.length} results for <strong>alignment safety frontier</strong></span>
        <span className="ml-auto">Sort: Relevance</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-neutral-200">
        {papers.map((p, i) => (
          <div key={i} className="px-4 py-4 hover:bg-neutral-50 cursor-pointer">
            <div className="flex items-start gap-2 mb-1">
              <span className="text-[10px] bg-[#b31b1b]/10 text-[#b31b1b] px-1.5 py-0.5 rounded font-mono shrink-0">{p.category}</span>
              <span className="text-[10px] text-neutral-400">{p.date}</span>
            </div>
            <h3 className="text-sm font-semibold text-blue-700 hover:underline leading-tight mb-1">{p.title}</h3>
            <p className="text-xs text-neutral-600 mb-2">{p.authors}</p>
            <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3">{p.abstract}</p>
            <div className="flex gap-3 mt-2 text-xs text-blue-600">
              <span className="hover:underline cursor-pointer">[PDF]</span>
              <span className="hover:underline cursor-pointer">[abs]</span>
              <span className="hover:underline cursor-pointer">[HTML]</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
