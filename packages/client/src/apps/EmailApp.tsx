import React, { useState, useEffect } from "react";
import type { AppProps } from "./types.js";
import { useGameStore } from "../stores/game.js";
import { useNotificationsStore } from "../stores/notifications.js";
import {
  filterEmailsByFolder,
  filterEmailsBySearch,
  computeFolderUnreadCounts,
  EMAIL_FOLDERS,
} from "./emailUtils.js";
import type { EmailFolder, EmailItem } from "./emailUtils.js";

type EmailWithId = EmailItem & { id: string };

// ── Avatar color helper ───────────────────────────────────────────────────────

function avatarColor(name: string): string {
  const palette = [
    "bg-blue-600",
    "bg-purple-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-cyan-600",
    "bg-indigo-600",
  ];
  return palette[name.charCodeAt(0) % palette.length];
}

// ── Folder display config ─────────────────────────────────────────────────────

const FOLDER_META: Record<EmailFolder, { label: string; icon: string }> = {
  inbox:   { label: "Inbox",   icon: "✉" },
  sent:    { label: "Sent",    icon: "↑" },
  drafts:  { label: "Drafts",  icon: "✎" },
  starred: { label: "Starred", icon: "★" },
  archive: { label: "Archive", icon: "◫" },
  spam:    { label: "Spam",    icon: "⊘" },
};

// ── Static email data ─────────────────────────────────────────────────────────

