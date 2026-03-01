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

// ─── Types ────────────────────────────────────────────────────────────────────

type SidebarNode = {
  title: string;
  icon: string;
  children: SidebarNode[];
};

// ─── Sidebar tree ─────────────────────────────────────────────────────────────

const SIDEBAR_TREE: SidebarNode[] = [
  {
    title: "Engineering",
    icon: "📁",
    children: [
      {
        title: "Internal Memos",
        icon: "📁",
        children: [
          { title: "Alignment Strategy", icon: "📄", children: [] },
          { title: "Board Prep Q1", icon: "📄", children: [] },
          { title: "Red Team Notes", icon: "📄", children: [] },
        ],
      },
      { title: "Security Protocols", icon: "📄", children: [] },
    ],
  },
  {
    title: "Operations",
    icon: "📁",
    children: [
      { title: "Budget Q1", icon: "📊", children: [] },
      { title: "Team Directory", icon: "📋", children: [] },
    ],
  },
];

// ─── Markdown renderer (fixes table bug: <tr> wrapped in proper <table>) ──────

function renderMarkdown(body: string): React.ReactNode {
  const lines = body.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      result.push(
        <h1 key={k++} className="text-2xl font-bold mb-2 text-neutral-900">
          {line.slice(2)}
        </h1>
      );
      i++;
    } else if (line.startsWith("## ")) {
      result.push(
        <h2 key={k++} className="text-lg font-semibold mt-5 mb-2 text-neutral-800">
          {line.slice(3)}
        </h2>
      );
      i++;
    } else if (line.startsWith("*") && line.endsWith("*") && line.length > 2 && !line.startsWith("**")) {
      result.push(
        <p key={k++} className="text-neutral-400 text-xs italic mb-3">
          {line.slice(1, -1)}
        </p>
      );
      i++;
    } else if (line === "---") {
      result.push(<hr key={k++} className="my-4 border-neutral-200" />);
      i++;
    } else if (line.startsWith("- [ ]")) {
      result.push(
        <div key={k++} className="flex items-start gap-2 text-xs text-neutral-600 my-1">
          <input type="checkbox" className="mt-0.5" readOnly />
          <span>{line.slice(6)}</span>
        </div>
      );
      i++;
    } else if (line.startsWith("| ")) {
      // Collect all contiguous table lines (INV-1: must wrap in <table>)
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("| ")) {
        tableLines.push(lines[i]);
        i++;
      }
      // Filter out separator rows like |---|---|
      const dataLines = tableLines.filter((l) => !l.match(/^\|[\s\-|:]+\|$/));

      result.push(
        <table key={k++} className="w-full border-collapse border border-neutral-200 my-3">
          <tbody>
            {dataLines.map((row, rowIdx) => {
              const cells = row
                .split("|")
                .filter(Boolean)
                .map((c) => c.trim());
              return (
                <tr key={rowIdx} className="border-b border-neutral-200">
                  {cells.map((c, j) =>
                    rowIdx === 0 ? (
                      <th
                        key={j}
                        className="px-2 py-1.5 text-xs font-semibold text-left bg-neutral-50 border-r border-neutral-200 last:border-r-0"
                      >
                        {c}
                      </th>
                    ) : (
                      <td
                        key={j}
                        className="px-2 py-1.5 text-xs border-r border-neutral-200 last:border-r-0"
                      >
                        {c}
                      </td>
                    )
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      );
      // i already advanced by inner while loop — do not increment again
    } else if (line.trim() === "") {
      result.push(<div key={k++} className="h-2" />);
      i++;
    } else {
      const parts = line.split(/\*\*([^*]+)\*\*/);
      result.push(
        <p key={k++} className="text-xs text-neutral-700 leading-relaxed">
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </p>
      );
      i++;
    }
  }

  return <>{result}</>;
}

// ─── Hierarchical sidebar item ────────────────────────────────────────────────

function SidebarItem({
  node,
  depth,
  selectedTitle,
  onSelect,
  expanded,
  onToggle,
}: {
  node: SidebarNode;
  depth: number;
  selectedTitle: string;
  onSelect: (title: string) => void;
  expanded: Set<string>;
  onToggle: (title: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.title);
  const isSelected = selectedTitle === node.title;

  return (
    <div>
      <div
        onClick={() => {
          if (hasChildren) onToggle(node.title);
          else onSelect(node.title);
        }}
        className={`flex items-center gap-1 rounded cursor-pointer text-xs py-1.5 ${
          isSelected
            ? "bg-blue-100 text-blue-800 font-medium"
            : "text-neutral-600 hover:bg-neutral-100"
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: "8px" }}
      >
        {hasChildren ? (
          <span className="text-neutral-400 text-[10px] w-3 shrink-0 select-none">
            {isExpanded ? "▾" : "▸"}
          </span>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="shrink-0">{node.icon}</span>
        <span className="truncate">{node.title}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <SidebarItem
              key={child.title}
              node={child}
              depth={depth + 1}
              selectedTitle={selectedTitle}
              onSelect={onSelect}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page metadata block ──────────────────────────────────────────────────────

function PageMetadata({ author }: { author: string }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-neutral-400 mb-4 pb-4 border-b border-neutral-100">
      <span>
        <span className="font-medium text-neutral-500">Last edited:</span> Feb 28, 2026
      </span>
      <span>
        <span className="font-medium text-neutral-500">Created by:</span> {author}
      </span>
      <span>
        <span className="font-medium text-neutral-500">Tags:</span> internal, Q1-review
      </span>
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ crumbs }: { crumbs: string[] }) {
  return (
    <div className="flex items-center flex-wrap gap-1 text-xs text-neutral-400 mb-4">
      {crumbs.map((crumb, i) => (
        <React.Fragment key={i}>
          <span className="hover:text-neutral-700 cursor-pointer hover:underline">{crumb}</span>
          {i < crumbs.length - 1 && <span className="text-neutral-300">/</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const MemoApp = React.memo(function MemoApp({ content }: AppProps) {
  const memoItems = content.filter((i) => i.type === "memo" || i.type === "document");
  const [selectedTitle, setSelectedTitle] = React.useState("Alignment Strategy");
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(
    () => new Set(["Engineering", "Internal Memos"])
  );
  const [toast, setToast] = React.useState<string | null>(null);

  // Build page list from content or use static fallback
  const pages =
    memoItems.length > 0
      ? memoItems.map((item) => ({ title: item.subject ?? "Untitled", body: item.body }))
      : PAGES.map((t, i) => ({ title: t, body: i === 0 ? BODY : "" }));

  const currentPage = pages.find((p) => p.title === selectedTitle) ?? pages[0];
  const displayTitle = currentPage?.title ?? selectedTitle;

  const handleToggle = (title: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const handleNewPage = () => {
    setToast("Page created!");
    setTimeout(() => setToast(null), 2000);
  };

  const breadcrumbs = ["Workspace", "Engineering", "Internal Memos", displayTitle];

  return (
    <div className="flex h-full bg-white text-black text-sm relative">
      {/* Toast notification */}
      {toast && (
        <div className="absolute top-3 right-3 z-50 bg-neutral-800 text-white text-xs px-3 py-2 rounded shadow-lg transition-opacity">
          {toast}
        </div>
      )}

      {/* Sidebar — hierarchical (INV-3) */}
      <div className="w-52 bg-neutral-50 border-r border-neutral-200 flex flex-col shrink-0">
        <div className="p-3 border-b border-neutral-200">
          <div className="font-semibold text-xs text-neutral-600">OpenBrain Docs</div>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
          {SIDEBAR_TREE.map((node) => (
            <SidebarItem
              key={node.title}
              node={node}
              depth={0}
              selectedTitle={selectedTitle}
              onSelect={setSelectedTitle}
              expanded={expandedNodes}
              onToggle={handleToggle}
            />
          ))}
        </div>
        <div className="p-2 border-t border-neutral-200">
          <button
            onClick={handleNewPage}
            className="w-full text-left text-xs text-neutral-500 hover:text-neutral-800 px-2 py-1 hover:bg-neutral-100 rounded transition-colors"
          >
            + New page
          </button>
        </div>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-6">
          {/* Breadcrumb (INV-2) */}
          <Breadcrumb crumbs={breadcrumbs} />

          {memoItems.length > 0 ? (
            <div>
              <h1 className="text-2xl font-bold mb-3 text-neutral-900">{displayTitle}</h1>
              <PageMetadata author="A. Chen" />
              <pre className="text-xs text-neutral-700 whitespace-pre-wrap font-sans leading-relaxed">
                {currentPage?.body}
              </pre>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {currentPage?.body ? (
                <>
                  <PageMetadata author="A. Chen" />
                  {renderMarkdown(currentPage.body)}
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-3 text-neutral-900">{displayTitle}</h1>
                  <PageMetadata author="A. Chen" />
                  <p className="text-xs text-neutral-400 italic">This page has no content yet.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
