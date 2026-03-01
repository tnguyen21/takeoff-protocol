/**
 * Pure utility functions for ArxivApp.
 *
 * Invariants:
 * - INV-1: A paper's arXiv ID is determined solely by its stable index, not its position in any filtered array.
 * - INV-2: Stable index assignment is based on position in the unfiltered basePapers array.
 */

export interface Paper {
  title: string;
  authors: string;
  fullAuthors?: string;
  date: string;
  submitted?: string;
  category: string;
  categories: string[];
  abstract: string;
  subjects?: string;
  comments?: string;
  citations: number;
}

export interface PaperWithId extends Paper {
  stableId: number;
}

/**
 * Assigns a stable numeric ID to each paper based on its position in the
 * unfiltered source array. The returned IDs are immutable regardless of
 * any subsequent filtering.
 */
export function assignStableIds(papers: Paper[]): PaperWithId[] {
  return papers.map((p, i) => ({ ...p, stableId: i }));
}

/**
 * Computes the arXiv ID string for a paper given its stable index.
 * The ID is always derived from stableId, never from a filtered position.
 */
export function computeArxivId(stableId: number): string {
  return `arXiv:2602.${10000 + stableId}`;
}
