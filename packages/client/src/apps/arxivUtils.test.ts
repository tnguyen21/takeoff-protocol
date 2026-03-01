/**
 * Tests for ArxivApp pure utility functions.
 *
 * Invariants tested:
 * - INV-1: A paper's arXiv ID is the same regardless of which filters are active
 * - INV-2: Stable ID is based on original array position, not filtered position
 * - INV-3: Filtering a paper out and back in does not change its stable identity
 */

import { describe, expect, it } from "bun:test";
import { assignStableIds, computeArxivId } from "./arxivUtils.js";
import type { Paper } from "./arxivUtils.js";

function makePaper(overrides: Partial<Paper> & { title: string }): Paper {
  return {
    authors: "Test Author",
    date: "2026-02-01",
    category: "cs.AI",
    categories: ["cs.AI"],
    abstract: "Abstract text.",
    citations: 0,
    ...overrides,
  };
}

// ── computeArxivId ────────────────────────────────────────────────────────────

describe("computeArxivId", () => {
  it("paper at stableId 0 gets arXiv:2602.10000", () => {
    expect(computeArxivId(0)).toBe("arXiv:2602.10000");
  });

  it("paper at stableId 5 gets arXiv:2602.10005", () => {
    expect(computeArxivId(5)).toBe("arXiv:2602.10005");
  });

  it("paper at stableId 11 gets arXiv:2602.10011", () => {
    expect(computeArxivId(11)).toBe("arXiv:2602.10011");
  });

  it("INV-1: ID depends only on stableId, not on anything else", () => {
    // Same stableId always produces the same ID
    expect(computeArxivId(3)).toBe(computeArxivId(3));
    expect(computeArxivId(3)).not.toBe(computeArxivId(4));
  });
});

// ── assignStableIds ───────────────────────────────────────────────────────────

describe("assignStableIds", () => {
  const papers = [
    makePaper({ title: "Paper A", categories: ["cs.AI"] }),
    makePaper({ title: "Paper B", categories: ["cs.LG"] }),
    makePaper({ title: "Paper C", categories: ["cs.AI"] }),
    makePaper({ title: "Paper D", categories: ["cs.CY"] }),
  ];

  it("assigns sequential stableIds starting at 0", () => {
    const result = assignStableIds(papers);
    expect(result.map((p) => p.stableId)).toEqual([0, 1, 2, 3]);
  });

  it("preserves all original paper fields", () => {
    const result = assignStableIds(papers);
    expect(result[1].title).toBe("Paper B");
    expect(result[1].categories).toEqual(["cs.LG"]);
  });

  it("INV-1: paper arXiv ID is stable regardless of active category filter", () => {
    const withIds = assignStableIds(papers);

    // Simulate filtering to cs.AI only — Paper B and D are excluded
    const filteredAI = withIds.filter((p) => p.categories.includes("cs.AI"));
    // Simulate filtering to cs.LG only
    const filteredLG = withIds.filter((p) => p.categories.includes("cs.LG"));

    // Paper A (index 0) has same ID in both filter contexts
    const paperAInAll = withIds.find((p) => p.title === "Paper A")!;
    const paperAInAI = filteredAI.find((p) => p.title === "Paper A")!;
    expect(computeArxivId(paperAInAll.stableId)).toBe(computeArxivId(paperAInAI.stableId));

    // Paper B (index 1) has same ID whether filtered or not
    const paperBInAll = withIds.find((p) => p.title === "Paper B")!;
    const paperBInLG = filteredLG.find((p) => p.title === "Paper B")!;
    expect(computeArxivId(paperBInAll.stableId)).toBe(computeArxivId(paperBInLG.stableId));
  });

  it("INV-1: filtering does NOT change position-based arXiv IDs of remaining papers", () => {
    const withIds = assignStableIds(papers);
    // Paper C is at stableId=2 in unfiltered list
    const paperCFull = withIds.find((p) => p.title === "Paper C")!;
    expect(paperCFull.stableId).toBe(2);
    expect(computeArxivId(paperCFull.stableId)).toBe("arXiv:2602.10002");

    // After filtering out Paper A and B, Paper C is now first in filtered list
    // but its stableId must still be 2
    const filtered = withIds.filter((p) => p.categories.includes("cs.AI"));
    const paperCFiltered = filtered[1]; // second entry after filtering
    expect(paperCFiltered.title).toBe("Paper C");
    expect(paperCFiltered.stableId).toBe(2);
    expect(computeArxivId(paperCFiltered.stableId)).toBe("arXiv:2602.10002");
  });

  it("INV-2: stableId matches original array position", () => {
    const withIds = assignStableIds(papers);
    withIds.forEach((p, filteredIdx) => {
      // stableId equals original index, not filtered index
      expect(p.stableId).toBe(filteredIdx); // all present here, so same
    });

    // After removing first element, remaining papers keep their stableIds
    const subset = withIds.slice(1);
    expect(subset[0].stableId).toBe(1); // Paper B
    expect(subset[1].stableId).toBe(2); // Paper C
    expect(subset[2].stableId).toBe(3); // Paper D
  });

  it("INV-3: stableId is deterministic — same input produces same IDs", () => {
    const first = assignStableIds(papers);
    const second = assignStableIds(papers);
    expect(first.map((p) => p.stableId)).toEqual(second.map((p) => p.stableId));
  });

  it("returns empty array for empty input", () => {
    expect(assignStableIds([])).toEqual([]);
  });
});