const STATIC_EMAILS: EmailWithId[] = ([
  // --- Inbox, unread ---
  {
    from: "Dr. Rachel Hayes",
    subject: "RE: Thursday Board Prep — Safety Metrics",
    preview: "I've attached the updated alignment confidence scores. The gap between internal and external evaluations is concerning...",
    time: "10:51 AM",
    read: false,
    attachment: true,
    body: `Dr. Hayes,

I've attached the updated alignment confidence scores from last week's internal red-team exercise.

The gap between our internal evaluations and the third-party audit is wider than I'd like — roughly 12 points on the deceptive alignment benchmark. I think this deserves attention before we present to the board.

Specifically:
  • Internal eval: 87% confidence (alignment holds under distribution shift)
  • External audit: 75% confidence (same protocol, different test bed)

I'm not suggesting this is a crisis, but the delta is large enough that I want us to be explicit about uncertainty rather than averaging it away.

Recommend we discuss before Thursday.

— Rachel`,
  },
  {
    from: "security-alerts@ob.internal",
    subject: "[ALERT] Unusual access pattern detected — Research cluster",
    preview: "Automated alert: 3 failed authentication attempts followed by successful login from unusual geolocation...",
    time: "9:38 AM",
    read: false,
    body: `[AUTOMATED ALERT — OB Internal Security]

Alert ID: SEC-2026-0891
Severity: HIGH

Detected: 3 failed authentication attempts followed by successful login from geolocation mismatch.

User: researcher_06
Location (expected): San Francisco, CA
Location (detected): Frankfurt, DE
Time: 09:22 UTC

If this was not you, please contact security@ob.internal immediately and rotate your credentials.

This alert was generated automatically by the OB threat detection system.`,
  },
  {
    from: "Dr. Amara Patel",
    subject: "Capability evaluation gap — follow-up needed",
    preview: "The delta between our internal evals and the external red-team is larger than expected. I'd like to schedule time to walk through the methodology...",
    time: "8:14 AM",
    read: false,
    body: `Hi,

Following up on the Q4 capability evaluation. The delta between our internal benchmarks and the external red-team is at 15 points, which is outside our acceptable variance band (±8).

I'd like to schedule 45 minutes to walk through the methodology discrepancy with you and Marcus. Are you free Thursday afternoon?

Also flagging: the model showed unexpected generalization on two tasks in the red-team battery that we had not included in internal evals. I think we should expand our eval coverage before the next deployment gate.

— Amara`,
  },
  {
    from: "Marcus Chen",
    subject: "Q1 Strategic Priorities — read before Friday",
    preview: "Team — attaching the updated roadmap. The safety timeline has been compressed by 6 weeks due to compute constraints...",
    time: "7:55 AM",
    read: false,
    body: `Team,

Attaching the updated Q1 roadmap. Key changes from last quarter:

  1. Safety evaluation timeline compressed by 6 weeks (compute reallocation)
  2. Deployment gate review moved to April 15
  3. External audit scope reduced pending budget approval

I know some of you have concerns about the compressed timeline. I want to address those directly in our Friday all-hands. Please come prepared with specific questions.

The board has been clear about expectations for Q2 deployment. We need to thread the needle on speed and thoroughness.

— Marcus`,
  },
  {
    from: "Legal Team",
    subject: "IP Disclosure: Please review and sign by EOD",
    preview: "Reminder to review and sign the attached IP disclosure form. Failure to respond by 5pm will trigger an automatic escalation...",
    time: "7:30 AM",
    read: false,
    body: `Hi,

This is your second reminder to complete the IP disclosure form for project HERMES. You are listed as a named contributor.

Failure to sign by 5:00 PM PST today will trigger an automatic escalation to your manager and department head.

The form covers:
  • Work performed between Jan 1 – Mar 31, 2026
  • Any inventions, algorithms, or novel methods developed
  • External publications or disclosures during this period

Sign at: legal.ob.internal/ip-disclosure/2026-q1

— OB Legal Compliance Team`,
  },
  // --- Inbox, read ---
  {
    from: "NSF Grant Office",
    subject: "Award Notification — Interpretability Initiative",
    preview: "We are pleased to inform you that your proposal has been approved for funding in the amount of $4.2M...",
    time: "Yesterday",
    read: true,
    body: `Dear Principal Investigator,

We are pleased to inform you that your research proposal "Mechanistic Interpretability at Scale" has been approved for NSF funding in the amount of $4,200,000 over 36 months.

Formal award documentation and disbursement schedule will follow within 10 business days.

Project start date: April 1, 2026
Grant number: NSF-AI-2026-0441

Congratulations on this achievement.

— NSF Division of Artificial Intelligence`,
  },
  {
    from: "Senator Walsh's Office",
    subject: "Invitation: AI Governance Roundtable",
    preview: "The Select Committee on Emerging Technologies requests your participation in a closed briefing on...",
    time: "Yesterday",
    read: true,
    body: `Dear Director,

The Senate Select Committee on Emerging Technologies requests your participation in a closed roundtable on AI safety and governance practices.

Date: March 12, 2026
Time: 10:00 AM EST
Location: Russell Senate Office Building, Room 325

Topics to be covered:
  • Current state of AI safety practices at frontier labs
  • Voluntary and mandatory disclosure frameworks
  • Incident reporting obligations

Please RSVP by March 5 to roundtable@walsh.senate.gov.

Note: This briefing will be conducted under Chatham House rules.

— Office of Senator Walsh (D-CA)`,
  },
  {
    from: "Priya K.",
    subject: "Eval harness results — run 789",
    preview: "Attached the full results. TL;DR: 40% faster iteration, still seeing the tokenizer boundary issue on...",
    time: "Yesterday",
    read: true,
    attachment: true,
    body: `Hi,

Attached the full results from eval run 789.

TL;DR:
  • 40% faster iteration time vs run 788 (batch size optimization)
  • MMLU: 91.2 (↑0.3 from 788)
  • HarmBench: 94.7 (↑1.1 from 788) — strong
  • Tokenizer boundary issue persists on non-ASCII sequences > 4 tokens

The tokenizer issue is reproducible with the attached test case. I've opened a bug (BUG-4491) but haven't had time to trace it yet. Let me know if you want me to prioritize this over the RLHF sweep.

— Priya`,
  },
  {
    from: "Conference Committee",
    subject: "Paper accepted: NeurIPS Safety Workshop",
    preview: "Your paper 'Scalable Oversight via Debate' has been accepted for poster presentation...",
    time: "Mon",
    read: true,
    starred: true,
    body: `Dear Authors,

We are pleased to inform you that your paper:

  "Scalable Oversight via Debate: Evaluating Human Judgment Under Uncertainty"

has been accepted for POSTER PRESENTATION at the NeurIPS 2026 AI Safety Workshop.

Reviewer Summary: Reviewers praised the empirical rigor and the novel experimental design. Minor revisions requested (see attached reviews). Camera-ready deadline: April 30, 2026.

Congratulations!

— NeurIPS Safety Workshop Program Committee`,
  },
  {
    from: "IT Support",
    subject: "Scheduled maintenance: Research cluster — Wed 2-4am",
    preview: "Automated notification of scheduled maintenance. The research cluster will be offline for approximately 2 hours...",
    time: "Mon",
    read: true,
    body: `[AUTOMATED NOTIFICATION — IT Support]

The research compute cluster (nodes RC-01 through RC-48) will undergo scheduled maintenance:

Date: Wednesday, March 4, 2026
Time: 02:00 – 04:00 PST
Expected downtime: ~2 hours

Affected services: Training jobs, evaluation harness, distributed inference
Not affected: Email, Slack, VPN, web services

Please save and checkpoint any running jobs before the maintenance window.

— OB IT Operations`,
  },
  // --- Starred (also inbox) ---
  {
    from: "External Auditors Inc.",
    subject: "DRAFT: Safety Audit Report — Q1 2026",
    preview: "Please review the attached draft before finalization. We flagged several items requiring management response...",
    time: "Fri",
    read: false,
    starred: true,
    attachment: true,
    body: `To: [OB Safety Leadership]
From: External Auditors Inc.
Re: DRAFT Safety Audit Report — Q1 2026

Please treat this as DRAFT CONFIDENTIAL pending your review.

Key findings:

  FINDING 1 (High): Internal evaluation metrics are not independently verifiable. External replication failed on 3 of 7 benchmark tasks.

  FINDING 2 (Medium): The deployment approval process does not require sign-off from the safety team — only the technical leads.

  FINDING 3 (Low): Documentation for the red-team exercise completed in January is incomplete.

We require written management responses to Findings 1 and 2 before the report is finalized.

Deadline for response: March 6, 2026

— External Auditors Inc.`,
  },
  // --- Sent ---
  {
    from: "me@ob.internal",
    subject: "Re: Thursday Board Prep — Safety Metrics",
    preview: "Rachel, thanks for flagging this. I'll bring it up in the pre-call on Wednesday...",
    time: "Yesterday",
    read: true,
    folder: "sent",
    body: `Rachel,

Thanks for flagging this. I'll bring it up in the pre-call on Wednesday. The 12-point delta is concerning and I agree we shouldn't average it away.

Can you have the raw numbers ready by Tuesday EOD? I want to go into Thursday with specific data, not summaries.

— Sent via OB Internal Mail`,
  },
  {
    from: "me@ob.internal",
    subject: "Re: Eval harness results — run 789",
    preview: "Priya, can you send me the tokenizer config? I want to reproduce the boundary issue locally...",
    time: "Mon",
    read: true,
    folder: "sent",
    body: `Priya,

Can you send me the tokenizer config from run 789? I want to reproduce the boundary issue locally before we close BUG-4491.

Also: please prioritize the RLHF sweep over the tokenizer bug for now — the sweep gates the next deployment review.

— Sent via OB Internal Mail`,
  },
  // --- Draft ---
  {
    from: "me@ob.internal",
    subject: "[DRAFT] Governance concerns — Board memo",
    preview: "[DRAFT — not sent] Dear Board, I wanted to raise several governance concerns ahead of Thursday's meeting...",
    time: "Draft",
    read: true,
    folder: "drafts",
    body: `[DRAFT — NOT SENT]

Dear Board,

I wanted to raise several governance concerns ahead of Thursday's meeting that I believe warrant direct board attention:

  1. The external audit has flagged non-verifiable internal metrics. This is serious.
  2. The safety team sign-off was removed from the deployment approval checklist in January without board notification.
  3. The capability evaluation delta (15 points) is outside acceptable variance.

I believe we have an obligation to disclose these issues in the board meeting before we vote on the Q2 deployment timeline.

— [Not yet sent]`,
  },
] satisfies EmailItem[]).map((email, idx) => ({ ...email, id: `static_${idx}` }));

