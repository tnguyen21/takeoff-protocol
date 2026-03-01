import { describe, it, expect } from "bun:test";
import { colLetter, cellRef, isMonetaryCol, computeSummary, type SheetDataset } from "./sheetsUtils.js";

// ── colLetter ────────────────────────────────────────────────────────────────

describe("colLetter", () => {
  it("maps index 0 to A", () => {
    expect(colLetter(0)).toBe("A");
  });

  it("maps index 25 to Z", () => {
    expect(colLetter(25)).toBe("Z");
  });

  it("maps index 26 to AA (two-letter column)", () => {
    expect(colLetter(26)).toBe("AA");
  });

  it("maps index 27 to AB", () => {
    expect(colLetter(27)).toBe("AB");
  });

  it("maps index 51 to AZ", () => {
    expect(colLetter(51)).toBe("AZ");
  });

  it("maps index 52 to BA", () => {
    expect(colLetter(52)).toBe("BA");
  });
});

// ── cellRef ──────────────────────────────────────────────────────────────────

describe("cellRef", () => {
  it("produces A1 for row=0 col=0", () => {
    expect(cellRef(0, 0)).toBe("A1");
  });

  it("produces B3 for row=2 col=1", () => {
    expect(cellRef(2, 1)).toBe("B3");
  });

  it("produces Z10 for row=9 col=25", () => {
    expect(cellRef(9, 25)).toBe("Z10");
  });

  it("produces AA1 for row=0 col=26", () => {
    expect(cellRef(0, 26)).toBe("AA1");
  });
});

// ── isMonetaryCol ────────────────────────────────────────────────────────────

const mockDataset: SheetDataset = {
  headers: ["Category", "Q1 Budget", "Notes"],
  rows: [],
  colWidths: [100, 100, 100],
  monetaryColIndices: [1],
};

describe("isMonetaryCol", () => {
  it("returns true for a monetary column index", () => {
    expect(isMonetaryCol(1, mockDataset)).toBe(true);
  });

  it("returns false for a non-monetary column", () => {
    expect(isMonetaryCol(0, mockDataset)).toBe(false);
    expect(isMonetaryCol(2, mockDataset)).toBe(false);
  });
});

// ── computeSummary ───────────────────────────────────────────────────────────

const budgetDataset: SheetDataset = {
  headers: ["Category", "Q1 Budget", "Notes"],
  rows: [
    ["Compute", "$1,000,000", "note a"],
    ["Personnel", "$2,000,000", "note b"],
    ["TOTAL", "$3,000,000", ""],
  ],
  colWidths: [100, 100, 100],
  monetaryColIndices: [1],
};

describe("computeSummary", () => {
  it("shows SUM/AVG/COUNT for a monetary column with no selection (defaults to col 1)", () => {
    const result = computeSummary(budgetDataset.rows, null, budgetDataset);
    // Excludes last row (TOTAL), so 2 rows with $1M and $2M
    expect(result).toContain("SUM:");
    expect(result).toContain("$3,000,000");
    expect(result).toContain("AVG:");
    expect(result).toContain("$1,500,000");
    expect(result).toContain("COUNT: 2");
  });

  it("shows SUM/AVG/COUNT for a monetary column when that column is selected", () => {
    const result = computeSummary(budgetDataset.rows, [0, 1], budgetDataset);
    expect(result).toContain("SUM: $3,000,000");
    expect(result).toContain("COUNT: 2");
  });

  it("shows COUNT for a non-monetary column (text column)", () => {
    const result = computeSummary(budgetDataset.rows, [0, 0], budgetDataset);
    // col 0 is not monetary; counts non-empty, non-dash values excluding TOTAL row
    expect(result).toBe("COUNT: 2");
  });

  it("handles empty monetary column gracefully", () => {
    const emptyDataset: SheetDataset = {
      headers: ["Category", "Budget"],
      rows: [["TOTAL", ""]],
      colWidths: [100, 100],
      monetaryColIndices: [1],
    };
    const result = computeSummary(emptyDataset.rows, null, emptyDataset);
    // No rows before last, so vals is empty
    expect(result).toBe("COUNT: 0");
  });

  it("skips dash values in monetary columns", () => {
    const dataset: SheetDataset = {
      headers: ["Category", "Actual"],
      rows: [
        ["Item A", "$500,000"],
        ["Item B", "—"],
        ["TOTAL", "$500,000"],
      ],
      colWidths: [100, 100],
      monetaryColIndices: [1],
    };
    const result = computeSummary(dataset.rows, null, dataset);
    // Only Item A has a parseable value; Item B has "—" which has no numeric chars
    expect(result).toContain("COUNT: 1");
    expect(result).toContain("SUM: $500,000");
  });
});
