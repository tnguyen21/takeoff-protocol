import { useEffect } from "react";
import { useGameStore } from "../stores/game.js";
import { useUIStore } from "../stores/ui.js";
import { FACTIONS } from "@takeoff/shared";
import { MenuBar } from "../desktop/MenuBar.js";
import { Dock } from "../desktop/Dock.js";
import { Window } from "../desktop/Window.js";
import { APP_COMPONENTS } from "../apps/index.js";
import type { AppId } from "@takeoff/shared";

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
  const { selectedFaction, isGM } = useGameStore();
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
        background: `
          radial-gradient(ellipse 120% 80% at 20% 0%, rgba(45,25,100,0.85) 0%, transparent 60%),
          radial-gradient(ellipse 80% 60% at 85% 15%, rgba(10,50,120,0.70) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 60% 90%, rgba(20,60,100,0.55) 0%, transparent 50%),
          linear-gradient(175deg, #0d0d1a 0%, #111827 40%, #0a1628 70%, #060d1f 100%)
        `,
      }}
    >
      <MenuBar />

      {/* Windows layer */}
      <div className="absolute inset-0" style={{ top: "var(--menubar-height)", bottom: "var(--dock-height)" }}>
        {windows
          .filter((w) => w.isOpen && !w.isMinimized)
          .map((w) => {
            const AppComponent = APP_COMPONENTS[w.appId as AppId];
            return (
              <Window key={w.id} windowState={w}>
                {AppComponent ? (
                  <AppComponent content={[]} />
                ) : (
                  <div className="p-4 text-neutral-400 text-sm">
                    <p className="text-neutral-500">{w.title}</p>
                    <p className="mt-2 text-neutral-600">App not found.</p>
                  </div>
                )}
              </Window>
            );
          })}
      </div>

      <Dock />
    </div>
  );
}

