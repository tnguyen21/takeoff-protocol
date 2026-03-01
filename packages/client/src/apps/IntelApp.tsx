import React, { useState } from "react";
import type { AppProps } from "./types.js";

type ClassLevel = "TS" | "S" | "C";
const CLASS_CYCLE: ClassLevel[] = ["TS", "S", "C"];

function ClassBadge({ level }: { level: ClassLevel }) {
  const colors: Record<ClassLevel, string> = {
    TS: "bg-red-700 text-white",
    S: "bg-orange-600 text-white",
    C: "bg-blue-600 text-white",
  };
  return <span className={`${colors[level]} px-1 py-0.5 text-[9px] font-bold tracking-wide`}>{level}</span>;
}

function HandlingCaveats({ variant }: { variant: 0 | 1 }) {
  const text =
    variant === 0
      ? "HANDLE VIA COMINT CHANNELS ONLY · NOT RELEASABLE TO FOREIGN NATIONALS"
      : "ORIGINATOR CONTROLLED · HANDLE VIA SCI CHANNELS ONLY";
  return (
    <div className="border-2 border-red-800 p-1.5 mb-3 text-center text-[10px] font-bold tracking-wide text-red-800">
      {text}
    </div>
  );
}

function CoordinationLine() {
  return (
    <div className="mt-3 text-[10px] border-t border-black pt-2">
      <span className="font-bold">COORDINATION:</span>{" "}
      <span className="italic">
        This assessment has been coordinated with CIA/DI <span className="not-italic font-bold">(concur)</span>, NSA/SID{" "}
        <span className="not-italic font-bold">(concur with comment)</span>, DHS/I&amp;A{" "}
        <span className="not-italic font-bold">(concur)</span>, FBI/IB{" "}
        <span className="not-italic font-bold text-red-800">(nonconcur — see footnote 3)</span>.
      </span>
    </div>
  );
}

