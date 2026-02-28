import React from "react";
import type { AppProps } from "./types.js";

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

export const SubstackApp = React.memo(function SubstackApp({ content }: AppProps) {
  const docItems = content.filter((i) => i.type === "document" || i.type === "memo");
  const [selectedIdx, setSelectedIdx] = React.useState(0);

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

  const safeIdx = Math.min(selectedIdx, posts.length - 1);
  const selected = posts[safeIdx];

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
          <button className="w-full bg-[#ff6719] text-white text-xs py-2 rounded font-semibold hover:bg-orange-600">
            New post
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Post list */}
        <div className="border-b border-neutral-200 shrink-0">
          {posts.map((p, i) => (
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
          <button className="bg-[#ff6719] text-white text-xs px-4 py-1.5 rounded font-semibold hover:bg-orange-600">Publish</button>
          <button className="text-neutral-500 text-xs px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50">Save draft</button>
          <span className="text-[10px] text-neutral-400 ml-auto">Autosaved 2m ago</span>
        </div>
      </div>
    </div>
  );
});
