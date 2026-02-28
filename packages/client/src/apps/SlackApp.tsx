import React from "react";
import type { AppProps } from "./types.js";

const CHANNELS = ["#general", "#research", "#alignment", "#safety", "#announcements", "#ops", "#random"];

const MESSAGES = [
  { user: "alex_chen", avatar: "AC", time: "10:42 AM", text: "Just pushed the new eval harness — should cut our iteration time by 40%." },
  { user: "priya_k", avatar: "PK", time: "10:44 AM", text: "Nice. Does it handle the edge cases from last week's regression?" },
  { user: "alex_chen", avatar: "AC", time: "10:45 AM", text: "Most of them. Still a known issue with tokenizer boundary conditions on long contexts." },
  { user: "dr_hayes", avatar: "DH", time: "10:51 AM", text: "Can we schedule a sync this afternoon? The board wants an update on the safety metrics before the Thursday call." },
  { user: "priya_k", avatar: "PK", time: "10:53 AM", text: "I'm free 2-3 PM. @alex_chen are you around?" },
  { user: "alex_chen", avatar: "AC", time: "10:54 AM", text: "Works for me 👍" },
  { user: "sys_bot", avatar: "SB", time: "11:00 AM", text: "🔔 Reminder: Cluster A maintenance window begins at 11:30 PM UTC." },
];

export const SlackApp = React.memo(function SlackApp(_: AppProps) {
  return (
    <div className="flex h-full bg-[#1a1d21] text-white text-sm font-sans">
      {/* Sidebar */}
      <div className="w-48 bg-[#3f0f40] flex flex-col shrink-0">
        <div className="px-3 py-3 border-b border-white/10">
          <div className="font-bold text-white text-sm">OpenBrain</div>
          <div className="text-green-400 text-xs flex items-center gap-1 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Active
          </div>
        </div>

        <div className="px-2 py-2 space-y-0.5 overflow-y-auto flex-1">
          <div className="text-[#c9b9c9] text-xs font-semibold px-2 py-1 uppercase tracking-wide">Channels</div>
          {CHANNELS.map((ch) => (
            <div
              key={ch}
              className={`px-2 py-1 rounded cursor-pointer text-[#c9b9c9] hover:bg-white/10 text-xs ${ch === "#general" ? "bg-white/20 text-white font-semibold" : ""}`}
            >
              {ch}
            </div>
          ))}

          <div className="text-[#c9b9c9] text-xs font-semibold px-2 py-1 uppercase tracking-wide mt-3">Direct</div>
          {["alex_chen", "priya_k", "dr_hayes"].map((u) => (
            <div key={u} className="px-2 py-1 rounded cursor-pointer text-[#c9b9c9] hover:bg-white/10 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              {u}
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-9 border-b border-white/10 flex items-center px-4 bg-[#1a1d21] shrink-0">
          <span className="font-semibold text-white">#general</span>
          <span className="text-neutral-500 ml-2 text-xs">· 24 members</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {MESSAGES.map((m, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded bg-purple-700 flex items-center justify-center text-xs font-bold shrink-0 text-white">
                {m.avatar}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-white text-xs">{m.user}</span>
                  <span className="text-neutral-500 text-xs">{m.time}</span>
                </div>
                <p className="text-neutral-300 text-xs mt-0.5 leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-white/10 shrink-0">
          <div className="bg-[#2c2f33] rounded px-3 py-2 text-neutral-500 text-xs border border-white/10">
            Message #general
          </div>
        </div>
      </div>
    </div>
  );
});
