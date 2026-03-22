import React from "react";
import { FACTIONS, canWriteSubstack, type PublicationAngle, type PublicationTarget } from "@takeoff/shared";
import type { AppProps } from "./types.js";
import { useGameStore } from "../stores/game.js";
import { estimateReadTime, renderMarkdown } from "./substackUtils.js";

interface FeedPost {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  displayDate: string;
  byline: string;
  badge: string;
  readTime: number;
}

export const SubstackApp = React.memo(function SubstackApp({ content }: AppProps) {
  const { selectedRole, publishArticle, generatePublicationDraft, publications, round } = useGameStore();
  const canWrite = canWriteSubstack(selectedRole);
  const hasPublishedThisRound = publications.some(
    (p) => p.publishedBy === selectedRole && p.round === round,
  );

  const docItems = content.filter((i) => i.type === "document");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [composing, setComposing] = React.useState(false);
  const [composeTitle, setComposeTitle] = React.useState("");
  const [composeBody, setComposeBody] = React.useState("");
  const [composeAngle, setComposeAngle] = React.useState<PublicationAngle | "">("");
  const [composeTarget, setComposeTarget] = React.useState<PublicationTarget | "">("");
  const [justPublished, setJustPublished] = React.useState(false);
  const [draftGenerating, setDraftGenerating] = React.useState(false);
  const [draftError, setDraftError] = React.useState<string | null>(null);
  const [draftGeneratedRound, setDraftGeneratedRound] = React.useState<number | null>(null);

  const roleLabels = React.useMemo(
    () =>
      new Map(
        FACTIONS.flatMap((faction) => faction.roles.map((role) => [role.id, role.label] as const)),
      ),
    [],
  );

  const posts = React.useMemo<FeedPost[]>(() => {
    const generatedPosts = docItems.map((item) => {
      const timestamp = Date.parse(item.timestamp) || 0;
      return {
        id: item.id,
        title: item.subject ?? item.body.split("\n")[0] ?? "(untitled)",
        body: item.body,
        timestamp,
        displayDate: timestamp > 0 ? new Date(timestamp).toLocaleDateString() : item.timestamp,
        byline: item.sender ?? "Guest Essay",
        badge: item.classification === "critical" ? "Urgent" : "Essay",
        readTime: estimateReadTime(item.body),
      };
    });

    const publicationPosts = publications.map((publication) => ({
      id: `publication-${publication.id}`,
      title: publication.title,
      body: publication.content,
      timestamp: publication.publishedAt,
      displayDate: new Date(publication.publishedAt).toLocaleString(),
      byline: publication.source || roleLabels.get(publication.publishedBy) || publication.publishedBy,
      badge:
        publication.type === "leak"
          ? "Leak"
          : publication.type === "research"
            ? "Research"
            : "Op-ed",
      readTime: estimateReadTime(publication.content),
    }));

    return [...generatedPosts, ...publicationPosts].sort((a, b) => b.timestamp - a.timestamp);
  }, [docItems, publications, roleLabels]);

  React.useEffect(() => {
    if ((!canWrite || hasPublishedThisRound) && composing) {
      setComposing(false);
    }
  }, [canWrite, hasPublishedThisRound, composing]);

  React.useEffect(() => {
    if (draftGeneratedRound !== round) {
      setDraftError(null);
    }
  }, [draftGeneratedRound, round]);

  React.useEffect(() => {
    if (posts.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !posts.some((post) => post.id === selectedId)) {
      setSelectedId(posts[0]!.id);
    }
  }, [posts, selectedId]);

  const selected = posts.find((post) => post.id === selectedId) ?? null;
  const hasGeneratedDraftThisRound = draftGeneratedRound === round;

  function handlePublish() {
    if (!canWrite) return;
    if (!composeTitle.trim() || !composeBody.trim() || !composeAngle || !composeTarget) return;
    publishArticle({
      type: "article",
      title: composeTitle.trim(),
      content: composeBody.trim(),
      source: "",
      angle: composeAngle,
      targetFaction: composeTarget,
    });
    setJustPublished(true);
    setComposing(false);
    setComposeTitle("");
    setComposeBody("");
    setComposeAngle("");
    setComposeTarget("");
    setDraftGeneratedRound(round);
    setDraftError(null);
    setTimeout(() => setJustPublished(false), 3000);
  }

  async function handleGenerateDraft() {
    if (!composeAngle || !composeTarget || draftGenerating || hasGeneratedDraftThisRound || hasPublishedThisRound) {
      return;
    }
    setDraftGenerating(true);
    setDraftError(null);
    const result = await generatePublicationDraft({
      angle: composeAngle,
      targetFaction: composeTarget,
    });
    setDraftGenerating(false);
    if (!result.ok || !result.title || !result.body) {
      setDraftError(result.error || "Draft generation failed");
      return;
    }
    setComposeTitle(result.title);
    setComposeBody(result.body);
    setDraftGeneratedRound(round);
  }

  return (
    <div className="flex h-full bg-white text-black text-sm">
      <div className="w-60 bg-neutral-50 border-r border-neutral-200 flex flex-col shrink-0">
        <div className="p-3 border-b border-neutral-200">
          <div className="font-bold text-sm">The World Feed</div>
          <div className="text-neutral-500 text-xs">
            Essays, dispatches, and public analysis from across the AI race
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {posts.length === 0 ? (
            <div className="px-2 py-6 text-xs text-neutral-500 text-center">
              No articles yet. The public narrative will populate here as the round unfolds.
            </div>
          ) : (
            posts.map((post) => (
              <button
                key={post.id}
                onClick={() => {
                  setSelectedId(post.id);
                  setComposing(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded border ${
                  selected?.id === post.id && !composing
                    ? "bg-amber-50 border-amber-200"
                    : "border-transparent hover:bg-neutral-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-neutral-900 truncate">{post.title}</span>
                  <span className="text-[9px] uppercase tracking-wide text-neutral-500 shrink-0">
                    {post.badge}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 truncate">{post.byline}</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {post.displayDate} · {post.readTime} min read
                </div>
              </button>
            ))
          )}
        </div>
        {canWrite && (
          <div className="p-3 border-t border-neutral-200">
            <button
              onClick={() => setComposing(true)}
              disabled={hasPublishedThisRound}
              className="w-full bg-[#ff6719] text-white text-xs py-2 rounded font-semibold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {hasPublishedThisRound ? "Published this round" : "New post"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        {composing ? (
          <div className="flex flex-col flex-1 p-5 gap-3">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setComposing(false)}
                className="text-neutral-400 hover:text-neutral-700 text-xs"
              >
                ← Back
              </button>
              <span className="text-xs font-semibold text-neutral-500">Publish to the public feed</span>
            </div>
            <input
              type="text"
              placeholder="Article title…"
              value={composeTitle}
              onChange={(e) => setComposeTitle(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <textarea
              placeholder="Write your article here…"
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              className="flex-1 border border-neutral-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none leading-relaxed"
            />
            <div className="flex gap-2 shrink-0">
              <select
                value={composeAngle}
                onChange={(e) => {
                  setComposeAngle(e.target.value as PublicationAngle | "");
                  setDraftError(null);
                }}
                className="flex-1 border border-neutral-300 rounded px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              >
                <option value="">Angle…</option>
                <option value="safety">Safety</option>
                <option value="hype">Hype</option>
                <option value="geopolitics">Geopolitics</option>
              </select>
              <select
                value={composeTarget}
                onChange={(e) => {
                  setComposeTarget(e.target.value as PublicationTarget | "");
                  setDraftError(null);
                }}
                className="flex-1 border border-neutral-300 rounded px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              >
                <option value="">Target…</option>
                <option value="openbrain">OpenBrain</option>
                <option value="prometheus">Prometheus</option>
                <option value="china">China</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  void handleGenerateDraft();
                }}
                disabled={!composeAngle || !composeTarget || draftGenerating || hasGeneratedDraftThisRound || hasPublishedThisRound}
                className="text-neutral-700 text-xs px-4 py-2 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {draftGenerating ? "Generating…" : hasGeneratedDraftThisRound ? "Draft generated this round" : "Generate draft"}
              </button>
              <span className="text-[11px] text-neutral-500">
                One assisted draft per round. You can edit before publishing.
              </span>
            </div>
            {draftError && <div className="text-[11px] text-red-600">{draftError}</div>}
            <div className="flex gap-2 items-center shrink-0">
              <button
                onClick={handlePublish}
                disabled={!composeTitle.trim() || !composeBody.trim() || !composeAngle || !composeTarget}
                className="bg-[#ff6719] text-white text-xs px-5 py-2 rounded font-semibold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Publish to feed
              </button>
              <button
                onClick={() => setComposing(false)}
                className="text-neutral-500 text-xs px-3 py-2 rounded border border-neutral-200 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {selected && (
              <div className="flex-1 overflow-y-auto p-5">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
                      {selected.badge}
                    </span>
                    <span className="text-[10px] text-neutral-400">{selected.displayDate}</span>
                    <span className="text-[10px] text-neutral-400">{selected.readTime} min read</span>
                  </div>
                  <div className="text-xl font-bold text-neutral-800 mb-3">{selected.title}</div>
                  <div className="text-xs text-neutral-500 mb-4">{selected.byline}</div>
                  <div className="h-px bg-neutral-200 mb-4" />
                  <article
                    className="prose prose-sm max-w-none text-neutral-700"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.body) }}
                  />
                </div>
              </div>
            )}
            {!selected && (
              <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
                No articles available yet.
              </div>
            )}

            <div className="border-t border-neutral-200 px-4 py-2 flex gap-2 items-center shrink-0">
              {canWrite && !hasPublishedThisRound && (
                <>
                  <button
                    onClick={() => setComposing(true)}
                    className="bg-[#ff6719] text-white text-xs px-4 py-1.5 rounded font-semibold hover:bg-orange-600"
                  >
                    Write
                  </button>
                  <button className="text-neutral-500 text-xs px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50">
                    Save draft
                  </button>
                </>
              )}
              {justPublished && (
                <span className="text-[10px] text-green-600 font-semibold ml-2">✓ Published to the public feed</span>
              )}
              <span className="text-[10px] text-neutral-400 ml-auto">
                {canWrite
                  ? hasPublishedThisRound
                    ? "You've published this round."
                    : "Writers can shape the public narrative from here."
                  : "Read-only access"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
