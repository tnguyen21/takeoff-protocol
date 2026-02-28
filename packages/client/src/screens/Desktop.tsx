import { useEffect } from "react";
import { useGameStore } from "../stores/game.js";
import { useUIStore } from "../stores/ui.js";
import { FACTIONS } from "@takeoff/shared";
import { MenuBar } from "../desktop/MenuBar.js";
import { Dock } from "../desktop/Dock.js";
import { Window } from "../desktop/Window.js";

const APP_LABELS: Record<string, string> = {
  slack: "Slack",
  signal: "Signal",
  wandb: "W&B",
  news: "News",
  twitter: "X",
  email: "Email",
  sheets: "Sheets",
  gamestate: "State",
  security: "Security",
  bloomberg: "Bloomberg",
  briefing: "Briefing",
  wechat: "WeChat",
  intel: "Intel",
  military: "Military",
  arxiv: "arXiv",
  substack: "Substack",
  memo: "Memos",
  compute: "Compute",
};

export function Desktop() {
  const { selectedFaction, selectedRole, isGM } = useGameStore();
  const { windows, initWindows } = useUIStore();

  useEffect(() => {
    if (isGM) {
      // GM sees all apps
      const allApps = Object.entries(APP_LABELS).map(([appId, title]) => ({ appId, title }));
      initWindows(allApps);
      return;
    }

    // Find faction config and get available apps
    const factionConfig = FACTIONS.find((f) => f.id === selectedFaction);
    if (!factionConfig) return;

    const apps = factionConfig.apps.map((appId) => ({
      appId,
      title: APP_LABELS[appId] ?? appId,
    }));

    initWindows(apps);
  }, [selectedFaction, isGM, initWindows]);

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      }}
    >
      <MenuBar />

      {/* Windows layer */}
      <div className="absolute inset-0" style={{ top: "var(--menubar-height)", bottom: "var(--dock-height)" }}>
        {windows
          .filter((w) => w.isOpen && !w.isMinimized)
          .map((w) => (
            <Window key={w.id} windowState={w}>
              <div className="p-4 text-neutral-400 text-sm">
                <p className="text-neutral-500">{w.title}</p>
                <p className="mt-2 text-neutral-600">App content will render here.</p>
              </div>
            </Window>
          ))}
      </div>

      <Dock />
    </div>
  );
}
