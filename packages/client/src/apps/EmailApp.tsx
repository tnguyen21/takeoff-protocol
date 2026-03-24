import React, { useState, useEffect, useMemo, useCallback } from "react";
import { canWriteSubstack } from "@takeoff/shared";
import type { AppProps } from "./types.js";
import { useGameStore } from "../stores/game.js";
import { useNotificationsStore } from "../stores/notifications.js";
import {
  filterEmailsByFolder,
  filterEmailsBySearch,
  computeFolderUnreadCounts,
  EMAIL_FOLDERS,
} from "./emailUtils.js";
import type { EmailFolder } from "./emailUtils.js";
import { avatarColor } from "../utils.js";
import { FOLDER_META, STATIC_EMAILS, REGULATORY_EMAIL } from "./emailData.js";
import type { EmailWithId } from "./emailData.js";
import { EmailCompose } from "./EmailCompose.js";
import { EmailDetail } from "./EmailDetail.js";

// ── Component ─────────────────────────────────────────────────────────────────

export const EmailApp = React.memo(function EmailApp({ content }: AppProps) {
  const { selectedRole, publishArticle } = useGameStore();
  const stateView = useGameStore((s) => s.stateView);
  const isObSafety = selectedRole === "ob_safety";
  const canPublishArticle = canWriteSubstack(selectedRole);

  const regulatoryAccuracy = stateView?.regulatoryPressure.accuracy ?? null;
  const regulatoryValue = stateView
    ? regulatoryAccuracy !== "hidden"
      ? stateView.regulatoryPressure.value
      : null
    : null;
  const highRegulatory = regulatoryValue !== null && regulatoryValue > 50;

  // Build email list from game content or fall back to static data
  const allEmails: EmailWithId[] = useMemo(() => {
    const docItems = content
      .filter((i) => i.type === "document")
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
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

    return highRegulatory ? [REGULATORY_EMAIL, ...baseEmails] : baseEmails;
  }, [content, highRegulatory]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeFolder, setActiveFolder] = useState<EmailFolder>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [leakSent, setLeakSent] = useState<Record<string, boolean>>({});
  const [readEmails, setReadEmails] = useState<Record<string, boolean>>({});

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<"new" | "reply" | "forward">("new");

  // Dismiss email toasts when app is opened and when new content arrives
  useEffect(() => {
    useNotificationsStore.getState().dismissByApp("email");
  }, [content.length]);

  // Reset selection when folder or search changes
  useEffect(() => {
    setSelected(0);
  }, [activeFolder, searchQuery]);

  // ── Derived data (memoized) ────────────────────────────────────────────────
  const emailsWithReadState = useMemo(
    () => allEmails.map((email) => ({ ...email, read: email.read || !!readEmails[email.id] })),
    [allEmails, readEmails],
  );

  const folderEmails = useMemo(
    () => filterEmailsByFolder(emailsWithReadState, activeFolder),
    [emailsWithReadState, activeFolder],
  );

  const filteredEmails = useMemo(
    () => filterEmailsBySearch(folderEmails, searchQuery),
    [folderEmails, searchQuery],
  );

  const unreadCounts = useMemo(
    () => computeFolderUnreadCounts(emailsWithReadState),
    [emailsWithReadState],
  );

  const safeSelected = filteredEmails.length > 0 ? Math.min(selected, filteredEmails.length - 1) : -1;
  const selectedEmail = safeSelected >= 0 ? filteredEmails[safeSelected] : null;
  const selectedEmailId = selectedEmail ? (selectedEmail as EmailWithId).id : null;

  // ── Handlers ──────────────────────────────────────────────────────────────
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
    if (!canPublishArticle) return;
    setComposeMode(mode);
    setComposeOpen(true);
  }

  const handleComposeSend = useCallback(
    (data: { subject: string; body: string; to: string; cc: string }) => {
      publishArticle({
        type: "article",
        title: data.subject,
        content: [
          data.to ? `To: ${data.to}` : null,
          data.cc ? `CC: ${data.cc}` : null,
          "",
          data.body,
        ]
          .filter((l) => l !== null)
          .join("\n"),
        source: "email",
      });
    },
    [publishArticle],
  );

  const handleComposeClose = useCallback(() => setComposeOpen(false), []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-[#111] text-white text-sm">
      {/* Folder sidebar */}
      <div className="w-40 border-r border-white/10 flex flex-col shrink-0 bg-[#0f0f0f]">
        {/* Compose button */}
        {canPublishArticle && (
          <div className="p-2.5">
            <button
              onClick={() => openCompose("new")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded flex items-center gap-1.5"
            >
              <span className="text-sm">✎</span> Compose
            </button>
          </div>
        )}

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
        <EmailCompose
          selectedEmail={selectedEmail}
          mode={composeMode}
          canPublish={canPublishArticle}
          onSend={handleComposeSend}
          onClose={handleComposeClose}
        />
      ) : selectedEmail ? (
        <EmailDetail
          email={selectedEmail as EmailWithId}
          canPublish={canPublishArticle}
          isObSafety={isObSafety}
          highRegulatory={highRegulatory}
          leakSent={!!selectedEmailId && !!leakSent[selectedEmailId]}
          onLeak={handleLeak}
          onCompose={openCompose}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-neutral-700 text-sm">
          No messages in {FOLDER_META[activeFolder].label}
        </div>
      )}
    </div>
  );
});
