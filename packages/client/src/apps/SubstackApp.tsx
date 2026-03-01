import React from "react";
import type { AppProps } from "./types.js";
import { useGameStore } from "../stores/game.js";
import { isPublisherRole, estimateReadTime, renderMarkdown } from "./substackUtils.js";

const POSTS = [
  { title: "Why I left my AI safety role (and what I learned)", date: "Feb 27", status: "Published", reads: "24.1K" },
  { title: "The alignment tax is real — and it's growing", date: "Feb 20", status: "Published", reads: "18.4K" },
  { title: "DRAFT: What does 'safe' even mean in 2026?", date: "Feb 28", status: "Draft", reads: "" },
];

const EDITOR_CONTENT = `Why I left my AI safety role (and what I learned)

After three years working at the frontier of AI alignment research, I resigned last month. I want to explain why — not to burn bridges, but because I think the dynamics that drove me out are important for the field to understand.

The short version: the pressure to ship had become indistinguishable from the pressure to compromise.

---

**The research was real.** I'm proud of the work our team published. The deceptive alignment probes, the scalable oversight experiments — we were doing genuine science, and some of it genuinely mattered.

But science doesn't exist in a vacuum. It exists inside institutions, and institutions have incentives. By the end of my tenure, I had watched the safety timeline get compressed three times to accommodate capability milestones. I had watched "we need more time to evaluate this" get overruled twice by leadership citing competitive pressure.

I wasn't alone in noticing. Several colleagues had similar experiences, though most stayed quiet.

---

**This is not an accusation.** The people making these decisions were not villains. They were caught between genuine uncertainty about risks and genuine competitive pressure that felt existential. I understand the logic. I just came to believe that the institutional structure couldn't reliably surface and act on safety concerns when they conflicted with deployment timelines.

And that's the thing about safety failures. They don't announce themselves. They accumulate quietly until they don't.`;

const STATIC_COMMENTS = [
  {
    author: "Dr. Priya Nair",
    initial: "P",
    timestamp: "Feb 27",
    text: "This resonates deeply. The 'competitive pressure as existential threat' framing is one I've heard from almost everyone I've interviewed at frontier labs. Thank you for putting it into words.",
    likes: 87,
  },
  {
    author: "Marcus Chen",
    initial: "M",
    timestamp: "Feb 27",
    text: "The safety timeline compression you describe is real. At two different orgs I've worked at, the standard was 'we'll do more safety testing after launch.' The institutional logic makes sense in the moment and is terrifying in aggregate.",
    likes: 64,
  },
  {
    author: "alignment_lurker_9",
    initial: "A",
    timestamp: "Feb 28",
    text: "What would actually fix this? Genuine question. External audit? Liability? Or are we just too early in the capability curve for any governance to matter?",
    likes: 23,
  },
  {
    author: "Isabel Ferreira",
    initial: "I",
    timestamp: "Mar 1",
    text: "I left last year for similar reasons. The hardest part wasn't the decision — it was watching colleagues rationalize each compromise as necessary. Miss the work, not the environment.",
    likes: 41,
  },
];

const RECOMMENDED = [
  "Alignment Forum Weekly",
  "The GPU Report",
  "China AI Watcher",
  "Compute & Capital",
];

