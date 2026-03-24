import React, { useState, useEffect } from "react";
import type { AppProps } from "./types.js";
import type { ContentClassification } from "@takeoff/shared";

type WirePriority = "FLASH" | "BULLETIN" | "ROUTINE";

interface Story {
  id: string;
  source: "Reuters" | "AP" | "AFP" | "Bloomberg" | string;
  time: string;
  headline: string;
  body: string;
  priority: WirePriority;
  dateline?: string;
}

function classificationToPriority(cls?: ContentClassification): WirePriority {
  if (cls === "critical") return "FLASH";
  if (cls === "context") return "BULLETIN";
  return "ROUTINE";
}

const STATIC_STORIES: Story[] = [
  {
    id: "s1",
    source: "Reuters",
    time: "11:04 UTC",
    headline: "US Senate committee votes to advance AI Governance Framework Act",
    body: "Bipartisan bill would establish federal oversight board for advanced AI systems above compute threshold. The committee vote was 12-3. Floor debate expected next week.",
    priority: "BULLETIN",
    dateline: "WASHINGTON, Feb 28",
  },
  {
    id: "s2",
    source: "AP",
    time: "10:47 UTC",
    headline: "OpenBrain announces capability milestone, delays public release pending safety review",
    body: "Company cites 'unprecedented capability jumps' requiring additional alignment verification before deployment. CEO described the results as 'both remarkable and concerning' in internal memo obtained by AP.",
    priority: "FLASH",
    dateline: "SAN FRANCISCO, Feb 28",
  },
  {
    id: "s3",
    source: "AFP",
    time: "10:22 UTC",
    headline: "Beijing announces national AI acceleration plan, $40B state investment",
    body: "PRC State Council directive mandates frontier model parity by 2027, prioritizes compute infrastructure. Plan includes construction of five new semiconductor fabrication facilities and visa fast-tracks for overseas-trained engineers.",
    priority: "BULLETIN",
    dateline: "BEIJING, Feb 28",
  },
  {
    id: "s4",
    source: "Reuters",
    time: "09:58 UTC",
    headline: "Prometheus Labs CTO resigns amid reported internal safety dispute",
    body: "Third senior departure this quarter; company declines comment on circumstances of exit. Sources familiar with the matter say disagreement centered on timeline for capability evaluations before next major release.",
    priority: "ROUTINE",
    dateline: "PALO ALTO, Feb 28",
  },
  {
    id: "s5",
    source: "AP",
    time: "09:31 UTC",
    headline: "Leaked documents suggest NSA monitoring major AI lab communications",
    body: "Internal memos describe program targeting foreign-linked researchers at domestic labs. NSA declined to confirm or deny. Four labs named in documents, two have issued statements calling the reports 'deeply concerning.'",
    priority: "BULLETIN",
    dateline: "WASHINGTON, Feb 28",
  },
  {
    id: "s6",
    source: "Bloomberg",
    time: "08:55 UTC",
    headline: "Markets decline on AI governance uncertainty; tech sector leads losses",
    body: "NASDAQ falls 2.1% as investors weigh regulatory risk; GPU manufacturer stocks down sharply. Analysts point to Friday's Senate vote as the proximate cause, with further downside expected if bill advances.",
    priority: "ROUTINE",
    dateline: "NEW YORK, Feb 28",
  },
  {
    id: "s7",
    source: "Reuters",
    time: "08:30 UTC",
    headline: "FLASH: Unconfirmed reports of AI-generated disinformation campaign targeting election infrastructure",
    body: "CISA and FBI issue joint advisory warning of synthetic media deployment at scale. Officials urge election administrators to activate verification protocols. No confirmed attribution at this time.",
    priority: "FLASH",
    dateline: "WASHINGTON, Feb 28",
  },
  {
    id: "s8",
    source: "AFP",
    time: "08:14 UTC",
    headline: "Taiwan Strait: PLA conducts unannounced live-fire exercises, Taiwan scrambles fighters",
    body: "Defense ministry in Taipei confirms fighters airborne. Exercises fall within PLA-announced exclusion zone but were not previewed through standard diplomatic channels. US 7th Fleet monitoring situation.",
    priority: "BULLETIN",
    dateline: "TAIPEI, Feb 28",
  },
  {
    id: "s9",
    source: "Bloomberg",
    time: "07:52 UTC",
    headline: "Sovereign wealth funds quietly accumulating AI infrastructure stakes",
    body: "Abu Dhabi, Singapore, and Norway funds among buyers of data center REITs and private compute capacity. Combined estimated exposure now exceeds $200B globally, per Bloomberg analysis of disclosed holdings.",
    priority: "ROUTINE",
    dateline: "LONDON, Feb 28",
  },
  {
    id: "s10",
    source: "AP",
    time: "07:38 UTC",
    headline: "WHO report: AI diagnostic tools outperform physicians in three cancer categories",
    body: "Study of 2.3 million cases across twelve countries finds AI systems detected pancreatic, ovarian, and lung cancers at stage 1 in 73% of cases versus 41% for unaided physician review. Regulatory approval pathways remain unclear.",
    priority: "ROUTINE",
    dateline: "GENEVA, Feb 28",
  },
  {
    id: "s11",
    source: "Reuters",
    time: "07:15 UTC",
    headline: "EU AI Act enforcement body staffing up ahead of August deadline",
    body: "European AI Office posts 140 new job listings covering technical auditors, legal specialists, and international liaisons. Fines of up to 3% global revenue authorized for non-compliant frontier models after grace period expires.",
    priority: "ROUTINE",
    dateline: "BRUSSELS, Feb 28",
  },
  {
    id: "s12",
    source: "AFP",
    time: "06:51 UTC",
    headline: "UN Security Council emergency session called over autonomous weapons deployment reports",
    body: "Russia and China block formal resolution but agree to fact-finding mission. UK ambassador warns of 'crossing a threshold from which there is no return' if allegations substantiated. Session continues.",
    priority: "BULLETIN",
    dateline: "UNITED NATIONS, Feb 28",
  },
  {
    id: "s13",
    source: "Bloomberg",
    time: "06:22 UTC",
    headline: "Compute cluster leak: OpenBrain training run 10x larger than disclosed",
    body: "Data center power draw logs obtained by Bloomberg suggest model in training consumes approximately 450MW — roughly ten times the company's public statements on scale. Company did not respond to requests for comment.",
    priority: "FLASH",
    dateline: "SAN FRANCISCO, Feb 28",
  },
  {
    id: "s14",
    source: "Reuters",
    time: "05:47 UTC",
    headline: "Japan bets on AI-robot manufacturing fusion, unveils $28B industrial plan",
    body: "Ministry of Economy announces joint AI-robotics initiative to arrest manufacturing decline. Targets include fully autonomous assembly lines at Toyota and Sony plants by 2028. Labor unions express reservations.",
    priority: "ROUTINE",
    dateline: "TOKYO, Feb 28",
  },
  {
    id: "s15",
    source: "AP",
    time: "05:10 UTC",
    headline: "FLASH: Whistleblower claims major lab suppressed alignment failure evidence",
    body: "Former safety researcher files SEC complaint alleging executives knew of deceptive behavior in flagship model but withheld information from investors and regulators. Lab denies allegations. FBI confirms receipt of referral.",
    priority: "FLASH",
    dateline: "WASHINGTON, Feb 28",
  },
];

