// Pure helper functions for SheetsApp — extracted for unit testing
// (bun:test cannot import .tsx files with JSX without react/jsx-dev-runtime)

export type SheetDataset = {
  headers: string[];
  rows: string[][];
  colWidths: number[];
  monetaryColIndices: number[];
};

/** Convert a 0-based column index to a spreadsheet letter (0→A, 1→B, 26→AA). */
export function colLetter(index: number): string {
  let result = "";
  let n = index + 1;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

/** Build a cell reference string like "A1", "B3", "Z26". */
export function cellRef(row: number, col: number): string {
  return `${colLetter(col)}${row + 1}`;
}

export function isMonetaryCol(ci: number, dataset: SheetDataset): boolean {
  return dataset.monetaryColIndices.includes(ci);
}

/** Compute the summary bar text (SUM/AVG/COUNT) for a given column selection. */
export function computeSummary(rows: string[][], selectedCell: [number, number] | null, dataset: SheetDataset): string {
  const colIdx = selectedCell ? selectedCell[1] : 1;
  if (!isMonetaryCol(colIdx, dataset)) {
    const vals = rows.slice(0, -1).map((r) => r[colIdx]).filter((v) => v && v !== "—" && v !== "");
    return `COUNT: ${vals.length}`;
  }
  const vals = rows
    .slice(0, -1)
    .map((r) => r[colIdx])
    .map((v) => {
      const stripped = v.replace(/[^0-9.]/g, "");
      return stripped ? parseFloat(stripped) : null;
    })
    .filter((v): v is number => v !== null);
  if (vals.length === 0) return "COUNT: 0";
  const sum = vals.reduce((a, b) => a + b, 0);
  const avg = sum / vals.length;
  const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `SUM: ${fmt(sum)} | AVG: ${fmt(avg)} | COUNT: ${vals.length}`;
}
