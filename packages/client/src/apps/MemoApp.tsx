import React from "react";
import type { AppProps } from "./types.js";

// ─── Markdown renderer (fixes table bug: <tr> wrapped in proper <table>) ──────

function renderMarkdown(body: string): React.ReactNode {
  const lines = body.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      result.push(
        <h1 key={k++} className="text-2xl font-bold mb-2 text-neutral-900">
          {line.slice(2)}
        </h1>
      );
      i++;
    } else if (line.startsWith("## ")) {
      result.push(
        <h2 key={k++} className="text-lg font-semibold mt-5 mb-2 text-neutral-800">
          {line.slice(3)}
        </h2>
      );
      i++;
    } else if (line.startsWith("*") && line.endsWith("*") && line.length > 2 && !line.startsWith("**")) {
      result.push(
        <p key={k++} className="text-neutral-400 text-xs italic mb-3">
          {line.slice(1, -1)}
        </p>
      );
      i++;
    } else if (line === "---") {
      result.push(<hr key={k++} className="my-4 border-neutral-200" />);
      i++;
    } else if (line.startsWith("- [ ]")) {
      result.push(
        <div key={k++} className="flex items-start gap-2 text-xs text-neutral-600 my-1">
          <input type="checkbox" className="mt-0.5" readOnly />
          <span>{line.slice(6)}</span>
        </div>
      );
      i++;
    } else if (line.startsWith("| ")) {
      // Collect all contiguous table lines (INV-1: must wrap in <table>)
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("| ")) {
        tableLines.push(lines[i]);
        i++;
      }
      // Filter out separator rows like |---|---|
      const dataLines = tableLines.filter((l) => !l.match(/^\|[\s\-|:]+\|$/));

      result.push(
        <table key={k++} className="w-full border-collapse border border-neutral-200 my-3">
          <tbody>
            {dataLines.map((row, rowIdx) => {
              const cells = row
                .split("|")
                .filter(Boolean)
                .map((c) => c.trim());
              return (
                <tr key={rowIdx} className="border-b border-neutral-200">
                  {cells.map((c, j) =>
                    rowIdx === 0 ? (
                      <th
                        key={j}
                        className="px-2 py-1.5 text-xs font-semibold text-left bg-neutral-50 border-r border-neutral-200 last:border-r-0"
                      >
                        {c}
                      </th>
                    ) : (
                      <td
                        key={j}
                        className="px-2 py-1.5 text-xs border-r border-neutral-200 last:border-r-0"
                      >
                        {c}
                      </td>
                    )
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      );
      // i already advanced by inner while loop — do not increment again
    } else if (line.trim() === "") {
      result.push(<div key={k++} className="h-2" />);
      i++;
    } else {
      const parts = line.split(/\*\*([^*]+)\*\*/);
      result.push(
        <p key={k++} className="text-xs text-neutral-700 leading-relaxed">
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </p>
      );
      i++;
    }
  }

  return <>{result}</>;
}

// ─── Page metadata block ──────────────────────────────────────────────────────

function PageMetadata({ author, timestamp }: { author: string; timestamp?: string }) {
  const formatted = timestamp
    ? new Date(timestamp).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : null;
  return (
    <div className="flex flex-wrap gap-4 text-xs text-neutral-400 mb-4 pb-4 border-b border-neutral-100">
      {formatted && (
        <span>
          <span className="font-medium text-neutral-500">Last edited:</span> {formatted}
        </span>
      )}
      <span>
        <span className="font-medium text-neutral-500">Created by:</span> {author}
      </span>
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ crumbs }: { crumbs: string[] }) {
  return (
    <div className="flex items-center flex-wrap gap-1 text-xs text-neutral-400 mb-4">
      {crumbs.map((crumb, i) => (
        <React.Fragment key={i}>
          <span className="text-neutral-400">{crumb}</span>
          {i < crumbs.length - 1 && <span className="text-neutral-300">/</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── New page inline editor ───────────────────────────────────────────────────

type UserPage = { title: string; body: string; isUserCreated: true };

function NewPageEditor({ onSubmit, onCancel }: { onSubmit: (p: UserPage) => void; onCancel: () => void }) {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSubmit({ title: trimmedTitle, body, isUserCreated: true });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200 bg-white">
      <div className="mb-2">
        <input
          autoFocus
          type="text"
          placeholder="Page title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xs border border-neutral-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>
      <div className="mb-2">
        <textarea
          placeholder="Page content (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full text-xs border border-neutral-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          Create
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-neutral-500 px-3 py-1 rounded hover:bg-neutral-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Page = { title: string; body: string; sender?: string; timestamp?: string; isUserCreated?: true };

export const MemoApp = React.memo(function MemoApp({ content }: AppProps) {
  const memoItems = content.filter((i) => i.type === "memo" || i.type === "document");

  // Server-provided pages from content
  const serverPages: Page[] = memoItems.map((item) => ({
    title: item.subject ?? "Untitled Document",
    body: item.body,
    sender: item.sender,
    timestamp: item.timestamp,
  }));

  const [userPages, setUserPages] = React.useState<UserPage[]>([]);
  const [selectedTitle, setSelectedTitle] = React.useState<string | null>(
    serverPages.length > 0 ? serverPages[0].title : null
  );
  const [showNewPageEditor, setShowNewPageEditor] = React.useState(false);

  const allPages: Page[] = [...serverPages, ...userPages];

  // If selection is null but pages now exist (e.g. after content loads), pick first
  const effectiveTitle = selectedTitle ?? allPages[0]?.title ?? null;
  const currentPage = allPages.find((p) => p.title === effectiveTitle) ?? null;

  const handleCreatePage = (page: UserPage) => {
    setUserPages((prev) => [...prev, page]);
    setSelectedTitle(page.title);
    setShowNewPageEditor(false);
  };

  const breadcrumbs = effectiveTitle
    ? ["Workspace", "Documents", effectiveTitle]
    : ["Workspace", "Documents"];

  return (
    <div className="flex h-full bg-white text-black text-sm relative">
      {/* Sidebar */}
      <div className="w-52 bg-neutral-50 border-r border-neutral-200 flex flex-col shrink-0">
        <div className="p-3 border-b border-neutral-200">
          <div className="font-semibold text-xs text-neutral-600">Internal Docs</div>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {/* Documents section */}
          {serverPages.length > 0 ? (
            <div>
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1 mt-1">
                Documents
              </div>
              {serverPages.map((page) => (
                <div
                  key={page.title}
                  onClick={() => { setSelectedTitle(page.title); setShowNewPageEditor(false); }}
                  className={`flex items-center gap-1.5 rounded cursor-pointer text-xs py-1.5 px-2 ${
                    effectiveTitle === page.title && !showNewPageEditor
                      ? "bg-blue-100 text-blue-800 font-medium"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <span>📄</span>
                  <span className="truncate">{page.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-neutral-400 italic px-2 py-3">No documents yet</div>
          )}

          {/* My Notes section */}
          {userPages.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">
                My Notes
              </div>
              {userPages.map((page) => (
                <div
                  key={page.title}
                  onClick={() => { setSelectedTitle(page.title); setShowNewPageEditor(false); }}
                  className={`flex items-center gap-1.5 rounded cursor-pointer text-xs py-1.5 px-2 ${
                    effectiveTitle === page.title && !showNewPageEditor
                      ? "bg-blue-100 text-blue-800 font-medium"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <span>📝</span>
                  <span className="truncate">{page.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-neutral-200">
          {showNewPageEditor ? (
            <NewPageEditor onSubmit={handleCreatePage} onCancel={() => setShowNewPageEditor(false)} />
          ) : (
            <div className="p-2">
              <button
                onClick={() => setShowNewPageEditor(true)}
                className="w-full text-left text-xs text-neutral-500 hover:text-neutral-800 px-2 py-1 hover:bg-neutral-100 rounded transition-colors"
              >
                + New page
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-6">
          <Breadcrumb crumbs={breadcrumbs} />

          {currentPage ? (
            <div className="prose prose-sm max-w-none">
              <h1 className="text-2xl font-bold mb-3 text-neutral-900">{currentPage.title}</h1>
              <PageMetadata
                author={currentPage.sender ?? "You"}
                timestamp={currentPage.timestamp}
              />
              {currentPage.body ? (
                renderMarkdown(currentPage.body)
              ) : (
                <p className="text-xs text-neutral-400 italic">This page has no content yet.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
              <p className="text-sm">No document selected</p>
              <p className="text-xs mt-1">Create a new page or wait for documents to load</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
