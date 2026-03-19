/**
 * Tests for SubstackApp pure helper functions.
 *
 * Invariants tested:
 * - INV-1: isPublisherRole returns true for all roles (universal publish access)
 * - INV-2: Markdown syntax renders as formatted HTML (renderMarkdown)
 * - INV-3: Read time estimation is at least 1 and scales with word count
 */

import { describe, expect, it } from "bun:test";
import { isPublisherRole, estimateReadTime, renderMarkdown } from "./substackUtils.js";

// ── isPublisherRole ────────────────────────────────────────────────────────────

describe("isPublisherRole", () => {
  it("INV-1: returns true for ext_journalist", () => {
    expect(isPublisherRole("ext_journalist")).toBe(true);
  });

  it("INV-1: returns true for prom_opensource", () => {
    expect(isPublisherRole("prom_opensource")).toBe(true);
  });

  it("INV-1: returns true for all roles (universal publish access)", () => {
    expect(isPublisherRole("ob_cto")).toBe(true);
    expect(isPublisherRole("china_director")).toBe(true);
    expect(isPublisherRole("ext_diplomat")).toBe(true);
  });

  it("INV-1: returns true even for null and undefined (safe default)", () => {
    expect(isPublisherRole(null)).toBe(true);
    expect(isPublisherRole(undefined)).toBe(true);
  });

  it("INV-1: returns true for empty string", () => {
    expect(isPublisherRole("")).toBe(true);
  });
});

// ── estimateReadTime ───────────────────────────────────────────────────────────

describe("estimateReadTime", () => {
  it("INV-3: returns minimum 1 for empty string", () => {
    expect(estimateReadTime("")).toBe(1);
  });

  it("INV-3: returns minimum 1 for very short text", () => {
    expect(estimateReadTime("Hello world")).toBe(1);
  });

  it("INV-3: scales with word count (200 words ≈ 1 minute)", () => {
    const words = Array(200).fill("word").join(" ");
    expect(estimateReadTime(words)).toBe(1);
  });

  it("INV-3: 400 words ≈ 2 minutes", () => {
    const words = Array(400).fill("word").join(" ");
    expect(estimateReadTime(words)).toBe(2);
  });

  it("INV-3: longer articles get higher read time", () => {
    const short = Array(100).fill("word").join(" ");
    const long = Array(1000).fill("word").join(" ");
    expect(estimateReadTime(long)).toBeGreaterThan(estimateReadTime(short));
  });
});

// ── renderMarkdown ─────────────────────────────────────────────────────────────

describe("renderMarkdown", () => {
  it("INV-2: renders **bold** text as <strong>", () => {
    const result = renderMarkdown("**Hello** world");
    expect(result).toContain("<strong>Hello</strong>");
  });

  it("INV-2: renders *italic* text as <em>", () => {
    const result = renderMarkdown("*Hello* world");
    expect(result).toContain("<em>Hello</em>");
  });

  it("INV-2: renders # heading as <h1>", () => {
    const result = renderMarkdown("# My Heading");
    expect(result).toContain("<h1>My Heading</h1>");
  });

  it("INV-2: renders ## heading as <h2>", () => {
    const result = renderMarkdown("## Section");
    expect(result).toContain("<h2>Section</h2>");
  });

  it("INV-2: renders ### heading as <h3>", () => {
    const result = renderMarkdown("### Subsection");
    expect(result).toContain("<h3>Subsection</h3>");
  });

  it("INV-2: renders --- as <hr/>", () => {
    const result = renderMarkdown("---");
    expect(result).toContain("<hr/>");
  });

  it("INV-2: renders > blockquote as <blockquote>", () => {
    const result = renderMarkdown("> Some quote");
    expect(result).toContain("<blockquote>Some quote</blockquote>");
  });

  it("INV-2: renders - list items as <ul><li>", () => {
    const result = renderMarkdown("- item one\n- item two");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>item one</li>");
    expect(result).toContain("<li>item two</li>");
  });

  it("INV-2: renders plain text as <p>", () => {
    const result = renderMarkdown("Just a paragraph.");
    expect(result).toContain("<p>Just a paragraph.</p>");
  });

  it("INV-2: bold within heading is rendered", () => {
    const result = renderMarkdown("## **Important** section");
    expect(result).toContain("<strong>Important</strong>");
  });

  it("INV-2: empty string produces no output", () => {
    expect(renderMarkdown("")).toBe("");
  });

  it("INV-2: only whitespace produces no output", () => {
    expect(renderMarkdown("   \n\n   ")).toBe("");
  });

  it("INV-2: multiple paragraphs each become <p>", () => {
    const result = renderMarkdown("First paragraph.\n\nSecond paragraph.");
    expect(result).toContain("<p>First paragraph.</p>");
    expect(result).toContain("<p>Second paragraph.</p>");
  });

  it("INV-2: mixed content renders all elements", () => {
    const md = "# Title\n\nA paragraph.\n\n---\n\n- item one\n- item two";
    const result = renderMarkdown(md);
    expect(result).toContain("<h1>Title</h1>");
    expect(result).toContain("<p>A paragraph.</p>");
    expect(result).toContain("<hr/>");
    expect(result).toContain("<li>item one</li>");
  });
});
