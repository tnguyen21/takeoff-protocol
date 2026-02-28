import React from "react";
import type { AppProps } from "./types.js";

export const IntelApp = React.memo(function IntelApp(_: AppProps) {
  return (
    <div className="flex flex-col h-full bg-[#f5f0e8] text-black font-mono text-xs overflow-y-auto">
      {/* Classification banner */}
      <div className="bg-[#cc0000] text-white text-center py-1.5 font-bold tracking-[0.3em] text-sm shrink-0">
        TOP SECRET // SCI // NOFORN
      </div>

      <div className="p-5 max-w-2xl mx-auto w-full">
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
            Confidence: HIGH.
          </p>

          <div className="border border-black p-2 my-3">
            <div className="font-bold text-center mb-1">KEY JUDGMENTS</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Foreign capability development has accelerated beyond prior estimates. (HIGH CONFIDENCE)</li>
              <li>
                <span className="bg-black text-black select-none">████████████████████████████████████████</span>. (MODERATE CONFIDENCE)
              </li>
              <li>US lead in compute infrastructure remains significant but narrowing. (HIGH CONFIDENCE)</li>
              <li>
                Alignment methodology deployed by{" "}
                <span className="bg-black text-black select-none">████████</span> is not consistent with known safe approaches. (LOW CONFIDENCE)
              </li>
            </ol>
          </div>

          <p>
            <span className="font-bold">(S//NF)</span> Recommend immediate interagency coordination on{" "}
            <span className="bg-black text-black select-none">██████████████████████████████████████████████████████</span>.
          </p>

          <p className="text-neutral-600">
            <span className="font-bold">DISSEM:</span> SECDEF, DNI, NSC, CISA, relevant IC elements. NOT FOR FOREIGN DISSEMINATION.
          </p>
        </div>

        {/* Footer classification */}
        <div className="mt-6 border-t border-black pt-2 text-center text-[10px]">
          Classified By: DIA Authority NW2026<br />
          Declassify On: 20360228
        </div>
      </div>

      {/* Classification banner */}
      <div className="bg-[#cc0000] text-white text-center py-1.5 font-bold tracking-[0.3em] text-sm shrink-0">
        TOP SECRET // SCI // NOFORN
      </div>
    </div>
  );
});
