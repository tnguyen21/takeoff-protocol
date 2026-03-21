import { useState } from "react";

type Tab = "overview" | "mechanics";

export function AboutModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[min(720px,95vw)] max-h-[85vh] bg-neutral-900 border border-neutral-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex gap-1">
            <button
              onClick={() => setTab("overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === "overview"
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setTab("mechanics")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === "mechanics"
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              Mechanics & Balance
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors text-lg leading-none px-1"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed">
          {tab === "overview" ? <OverviewTab /> : <MechanicsTab />}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 flex items-center justify-between">
          <a
            href="https://ai-2027.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-300 text-xs transition-colors"
          >
            Based on AI 2027 &rarr;
          </a>
          <button
            onClick={onClose}
            className="bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg px-4 py-1.5 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-5 text-neutral-300">
      <div>
        <h2 className="text-white font-semibold text-base mb-2">What is Takeoff Protocol?</h2>
        <p>
          A tabletop exercise set in late 2026 where 8-14 players navigate the most consequential
          technology race in human history. Two rival AI labs, a rising China, and a set of power
          brokers who control the money, the regulations, and the narrative.
        </p>
        <p className="mt-2">
          You inhabit a <span className="text-white">simulated macOS desktop</span> — the laptop of the person whose
          role you're playing. Slack messages, news feeds, Bloomberg terminals, Signal DMs, internal memos.
          You have minutes to scan your apps, piece together what's happening, and make decisions with
          incomplete information.
        </p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-1.5">The Four Factions</h3>
        <div className="grid grid-cols-2 gap-3">
          <FactionCard
            name="OpenBrain"
            color="text-blue-400"
            desc="The leading US lab. Capabilities-first, moves fast, ships product. Your lead is narrow and built on speed."
          />
          <FactionCard
            name="Prometheus"
            color="text-green-400"
            desc="The #2 US lab. Safety-first, invests in alignment. You're behind because you do the hard work. Does your safety edge become your moat?"
          />
          <FactionCard
            name="China (DeepCent + CCP)"
            color="text-red-400"
            desc="The open-source dark horse. Stolen weights, state compute, asymmetric strategies. How far do you escalate?"
          />
          <FactionCard
            name="External Stakeholders"
            color="text-amber-400"
            desc="NSA, journalists, VCs, diplomats. You can't build AGI, but you control the money, the regulations, and the story."
          />
        </div>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-1.5">How a Round Works</h3>
        <ol className="space-y-1.5 text-neutral-400 text-xs">
          <li><span className="text-white font-medium">1. Briefing</span> — The GM reads what just happened. Sets the scene.</li>
          <li><span className="text-white font-medium">2. Intel Gathering</span> — Desktop unlocks. Check your apps. Read your messages. You will miss things. That's the point.</li>
          <li><span className="text-white font-medium">3. Deliberation</span> — Discuss with your team. Share intel. Cross-faction DMs are open but cost you time.</li>
          <li><span className="text-white font-medium">4. Decisions</span> — Individual action + team vote. Your team leader gets final say. Inaction is the default if time expires.</li>
          <li><span className="text-white font-medium">5. Resolution</span> — Consequences revealed. State shifts. Next round begins.</li>
        </ol>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-1.5">5 Rounds, 2 Hours</h3>
        <div className="text-neutral-400 text-xs space-y-1">
          <p><span className="text-white">Round 1:</span> Late 2026 — The Race Heats Up</p>
          <p><span className="text-white">Round 2:</span> Q1 2027 — The Superhuman Coder</p>
          <p><span className="text-white">Round 3:</span> Mid 2027 — The Intelligence Explosion</p>
          <p><span className="text-white">Round 4:</span> Late 2027 — The Branch Point</p>
          <p><span className="text-white">Round 5:</span> Early 2028 — Endgame</p>
        </div>
      </div>
    </div>
  );
}

function MechanicsTab() {
  return (
    <div className="space-y-5 text-neutral-300">
      <div>
        <h2 className="text-white font-semibold text-base mb-2">Game State & Fog of War</h2>
        <p>
          The game tracks 30+ state variables — AI capability levels, public sentiment, Taiwan tension,
          alignment confidence, economic disruption, and more. Each variable has a true value known only
          to the GM.
        </p>
        <p className="mt-2">
          Players see a <span className="text-white">fog-of-war filtered view</span>: some variables are
          visible to your faction, some are approximate (shown with noise), and some are completely hidden.
          OpenBrain knows their own capability score. They don't know China's. You make decisions with
          incomplete information — just like the real world.
        </p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-1.5">Decisions & Effects</h3>
        <p>
          Every decision has exactly 3 options, each with 5-8 state effects. There are no free lunches —
          every option has both positive and negative consequences. Effects can be conditional: a choice
          might hit harder when you're already behind, or pay off more when conditions are right.
        </p>
        <p className="mt-2 text-neutral-400 text-xs">
          Example: "Push Agent-2 training immediately" might give +6 capability but -4 alignment confidence
          and -3 internal trust. The alignment hit doubles if your safety team is already under-resourced.
        </p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-1.5">Composite Endings</h3>
        <p>
          The game resolves along 9 independent narrative arcs. The combination creates a unique ending:
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-neutral-400">
          <ArcCard label="The AI Race" range="OB dominant ... China parity" />
          <ArcCard label="Alignment" range="Genuinely aligned ... Scheming" />
          <ArcCard label="Control" range="Democratic ... AI autonomous" />
          <ArcCard label="US-China" range="Active conflict ... Cooperation" />
          <ArcCard label="Public Reaction" range="Riots ... Unaware" />
          <ArcCard label="Economy" range="Collapse ... AI boom" />
          <ArcCard label="Prometheus" range="Replaced OB ... Marginalized" />
          <ArcCard label="Taiwan" range="Full invasion ... Non-issue" />
          <ArcCard label="Open Source" range="Everything leaked ... Closed won" />
        </div>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-1.5">Information Overload</h3>
        <p>
          Your desktop is flooded with content each round — Slack threads, news headlines, Bloomberg tickers,
          arXiv papers, Signal DMs. Most of it is context. Some of it is critical intel buried in the noise.
          Some of it is misleading. The ability to find signal in noise is the core skill the game tests.
        </p>
        <p className="mt-2 text-neutral-400 text-xs">
          Tip: if you're overwhelmed, check Signal and internal memos first — private channels tend to be
          higher signal. Feed apps (Slack, Twitter, news) reward careful reading but are noisier.
        </p>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-1.5">Based on AI 2027</h3>
        <p>
          This game is based on the{" "}
          <a href="https://ai-2027.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
            AI 2027
          </a>{" "}
          scenario — a detailed exploration of what the next few years of AI development might look like.
          The factions, tensions, and dynamics are drawn from that scenario. You don't need to have read it
          to play, but it provides the worldbuilding.
        </p>
      </div>
    </div>
  );
}

function FactionCard({ name, color, desc }: { name: string; color: string; desc: string }) {
  return (
    <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700/30">
      <h4 className={`font-semibold text-xs mb-1 ${color}`}>{name}</h4>
      <p className="text-neutral-400 text-xs leading-snug">{desc}</p>
    </div>
  );
}

function ArcCard({ label, range }: { label: string; range: string }) {
  return (
    <div className="bg-neutral-800/50 rounded p-2 border border-neutral-700/30">
      <p className="text-white text-[10px] font-medium">{label}</p>
      <p className="text-[10px] mt-0.5">{range}</p>
    </div>
  );
}
