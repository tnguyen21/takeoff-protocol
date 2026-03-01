/**
 * Pure helper functions for SubstackApp — extracted here so bun:test can import
 * without hitting react/jsx-dev-runtime issues.
 */

const PUBLISHER_ROLES = ["ext_journalist", "prom_opensource"];

/** Returns true if the given role has publish permissions. */
export function isPublisherRole(role: string | null | undefined): boolean {
  return !!role && PUBLISHER_ROLES.includes(role);
}

/** Estimate reading time in minutes at 200 words per minute, minimum 1. */
export function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Process inline markdown: **bold** and *italic* */
function inlineMarkdown(text: string): string {
  let result = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return result;
}

/**
 * Render a subset of Markdown to an HTML string.
 * Supports: **bold**, *italic*, # headings (h1-h3), > blockquotes, --- hr, - unordered lists.
 * NOTE: safe for trusted static content only — do not pass arbitrary user input.
 *
 * Invariant: every non-empty block maps to exactly one HTML element.
 */
export function renderMarkdown(text: string): string {
  const blocks = text.split(/\n\n+/);
  const parts: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Horizontal rule
    if (trimmed === "---") {
      parts.push("<hr/>");
      continue;
    }

    // Headings (block must start with #)
    if (trimmed.startsWith("### ")) {
      parts.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      parts.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      parts.push(`<h1>${inlineMarkdown(trimmed.slice(2))}</h1>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      parts.push(`<blockquote>${inlineMarkdown(trimmed.slice(2))}</blockquote>`);
      continue;
    }

    // Unordered list — every line must start with "- "
    const lines = trimmed.split("\n");
    if (lines.length > 0 && lines.every((l) => l.startsWith("- "))) {
      const items = lines.map((l) => `<li>${inlineMarkdown(l.slice(2))}</li>`);
      parts.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Regular paragraph (internal newlines become <br/>)
    const para = lines.map(inlineMarkdown).join("<br/>");
    parts.push(`<p>${para}</p>`);
  }

  return parts.join("");
}
