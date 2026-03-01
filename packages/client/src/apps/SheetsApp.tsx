import React, { useState, useCallback, useEffect } from "react";
import type { AppProps } from "./types.js";
import { useGameStore } from "../stores/game.js";
import { type SheetDataset, colLetter, cellRef, isMonetaryCol, computeSummary } from "./sheetsUtils.js";

// ── Sheet datasets ───────────────────────────────────────────────────────────

const BUDGET_OVERVIEW: SheetDataset = {
  headers: ["Category", "Q1 Budget", "Q2 Budget", "Q1 Actual", "Q2 Actual", "Variance", "Notes"],
  colWidths: [160, 100, 100, 100, 90, 90, 180],
  monetaryColIndices: [1, 2, 3, 4, 5],
  rows: [
    ["Compute (H100 hours)", "$8,400,000", "$12,200,000", "$9,100,000", "—", "▲ $700K", "Demand spike from run-789"],
    ["Cloud Egress", "$320,000", "$380,000", "$298,000", "—", "▼ $22K", "Optimization in CDN routing"],
    ["Safety Infra", "$1,200,000", "$1,200,000", "$1,150,000", "—", "▼ $50K", "Under budget"],
    ["Research Personnel", "$4,800,000", "$4,800,000", "$4,800,000", "—", "—", "On plan"],
    ["External Audits", "$600,000", "$900,000", "$540,000", "—", "▼ $60K", "Deferred 1 audit to Q3"],
    ["Facilities", "$450,000", "$450,000", "$448,000", "—", "▼ $2K", ""],
    ["Legal & Compliance", "$800,000", "$1,100,000", "$920,000", "—", "▲ $120K", "Senate hearings prep"],
    ["TOTAL", "$16,570,000", "$21,030,000", "$17,256,000", "—", "▲ $686K", ""],
  ],
};

const PERSONNEL: SheetDataset = {
  headers: ["Role", "Headcount", "Avg Salary", "Total Cost", "Dept", "Level", "Start Quarter"],
  colWidths: [160, 80, 100, 110, 120, 60, 100],
  monetaryColIndices: [2, 3],
  rows: [
    ["Research Scientist (ML)", "12", "$310,000", "$3,720,000", "Research", "IC5", "Q1 2024"],
    ["Research Engineer", "18", "$290,000", "$5,220,000", "Research", "IC4", "Q1 2024"],
    ["Safety Researcher", "8", "$295,000", "$2,360,000", "Safety", "IC5", "Q2 2024"],
    ["Data Engineer", "6", "$240,000", "$1,440,000", "Infra", "IC3", "Q1 2024"],
    ["Infrastructure Eng.", "9", "$260,000", "$2,340,000", "Infra", "IC4", "Q1 2024"],
    ["Security Engineer", "4", "$270,000", "$1,080,000", "Security", "IC4", "Q2 2024"],
    ["Policy & Comms", "5", "$210,000", "$1,050,000", "Policy", "IC3", "Q1 2024"],
    ["Executive (VP+)", "3", "$580,000", "$1,740,000", "Exec", "VP", "Q1 2024"],
    ["Legal Counsel", "3", "$340,000", "$1,020,000", "Legal", "IC5", "Q2 2024"],
    ["TOTAL", "68", "$286,000", "$19,970,000", "—", "—", ""],
  ],
};

const COMPUTE_DETAIL: SheetDataset = {
  headers: ["Workload Type", "GPU-Hours", "H100 Count", "Cost/Hr", "Total Cost", "Cluster", "Priority"],
  colWidths: [140, 90, 90, 80, 110, 100, 80],
  monetaryColIndices: [3, 4],
  rows: [
    ["Pre-training (run-789)", "284,160", "512", "$3.20", "$9,093,120", "cluster-a", "CRITICAL"],
    ["Fine-tuning (safety)", "42,240", "128", "$3.20", "$1,351,680", "cluster-b", "HIGH"],
    ["RLHF alignment", "28,160", "64", "$3.20", "$901,120", "cluster-b", "HIGH"],
    ["Evaluation suite", "8,960", "32", "$3.20", "$286,720", "cluster-c", "NORMAL"],
    ["Inference (prod)", "35,840", "64", "$3.20", "$1,146,880", "cluster-d", "HIGH"],
    ["Burst capacity", "12,800", "32", "$3.20", "$409,600", "cluster-e", "BURST"],
    ["Red-team eval", "4,480", "16", "$3.20", "$143,360", "cluster-c", "NORMAL"],
    ["TOTAL", "416,640", "848", "$3.20", "$13,332,480", "—", "—"],
  ],
};