function SourceReliabilityFooter() {
  return (
    <div className="mt-4 border border-black p-2">
      <div className="font-bold text-[10px] text-center mb-1 tracking-wide">SOURCE SUMMARY</div>
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left pr-3 pb-0.5 font-bold">Source</th>
            <th className="text-left pr-3 pb-0.5 font-bold">Reliability</th>
            <th className="text-left pb-0.5 font-bold">Information</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="pr-3 py-0.5">A</td>
            <td className="pr-3 py-0.5">Reliable</td>
            <td className="py-0.5">Confirmed</td>
          </tr>
          <tr>
            <td className="pr-3 py-0.5">B</td>
            <td className="pr-3 py-0.5">Usually Reliable</td>
            <td className="py-0.5">Probably True</td>
          </tr>
          <tr>
            <td className="pr-3 py-0.5">C</td>
            <td className="pr-3 py-0.5">Unreliable</td>
            <td className="py-0.5">Cannot Be Judged</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export const IntelApp = React.memo(function IntelApp({ content }: AppProps) {
  const docItems = content.filter((i) => i.type === "document" || i.type === "memo");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const showSidebar = docItems.length > 1;
  const activeIdx = Math.min(selectedIdx, docItems.length - 1);

  if (docItems.length > 0) {
    const activeDoc = docItems[activeIdx];

    return (
      <div className="flex flex-col h-full bg-[#f5f0e8] text-black font-mono text-xs">
        {/* Top classification banner */}
        <div className="bg-[#cc0000] text-white text-center py-1.5 font-bold tracking-[0.3em] text-sm shrink-0">
          TOP SECRET // SCI // NOFORN
        </div>

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Document navigation sidebar */}
          {showSidebar && (
            <div className="w-[210px] shrink-0 border-r border-black overflow-y-auto bg-[#ede8dc]">
              <div className="bg-black text-white text-[9px] text-center py-1 tracking-widest font-bold">
                DOCUMENTS ({docItems.length})
              </div>
              <div className="divide-y divide-black/20">
                {docItems.map((doc, i) => {
                  const classLevel = CLASS_CYCLE[i % CLASS_CYCLE.length];
                  const isActive = i === activeIdx;
                  return (
                    <button
                      key={doc.id}
                      className={`w-full text-left px-2 py-2 hover:bg-[#ddd8cc] transition-colors ${
                        isActive ? "bg-[#cc0000]/10 border-l-2 border-l-red-700" : ""
                      }`}
                      onClick={() => setSelectedIdx(i)}
                    >
                      <div className="flex items-start gap-1.5 mb-0.5">
                        <ClassBadge level={classLevel} />
                        <span className={`text-[10px] font-bold leading-tight ${isActive ? "text-red-800" : ""}`}>
                          {doc.subject || doc.sender || `DOCUMENT ${i + 1}`}
                        </span>
                      </div>
                      <div className="text-[9px] text-black/60 ml-[26px]">{doc.timestamp}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Document viewer */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 max-w-2xl mx-auto w-full">
              {/* Handling caveats */}
              <HandlingCaveats variant={(activeIdx % 2 === 0 ? 0 : 1) as 0 | 1} />

              <div className="border border-black p-4">
                {activeDoc.subject && (
                  <div className="font-bold text-sm mb-2 underline text-center tracking-wide">{activeDoc.subject}</div>
                )}
                {activeDoc.sender && (
                  <div className="text-[10px] mb-2">
                    <span className="font-bold">SOURCE:</span> {activeDoc.sender} · {activeDoc.timestamp}
                  </div>
                )}
                <pre className="text-[11px] leading-relaxed whitespace-pre-wrap font-mono">{activeDoc.body}</pre>

                {/* Cross-reference callouts */}
                <div className="mt-3 text-[10px] text-black/60 italic border-t border-dashed border-black/30 pt-2">
                  Cross-references: (See DIA-AI-2026-0215-003) · (See NSA-SIGINT-2026-0189) · (See CIA-HUMINT-2026-0441)
                </div>

                {/* Coordination line */}
                <CoordinationLine />

                {/* Dissemination */}
                <div className="mt-2 text-[10px] text-neutral-600 border-t border-black pt-2">
                  <span className="font-bold">DISSEM:</span> SECDEF, DNI, NSC, CISA, relevant IC elements. NOT FOR FOREIGN DISSEMINATION.
                </div>
              </div>

              {/* Source reliability footer */}
              <SourceReliabilityFooter />
            </div>
          </div>
        </div>

        {/* Bottom classification banner */}
        <div className="bg-[#cc0000] text-white text-center py-1.5 font-bold tracking-[0.3em] text-sm shrink-0">
          TOP SECRET // SCI // NOFORN
        </div>
      </div>
    );
  }

  // ── Static fallback document ──
  return (
    <div className="flex flex-col h-full bg-[#f5f0e8] text-black font-mono text-xs overflow-y-auto">
      {/* Classification banner */}
      <div className="bg-[#cc0000] text-white text-center py-1.5 font-bold tracking-[0.3em] text-sm shrink-0">
        TOP SECRET // SCI // NOFORN
      </div>

      <div className="p-5 max-w-2xl mx-auto w-full">
        {/* Handling caveats */}
        <div className="border-2 border-red-800 p-1.5 mb-3 text-center text-[10px] font-bold tracking-wide text-red-800">
          HANDLE VIA COMINT CHANNELS ONLY · NOT RELEASABLE TO FOREIGN NATIONALS
        </div>

        {/* Header block */}
        <div className="border-2 border-black p-3 mb-4 text-center">
          <div className="font-bold text-sm tracking-widest">DEFENSE INTELLIGENCE AGENCY</div>
          <div className="text-xs mt-0.5 tracking-wide">ANALYTICAL INTELLIGENCE PRODUCT</div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-left">
            <div><span className="font-bold">DTG:</span> 281042Z FEB 26</div>
            <div><span className="font-bold">REF:</span> DIA-AI-2026-0228-001</div>
            <div><span className="font-bold">ORIG:</span> DIA/DI/STE</div>
            <div><span className="font-bold">CLASS:</span> TS//SCI//NOFORN</div>
          </div>
        </div>

        {/* Title */}
        <div className="font-bold text-sm mb-3 underline text-center tracking-wide">
          SUBJECT: FOREIGN AI CAPABILITY ASSESSMENT — PRIORITY INTELLIGENCE REPORT
        </div>

        {/* Body */}
        <div className="space-y-3 text-[11px] leading-relaxed">
          <p>
            <span className="font-bold">(TS//SCI)</span> Assessment of foreign advanced AI development programs indicates
            that [REDACTED] has achieved capability benchmarks previously assessed to be 12-18 months beyond current trajectory.
            Revised timeline estimates suggest parity with leading US programs by <span className="bg-black text-black select-none">████████████████</span>.
          </p>

          <p>
            <span className="font-bold">(TS//SCI//NOFORN)</span> HUMINT reporting from source <span className="bg-black text-black select-none">████</span> indicates
            internal documentation describing emergent behaviors in frontier models consistent with{" "}
            <span className="bg-black text-black select-none">████████████████████████████████</span>.
            Confidence: HIGH. <span className="text-black/50 italic">(See DIA-AI-2026-0215-003)</span>
          </p>

          <div className="border border-black p-2 my-3">
            <div className="font-bold text-center mb-1">KEY JUDGMENTS</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Foreign capability development has accelerated beyond prior estimates. (HIGH CONFIDENCE)</li>
              <li>
                <span className="bg-black text-black select-none">████████████████████████████████████████</span>. (MODERATE CONFIDENCE)
              </li>
              <li>
                US lead in compute infrastructure remains significant but narrowing. (HIGH CONFIDENCE){" "}
                <span className="text-black/50 italic">(See NSA-SIGINT-2026-0189)</span>
              </li>
              <li>
                Alignment methodology deployed by{" "}
                <span className="bg-black text-black select-none">████████</span> is not consistent with known safe approaches. (LOW CONFIDENCE)
              </li>
            </ol>
          </div>

          <p>
            <span className="font-bold">(S//NF)</span> Recommend immediate interagency coordination on{" "}
            <span className="bg-black text-black select-none">██████████████████████████████████████████████████████</span>.{" "}
            <span className="text-black/50 italic">(See CIA-HUMINT-2026-0441)</span>
          </p>

          {/* Coordination line */}
          <div className="text-[10px] border-t border-black pt-2">
            <span className="font-bold">COORDINATION:</span>{" "}
            <span className="italic">
              This assessment has been coordinated with CIA/DI <span className="not-italic font-bold">(concur)</span>, NSA/SID{" "}
              <span className="not-italic font-bold">(concur with comment)</span>, DHS/I&amp;A{" "}
              <span className="not-italic font-bold">(concur)</span>, FBI/IB{" "}
              <span className="not-italic font-bold text-red-800">(nonconcur — see footnote 3)</span>.
            </span>
          </div>

          <p className="text-neutral-600">
            <span className="font-bold">DISSEM:</span> SECDEF, DNI, NSC, CISA, relevant IC elements. NOT FOR FOREIGN DISSEMINATION.
          </p>
        </div>

        {/* Footer classification */}
        <div className="mt-6 border-t border-black pt-2 text-center text-[10px]">
          Classified By: DIA Authority NW2026<br />
          Declassify On: 20360228
        </div>

        {/* Source reliability footer */}
        <SourceReliabilityFooter />
      </div>

      {/* Classification banner */}
      <div className="bg-[#cc0000] text-white text-center py-1.5 font-bold tracking-[0.3em] text-sm shrink-0">
        TOP SECRET // SCI // NOFORN
      </div>
    </div>
  );
});
