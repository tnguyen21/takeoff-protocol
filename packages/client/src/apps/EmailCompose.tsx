import React, { useState, useEffect } from "react";
import type { EmailItem } from "./emailUtils.js";

interface EmailComposeProps {
  selectedEmail: EmailItem | null;
  mode: "new" | "reply" | "forward";
  canPublish: boolean;
  onSend: (data: { subject: string; body: string; to: string; cc: string }) => void;
  onClose: () => void;
}

export const EmailCompose = React.memo(function EmailCompose({
  selectedEmail,
  mode,
  canPublish,
  onSend,
  onClose,
}: EmailComposeProps) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  // Initialize fields based on mode and selected email
  useEffect(() => {
    if (mode === "reply" && selectedEmail) {
      setTo(selectedEmail.from);
      setCc("");
      setSubject(`Re: ${selectedEmail.subject.replace(/^Re:\s*/i, "")}`);
      setBody(
        `\n\n---\nOn ${selectedEmail.time}, ${selectedEmail.from} wrote:\n\n${selectedEmail.body ?? selectedEmail.preview}`
      );
    } else if (mode === "forward" && selectedEmail) {
      setTo("");
      setCc("");
      setSubject(`Fwd: ${selectedEmail.subject.replace(/^Fwd:\s*/i, "")}`);
      setBody(
        `\n\n---\nForwarded message from ${selectedEmail.from}:\n\n${selectedEmail.body ?? selectedEmail.preview}`
      );
    } else {
      setTo("");
      setCc("");
      setSubject("");
      setBody("");
    }
    setSent(false);
  }, [mode, selectedEmail]);

  // Close if publish capability is lost
  useEffect(() => {
    if (!canPublish) onClose();
  }, [canPublish, onClose]);

  function handleSend() {
    if (!subject.trim() && !body.trim()) return;
    onSend({ subject: subject || "(no subject)", body, to, cc });
    setSent(true);
    setTimeout(onClose, 1200);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#161616]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="font-semibold text-sm">New Message</span>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-300 text-base leading-none"
        >
          ✕
        </button>
      </div>

      {/* Fields */}
      <div className="border-b border-white/10 text-xs">
        {[
          { label: "To", value: to, setter: setTo },
          { label: "CC", value: cc, setter: setCc },
          { label: "Subject", value: subject, setter: setSubject },
        ].map(({ label, value, setter }) => (
          <div key={label} className="flex items-center border-b border-white/5 px-4 py-1.5 gap-2">
            <span className="text-neutral-500 w-12 shrink-0">{label}</span>
            <input
              type="text"
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="flex-1 bg-transparent text-neutral-200 outline-none placeholder-neutral-700"
              placeholder={label === "To" ? "recipient@ob.internal" : label === "Subject" ? "(no subject)" : ""}
            />
          </div>
        ))}
      </div>

      {/* Body */}
      <textarea
        className="flex-1 p-4 text-xs text-neutral-300 bg-transparent resize-none outline-none placeholder-neutral-700 font-sans leading-relaxed"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message..."
      />

      {/* Actions */}
      <div className="border-t border-white/10 px-4 py-3 flex items-center gap-3 shrink-0">
        {sent ? (
          <span className="text-green-400 text-xs font-semibold">✓ Sent</span>
        ) : (
          <button
            onClick={handleSend}
            disabled={!subject.trim() && !body.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs px-4 py-1.5 rounded font-semibold"
          >
            Send
          </button>
        )}
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-300 text-xs"
        >
          Discard
        </button>
      </div>
    </div>
  );
});
