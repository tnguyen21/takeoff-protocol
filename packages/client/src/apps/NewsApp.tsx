import React from "react";
import type { AppProps } from "./types.js";

const STATIC_STORIES = [
  {
    source: "Reuters",
    time: "11:04 UTC",
    headline: "US Senate committee votes to advance AI Governance Framework Act",
    summary: "Bipartisan bill would establish federal oversight board for advanced AI systems above compute threshold.",
  },
  {
    source: "AP",
    time: "10:47 UTC",
    headline: "OpenBrain announces capability milestone, delays public release pending safety review",
    summary: "Company cites 'unprecedented capability jumps' requiring additional alignment verification before deployment.",
  },
  {
    source: "AFP",
    time: "10:22 UTC",
    headline: "Beijing announces national AI acceleration plan, $40B state investment",
    summary: "PRC State Council directive mandates frontier model parity by 2027, prioritizes compute infrastructure.",
  },
  {
    source: "Reuters",
    time: "09:58 UTC",
    headline: "Prometheus Labs CTO resigns amid reported internal safety dispute",
    summary: "Third senior departure this quarter; company declines comment on circumstances of exit.",
  },
  {
    source: "AP",
    time: "09:31 UTC",
    headline: "Leaked documents suggest NSA monitoring major AI lab communications",
    summary: "Internal memos describe program targeting foreign-linked researchers at domestic labs.",
  },
  {
    source: "Bloomberg",
    time: "08:55 UTC",
    headline: "Markets decline on AI governance uncertainty; tech sector leads losses",
    summary: "NASDAQ falls 2.1% as investors weigh regulatory risk; GPU manufacturer stocks down sharply.",
  },
];

export const NewsApp = React.memo(function NewsApp({ content }: AppProps) {
  const headlines = content.filter((i) => i.type === "headline");

  const stories =
    headlines.length > 0
      ? headlines.map((item) => ({
          source: item.sender ?? "Wire",
          time: item.timestamp,
          headline: item.subject ?? item.body.slice(0, 120),
          summary: item.subject ? item.body : "",
        }))
      : STATIC_STORIES;

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] text-white">
      <div className="border-b border-neutral-700 px-4 py-2 flex items-center gap-4 shrink-0">
        <span className="font-mono font-bold text-sm tracking-widest text-neutral-200">WIRE SERVICE</span>
        <span className="text-neutral-600 text-xs font-mono">|</span>
        <span className="text-neutral-500 text-xs font-mono">LIVE FEED · TECHNOLOGY · AI POLICY</span>
        <span className="ml-auto text-green-400 text-xs font-mono animate-pulse">● LIVE</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {stories.map((s, i) => (
          <div key={i} className="px-4 py-3 border-b border-neutral-800 hover:bg-white/3 cursor-pointer">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded uppercase tracking-wide">
                {s.source}
              </span>
              <span className="text-[10px] font-mono text-neutral-600">{s.time}</span>
            </div>
            <h3 className="text-sm font-semibold text-neutral-100 leading-tight mb-1">{s.headline}</h3>
            {s.summary && <p className="text-xs text-neutral-500 leading-relaxed">{s.summary}</p>}
          </div>
        ))}
      </div>
    </div>
  );
});