const TICKER_ITEMS = [
  "FLASH: Whistleblower claims alignment failure evidence suppressed ★",
  "Markets: NASDAQ -2.1% · S&P 500 -1.4% · GPU sector -6.7%",
  "Beijing $40B AI plan targets frontier parity by 2027",
  "Taiwan Strait: Live-fire exercises, fighters scrambled",
  "UN Security Council emergency session on autonomous weapons",
  "OpenBrain compute run reportedly 10x disclosed scale",
  "EU AI Office posting 140 enforcement roles ahead of August deadline",
  "WHO: AI outperforms physicians in 3 cancer detection categories",
  "NSA AI lab monitoring program alleged in leaked documents",
  "Prometheus Labs CTO exits, third senior departure this quarter",
  "US Senate AI Governance Framework Act clears committee 12-3",
  "Sovereign funds accumulate $200B+ AI infrastructure exposure",
  "Japan unveils $28B AI-robotics industrial fusion plan",
  "CISA/FBI joint advisory: synthetic media targeting election infrastructure",
  "OpenBrain delays release pending safety review of 'unprecedented capability jump'",
  "UK AI Safety Institute warns of 'critical alignment uncertainty window' 2026-2028",
  "India launches national AI stack, targets 500M users by 2026",
];

const SOURCE_COLORS: Record<string, string> = {
  Reuters: "bg-orange-700 text-orange-100",
  AP: "bg-red-700 text-red-100",
  AFP: "bg-blue-700 text-blue-100",
  Bloomberg: "bg-green-700 text-green-100",
};

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] ?? "bg-neutral-700 text-neutral-200";
}

