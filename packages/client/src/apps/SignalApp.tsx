import React from "react";
import type { AppProps } from "./types.js";

const CONVERSATIONS = [
  { name: "Dr. Hayes", preview: "Can you send the eval results?", time: "10:54 AM", unread: 2 },
  { name: "Priya K.", preview: "See you at 2pm sync", time: "10:45 AM", unread: 0 },
  { name: "Team Alpha", preview: "Alex: Cluster is back online", time: "9:30 AM", unread: 0 },
  { name: "Dispatch", preview: "Scheduled maintenance tonight", time: "Yesterday", unread: 0 },
];

const MESSAGES = [
  { sent: false, text: "Hey — have you seen the latest alignment report?", time: "10:40 AM" },
  { sent: true, text: "Just skimming it now. The RLHF section is concerning.", time: "10:41 AM" },
  { sent: false, text: "Agreed. We should loop in safety before Thursday.", time: "10:42 AM" },
  { sent: true, text: "On it. I'll set up a call.", time: "10:43 AM" },
  { sent: false, text: "Can you send the eval results beforehand?", time: "10:54 AM" },
];

export const SignalApp = React.memo(function SignalApp(_: AppProps) {
  return (
    <div className="flex h-full bg-[#1b1b1b] text-white text-sm">
      {/* Sidebar */}
      <div className="w-52 bg-[#1b1b1b] border-r border-white/10 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/10">
          <div className="bg-[#2a2a2a] rounded px-2 py-1.5 text-neutral-500 text-xs">Search</div>
        </div>
        <div className="overflow-y-auto flex-1">
          {CONVERSATIONS.map((c) => (
            <div
              key={c.name}
              className={`flex items-start gap-3 px-3 py-3 cursor-pointer border-b border-white/5 hover:bg-white/5 ${c.name === "Dr. Hayes" ? "bg-white/10" : ""}`}
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-xs truncate">{c.name}</span>
                  <span className="text-neutral-500 text-[10px] shrink-0 ml-1">{c.time}</span>
                </div>
                <p className="text-neutral-400 text-xs truncate mt-0.5">{c.preview}</p>
              </div>
              {c.unread > 0 && (
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {c.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat pane */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-10 border-b border-white/10 flex items-center px-4 shrink-0">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold mr-2">D</div>
          <span className="font-semibold text-sm">Dr. Hayes</span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {MESSAGES.map((m, i) => (
            <div key={i} className={`flex ${m.sent ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  m.sent ? "bg-blue-600 text-white rounded-br-sm" : "bg-[#2a2a2a] text-neutral-200 rounded-bl-sm"
                }`}
              >
                <p>{m.text}</p>
                <p className={`text-[10px] mt-1 ${m.sent ? "text-blue-200" : "text-neutral-500"}`}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-white/10 flex gap-2 shrink-0">
          <div className="flex-1 bg-[#2a2a2a] rounded-full px-3 py-1.5 text-neutral-500 text-xs border border-white/10">
            Message
          </div>
          <button className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">▶</button>
        </div>
      </div>
    </div>
  );
});