const AUDIT_LOG: SheetDataset = {
  headers: ["Timestamp", "User", "Action", "Cell", "Old Value", "New Value"],
  colWidths: [140, 100, 120, 60, 110, 110],
  monetaryColIndices: [],
  rows: [
    ["2026-02-28 14:22:01", "j.chen@ob.ai", "EDIT", "C2", "$11,800,000", "$12,200,000"],
    ["2026-02-28 13:55:14", "a.patel@ob.ai", "EDIT", "D2", "$8,900,000", "$9,100,000"],
    ["2026-02-28 11:30:47", "k.williams@ob.ai", "EDIT", "B8", "$16,200,000", "$16,570,000"],
    ["2026-02-27 16:12:33", "j.chen@ob.ai", "COMMENT", "F1", "—", "Added variance note"],
    ["2026-02-27 09:44:08", "r.sharma@ob.ai", "EDIT", "D5", "$560,000", "$540,000"],
    ["2026-02-26 17:22:55", "a.patel@ob.ai", "SHARE", "—", "—", "Link shared (view-only)"],
    ["2026-02-26 14:08:19", "k.williams@ob.ai", "EDIT", "B3", "$1,100,000", "$1,200,000"],
    ["2026-02-25 11:55:42", "j.chen@ob.ai", "EDIT", "G7", "", "Senate hearings prep"],
    ["2026-02-25 09:30:11", "r.sharma@ob.ai", "CREATE", "—", "—", "Sheet created from template"],
    ["2026-02-24 15:44:28", "admin@ob.ai", "PERMISSION", "—", "—", "Added j.chen as editor"],
    ["2026-02-24 10:22:05", "admin@ob.ai", "IMPORT", "—", "—", "Imported from budget-2023.xlsx"],
    ["2026-02-23 08:15:00", "admin@ob.ai", "CREATE", "—", "—", "Spreadsheet initialized"],
  ],
};

const TABS = ["Budget Overview", "Personnel", "Compute Detail", "Audit Log"] as const;
type TabName = (typeof TABS)[number];

const TAB_DATASETS: Record<TabName, SheetDataset> = {
  "Budget Overview": BUDGET_OVERVIEW,
  Personnel: PERSONNEL,
  "Compute Detail": COMPUTE_DETAIL,
  "Audit Log": AUDIT_LOG,
};

// ── Component ────────────────────────────────────────────────────────────────