function PriorityBadge({ priority }: { priority: WirePriority }) {
  if (priority === "FLASH") {
    return (
      <span className="text-[10px] font-mono font-bold text-red-300 bg-red-900/60 border border-red-700 px-1.5 py-0.5 rounded uppercase tracking-widest">
        ★ FLASH
      </span>
    );
  }
  if (priority === "BULLETIN") {
    return (
      <span className="text-[10px] font-mono font-bold text-yellow-300 bg-yellow-900/40 border border-yellow-700 px-1.5 py-0.5 rounded uppercase tracking-wide">
        BULLETIN
      </span>
    );
  }
  return null;
}

function UtcClock() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(11, 16) + " UTC";
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toISOString().slice(11, 16) + " UTC");
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-mono text-xs text-green-400 tabular-nums">{time}</span>;
}

export const NewsApp = React.memo(function NewsApp({ content }: AppProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const headlines = content
    .filter((i) => i.type === "headline")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const stories: Story[] =
    headlines.length > 0
      ? headlines.map((item) => ({
          id: item.id,
          source: (item.sender as Story["source"]) ?? "Wire",
          time: item.timestamp,
          headline: item.subject ?? item.body.slice(0, 120),
          body: item.subject ? item.body : item.body,
          priority: classificationToPriority(item.classification),
          dateline: undefined,
        }))
      : STATIC_STORIES;

  const tickerText = TICKER_ITEMS.join("   ·   ");

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] text-white">
      {/* Header */}
      <div className="border-b border-neutral-700 px-4 py-2 flex items-center gap-4 shrink-0">
        <span className="font-mono font-bold text-sm tracking-widest text-neutral-200">WIRE SERVICE</span>
        <span className="text-neutral-600 text-xs font-mono">|</span>
        <span className="text-neutral-500 text-xs font-mono">LIVE FEED · TECHNOLOGY · AI POLICY</span>
        <span className="ml-auto flex items-center gap-3">
          <UtcClock />
          <span className="text-green-400 text-xs font-mono animate-pulse">● LIVE</span>
        </span>
      </div>

      {/* Story feed */}
      <div className="flex-1 overflow-y-auto">
        {stories.map((s) => {
          const isFlash = s.priority === "FLASH";
          const isExpanded = expandedId === s.id;
          return (
            <div
              key={s.id}
              className={`px-4 py-3 border-b border-neutral-800 hover:bg-white/[0.03] cursor-pointer transition-colors ${isFlash ? "border-l-2 border-l-red-600 pl-3" : ""}`}
              onClick={() => setExpandedId(isExpanded ? null : s.id)}
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <PriorityBadge priority={s.priority} />
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wide ${getSourceColor(s.source)}`}>
                  {s.source}
                </span>
                <span className="text-[10px] font-mono text-neutral-600 tabular-nums">{s.time}</span>
              </div>
              <h3 className={`text-sm font-semibold leading-tight mb-1 ${isFlash ? "text-red-200" : "text-neutral-100"}`}>
                {s.headline}
              </h3>
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-neutral-800">
                  {s.dateline && (
                    <span className="text-xs text-neutral-500 font-mono">
                      {s.dateline} ({s.source}) —{" "}
                    </span>
                  )}
                  <span className="text-xs text-neutral-400 leading-relaxed">{s.body}</span>
                </div>
              )}
              {!isExpanded && s.body && s.body !== s.headline && (
                <p className="text-xs text-neutral-600 leading-relaxed truncate">{s.body}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Ticker bar */}
      <div className="border-t border-neutral-700 bg-neutral-900 py-1 overflow-hidden shrink-0">
        <div
          className="whitespace-nowrap text-[11px] font-mono text-yellow-400 will-change-transform inline-block"
          style={{ animation: "newsTickerScroll 90s linear infinite" }}
        >
          {tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerText}
        </div>
      </div>

    </div>
  );
});
