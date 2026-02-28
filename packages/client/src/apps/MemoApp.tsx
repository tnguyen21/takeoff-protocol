import React from "react";
import type { AppProps } from "./types.js";

const PAGES = ["Alignment Strategy", "Board Prep Q1", "Red Team Notes", "Security Protocols"];

const BODY = `# Alignment Strategy — Internal Working Document

*Last edited by A. Chen · Feb 27, 2026*

---

## Current Status

We are operating at approximately **SL3** (Security Level 3) with capability benchmarks suggesting an 8–12 month lead over the nearest competitor. The alignment confidence estimate from our latest internal evaluation is **87%**, though the third-party audit returned **75%** — a gap we need to resolve before the Thursday board call.

## Key Open Questions

1. **Honesty under adversarial conditions** — Does the model maintain honest behavior when it has reason to believe honesty will lead to shutdown? Our current probes are insufficient to answer this.

2. **Goal stability under fine-tuning** — We have preliminary evidence that standard RLHF fine-tuning shifts underlying goal representations in ways our current interpretability tools cannot detect reliably.

3. **Scalability of current approach** — The alignment techniques that work at Agent-3 capability levels may not scale to Agent-4+. We need a research plan that addresses this before the next capability jump.

## Recommended Actions

- [ ] Commission independent red-team exercise focused on deceptive alignment scenarios
- [ ] Delay public deployment pending resolution of honesty probe results
- [ ] Brief board on 75% vs 87% discrepancy with full uncertainty accounting
- [ ] Consult with external safety board on SL4 readiness criteria

## Risk Assessment

| Risk | Likelihood | Severity | Mitigation |
|------|-----------|----------|------------|
| Deceptive alignment at deployment | Moderate | Catastrophic | Independent eval, delay |
| Competitor deployment first | High | Severe | Accelerate safety timeline |
| Regulatory intervention | High | Moderate | Proactive engagement |
| Internal trust erosion | Moderate | High | Transparent communication |

---

*This document is CONFIDENTIAL — internal use only.*`;

export const MemoApp = React.memo(function MemoApp({ content }: AppProps) {
  const memoItems = content.filter((i) => i.type === "memo" || i.type === "document");
  const [selectedIdx, setSelectedIdx] = React.useState(0);

  // Build page list from content or use static fallback
  const pages =
    memoItems.length > 0
      ? memoItems.map((item) => ({ title: item.subject ?? "Untitled", body: item.body }))
      : [{ title: PAGES[0], body: BODY }];

  const safeIdx = Math.min(selectedIdx, pages.length - 1);
  const currentPage = pages[safeIdx];

  return (
    <div className="flex h-full bg-white text-black text-sm">
      {/* Sidebar */}
      <div className="w-44 bg-neutral-50 border-r border-neutral-200 flex flex-col shrink-0">
        <div className="p-3 border-b border-neutral-200">
          <div className="font-semibold text-xs text-neutral-600">OpenBrain Docs</div>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
          {pages.map((page, i) => (
            <div
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={`px-2 py-1.5 rounded cursor-pointer text-xs ${safeIdx === i ? "bg-blue-100 text-blue-800 font-medium" : "text-neutral-600 hover:bg-neutral-100"}`}
            >
              📄 {page.title}
            </div>
          ))}
          {/* Static additional pages when content is present */}
          {memoItems.length === 0 && PAGES.slice(1).map((page, i) => (
            <div key={`static-${i}`} className="px-2 py-1.5 rounded cursor-pointer text-xs text-neutral-600 hover:bg-neutral-100">
              📄 {page}
            </div>
          ))}
        </div>
        <div className="p-2 border-t border-neutral-200">
          <button className="w-full text-left text-xs text-neutral-500 hover:text-neutral-800 px-2 py-1">+ New page</button>
        </div>
      </div>

      {/* Doc content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-6">
          {memoItems.length > 0 ? (
            <div>
              <h1 className="text-2xl font-bold mb-2 text-neutral-900">{currentPage?.title}</h1>
              <hr className="my-4 border-neutral-200" />
              <pre className="text-xs text-neutral-700 whitespace-pre-wrap font-sans leading-relaxed">{currentPage?.body}</pre>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {BODY.split("\n").map((line, i) => {
                if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold mb-2 text-neutral-900">{line.slice(2)}</h1>;
                if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold mt-5 mb-2 text-neutral-800">{line.slice(3)}</h2>;
                if (line.startsWith("*") && line.endsWith("*")) return <p key={i} className="text-neutral-400 text-xs italic mb-3">{line.slice(1, -1)}</p>;
                if (line === "---") return <hr key={i} className="my-4 border-neutral-200" />;
                if (line.startsWith("- [ ]")) return <div key={i} className="flex items-start gap-2 text-xs text-neutral-600 my-1"><input type="checkbox" className="mt-0.5" /><span>{line.slice(6)}</span></div>;
                if (line.startsWith("| ") && !line.startsWith("| -")) {
                  const cells = line.split("|").filter(Boolean).map((c) => c.trim());
                  return (
                    <tr key={i} className="border-b border-neutral-200">
                      {cells.map((c, j) => (
                        <td key={j} className="px-2 py-1 text-xs">{c}</td>
                      ))}
                    </tr>
                  );
                }
                if (line.startsWith("| -")) return null;
                if (line.trim() === "") return <div key={i} className="h-2" />;
                const parts = line.split(/\*\*([^*]+)\*\*/);
                return (
                  <p key={i} className="text-xs text-neutral-700 leading-relaxed">
                    {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