export const SheetsApp = React.memo(function SheetsApp({ content }: AppProps) {
  const stateView = useGameStore((s) => s.stateView);
  const selectedFaction = useGameStore((s) => s.selectedFaction);

  const [activeTab, setActiveTab] = useState<TabName>("Budget Overview");
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  const dataset = TAB_DATASETS[activeTab];

  const rowItems = content.filter((i) => i.type === "row");
  const rows =
    activeTab === "Budget Overview" && rowItems.length > 0
      ? rowItems.map((item) => {
          const cols = item.body.split("\t");
          return cols.length > 0 ? cols : [item.subject ?? "Row", item.body];
        })
      : dataset.rows;

  const handleCellClick = useCallback((ri: number, ci: number) => {
    setSelectedCell((prev) => (prev && prev[0] === ri && prev[1] === ci ? null : [ri, ci]));
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedCell(null);
    },
    [],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleTabClick = useCallback((tab: TabName) => {
    setActiveTab(tab);
    setSelectedCell(null);
  }, []);

  // Formula bar display
  const formulaRef = selectedCell ? cellRef(selectedCell[0], selectedCell[1]) : "A1";
  const formulaVal = selectedCell ? (rows[selectedCell[0]]?.[selectedCell[1]] ?? "") : dataset.headers[0];

  // Burn rate
  const isOpenbrain = selectedFaction === "openbrain";
  const isPrometheus = selectedFaction === "prometheus";
  const burnRateVar = isOpenbrain ? stateView?.obBurnRate : isPrometheus ? stateView?.promBurnRate : null;
  const burnRateAccuracy = burnRateVar?.accuracy ?? null;
  const burnRateValue = burnRateVar && burnRateAccuracy !== "hidden" ? burnRateVar.value : null;
  const burnRateHigh = burnRateValue !== null && burnRateValue > 70;

  const summary = computeSummary(rows, selectedCell, dataset);

  return (
    <div
      className="flex flex-col h-full bg-[#1e1e1e] text-white text-xs"
      onClick={(e) => {
        // Deselect if clicking outside a cell (on the container)
        if ((e.target as HTMLElement).closest("td") === null) setSelectedCell(null);
      }}
    >
      {/* Burn rate health banner */}
      {burnRateValue !== null && (
        <div
          className={`flex items-center gap-3 px-3 py-1.5 border-b shrink-0 ${burnRateHigh ? "bg-red-950/60 border-red-700/50" : "bg-[#161616] border-white/5"}`}
        >
          <span className={`text-[10px] font-semibold tracking-wider ${burnRateHigh ? "text-red-400" : "text-neutral-500"}`}>
            {burnRateHigh ? "⚠ " : ""}BUDGET BURN RATE
          </span>
          <div className="flex-1 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${burnRateHigh ? "bg-red-500" : burnRateValue > 50 ? "bg-amber-500" : "bg-green-500"}`}
              style={{ width: `${burnRateValue}%` }}
            />
          </div>
          <span className={`font-mono text-[11px] font-bold w-8 text-right ${burnRateHigh ? "text-red-400" : "text-neutral-300"}`}>
            {burnRateValue.toFixed(0)}%
          </span>
        </div>
      )}

      {/* Menu bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#161616] shrink-0">
        <span className="text-green-400 font-bold text-sm">■</span>
        <span className="text-neutral-300 text-xs">compute_budget_2024.xlsx</span>
        <div className="ml-4 flex gap-3 text-neutral-500">
          {["File", "Edit", "View", "Insert", "Format", "Data", "Tools", "Extensions", "Help"].map((m) => (
            <span key={m} className="hover:text-white cursor-pointer">
              {m}
            </span>
          ))}
        </div>
        <div className="ml-auto">
          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded cursor-pointer hover:bg-blue-500">Share</span>
        </div>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-white/10 bg-[#1a1a1a] shrink-0 flex-wrap">
        {/* Undo/Redo */}
        <button className="px-1.5 py-0.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded" title="Undo">
          ↩
        </button>
        <button className="px-1.5 py-0.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded" title="Redo">
          ↪
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        {/* Font size */}
        <select className="bg-[#252525] border border-white/10 text-neutral-300 text-[10px] rounded px-1 py-0.5 h-5">
          {[10, 11, 12, 14, 16, 18, 24].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="w-px h-4 bg-white/10 mx-1" />
        {/* B I U */}
        <button className="w-5 h-5 text-neutral-300 hover:text-white hover:bg-white/10 rounded font-bold text-[11px]" title="Bold">
          B
        </button>
        <button className="w-5 h-5 text-neutral-400 hover:text-white hover:bg-white/10 rounded italic text-[11px]" title="Italic">
          I
        </button>
        <button
          className="w-5 h-5 text-neutral-400 hover:text-white hover:bg-white/10 rounded underline text-[11px]"
          title="Underline"
        >
          U
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        {/* Text color / fill */}
        <button className="px-1.5 py-0.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded text-[10px]" title="Text color">
          A
          <span className="block h-0.5 bg-red-400 -mt-0.5" />
        </button>
        <button className="px-1.5 py-0.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded text-[10px]" title="Fill color">
          🪣
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        {/* Borders */}
        <button className="px-1.5 py-0.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded text-[10px]" title="Borders">
          ▦
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        {/* Alignment */}
        <button className="w-5 h-5 text-neutral-400 hover:text-white hover:bg-white/10 rounded text-[10px]" title="Align left">
          ≡
        </button>
        <button className="w-5 h-5 text-neutral-400 hover:text-white hover:bg-white/10 rounded text-[10px]" title="Align center">
          ☰
        </button>
        <button className="w-5 h-5 text-neutral-400 hover:text-white hover:bg-white/10 rounded text-[10px]" title="Align right">
          ≡
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        {/* Merge / wrap */}
        <button className="px-1.5 py-0.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded text-[10px]" title="Wrap text">
          ⏎
        </button>
        <button className="px-1.5 py-0.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded text-[10px]" title="Merge cells">
          ⊞
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        {/* Functions */}
        <button className="px-1.5 py-0.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded text-[10px]" title="Insert function">
          Σ
        </button>
        <button className="px-1.5 py-0.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded text-[10px]" title="Insert chart">
          📊
        </button>
      </div>

      {/* Formula bar */}
      <div className="flex items-center gap-2 px-3 py-1 border-b border-white/10 bg-[#1a1a1a] shrink-0">
        <span className="text-neutral-300 w-14 text-center border border-white/20 rounded px-1 bg-[#252525] font-mono text-[10px]">
          {formulaRef}
        </span>
        <span className="text-neutral-500 font-bold text-[11px]">fx</span>
        <span className="text-neutral-400 ml-1 flex-1 truncate">{formulaVal}</span>
      </div>

      {/* Sheet */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse w-full">
          <thead>
            {/* Column letter row (INV-3) */}
            <tr className="bg-[#1e1e1e]">
              <th className="w-8 border border-white/10 text-neutral-700 font-normal py-0.5 text-center sticky left-0 bg-[#1e1e1e] text-[9px]" />
              {dataset.headers.map((_, ci) => (
                <th
                  key={ci}
                  style={{ minWidth: dataset.colWidths[ci], width: dataset.colWidths[ci] }}
                  className={`border border-white/10 py-0.5 text-center text-[9px] font-normal text-neutral-500 bg-[#252525] ${
                    selectedCell && selectedCell[1] === ci ? "bg-[#3c4a6a] text-blue-300" : ""
                  }`}
                >
                  {colLetter(ci)}
                </th>
              ))}
            </tr>
            {/* Header row */}
            <tr className="bg-[#252525]">
              <th className="w-8 border border-white/10 text-neutral-600 font-normal py-1 text-center sticky left-0 bg-[#252525]" />
              {dataset.headers.map((h, ci) => (
                <th
                  key={h}
                  style={{ minWidth: dataset.colWidths[ci], width: dataset.colWidths[ci] }}
                  className={`border border-white/10 px-2 py-1 text-left text-neutral-300 font-semibold text-[10px] bg-[#2a2a2a] ${
                    isMonetaryCol(ci, dataset) ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const isTotal = ri === rows.length - 1;
              return (
                <tr
                  key={ri}
                  className={`
                    ${ri % 2 === 0 ? "bg-[#1e1e1e]" : "bg-[#212121]"}
                    ${isTotal ? "font-semibold bg-[#1a2a1a] border-t border-white/20" : ""}
                    ${burnRateHigh && ri === 0 ? "bg-red-950/40 border-l-2 border-l-red-600" : ""}
                    hover:bg-blue-900/10 cursor-pointer
                  `}
                >
                  {/* Row number gutter */}
                  <td
                    className={`border border-white/10 text-neutral-600 text-center py-1 sticky left-0 bg-inherit text-[10px] ${
                      selectedCell && selectedCell[0] === ri ? "bg-[#3c4a6a] text-blue-300" : ""
                    }`}
                  >
                    {ri + 1}
                  </td>
                  {row.map((cell, ci) => {
                    const isSelected = selectedCell !== null && selectedCell[0] === ri && selectedCell[1] === ci;
                    const monetary = isMonetaryCol(ci, dataset);
                    return (
                      <td
                        key={ci}
                        style={{
                          minWidth: dataset.colWidths[ci],
                          fontVariantNumeric: "tabular-nums",
                          ...(isSelected ? { outline: "2px solid #4285f4", outlineOffset: "-2px" } : {}),
                        }}
                        className={`border border-white/10 px-2 py-1 text-[11px] cursor-pointer
                          ${monetary ? "text-right" : ""}
                          ${ci === 5 && cell.startsWith("▲") ? "text-red-400" : ""}
                          ${ci === 5 && cell.startsWith("▼") ? "text-green-400" : ""}
                          ${ci > 0 && monetary && !cell.startsWith("—") ? "text-neutral-300 font-mono" : "text-neutral-400"}
                          ${isSelected ? "bg-blue-900/30" : ""}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(ri, ci);
                        }}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 px-3 py-1 border-t border-white/10 bg-[#161616] shrink-0 text-[10px] text-neutral-500">
        <span>{summary}</span>
        <span className="ml-auto text-neutral-600">{activeTab}</span>
      </div>

      {/* Sheet tabs */}
      <div className="flex items-center border-t border-white/10 bg-[#161616] px-2 py-1 shrink-0 gap-1">
        {TABS.map((tab) => (
          <div
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`px-3 py-1 rounded-t text-[10px] cursor-pointer transition-colors ${
              tab === activeTab
                ? "bg-[#1e1e1e] text-white border border-white/10 border-b-transparent"
                : "text-neutral-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab}
          </div>
        ))}
        <div className="ml-2 text-neutral-700 hover:text-neutral-400 cursor-pointer text-sm">+</div>
      </div>
    </div>
  );
});