export const SubstackApp = React.memo(function SubstackApp({ content }: AppProps) {
  const { selectedRole, publishArticle, publications } = useGameStore();
  const canPublish = isPublisherRole(selectedRole);

  const docItems = content.filter((i) => i.type === "document" || i.type === "memo");
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const [composing, setComposing] = React.useState(false);
  const [composeTitle, setComposeTitle] = React.useState("");
  const [composeBody, setComposeBody] = React.useState("");
  const [publishedCount, setPublishedCount] = React.useState(0);
  const [justPublished, setJustPublished] = React.useState(false);
  const [liked, setLiked] = React.useState(false);

  // Track publications created by this session for the post list
  const myPublications = publications.filter((p) => selectedRole && p.publishedBy === selectedRole);

  const posts =
    docItems.length > 0
      ? docItems.map((item) => ({
          title: item.subject ?? item.body.split("\n")[0] ?? "(untitled)",
          date: item.timestamp,
          status: "Published",
          reads: "",
          body: item.subject ? item.body : item.body.slice(item.body.indexOf("\n") + 1),
        }))
      : POSTS.map((p) => ({ ...p, body: EDITOR_CONTENT.slice(EDITOR_CONTENT.indexOf("\n") + 1) }));

  // Append recently published items
  const allPosts = [
    ...posts,
    ...myPublications.map((pub) => ({
      title: pub.title,
      date: new Date(pub.publishedAt).toLocaleTimeString(),
      status: "Published",
      reads: "",
      body: pub.content,
    })),
  ];

  const safeIdx = Math.min(selectedIdx, allPosts.length - 1);
  const selected = allPosts[safeIdx];

  function handlePublish() {
    if (!composeTitle.trim() || !composeBody.trim()) return;
    publishArticle({
      type: "article",
      title: composeTitle.trim(),
      content: composeBody.trim(),
      source: "",
    });
    setPublishedCount((c) => c + 1);
    setJustPublished(true);
    setComposing(false);
    setComposeTitle("");
    setComposeBody("");
    setTimeout(() => setJustPublished(false), 3000);
  }

  // ── Reader view (non-publisher roles) ──
  if (!canPublish) {
    const readTime = selected ? estimateReadTime(selected.body) : 1;
    const baseLikes = 1248;
    const displayLikes = baseLikes + (liked ? 1 : 0);

    return (
      <div className="flex h-full bg-white text-black text-sm">
        {/* Reader Sidebar */}
        <div className="w-52 bg-neutral-50 border-r border-neutral-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-neutral-200">
            <div className="font-bold text-sm">AI Safety Notes</div>
            <div className="text-neutral-500 text-xs">Dr. Rachel Hayes · 24.1K subs</div>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {allPosts.map((p, i) => (
              <div
                key={i}
                onClick={() => setSelectedIdx(i)}
                className={`px-2 py-1.5 rounded cursor-pointer text-xs ${safeIdx === i ? "bg-orange-50 font-semibold text-orange-800" : "text-neutral-600 hover:bg-neutral-100"}`}
              >
                <div className="truncate">{p.title}</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">{p.date}</div>
              </div>
            ))}
          </div>
          {/* Recommended section */}
          <div className="p-3 border-t border-neutral-200">
            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">Recommended</div>
            <div className="space-y-1">
              {RECOMMENDED.map((name) => (
                <div key={name} className="text-[11px] text-neutral-600 hover:text-orange-700 cursor-pointer truncate">{name}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Reader Main */}
        <div className="flex-1 overflow-y-auto">
          {selected && (
            <div className="max-w-2xl mx-auto px-8 py-8">
              {/* Article title — large serif */}
              <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.2, color: "#111", marginBottom: "1rem" }}>
                {selected.title}
              </h1>

              {/* Author metadata */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-[#ff6719] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  R
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-800">Dr. Rachel Hayes</div>
                  <div className="text-xs text-neutral-500">
                    {selected.date} · {readTime} min read · ♥ 1,248 · 💬 86
                  </div>
                </div>
              </div>

              <div className="h-px bg-neutral-200 mb-6" />

              {/* Markdown-rendered article body */}
              <div
                className="text-neutral-800 leading-relaxed"
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1rem",
                  lineHeight: 1.7,
                }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.body) }}
              />

              {/* Like button + Subscribe CTA */}
              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={() => setLiked((v) => !v)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${liked ? "bg-red-50 border-red-300 text-red-600" : "border-neutral-300 text-neutral-600 hover:border-red-300 hover:text-red-500"}`}
                >
                  {liked ? "♥" : "♡"} {displayLikes.toLocaleString()}
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#ff6719] text-white text-sm font-semibold hover:bg-orange-600">
                  Subscribe
                </button>
              </div>

              {/* Comments section */}
              <div className="mt-10 border-t border-neutral-200 pt-6">
                <div className="text-base font-bold text-neutral-800 mb-5">
                  {STATIC_COMMENTS.length} comments
                </div>
                <div className="space-y-5">
                  {STATIC_COMMENTS.map((c, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-neutral-300 text-neutral-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {c.initial}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold text-neutral-800">{c.author}</span>
                          <span className="text-[10px] text-neutral-400">{c.timestamp}</span>
                        </div>
                        <div className="text-xs text-neutral-700 leading-relaxed">{c.text}</div>
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-neutral-400">
                          <span>♥ {c.likes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Writer/publisher view (original layout) ──
  return (
    <div className="flex h-full bg-white text-black text-sm">
      {/* Sidebar */}
      <div className="w-52 bg-neutral-50 border-r border-neutral-200 flex flex-col shrink-0">
        <div className="p-3 border-b border-neutral-200">
          <div className="font-bold text-sm">AI Safety Notes</div>
          <div className="text-neutral-500 text-xs">Dr. Rachel Hayes · 24.1K subs</div>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {["Posts", "Drafts", "Subscribers", "Analytics", "Settings"].map((item, i) => (
            <div key={item} className={`px-2 py-1.5 rounded cursor-pointer text-xs ${i === 0 ? "bg-neutral-200 font-semibold" : "text-neutral-600 hover:bg-neutral-100"}`}>
              {item}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-neutral-200">
          <button
            onClick={() => { setComposing(true); setSelectedIdx(-1); }}
            className="w-full bg-[#ff6719] text-white text-xs py-2 rounded font-semibold hover:bg-orange-600"
          >
            New post
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {composing ? (
          /* Compose form */
          <div className="flex flex-col flex-1 p-5 gap-3">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setComposing(false)}
                className="text-neutral-400 hover:text-neutral-700 text-xs"
              >
                ← Back
              </button>
              <span className="text-xs font-semibold text-neutral-500">New Article</span>
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
            <div className="flex gap-2 items-center shrink-0">
              <button
                onClick={handlePublish}
                disabled={!composeTitle.trim() || !composeBody.trim()}
                className="bg-[#ff6719] text-white text-xs px-5 py-2 rounded font-semibold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Publish to all subscribers
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
            {/* Post list */}
            <div className="border-b border-neutral-200 shrink-0">
              {allPosts.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer ${safeIdx === i ? "bg-blue-50" : ""}`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-xs text-neutral-800">{p.title}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">{p.date} · {p.status}{p.reads ? ` · ${p.reads} reads` : ""}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === "Draft" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Editor */}
            {selected && (
              <div className="flex-1 overflow-y-auto p-5">
                <div className="max-w-xl mx-auto">
                  <div className="text-xl font-bold text-neutral-800 mb-3">{selected.title}</div>
                  <div className="h-px bg-neutral-200 mb-4" />
                  <pre className="text-xs text-neutral-700 whitespace-pre-wrap font-sans leading-relaxed">{selected.body}</pre>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="border-t border-neutral-200 px-4 py-2 flex gap-2 items-center shrink-0">
              <button
                onClick={() => setComposing(true)}
                className="bg-[#ff6719] text-white text-xs px-4 py-1.5 rounded font-semibold hover:bg-orange-600"
              >
                Publish
              </button>
              <button className="text-neutral-500 text-xs px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50">Save draft</button>
              {justPublished && (
                <span className="text-[10px] text-green-600 font-semibold ml-2">✓ Published to all feeds</span>
              )}
              <span className="text-[10px] text-neutral-400 ml-auto">Autosaved 2m ago</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
