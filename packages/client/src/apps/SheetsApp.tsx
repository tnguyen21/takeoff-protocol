import React from "react";
import type { AppProps } from "./types.js";

const HEADERS = ["Category", "Q1 Budget", "Q2 Budget", "Q1 Actual", "Q2 Actual", "Variance", "Notes"];

const ROWS = [
  ["Compute (H100 hours)", "$8,400,000", "$12,200,000", "$9,100,000", "—", "▲ $700K", "Demand spike from run-789"],
  ["Cloud Egress", "$320,000", "$380,000", "$298,000", "—", "▼ $22K", "Optimization in CDN routing"],
  ["Safety Infra", "$1,200,000", "$1,200,000", "$1,150,000", "—", "▼ $50K", "Under budget"],
  ["Research Personnel", "$4,800,000", "$4,800,000", "$4,800,000", "—", "—", "On plan"],
  ["External Audits", "$600,000", "$900,000", "$540,000", "—", "▼ $60K", "Deferred 1 audit to Q3"],
  ["Facilities", "$450,000", "$450,000", "$448,000", "—", "▼ $2K", ""],
  ["Legal & Compliance", "$800,000", "$1,100,000", "$920,000", "—", "▲ $120K", "Senate hearings prep"],
  ["TOTAL", "$16,570,000", "$21,030,000", "$17,256,000", "—", "▲ $686K", ""],
];

const COL_WIDTHS = [160, 100, 100, 100, 90, 90, 180];

export const SheetsApp = React.memo(function SheetsApp({ content }: AppProps) {
  const rowItems = content.filter((i) => i.type === "row");

  // Build rows from content items or use static fallback
  const rows =
    rowItems.length > 0
      ? rowItems.map((item) => {
          const cols = item.body.split("\t");
          // Pad to expected length or truncate
          return cols.length > 0 ? cols : [item.subject ?? "Row", item.body];
        })
      : ROWS;

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white text-xs">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#161616] shrink-0">
        <span className="text-green-400 font-bold text-sm">■</span>
        <span className="text-neutral-300 text-xs">compute_budget_2024.xlsx</span>
        <div className="ml-4 flex gap-3 text-neutral-500">
          {["File", "Edit", "View", "Insert", "Format", "Data"].map((m) => (
            <span key={m} className="hover:text-white cursor-pointer">{m}</span>
          ))}
        </div>
      </div>

      {/* Formula bar */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-white/10 bg-[#1a1a1a] shrink-0">
        <span className="text-neutral-500 w-12 text-center border border-white/10 rounded px-1">A1</span>
        <span className="text-neutral-600">fx</span>
        <span className="text-neutral-400 ml-1">Category</span>
      </div>

      {/* Sheet */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse w-full">
          <thead>
            <tr className="bg-[#252525]">
              <th className="w-8 border border-white/10 text-neutral-600 font-normal py-1 text-center sticky left-0 bg-[#252525]" />
              {HEADERS.map((h, i) => (
                <th
                  key={h}
                  style={{ minWidth: COL_WIDTHS[i], width: COL_WIDTHS[i] }}
                  className="border border-white/10 px-2 py-1 text-left text-neutral-300 font-semibold text-[10px] bg-[#2a2a2a]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={`
                  ${ri % 2 === 0 ? "bg-[#1e1e1e]" : "bg-[#212121]"}
                  ${ri === rows.length - 1 ? "font-semibold bg-[#1a2a1a] border-t border-white/20" : ""}
                  hover:bg-blue-900/20 cursor-pointer
                `}
              >
                <td className="border border-white/10 text-neutral-600 text-center py-1 sticky left-0 bg-inherit">{ri + 1}</td>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{ minWidth: COL_WIDTHS[ci] }}
                    className={`border border-white/10 px-2 py-1 text-[11px]
                      ${ci === 5 && cell.startsWith("▲") ? "text-red-400" : ""}
                      ${ci === 5 && cell.startsWith("▼") ? "text-green-400" : ""}
                      ${ci > 0 && ci < 5 && !cell.startsWith("—") ? "text-neutral-300 font-mono" : "text-neutral-400"}
                    `}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet tabs */}
      <div className="flex items-center border-t border-white/10 bg-[#161616] px-2 py-1 shrink-0 gap-1">
        {["Budget Overview", "Personnel", "Compute Detail", "Audit Log"].map((tab, i) => (
          <div
            key={tab}
            className={`px-3 py-1 rounded-t text-[10px] cursor-pointer ${i === 0 ? "bg-[#1e1e1e] text-white border border-white/10 border-b-transparent" : "text-neutral-500 hover:text-white"}`}
          >
            {tab}
          </div>
        ))}
      </div>
    </div>
  );
});