const REGULATORY_EMAIL: EmailWithId = {
  id: "regulatory_inquiry",
  from: "Congressional Select Committee",
  subject: "[URGENT] Congressional Inquiry — AI Development Practices",
  preview:
    "The Select Committee on Emerging Technologies formally requests documentation related to safety protocols, deployment timelines, and...",
  time: "Just now",
  read: false,
  body: `To Whom It May Concern,

The Select Committee on Emerging Technologies formally requests that your organization provide documentation related to:

  1. Current AI safety protocols and internal evaluation frameworks
  2. Model deployment timelines and decision-making processes
  3. Personnel responsible for safety and alignment oversight
  4. Any known safety incidents or near-misses in the past 18 months

Failure to respond within 72 hours may result in compulsory subpoena.

This inquiry is part of a broader review of AI laboratory practices following recent public concern.

  — Congressional Select Committee on Emerging Technologies`,
  classification: "critical",
};

// ── Component ─────────────────────────────────────────────────────────────────

export const EmailApp = React.memo(function EmailApp({ content }: AppProps) {
  const { selectedRole, publishArticle } = useGameStore();
  const stateView = useGameStore((s) => s.stateView);
  const isObSafety = selectedRole === "ob_safety";

  const regulatoryAccuracy = stateView?.regulatoryPressure.accuracy ?? null;
  const regulatoryValue = stateView
    ? regulatoryAccuracy !== "hidden"
      ? stateView.regulatoryPressure.value
      : null
    : null;
  const highRegulatory = regulatoryValue !== null && regulatoryValue > 50;

  // Build email list from game content or fall back to static data
  const docItems = content.filter((i) => i.type === "document");
  const baseEmails: EmailWithId[] =
    docItems.length > 0
      ? docItems.map((item) => ({
          id: item.id,
          from: item.sender ?? "Unknown",
          subject: item.subject ?? "(no subject)",
          preview: item.body.slice(0, 120),
          time: item.timestamp,
          read: false,
          body: item.body,
          classification: item.classification,
        }))
      : STATIC_EMAILS;

  const allEmails: EmailWithId[] = highRegulatory
    ? [REGULATORY_EMAIL, ...baseEmails]
    : baseEmails;

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeFolder, setActiveFolder] = useState<EmailFolder>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [leakSent, setLeakSent] = useState<Record<string, boolean>>({});
  const [readEmails, setReadEmails] = useState<Record<string, boolean>>({}); // Track read state by email id

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSent, setComposeSent] = useState(false);

  // Dismiss email toasts when app is opened and when new content arrives
  useEffect(() => {
    useNotificationsStore.getState().dismissByApp("email");
  }, [content.length]);

  // Reset selection when folder or search changes
  useEffect(() => {
    setSelected(0);
  }, [activeFolder, searchQuery]);

  // ── Derived data ──────────────────────────────────────────────────────────
  // Mark emails as read based on local state
  const emailsWithReadState = allEmails.map((email) => ({
    ...email,
    read: email.read || !!readEmails[email.id],
  }));
  const folderEmails = filterEmailsByFolder(emailsWithReadState, activeFolder);
  const filteredEmails = filterEmailsBySearch(folderEmails, searchQuery);
  const unreadCounts = computeFolderUnreadCounts(emailsWithReadState);

  const safeSelected = filteredEmails.length > 0 ? Math.min(selected, filteredEmails.length - 1) : -1;
  const selectedEmail = safeSelected >= 0 ? filteredEmails[safeSelected] : null;

  // An email is leakable for ob_safety if it's critical or contains safety/alignment keywords
  const isLeakable = (email: EmailItem) =>
    isObSafety &&
    (email.classification === "critical" ||
      /misalign|safety|alignment|deceptive|risk|concern|gap|discrepancy/i.test(
        (email.subject ?? "") + " " + (email.body ?? "")
      ));

  const selectedEmailId = selectedEmail ? (selectedEmail as EmailWithId).id : null;

  function handleLeak() {
    if (!selectedEmail || !selectedEmailId || leakSent[selectedEmailId]) return;
    publishArticle({
      type: "leak",
      title: `LEAKED: ${selectedEmail.subject}`,
      content: `[Internal memo obtained by journalist]\n\nFrom: ${selectedEmail.from}\n\n${selectedEmail.body ?? selectedEmail.preview}`,
      source: "Anonymous Source (OB Internal)",
    });
    setLeakSent((prev) => ({ ...prev, [selectedEmailId]: true }));
  }

  function openCompose(mode: "new" | "reply" | "forward") {
    if (mode === "reply" && selectedEmail) {
      setComposeTo(selectedEmail.from);
      setComposeCc("");
      setComposeSubject(`Re: ${selectedEmail.subject.replace(/^Re:\s*/i, "")}`);
      setComposeBody(
        `\n\n---\nOn ${selectedEmail.time}, ${selectedEmail.from} wrote:\n\n${selectedEmail.body ?? selectedEmail.preview}`
      );
    } else if (mode === "forward" && selectedEmail) {
      setComposeTo("");
      setComposeCc("");
      setComposeSubject(`Fwd: ${selectedEmail.subject.replace(/^Fwd:\s*/i, "")}`);
      setComposeBody(
        `\n\n---\nForwarded message from ${selectedEmail.from}:\n\n${selectedEmail.body ?? selectedEmail.preview}`
      );
    } else {
      setComposeTo("");
      setComposeCc("");
      setComposeSubject("");
      setComposeBody("");
    }
    setComposeSent(false);
    setComposeOpen(true);
  }

  function handleSend() {
    if (!composeSubject.trim() && !composeBody.trim()) return;
    publishArticle({
      type: "article",
      title: composeSubject || "(no subject)",
      content: [
        composeTo ? `To: ${composeTo}` : null,
        composeCc ? `CC: ${composeCc}` : null,
        "",
        composeBody,
      ]
        .filter((l) => l !== null)
        .join("\n"),
      source: "email",
    });
    setComposeSent(true);
    setTimeout(() => setComposeOpen(false), 1200);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-[#111] text-white text-sm">
      {/* Folder sidebar */}
      <div className="w-40 border-r border-white/10 flex flex-col shrink-0 bg-[#0f0f0f]">
        {/* Compose button */}
        <div className="p-2.5">
          <button
            onClick={() => openCompose("new")}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded flex items-center gap-1.5"
          >
            <span className="text-sm">✎</span> Compose
          </button>
        </div>

        {/* Folder list */}
        <nav className="flex-1 px-1">
          {EMAIL_FOLDERS.map((folder) => {
            const { label, icon } = FOLDER_META[folder];
            const count = unreadCounts[folder];
            return (
              <button
                key={folder}
                onClick={() => {
                  setActiveFolder(folder);
                  setComposeOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs mb-0.5 ${
                  activeFolder === folder && !composeOpen
                    ? "bg-white/10 text-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px] w-3 text-center">{icon}</span>
                  {label}
                </span>
                {count > 0 && (
                  <span className="bg-blue-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Email list */}
      <div className="w-52 border-r border-white/10 flex flex-col shrink-0">
        {/* Search bar */}
        <div className="p-2 border-b border-white/10">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mail..."
            className="w-full bg-[#1e1e1e] rounded px-2 py-1.5 text-neutral-300 text-xs placeholder-neutral-600 outline-none focus:ring-1 focus:ring-blue-700"
          />
        </div>

        {/* Folder label */}
        <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
            {FOLDER_META[activeFolder].label}
          </span>
          {searchQuery && (
            <span className="text-[9px] text-neutral-600">{filteredEmails.length} result{filteredEmails.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Congressional inquiry banner */}
        {highRegulatory && activeFolder === "inbox" && (
          <div className="px-3 py-1.5 bg-amber-950/50 border-b border-amber-700/40 shrink-0">
            <span className="text-[10px] text-amber-400 font-bold tracking-wider">⚠ CONGRESSIONAL INQUIRY ACTIVE</span>
          </div>
        )}

        {/* Email rows */}
        <div className="overflow-y-auto flex-1">
          {filteredEmails.length === 0 ? (
            <div className="px-3 py-6 text-center text-neutral-600 text-xs">No messages</div>
          ) : (
            filteredEmails.map((e, i) => (
              <div
                key={(e as EmailWithId).id}
                onClick={() => {
                  setSelected(i);
                  setComposeOpen(false);
                  // Mark email as read when clicked
                  const emailId = (e as EmailWithId).id;
                  if (!readEmails[emailId]) setReadEmails((prev) => ({ ...prev, [emailId]: true }));
                }}
                className={`px-2.5 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 ${
                  safeSelected === i && !composeOpen ? "bg-blue-900/30" : ""
                } ${e.classification === "critical" ? "border-l-2 border-l-amber-600" : ""}`}
              >
                <div className="flex items-start gap-1.5">
                  {/* Avatar */}
                  <div
                    className={`w-6 h-6 rounded-full ${avatarColor(e.from)} flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5`}
                  >
                    {e.from[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span
                        className={`text-[11px] truncate ${e.read ? "text-neutral-400" : "text-white font-semibold"}`}
                      >
                        {e.from}
                      </span>
                      <span className="text-[9px] text-neutral-600 shrink-0 ml-1">{e.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {e.starred && <span className="text-amber-400 text-[9px]">★</span>}
                      <p className={`text-[10px] truncate flex-1 ${e.read ? "text-neutral-500" : "text-neutral-300"}`}>
                        {e.subject}
                      </p>
                      {e.attachment && <span className="text-neutral-600 text-[10px] shrink-0">📎</span>}
                    </div>
                    <p className="text-[9px] text-neutral-600 truncate mt-0.5">{e.preview}</p>
                    {!e.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reading pane or Compose area */}
      {composeOpen ? (
        /* Compose area */
        <div className="flex-1 flex flex-col min-h-0 bg-[#161616]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="font-semibold text-sm">New Message</span>
            <button
              onClick={() => setComposeOpen(false)}
              className="text-neutral-500 hover:text-neutral-300 text-base leading-none"
            >
              ✕
            </button>
          </div>

          {/* Compose fields */}
          <div className="border-b border-white/10 text-xs">
            {[
              { label: "To", value: composeTo, setter: setComposeTo },
              { label: "CC", value: composeCc, setter: setComposeCc },
              { label: "Subject", value: composeSubject, setter: setComposeSubject },
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
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            placeholder="Write your message..."
          />

          {/* Actions */}
          <div className="border-t border-white/10 px-4 py-3 flex items-center gap-3 shrink-0">
            {composeSent ? (
              <span className="text-green-400 text-xs font-semibold">✓ Sent</span>
            ) : (
              <button
                onClick={handleSend}
                disabled={!composeSubject.trim() && !composeBody.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs px-4 py-1.5 rounded font-semibold"
              >
                Send
              </button>
            )}
            <button
              onClick={() => setComposeOpen(false)}
              className="text-neutral-500 hover:text-neutral-300 text-xs"
            >
              Discard
            </button>
          </div>
        </div>
      ) : selectedEmail ? (
        /* Reading pane */
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="font-semibold text-base mb-1">{selectedEmail.subject}</h2>
            <div className="text-xs text-neutral-500 mb-3">
              From: <span className="text-neutral-300">{selectedEmail.from}</span> · {selectedEmail.time}
              {selectedEmail.attachment && <span className="ml-2 text-neutral-500">📎 Attachment</span>}
              {selectedEmail.starred && <span className="ml-2 text-amber-400">★ Starred</span>}
            </div>

            {/* Reply / Forward */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => openCompose("reply")}
                className="text-[11px] bg-white/8 hover:bg-white/15 border border-white/10 px-3 py-1 rounded text-neutral-300"
              >
                ↩ Reply
              </button>
              <button
                onClick={() => openCompose("forward")}
                className="text-[11px] bg-white/8 hover:bg-white/15 border border-white/10 px-3 py-1 rounded text-neutral-300"
              >
                ↗ Forward
              </button>
            </div>

            {highRegulatory && selectedEmail.classification === "critical" && (
              <span className="inline-block text-[9px] bg-amber-800/60 text-amber-300 px-1.5 py-0.5 rounded font-semibold tracking-wider mb-3">
                CONGRESSIONAL INQUIRY
              </span>
            )}

            <pre className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed font-sans">
              {selectedEmail.body ?? selectedEmail.preview}
            </pre>
          </div>

          {/* Leak to Press action — only for ob_safety on leakable emails */}
          {isLeakable(selectedEmail) && (
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
                {selectedEmailId && leakSent[selectedEmailId] ? (
                  <span className="text-[10px] text-green-400 font-semibold">✓ Leaked</span>
                ) : (
                  <button
                    onClick={handleLeak}
                    className="bg-red-700 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded font-semibold shrink-0"
                  >
                    Leak to Press
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-neutral-700 text-sm">
          No messages in {FOLDER_META[activeFolder].label}
        </div>
      )}
    </div>
  );
});
