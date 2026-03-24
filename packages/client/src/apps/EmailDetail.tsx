import React from "react";
import type { EmailItem } from "./emailUtils.js";
import type { EmailWithId } from "./emailData.js";

interface EmailDetailProps {
  email: EmailItem & { id: string };
  canPublish: boolean;
  isObSafety: boolean;
  highRegulatory: boolean;
  leakSent: boolean;
  onLeak: () => void;
  onCompose: (mode: "reply" | "forward") => void;
}

export const EmailDetail = React.memo(function EmailDetail({
  email,
  canPublish,
  isObSafety,
  highRegulatory,
  leakSent,
  onLeak,
  onCompose,
}: EmailDetailProps) {
  const isLeakable =
    isObSafety &&
    (email.classification === "critical" ||
      /misalign|safety|alignment|deceptive|risk|concern|gap|discrepancy/i.test(
        (email.subject ?? "") + " " + (email.body ?? "")
      ));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="font-semibold text-base mb-1">{email.subject}</h2>
        <div className="text-xs text-neutral-500 mb-3">
          From: <span className="text-neutral-300">{email.from}</span> · {email.time}
          {email.attachment && <span className="ml-2 text-neutral-500">📎 Attachment</span>}
          {email.starred && <span className="ml-2 text-amber-400">★ Starred</span>}
        </div>

        {/* Reply / Forward */}
        {canPublish && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => onCompose("reply")}
              className="text-[11px] bg-white/8 hover:bg-white/15 border border-white/10 px-3 py-1 rounded text-neutral-300"
            >
              ↩ Reply
            </button>
            <button
              onClick={() => onCompose("forward")}
              className="text-[11px] bg-white/8 hover:bg-white/15 border border-white/10 px-3 py-1 rounded text-neutral-300"
            >
              ↗ Forward
            </button>
          </div>
        )}

        {highRegulatory && email.classification === "critical" && (
          <span className="inline-block text-[9px] bg-amber-800/60 text-amber-300 px-1.5 py-0.5 rounded font-semibold tracking-wider mb-3">
            CONGRESSIONAL INQUIRY
          </span>
        )}

        <pre className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed font-sans">
          {email.body ?? email.preview}
        </pre>
      </div>

      {/* Leak to Press action */}
      {isLeakable && (
        <div className="border-t border-white/10 px-4 py-3 shrink-0 bg-red-950/30">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[10px] text-red-400 font-semibold uppercase tracking-wide">
                ⚠ Whistleblower Action
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">
                Leak this memo to the press. This is irreversible and will increase public awareness.
              </div>
            </div>
            {leakSent ? (
              <span className="text-[10px] text-green-400 font-semibold">✓ Leaked</span>
            ) : (
              <button
                onClick={onLeak}
                className="bg-red-700 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded font-semibold shrink-0"
              >
                Leak to Press
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
