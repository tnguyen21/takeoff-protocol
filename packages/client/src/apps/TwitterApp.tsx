import React from "react";
import type { AppProps } from "./types.js";

const TWEETS = [
  {
    name: "Sam Hartley",
    handle: "@s_hartley",
    time: "2m",
    text: "The OpenBrain announcement is being massively underreported. This isn't just a benchmark jump — they're describing qualitatively new behaviors. Read the technical memo carefully. 🧵",
    likes: 4821,
    retweets: 1203,
    replies: 287,
  },
  {
    name: "Tech Policy Watch",
    handle: "@techpolicywatch",
    time: "8m",
    text: "BREAKING: Senate AI Governance Framework Act advances 12-4 in committee vote. First meaningful federal AI oversight bill to reach full chamber consideration. Full text linked.",
    likes: 2341,
    retweets: 891,
    replies: 144,
  },
  {
    name: "Dr. Lin Wei",
    handle: "@linwei_ml",
    time: "14m",
    text: "Unpopular opinion: the Prometheus CTO departure says more about the pressure on safety researchers than any public statement from leadership. People are leaving because they're not being heard.",
    likes: 7823,
    retweets: 2105,
    replies: 631,
  },
  {
    name: "AI Accelerate",
    handle: "@aiaccel8",
    time: "23m",
    text: "Doomer panic loop: capability announcement → senate hearing → stock volatility → labs slow down → China gains ground → repeat. At what point do we accept that the risk of inaction exceeds the risk of action?",
    likes: 3102,
    retweets: 788,
    replies: 1024,
  },
  {
    name: "Reuters Tech",
    handle: "@reuterstech",
    time: "31m",
    text: "NSA monitoring program targeting AI lab researchers wider than previously reported — internal documents. Story: [link]",
    likes: 9210,
    retweets: 4322,
    replies: 892,
  },
];

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

export const TwitterApp = React.memo(function TwitterApp(_: AppProps) {
  return (
    <div className="flex h-full bg-black text-white">
      {/* Sidebar */}
      <div className="w-14 border-r border-white/10 flex flex-col items-center py-4 gap-6 shrink-0">
        <div className="text-xl font-bold">𝕏</div>
        {["⌂", "🔍", "🔔", "✉", "👤"].map((icon, i) => (
          <button key={i} className="text-lg hover:text-blue-400 transition-colors">
            {icon}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto border-r border-white/10">
        <div className="sticky top-0 bg-black/80 backdrop-blur border-b border-white/10 px-4 py-3">
          <span className="font-bold text-base">Home</span>
        </div>

        {TWEETS.map((t, i) => (
          <div key={i} className="px-4 py-3 border-b border-white/10 hover:bg-white/3 cursor-pointer">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                {t.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-bold text-sm">{t.name}</span>
                  <span className="text-neutral-500 text-xs">{t.handle}</span>
                  <span className="text-neutral-500 text-xs">· {t.time}</span>
                </div>
                <p className="text-sm mt-1 leading-relaxed text-neutral-200">{t.text}</p>
                <div className="flex gap-6 mt-2 text-neutral-500 text-xs">
                  <span className="hover:text-blue-400 cursor-pointer">💬 {fmt(t.replies)}</span>
                  <span className="hover:text-green-400 cursor-pointer">🔁 {fmt(t.retweets)}</span>
                  <span className="hover:text-red-400 cursor-pointer">♥ {fmt(t.likes)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div className="w-52 px-3 py-4 hidden lg:block shrink-0">
        <div className="bg-[#16181c] rounded-xl p-3">
          <div className="font-bold text-sm mb-2">Trending</div>
          {["#AIGovernance", "#OpenBrain", "#TaiwanTensions", "#AlignmentCrisis"].map((tag) => (
            <div key={tag} className="py-1.5 border-b border-white/5 text-xs">
              <div className="text-blue-400">{tag}</div>
              <div className="text-neutral-500">Trending · Tech</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
