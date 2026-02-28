import React, { useState } from "react";
import type { AppProps } from "./types.js";

const STATIC_EMAILS = [
  {
    from: "Dr. Rachel Hayes",
    subject: "RE: Thursday Board Prep — Safety Metrics",
    preview: "I've attached the updated alignment confidence scores. The gap between internal and external evaluations is concerning...",
    time: "10:51 AM",
    read: false,
  },
  {
    from: "NSF Grant Office",
    subject: "Award Notification — Interpretability Initiative",
    preview: "We are pleased to inform you that your proposal has been approved for funding in the amount of $4.2M...",
    time: "9:22 AM",
    read: true,
  },
  {
    from: "Senator Walsh's Office",
    subject: "Invitation: AI Governance Roundtable",
    preview: "The Select Committee on Emerging Technologies requests your participation in a closed briefing on...",
    time: "8:07 AM",
    read: true,
  },
  {
    from: "security-alerts@ob.internal",
    subject: "[ALERT] Unusual access pattern detected — Research cluster",
    preview: "Automated alert: 3 failed authentication attempts followed by successful login from unusual geolocation...",
    time: "Yesterday",
    read: false,
  },
  {
    from: "Priya K.",
    subject: "Eval harness results — run 789",
    preview: "Attached the full results. TL;DR: 40% faster iteration, still seeing the tokenizer boundary issue on...",
    time: "Yesterday",
    read: true,
  },
];

const BODY = `Dr. Hayes,

I've attached the updated alignment confidence scores from last week's internal red-team exercise.

The gap between our internal evaluations and the third-party audit is wider than I'd like — roughly 12 points on the deceptive alignment benchmark. I think this deserves attention before we present to the board.

Specifically:
  • Internal eval: 87% confidence (alignment holds under distribution shift)
  • External audit: 75% confidence (same protocol, different test bed)

I'm not suggesting this is a crisis, but the delta is large enough that I want us to be explicit about uncertainty rather than averaging it away.

Recommend we discuss before Thursday.

— Rachel`;

export const EmailApp = React.memo(function EmailApp({ content }: AppProps) {
  const docItems = content.filter((i) => i.type === "document");

  const emails =
    docItems.length > 0
      ? docItems.map((item) => ({
          from: item.sender ?? "Unknown",
          subject: item.subject ?? "(no subject)",
          preview: item.body.slice(0, 120),
          time: item.timestamp,
          read: false,
          body: item.body,
        }))
      : STATIC_EMAILS.map((e) => ({ ...e, body: BODY }));

  const [selected, setSelected] = useState(0);
  const safeSelected = Math.min(selected, emails.length - 1);
  const selectedEmail = emails[safeSelected];

  return (
    <div className="flex h-full bg-[#111] text-white text-sm">
      {/* Email list */}
      <div className="w-56 border-r border-white/10 flex flex-col shrink-0">
        <div className="p-2 border-b border-white/10">
          <div className="bg-[#1e1e1e] rounded px-2 py-1.5 text-neutral-500 text-xs">Search mail</div>
        </div>
        <div className="overflow-y-auto flex-1">
          {emails.map((e, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              className={`px-3 py-2.5 border-b border-white/5 cursor-pointer hover:bg-white/5 ${safeSelected === i ? "bg-blue-900/30" : ""}`}
            >
              <div className="flex justify-between items-baseline mb-0.5">
                <span className={`text-xs truncate ${e.read ? "text-neutral-400" : "text-white font-semibold"}`}>{e.from}</span>
                <span className="text-[10px] text-neutral-600 shrink-0 ml-1">{e.time}</span>
              </div>
              <p className={`text-xs truncate ${e.read ? "text-neutral-600" : "text-neutral-300"}`}>{e.subject}</p>
              <p className="text-[10px] text-neutral-600 truncate mt-0.5">{e.preview}</p>
              {!e.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Reading pane */}
      {selectedEmail && (
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="font-semibold text-base mb-1">{selectedEmail.subject}</h2>
          <div className="text-xs text-neutral-500 mb-4">
            From: <span className="text-neutral-300">{selectedEmail.from}</span> · {selectedEmail.time}
          </div>
          <pre className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed font-sans">{selectedEmail.body}</pre>
        </div>
      )}
    </div>
  );
});
