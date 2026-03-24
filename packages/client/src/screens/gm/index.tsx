import { Header } from "./Header.js";
import { ControlsPanel } from "./ControlsPanel.js";
import { StatePanel } from "./StatePanel.js";
import { PlayerRoster } from "./PlayerRoster.js";
import { MessageFeed } from "./MessageFeed.js";

export function GMDashboard() {
  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden text-text-primary"
      style={{ background: "linear-gradient(160deg, #0a0a14 0%, #0d1117 50%, #060912 100%)" }}
    >
      <Header />

      <div className="flex-1 grid grid-cols-[300px_1fr_280px] grid-rows-[auto_1fr] gap-px bg-white/[0.06] overflow-hidden">
        {/* Left column: Controls + Players */}
        <div className="col-start-1 row-span-2 bg-surface py-6 px-5 flex flex-col gap-5 border-r border-white/[0.06] overflow-auto">
          <ControlsPanel />
          <PlayerRoster />
        </div>

        <StatePanel />
        <MessageFeed />
      </div>
    </div>
  );
}
